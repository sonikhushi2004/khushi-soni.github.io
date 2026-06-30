// ── Mobile menu toggle ──
const toggle = document.querySelector('.navbar__toggle');
const nav = document.querySelector('.navbar__nav');

toggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.navbar__link').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  });
});

// ── Navbar elevation on scroll ──
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  navbar.style.background = window.scrollY > 10
    ? 'rgba(13, 13, 13, 0.97)'
    : 'rgba(13, 13, 13, 0.85)';
}, { passive: true });

// ── Scroll-spy: active nav link ──
(function () {
  const navLinks = document.querySelectorAll('.navbar__link[data-section]');

  // Sections that actually exist in the DOM
  const sections = [...navLinks]
    .map(a => document.getElementById(a.dataset.section))
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(a => {
      a.classList.toggle('is-active', a.dataset.section === id);
    });
  }

  // Mark Hero active on load
  setActive('hero');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, {
    // Fire when a section crosses 40% into the viewport
    rootMargin: `0px 0px -55% 0px`,
    threshold: 0,
  });

  sections.forEach(sec => observer.observe(sec));
}());

// ── Hero particle canvas ──
(function () {
  const canvas = document.querySelector('.hero__canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const ACCENT = '108, 99, 255';
  const WHITE = '255, 255, 255';
  const COUNT = 72;
  const MAX_DIST = 140;

  let W, H, particles;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function createParticle() {
    return {
      x: rand(0, W),
      y: rand(0, H),
      vx: rand(-0.28, 0.28),
      vy: rand(-0.28, 0.28),
      r: rand(1, 2.2),
      // alternate between accent and white dots
      color: Math.random() > 0.6 ? ACCENT : WHITE,
      alpha: rand(0.25, 0.7),
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: COUNT }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw connecting lines
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const opacity = (1 - dist / MAX_DIST) * 0.12;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${ACCENT}, ${opacity})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Draw dots
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
      ctx.fill();

      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;
    }

    requestAnimationFrame(draw);
  }

  init();
  draw();

  window.addEventListener('resize', () => {
    resize();
    particles = Array.from({ length: COUNT }, createParticle);
  }, { passive: true });
}());

// ── Scroll reveal ──
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      // Stagger siblings inside the same parent
      const siblings = [...entry.target.parentElement.querySelectorAll('.reveal')];
      const idx = siblings.indexOf(entry.target);
      entry.target.style.transitionDelay = `${idx * 0.12}s`;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  els.forEach(el => observer.observe(el));
}());

// ── Contact form → EmailJS ──
(function () {
  // ── Replace these four values with your own from emailjs.com ──
  const PUBLIC_KEY = 'K6D7OTlBEWWya5Op8';
  const SERVICE_ID = 'service_cxmcsad';
  const NOTIFICATION_TEMPLATE = 'template_eqxujz7'; // email sent to you
  const CONFIRMATION_TEMPLATE = 'template_de50dg7'; // email sent to visitor

  emailjs.init(PUBLIC_KEY);

  const form = document.querySelector('.contact__form');
  if (!form) return;

  const submitBtn = form.querySelector('.contact__submit');

  function showToast(message, isError) {
    const old = document.querySelector('.contact-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'contact-toast' + (isError ? ' contact-toast--error' : '');
    toast.textContent = message;
    document.body.appendChild(toast);

    toast.offsetHeight; // force reflow for transition
    toast.classList.add('contact-toast--visible');

    setTimeout(() => {
      toast.classList.remove('contact-toast--visible');
      setTimeout(() => toast.remove(), 400);
    }, 5000);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = form.querySelector('#contact-name').value.trim();
    const email = form.querySelector('#contact-email').value.trim();
    const message = form.querySelector('#contact-message').value.trim();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      await emailjs.send(SERVICE_ID, NOTIFICATION_TEMPLATE, {
        from_name: name,
        from_email: email,
        message: message,
      });

      await emailjs.send(SERVICE_ID, CONFIRMATION_TEMPLATE, {
        to_name: name,
        to_email: email,
      });

      form.reset();
      showToast('Message sent! A confirmation has been emailed to you.');
    } catch (err) {
      console.error('EmailJS error:', err);
      showToast('Something went wrong. Please try again.', true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });
}());

// ── Count-up animation ──
(function () {
  const counters = document.querySelectorAll('.count');
  if (!counters.length) return;

  const DURATION = 1600;

  function animateCount(el) {
    const target = parseInt(el.dataset.target, 10);
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / DURATION, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }

    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}());
