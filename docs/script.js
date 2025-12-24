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