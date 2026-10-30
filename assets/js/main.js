// IkBenMedia — interactie zonder frameworks.
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  requestAnimationFrame(() => root.classList.add("is-loaded"));
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* Header: achtergrond na scrollen + voortgangsbalk + parallax van de hero */
  const header = document.querySelector("[data-header]");
  const progress = document.querySelector("[data-progress]");
  const parallaxImg = document.querySelector("[data-parallax]");
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle("is-scrolled", y > 12);
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (parallaxImg && !reduceMotion && y < window.innerHeight * 1.2) {
      parallaxImg.style.setProperty("--py", (-y * 0.12).toFixed(1));
    }
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* Mobiel menu */
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
    header.classList.toggle("menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setMenu(false); toggle.focus(); }
  });
  window.matchMedia("(min-width: 861px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

  /* Scroll-reveal, met een kleine vertraging per groep */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach((el) => {
      const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
      el.style.setProperty("--d", `${Math.min(siblings.indexOf(el), 5) * 0.07}s`);
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* Huidige sectie in de header en actieve navigatielink */
  const sections = document.querySelectorAll("[data-section]");
  const numEl = document.querySelector("[data-current-num]");
  const labelEl = document.querySelector("[data-current-label]");
  const navLinks = document.querySelectorAll(".nav-list a");
  if ("IntersectionObserver" in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const s = entry.target;
        numEl.textContent = s.dataset.section;
        labelEl.textContent = s.dataset.label;
        navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${s.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => so.observe(s));
  }

  /* Hero: lichtbundel volgt de cursor */
  const spot = document.querySelector("[data-spotlight]");
  if (spot && finePointer) {
    spot.addEventListener("pointermove", (e) => {
      const r = spot.getBoundingClientRect();
      spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
      spot.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  }

  /* Magnetische knoppen */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22;
        const y = (e.clientY - r.top - r.height / 2) * 0.32;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* Diensten: uitklapbare rijen + zwevende beeldpreview */
  document.querySelectorAll(".service-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      document.getElementById(btn.getAttribute("aria-controls")).hidden = open;
    });
  });

  const preview = document.querySelector("[data-service-preview]");
  if (preview && finePointer && !reduceMotion) {
    const img = preview.querySelector("img");
    let px = 0, py = 0, tx = 0, ty = 0, raf = 0;
    const follow = () => {
      px += (tx - px) * 0.16;
      py += (ty - py) * 0.16;
      preview.style.left = `${px}px`;
      preview.style.top = `${py}px`;
      raf = Math.abs(tx - px) + Math.abs(ty - py) > 0.5 ? requestAnimationFrame(follow) : 0;
    };
    document.querySelectorAll("[data-preview]").forEach((item) => {
      const toggleBtn = item.querySelector(".service-toggle");
      toggleBtn.addEventListener("click", () => {
        preview.classList.toggle("is-visible", toggleBtn.getAttribute("aria-expanded") !== "true");
      });
      toggleBtn.addEventListener("pointerenter", (e) => {
        if (toggleBtn.getAttribute("aria-expanded") === "true") return;
        img.src = item.dataset.preview;
        if (!preview.classList.contains("is-visible")) { px = tx = e.clientX + 140; py = ty = e.clientY; }
        preview.classList.add("is-visible");
      });
      toggleBtn.addEventListener("pointermove", (e) => {
        tx = e.clientX + 140; ty = e.clientY;
        if (!raf) raf = requestAnimationFrame(follow);
      });
      toggleBtn.addEventListener("pointerleave", () => preview.classList.remove("is-visible"));
    });
    window.addEventListener("scroll", () => preview.classList.remove("is-visible"), { passive: true });
  }

  /* Contactformulier: valideren en als e-mail openen (GitHub Pages heeft geen server) */
  const form = document.querySelector("[data-form]");
  const status = document.querySelector("[data-form-status]");
  const messages = {
    "f-naam": "Vul uw naam in.",
    "f-email": "Vul een geldig e-mailadres in.",
    "f-brief": "Vertel kort iets over uw project.",
  };
  const check = (input) => {
    const ok = input.checkValidity() && input.value.trim() !== "";
    input.setAttribute("aria-invalid", String(!ok));
    form.querySelector(`[data-error-for="${input.id}"]`).textContent = ok ? "" : messages[input.id];
    return ok;
  };
  Object.keys(messages).forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener("blur", () => { if (input.value) check(input); });
    input.addEventListener("input", () => { if (input.getAttribute("aria-invalid") === "true") check(input); });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const invalid = Object.keys(messages).map((id) => document.getElementById(id)).filter((i) => !check(i));
    if (invalid.length) { invalid[0].focus(); status.textContent = ""; status.classList.remove("is-ok"); return; }

    const data = new FormData(form);
    const services = data.getAll("dienst");
    const body = [
      `Naam: ${data.get("naam").trim()}`,
      `E-mail: ${data.get("email").trim()}`,
      `Diensten: ${services.length ? services.join(", ") : "—"}`,
      `Budget: ${data.get("budget") || "—"}`,
      "",
      data.get("brief").trim(),
    ].join("\n");
    const subject = `Projectaanvraag — ${data.get("naam").trim()}`;
    window.location.href = `mailto:info@ikbenmedia.nl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = "Uw e-mailprogramma wordt geopend met het bericht klaar om te verzenden.";
    status.classList.add("is-ok");
  });
})();
