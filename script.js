// Initialize AOS animations if available
if (window.AOS) {
  AOS.init({ duration: 800, once: true, easing: 'ease-out-cubic' });
}

// Inject decorative gradient background blobs into the page (non-interactive)
(function addBackgroundBlobs() {
  try {
    const wrapper = document.createElement('div');
    wrapper.className = 'site-gradient-bg';
    // two decorative blobs
    const b1 = document.createElement('div'); b1.className = 'animated-blob blob-1'; wrapper.appendChild(b1);
    const b2 = document.createElement('div'); b2.className = 'animated-blob blob-2'; wrapper.appendChild(b2);
    document.body.insertBefore(wrapper, document.body.firstChild);
  } catch (e) { /* fail silently */ }
})();

// Mobile menu: close menu when a link clicked (better UX)
document.addEventListener('click', function (e) {
  const mobileMenu = document.getElementById('mobile-menu');
  if (!mobileMenu) return;
  if (e.target.tagName === 'A' && mobileMenu.classList && !mobileMenu.classList.contains('hidden')) {
    // if link is inside mobile menu, hide it
    if (mobileMenu.contains(e.target)) {
      mobileMenu.classList.add('hidden');
    }
  }
});

// Simple toast utility (used by other scripts)
function showToast(msg, timeout = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast bg-gray-800/90 text-white px-4 py-2 rounded shadow';
  el.style.pointerEvents = 'auto';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .25s'; el.style.opacity = '0'; setTimeout(()=>el.remove(), 300); }, timeout);
}

// Clipboard helper (used by copy buttons)
function copyToClipboard(text) {
  if (!navigator.clipboard) {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); showToast('Copied to clipboard'); } catch(e){ showToast('Copy failed'); }
    ta.remove(); return;
  }
  navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard'), () => showToast('Copy failed'));
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
