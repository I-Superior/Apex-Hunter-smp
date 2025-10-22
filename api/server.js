/**
 * Apex Hunter — minimal API + store server
 *
 * Responsibilities:
 *  - Serve static site files (so /store/*.html are reachable)
 *  - Create Stripe Checkout sessions for rank purchases and donations
 *  - Receive Stripe webhook events to record completed purchases/donations
 *  - Accept feedback submissions and persist to a simple JSON store
 *  - Provide a small API endpoint to read top donators
 *
 * Environment variables expected:
 *  - STRIPE_SECRET_KEY         : Secret API key for Stripe (required to create sessions)
 *  - STRIPE_WEBHOOK_SECRET     : Webhook signing secret for verifying webhook payloads (optional for local testing)
 *
 * Notes:
 *  - db.json is used as a minimal local data store. Replace with a real DB for production.
 *  - The webhook handler expects raw request body (per Stripe requirements).
 *  - For production, secure the endpoints and validate inputs thoroughly.
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// new: Stripe integration (set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in env)
// If you don't have a key yet, set STRIPE_SECRET_KEY to your test key for local testing.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_replace_me');

// ---------- Simple JSON "DB" helpers ----------
// db.json stores three arrays: donators, purchases, feedback.
// This is intentionally minimal. Swap to a real DB for production.
const DB_PATH = path.join(__dirname, 'db.json');
function readDB() {
  try { return JSON.parse(fs.readFileSync(DB_PATH)); }
  catch (e) { return { donators: [], purchases: [], feedback: [] }; }
}
function writeDB(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }

// ---------- App setup ----------
const app = express();
app.use(cors());

// Serve static files from the project root (so /store/vip.html etc. are accessible)
app.use(express.static(path.join(__dirname, '..')));

// ---------- Stripe webhook route ----------
// Stripe requires the webhook endpoint to receive the raw request body for signature verification.
// We register a raw body parser for this route specifically.
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      // Verify signature using the webhook secret (recommended in production)
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      // If no webhook secret provided (local/dev), parse the JSON body (no signature verification)
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle relevant Stripe events
  if (event.type === 'checkout.session.completed') {
    // A successful Checkout session — record donation or purchase to db.json
    const session = event.data.object;
    const metadata = session.metadata || {};
    const db = readDB();

    // amount_total is in cents
    const amount = session.amount_total ? session.amount_total / 100 : null;
    const username = metadata.minecraft_username || (session.customer_details && session.customer_details.email) || 'Anonymous';
    const type = metadata.type || (metadata.rank ? 'rank' : 'donation');

    if (type === 'donation' || metadata.rank === 'donation') {
      // Record donation and keep list sorted by amount (top-first)
      db.donators.push({ name: username, amount: amount || 0, date: new Date().toISOString() });
      db.donators.sort((a, b) => b.amount - a.amount);
      db.donators = db.donators.slice(0, 50);
      console.log('Recorded donation:', username, amount);
    } else {
      // Record rank purchase
      db.purchases.push({ username, rank: metadata.rank || 'unknown', amount: amount || 0, date: new Date().toISOString() });
      console.log('Recorded purchase:', username, metadata.rank, amount);
    }
    writeDB(db);
  }

  // Acknowledge receipt of the webhook
  res.json({ received: true });
});

// ---------- Body parsers for other endpoints ----------
app.use(express.urlencoded({ extended: true })); // for form posts
app.use(bodyParser.json()); // for JSON posts

// ---------- Price map (USD cents) ----------
// Update these values if you change prices in your store
const PRICE_MAP = { vip: 499, mvp: 999, legend: 1999 };

// ---------- Create Checkout Session endpoint ----------
// This endpoint supports form submissions or JSON bodies from the store pages.
// It creates a Stripe Checkout session and redirects the user to Stripe's hosted checkout.
app.post('/api/create-checkout', async (req, res) => {
  try {
    // Support both urlencoded form and JSON payloads; also allow query params.
    const payload = Object.assign({}, req.body, req.query);
    const { rank, minecraft_username, type, amount } = payload;

    // Determine origin for success/cancel URLs
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;

    let priceCents;
    let productName;
    // Metadata will be attached to the Checkout Session so webhook can read it later
    let metadata = { minecraft_username: minecraft_username || 'Anonymous' };

    if ((type && String(type).toLowerCase() === 'donation') || rank === 'donation') {
      // Donation flow: require "amount" (dollars)
      const parsed = parseFloat(amount);
      if (!parsed || parsed <= 0) return res.status(400).send('Invalid donation amount');
      priceCents = Math.round(parsed * 100);
      productName = `Donation (${parsed.toFixed(2)} USD)`;
      metadata.type = 'donation';
    } else {
      // Rank purchase flow
      if (!rank || !PRICE_MAP[rank]) return res.status(400).send('Invalid rank');
      priceCents = PRICE_MAP[rank];
      productName = `${String(rank).toUpperCase()} Rank`;
      metadata.rank = rank;
      metadata.type = 'rank';
    }

    // Ensure username present in metadata
    metadata.minecraft_username = metadata.minecraft_username;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: productName },
            unit_amount: priceCents
          },
          quantity: 1
        }
      ],
      metadata,
      // On success/cancel, Stripe will redirect back to these pages
      success_url: `${origin}/store/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/store/cancel.html`
    });

    // Redirect user to Stripe Checkout (303 See Other)
    return res.redirect(303, session.url);
  } catch (err) {
    console.error('create-checkout error', err);
    return res.status(500).send('Failed to create checkout session');
  }
});

// ---------- Feedback endpoint ----------
// Accepts feedback submissions and appends them to db.json
app.post('/api/feedback', async (req, res) => {
  try {
    const { name, discord, type, message } = req.body;
    console.log('Feedback received:', { name, discord, type, message });

    const db = readDB();
    db.feedback.unshift({ name, discord, type, message, date: new Date().toISOString() });
    db.feedback = db.feedback.slice(0, 200); // keep recent 200 items
    writeDB(db);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling feedback:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ---------- Public endpoints ----------
// Returns top donators (read-only). Useful for the homepage or a leaderboard widget.
app.get('/api/top-donators', (req, res) => {
  const db = readDB();
  res.json({ donators: db.donators || [] });
});

// Simple health/status endpoint for uptime checks
app.get('/api/status', (req, res) => res.json({ ok: true }));

// ---------- Start server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API + store server running on port ${PORT}`);
});

/*
  Quick tips:
   - To run locally for testing Stripe webhooks, use the Stripe CLI:
       stripe listen --forward-to localhost:3000/webhook
     and set STRIPE_WEBHOOK_SECRET from the value stripe CLI prints.
   - Replace db.json with a proper database when scaling.
   - Protect the API endpoints and rate-limit form submissions in production.
*/
