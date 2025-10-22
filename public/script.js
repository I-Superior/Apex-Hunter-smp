// Initialize AOS (Animate On Scroll) if available
if (window.AOS) {
  AOS.init({ duration: 900, once: true, offset: 80 });
}

// Smooth scroll for in-page anchors (covers browsers without native behavior)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// copy-to-clipboard + toast feedback
function copyToClipboard(text) {
  if (!navigator.clipboard) {
    fallbackCopy(text);
    showToast('Copied to clipboard');
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied: ' + text);
  }, () => {
    showToast('Unable to copy');
  });
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  ta.remove();
}

// basic toast implementation
function showToast(message, timeout = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  container.appendChild(el);
  // auto remove with fade-out
  setTimeout(() => {
    el.style.animation = 'toast-out .28s ease forwards';
    setTimeout(() => el.remove(), 280);
  }, timeout);
}

// Optional: add nav styling toggle on scroll (if present)
window.addEventListener('scroll', function() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  if (window.scrollY > 50) {
    nav.classList.add('bg-gray-800');
    nav.classList.remove('bg-gray-800/80');
  } else {
    nav.classList.add('bg-gray-800/80');
    nav.classList.remove('bg-gray-800');
  }
});

// Falling items: lightweight emoji-based "Minecraft" items
(function(){
  const ITEMS = [
    { emoji: '💎', cls: 'diamond' },    // diamond
    { emoji: '🥇', cls: 'gold' },      // gold-like medal (gold)
    { emoji: '💚', cls: 'emerald' },   // emerald-like (green)
    { emoji: '⚔️', cls: 'sword' },     // sword
    { emoji: '⛏️', cls: 'sword' },     // pickaxe-ish
    { emoji: '🪓', cls: 'sword' }      // axe-ish
  ];

  const container = document.getElementById('fall-container');
  if (!container) return;

  let running = true;
  const MAX_ITEMS = 28; // cap simultaneous elements
  const MIN_INTERVAL = 300;
  const MAX_INTERVAL = 900;

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function randInt(min, max){ return Math.floor(rand(min, max+1)); }

  function spawnItem() {
    if (!running) return;
    if (container.children.length >= MAX_ITEMS) return;

    const item = ITEMS[randInt(0, ITEMS.length - 1)];
    const el = document.createElement('span');
    el.className = `fall-item ${item.cls}`;
    el.textContent = item.emoji;

    // random horizontal position (with safe margins)
    const leftPct = rand(3, 95);
    el.style.left = leftPct + '%';

    // random size
    const size = Math.round(rand(20, 62)); // px
    el.style.fontSize = size + 'px';

    // random animation durations
    const fallDuration = rand(4.2, 9.0); // seconds (free-fall)
    const spinDuration = rand(3.8, 8.0);  // seconds (continuous)

    // explicitly set animation names and durations (matches CSS)
    el.style.animationName = 'fall, spin';
    el.style.animationDuration = `${fallDuration}s, ${spinDuration}s`;
    el.style.animationTimingFunction = 'cubic-bezier(0.25,0.1,0.25,1), linear';
    el.style.animationIterationCount = '1, infinite';

    // small horizontal offset to vary starting transform (prevents strict stacking)
    const initialX = rand(-12, 12);
    el.style.transform = `translateX(${initialX}px)`;

    // remove when 'fall' animation finishes
    const onAnimEnd = (ev) => {
      if (ev.animationName === 'fall') {
        el.remove();
        el.removeEventListener('animationend', onAnimEnd);
      }
    };
    el.addEventListener('animationend', onAnimEnd);

    // safety removal in case animationend doesn't fire (e.g., tab hidden)
    const safetyTimer = setTimeout(() => {
      if (el.parentNode) el.remove();
      clearTimeout(safetyTimer);
    }, Math.ceil(fallDuration * 1000) + 500);

    container.appendChild(el);
  }

  let spawnTimer = null;
  function scheduleNext() {
    const t = randInt(MIN_INTERVAL, MAX_INTERVAL);
    spawnTimer = setTimeout(() => {
      spawnItem();
      scheduleNext();
    }, t);
  }

  // Start spawning after DOM ready (if not already)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleNext);
  } else {
    scheduleNext();
  }

  // Expose controls for potential later use
  window.fallingItems = {
    stop() { running = false; clearTimeout(spawnTimer); },
    start() { if (!running) { running = true; scheduleNext(); } },
    clear() { Array.from(container.children).forEach(c => c.remove()); }
  };
})();

// Form handling
document.getElementById('feedbackForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const status = document.getElementById('formStatus');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Disable submit button and show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending...';
    status.textContent = '';

    // Gather form data
    const formData = {
        name: form.querySelector('#name').value,
        discord: form.querySelector('#discord').value,
        type: form.querySelector('#type').value,
        message: form.querySelector('#message').value
    };

    try {
        // Mock API endpoint - replace with your actual endpoint
        const response = await fetch('https://api.apexhunter.com/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            status.textContent = 'Thank you for your feedback!';
            status.className = 'text-green-400 text-sm mt-4';
            form.reset();
        } else {
            throw new Error('Failed to submit');
        }
    } catch (err) {
        status.textContent = 'Failed to submit. Please try again or contact us on Discord.';
        status.className = 'text-red-400 text-sm mt-4';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Feedback';
    }
});

// Update top donators periodically (example)
async function updateTopDonators() {
    try {
        const response = await fetch('https://api.apexhunter.com/top-donators');
        const data = await response.json();
        // Update the DOM with new donator data
        // This is a mock function - implement actual update logic
    } catch (err) {
        console.error('Failed to fetch top donators');
    }
}

// Refresh top donators every 5 minutes
setInterval(updateTopDonators, 300000);
