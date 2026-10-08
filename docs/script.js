// Fly-in Burger-Menü: steuert Offcanvas, Overlay und Scroll-Lock
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const backdrop = document.getElementById('menu-backdrop');
const closeMenuButton = document.getElementById('close-menu');

// Schließt Panel, blendet Overlay aus, gibt Scrollen frei
const closeMobileMenu = () => {
  mobileMenu?.classList.remove('is-open');
  backdrop?.classList.remove('is-visible');
  document.body.style.overflow = '';
};

// Öffnet Panel, zeigt Overlay und sperrt Body-Scroll
const openMobileMenu = () => {
  mobileMenu?.classList.add('is-open');
  backdrop?.classList.add('is-visible');
  document.body.style.overflow = 'hidden';
};

// Klick auf Burger: toggelt zwischen offen/geschlossen
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

// Cookies (Placeholder – aktuell nur Logging)
document.addEventListener("DOMContentLoaded", () => {
  const banner = document.getElementById("cookie-banner");
  const acceptBtn = document.getElementById("accept-cookies");
  const declineBtn = document.getElementById("decline-cookies");

  if (!banner || !acceptBtn || !declineBtn) return;

  if (!localStorage.getItem("cookiesChoice")) {
    banner.style.display = "flex";
  }

  acceptBtn.addEventListener("click", () => {
    localStorage.setItem("cookiesChoice", "accepted");
    banner.style.display = "none";
    enableCookies();
  });

  declineBtn.addEventListener("click", () => {
    localStorage.setItem("cookiesChoice", "declined");
    banner.style.display = "none";
  });
});

function enableCookies() {
  console.log("Cookies wurden akzeptiert — hier kannst du Scripts starten.");
}

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
