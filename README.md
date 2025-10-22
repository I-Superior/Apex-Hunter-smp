# Apex Hunter SMP

A modern landing site + small store for the Apex Hunter SMP community.

[![Preview gif](https://i.imgur.com/placeholder.gif)](https://github.com/your-repo)  
*(Replace the image link with a short animated GIF that showcases the landing page)*

Quick highlights
- Attractive gradient branding and animated background blobs
- Smooth entrance animations (AOS), card hover lifts and button shine
- Stripe-powered checkout for ranks & donations
- Creator profiles, feedback form, top-donator leaderboard

Design & Animation
- Gradient logo & hero text: subtle animated gradient for brand emphasis.
- Floating blobs: soft, blurred color blobs provide depth (CSS + slight animation).
- Card & button polish: lift-on-hover, glow, and a gentle shine sweep on CTA buttons.
- Entrance & scroll animations use AOS (already included) — tweak in `index.html` and JS.

Customizing visuals
- Colors & sizes: edit `styles.css` (blob colors `.blob-1/.blob-2`, gradient stops)
- Animation timings: adjust `@keyframes floaty` and the `animation-duration` values in CSS
- Logo text: the `.gradient-text` class centralizes gradient styling (applied to logo & hero title)

Developer quick start
1. Install & run API:
   - cd api && npm install
   - export STRIPE_SECRET_KEY="sk_test_..."
   - node server.js
2. Open: http://localhost:3000/index.html

Where to edit
- Visuals: `styles.css`
- Frontend behavior: `script.js`
- Payment & webhook: `api/server.js` (configure Stripe secrets)
- Creators: `creators/*.html`

Need a demo GIF?
- Use a short screen capture of the homepage (3-6s), host it (Imgur/GitHub repo) and replace the placeholder link above.

Contact
- Discord: https://discord.gg/rjjrJ9NhaQ

Enjoy — these small touches make the site feel more alive while remaining lightweight and easy to maintain.
