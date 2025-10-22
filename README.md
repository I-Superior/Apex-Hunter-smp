# Apex Hunter SMP

[![Demo GIF](https://i.imgur.com/placeholder.gif)](https://github.com/your-repo)  
A modern landing site + lightweight store for the Apex Hunter SMP community — beautiful gradients, floating background blobs, animated cards, creator profiles, and Stripe-powered ranks & donations.

Badges:  
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4) ![Node](https://img.shields.io/badge/Node-Express-339933) ![Stripe](https://img.shields.io/badge/Payments-Stripe-6772e5)

Quick highlights
- Gradient logo & hero text with subtle animation
- Soft blurred floating blobs for depth
- AOS scroll animations, card lift & button shine
- Creator profiles, donation & rank checkout (Stripe)
- Minimal Express API recording donations/purchases to a JSON store

Design & Animation
- Gradient logo: `.gradient-text` class (index.html)
- Floating blobs: injected by `script.js` (`animated-blob` / `.site-gradient-bg`)
- Card & button polish: `.card-animated`, `.btn-shine`, `.logo-glow` in `styles.css`
- Entrance animations: AOS (configured in `script.js`, AOS attrs in HTML)

Demo / Preview GIF
- Replace the image at the top (placeholder.gif) with a short animated GIF (3–6s) that demonstrates the hero, blob motion, and a hover on a rank card.
- Quick GIF capture (Linux): use Peek or ffmpeg.
  - Peek (GUI): install and record, save as GIF.
  - ffmpeg (CLI) example (records 8s of a 1280x720 area):
    - ffmpeg -video_size 1280x720 -framerate 30 -f x11grab -i :0.0+100,200 -t 8 out.mp4
    - ffmpeg -i out.mp4 -vf "fps=15,scale=640:-1:flags=lanczos" -gifflags -transdiff -y preview.gif

Quick start (local)
1. Clone the repo:
   - git clone <repo-url>
   - cd Apex-Hunter-smp
2. API & store:
   - cd api
   - npm install
   - export STRIPE_SECRET_KEY="sk_test_..."
   - export STRIPE_WEBHOOK_SECRET="whsec_..."  # optional for signature verification
   - node server.js
3. Open the site:
   - http://localhost:3000/index.html

Where to edit visuals
- `styles.css` — blobs, gradients, card/button polish
  - blob colors: `.blob-1`, `.blob-2` (background gradients)
  - gradient text: `.gradient-text`
- `script.js` — AOS init, blob injection timing, toast helpers
- `index.html` — hero/title/logo markup and AOS attributes
- Creator pages: `/creators/*.html` — update profiles and avatar assets

Payments & webhooks
- Stripe Checkout handled in `api/server.js` (`/api/create-checkout`)  
  Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` before running.
- Use Stripe CLI for local webhook testing:
  - stripe listen --forward-to localhost:3000/webhook

Tips for a beautiful repo
- Add a short GIF that highlights the landing hero and a hover effect on a rank card.
- Use a 640px-wide GIF; keep under ~3MB for GitHub display.
- Add an `assets/preview.gif` and update the README image URL to point to it.

Contributing
- Fork → branch → PR. Keep UI changes focused and include screenshots/GIFs for visual updates.

Contact
- Discord: https://discord.gg/rjjrJ9NhaQ

License
- Add your LICENSE file or state terms.

Enjoy — small design details make the site feel polished while remaining lightweight and easy to maintain.
