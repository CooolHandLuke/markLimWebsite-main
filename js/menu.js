(function () {
  const btn = document.querySelector("[data-menu-btn]");
  const overlay = document.querySelector("[data-menu-overlay]");
  const NAVIGATION_DELAY = 220;
  let isNavigating = false;

  if (!btn || !overlay) return;

  const openMenu = () => {
    isNavigating = false;
    btn.classList.add("is-open");
    overlay.classList.add("is-open");
    overlay.classList.remove("is-navigating");
    btn.setAttribute("aria-label", "Close menu");
    btn.setAttribute("aria-expanded", "true");
    overlay.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  };

  const closeMenu = () => {
    isNavigating = false;
    btn.classList.remove("is-open");
    overlay.classList.remove("is-open");
    overlay.classList.remove("is-navigating");
    btn.setAttribute("aria-label", "Open menu");
    btn.setAttribute("aria-expanded", "false");
    overlay.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  };

  const toggleMenu = () => {
    if (overlay.classList.contains("is-open")) closeMenu();
    else openMenu();
  };

  btn.addEventListener("click", toggleMenu);

  // Close when clicking a menu link
  overlay.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link && !isNavigating) {
      e.preventDefault();
      isNavigating = true;
      btn.classList.remove("is-open");
      btn.setAttribute("aria-label", "Open menu");
      btn.setAttribute("aria-expanded", "false");
      overlay.classList.add("is-navigating");
      overlay.classList.add("is-open");
      setTimeout(() => {
        window.location.assign(link.href);
      }, NAVIGATION_DELAY);
    }
  });

  // ESC to close
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) {
      closeMenu();
    }
  });
})();
