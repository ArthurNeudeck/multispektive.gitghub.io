// Mobiles Menü: Glas-Panel, Overlay und Scroll-Lock
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const backdrop = document.getElementById('menu-backdrop');
const closeMenuButton = document.getElementById('close-menu');

// Schliesst Panel, blendet Overlay aus, gibt Scrollen frei
const closeMobileMenu = () => {
  mobileMenu?.classList.remove('is-open');
  backdrop?.classList.remove('is-visible');
  menuToggle?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
};

// Öffnet Panel, zeigt Overlay und sperrt Body-Scroll
const openMobileMenu = () => {
  mobileMenu?.classList.add('is-open');
  backdrop?.classList.add('is-visible');
  menuToggle?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  closeMenuButton?.focus();
};

menuToggle?.addEventListener('click', () => {
  if (mobileMenu?.classList.contains('is-open')) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
});

closeMenuButton?.addEventListener('click', closeMobileMenu);
backdrop?.addEventListener('click', closeMobileMenu);

mobileMenu?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeMobileMenu);
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMobileMenu();
});

// Kopfzeile bekommt eine Glasfläche, sobald gescrollt wird
const kopf = document.getElementById('kopf');
const dunkleAbschnitte = [...document.querySelectorAll('.abschnitt--dunkel, .fuss')];
const updateKopf = () => {
  if (!kopf) return;
  kopf.classList.toggle('ist-gescrollt', window.scrollY > 8);
  // Dark glass while a dark section sits behind the header
  const mitte = kopf.offsetHeight / 2;
  const dunkel = dunkleAbschnitte.find(el => {
    const r = el.getBoundingClientRect();
    return r.top <= mitte && r.bottom >= mitte;
  });
  kopf.classList.toggle('auf-dunkel', !!dunkel);
  // Header glass takes on the colour of the section behind it
  if (dunkel) {
    const farbe = getComputedStyle(dunkel).getPropertyValue('--flaeche').trim();
    kopf.style.setProperty('--kopf-dunkel', farbe || getComputedStyle(dunkel).backgroundColor);
  }
};
updateKopf();
window.addEventListener('scroll', updateKopf, { passive: true });

// E-Mail-Schutz: Adresse steht im HTML nur als "name(at)domain" und wird erst im Browser
// zu einem klickbaren mailto-Link zusammengesetzt, damit Adress-Sammelroboter sie nicht finden
document.querySelectorAll('.js-email').forEach(link => {
  const address = `${link.dataset.user}@${link.dataset.domain}`;
  link.href = `mailto:${address}`;
  link.textContent = address;
});


// Kontaktformular: sendet an Formspree, ohne die Seite zu verlassen, und zeigt eine Rückmeldung
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

contactForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = contactForm.querySelector('button[type="submit"]');
  button.disabled = true;
  formStatus.className = 'form-status';
  formStatus.textContent = 'Wird gesendet …';

  try {
    const response = await fetch(contactForm.action, {
      method: 'POST',
      body: new FormData(contactForm),
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    contactForm.reset();
    formStatus.classList.add('form-status--success');
    formStatus.textContent = 'Danke für deine Nachricht! Ich melde mich so bald wie möglich bei dir.';
  } catch {
    formStatus.classList.add('form-status--error');
    formStatus.textContent = 'Das hat leider nicht geklappt. Bitte versuche es später noch einmal oder schreib mir direkt an ' + ['info', 'multispektive.ch'].join('@') + '.';
  } finally {
    button.disabled = false;
  }
});

// Grafiken: ein ruhiger Moment, wenn sie ins Bild kommen (nur ohne "Bewegung reduzieren").
// Linien werden gezeichnet: ihre Länge wird gemessen und als --l gesetzt.
const auftritte = document.querySelectorAll('.auftritt');
if (auftritte.length && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.auftritt .zeichnen').forEach(el => {
    try {
      el.style.setProperty('--l', Math.ceil(el.getTotalLength()) + 1);
    } catch {}
  });
  document.documentElement.classList.add('anim');
  const beobachter = new IntersectionObserver((eintraege) => {
    eintraege.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('zeigen');
      beobachter.unobserve(e.target);
    });
  }, { threshold: 0.35 });
  auftritte.forEach(el => beobachter.observe(el));
}

// Seitenwechsel als Lichtbrechung: beim Verlassen fallen sechs Spektralbänder über die Seite,
// auf der neuen Seite heben sie sich wieder ab. Ohne "Bewegung reduzieren" und nur zwischen eigenen Seiten.
(() => {
  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const baender = () => {
    const el = document.createElement('div');
    el.className = 'lichtwechsel';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span></span>'.repeat(6);
    document.body.appendChild(el);
    return el;
  };
  const merken = (wert) => { try { wert ? sessionStorage.setItem('lichtwechsel', '1') : sessionStorage.removeItem('lichtwechsel'); } catch {} };

  // Arrival
  if (document.documentElement.classList.contains('lichtwechsel-ankunft')) {
    merken(false);
    const el = baender();
    el.classList.add('da');
    document.documentElement.classList.remove('lichtwechsel-ankunft');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.classList.add('hebt');
      setTimeout(() => el.remove(), 1100);
    }));
  }

  if (ruhig) return;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    const ziel = new URL(a.href, location.href);
    if (ziel.origin !== location.origin || ziel.pathname === location.pathname) return;
    if (!/\.html$|\/$/.test(ziel.pathname)) return;
    e.preventDefault();
    const el = baender();
    requestAnimationFrame(() => el.classList.add('geht'));
    merken(true);
    setTimeout(() => { location.href = ziel.href; }, 850);
  });
  // Back/forward from the cache: remove a leftover curtain
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) document.querySelectorAll('.lichtwechsel').forEach(el => el.remove());
  });
})();
