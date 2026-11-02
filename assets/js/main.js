// IkBenMedia — interactie, zonder frameworks.
(() => {
  const html = document.documentElement;
  const minderBeweging = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fijneMuis = matchMedia("(hover: hover) and (pointer: fine)").matches;

  requestAnimationFrame(() => html.classList.add("is-geladen"));

  /* ── Menu op kleine schermen ── */
  const menuknop = document.querySelector(".menuknop");
  const menu = document.getElementById("hoofdmenu");
  const zetMenu = (open) => {
    menuknop.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
    html.classList.toggle("menu-open", open);
  };
  menuknop.addEventListener("click", () => zetMenu(menuknop.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) zetMenu(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuknop.getAttribute("aria-expanded") === "true") { zetMenu(false); menuknop.focus(); }
  });
  matchMedia("(min-width: 881px)").addEventListener("change", (e) => { if (e.matches) zetMenu(false); });

  /* ── Verschijnen bij scrollen ── */
  const reveals = document.querySelectorAll(".reveal, .werk, .over-foto");
  if ("IntersectionObserver" in window && !minderBeweging) {
    const io = new IntersectionObserver((items) => {
      for (const item of items) {
        if (!item.isIntersecting) continue;
        item.target.classList.add("is-in");
        io.unobserve(item.target);
      }
    }, { rootMargin: "0px 0px -10% 0px" });
    reveals.forEach((el) => {
      const broertjes = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
      el.style.setProperty("--vertraging", `${Math.min(Math.max(broertjes.indexOf(el), 0), 5) * 0.08}s`);
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ── Stappen: de lijn tekent mee met het scrollen ── */
  const stappen = document.querySelector("[data-stappen]");
  if (stappen) {
    const items = [...stappen.children];
    const update = () => {
      const r = stappen.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / (r.height + innerHeight * 0.15)));
      stappen.style.setProperty("--voortgang", minderBeweging ? 1 : p.toFixed(3));
      items.forEach((li, i) => li.classList.toggle("is-aan", minderBeweging || p >= i / items.length + 0.02));
    };
    addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    addEventListener("resize", update);
    update();
  }

  /* ── Footer: letters worden breder en zwaarder rond de muis ── */
  const golf = document.querySelector(".golf");
  if (golf && !minderBeweging) {
    const tekst = golf.textContent;
    golf.textContent = "";
    const wrapper = document.createElement("span");
    wrapper.setAttribute("aria-hidden", "true");
    const letters = [...tekst].map((teken) => {
      const s = document.createElement("span");
      s.className = "letter";
      s.textContent = teken === " " ? " " : teken;
      wrapper.appendChild(s);
      return s;
    });
    golf.appendChild(wrapper);

    let muisX = null, raf = 0, t0 = performance.now(), zichtbaar = false;
    const teken = (nu) => {
      raf = 0;
      if (!zichtbaar) return;
      letters.forEach((l, i) => {
        let k;
        if (muisX !== null) {
          const r = l.getBoundingClientRect();
          const d = Math.abs(r.left + r.width / 2 - muisX);
          k = Math.max(0, 1 - d / 260);
        } else {
          // Zonder muis: een rustige golf die door de zin loopt.
          k = (Math.sin((nu - t0) / 700 - i * 0.35) + 1) / 2 * 0.55;
        }
        l.style.fontVariationSettings = `"wdth" ${(78 + k * 47).toFixed(1)}, "wght" ${(500 + k * 400).toFixed(0)}`;
      });
      if (muisX === null) raf = requestAnimationFrame(teken);
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(teken); };
    if (fijneMuis) {
      golf.addEventListener("pointermove", (e) => { muisX = e.clientX; start(); });
      golf.addEventListener("pointerleave", () => { muisX = null; start(); });
    }
    new IntersectionObserver(([e]) => { zichtbaar = e.isIntersecting; if (zichtbaar) start(); }).observe(golf);
  }

  /* ── Contactformulier: controleren en als e-mail openen ── */
  const formulier = document.querySelector("[data-formulier]");
  if (formulier) {
    const status = formulier.querySelector("[data-status]");
    const regels = {
      "v-naam": (v) => v.trim() ? "" : "Vul uw naam in.",
      "v-email": (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Vul een geldig e-mailadres in, bijvoorbeeld naam@bedrijf.nl.",
      "v-bericht": (v) => v.trim().length >= 10 ? "" : "Schrijf in een paar woorden waar u hulp bij zoekt.",
    };
    const controleer = (id) => {
      const veld = document.getElementById(id);
      const melding = regels[id](veld.value);
      const fout = document.getElementById("fout-" + id.slice(2));
      veld.setAttribute("aria-invalid", String(Boolean(melding)));
      fout.textContent = melding;
      fout.hidden = !melding;
      return !melding;
    };
    Object.keys(regels).forEach((id) => {
      const veld = document.getElementById(id);
      veld.addEventListener("blur", () => { if (veld.value) controleer(id); });
      veld.addEventListener("input", () => { if (veld.getAttribute("aria-invalid") === "true") controleer(id); });
    });

    formulier.addEventListener("submit", (e) => {
      e.preventDefault();
      const fout = Object.keys(regels).filter((id) => !controleer(id));
      if (fout.length) { document.getElementById(fout[0]).focus(); status.textContent = ""; return; }
      const d = new FormData(formulier);
      const diensten = d.getAll("dienst");
      const tekst = [
        `Naam: ${d.get("naam").trim()}`,
        `E-mail: ${d.get("email").trim()}`,
        `Telefoon: ${d.get("telefoon").trim() || "niet ingevuld"}`,
        `Diensten: ${diensten.length ? diensten.join(", ") : "niet ingevuld"}`,
        `Budget: ${d.get("budget") || "niet ingevuld"}`,
        "",
        d.get("bericht").trim(),
      ].join("\n");
      const onderwerp = `Projectaanvraag van ${d.get("naam").trim()}`;
      location.href = `mailto:info@ikbenmedia.nl?subject=${encodeURIComponent(onderwerp)}&body=${encodeURIComponent(tekst)}`;
      status.textContent = "Uw e-mailprogramma opent nu met het bericht. Druk daar op verzenden. Opent er niets? Mail dan naar info@ikbenmedia.nl.";
    });
  }

  /* ── Het logo als mozaïek: van chaos naar orde ── */
  const LOGO = [
    [[270, 88], [350, 148], [270, 206], [190, 148]],
    [[135, 145], [270, 246], [405, 145], [405, 350], [360, 386], [360, 240], [270, 306], [180, 240], [180, 386], [135, 350]],
    [[212, 353], [270, 394], [328, 353], [328, 410], [270, 450], [212, 410]],
  ];
  const binnen = (x, y, poly) => {
    let in_ = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) in_ = !in_;
    }
    return in_;
  };
  const CELLEN = [];
  for (let y = 82; y < 456; y += 9) {
    for (let x = 128; x < 412; x += 9) {
      if (LOGO.some((p) => binnen(x + 4.5, y + 4.5, p))) CELLEN.push([x + 4.5, y + 4.5]);
    }
  }

  document.querySelectorAll("[data-mozaiek]").forEach((canvas) => {
    const ctx = canvas.getContext("2d");
    const figuur = canvas.closest("figure");
    const held = canvas.closest("section");
    const PAPIER = "#F2EFE9", ROOD = "#FF6A4D";
    let B = 0, H = 0, dpr = 1, schaal = 1, cel = 9, ox = 0, oy = 0;
    let delen = [], raf = 0, zichtbaar = true, muis = null, uiteen = canvas.dataset.start === "chaos";

    const maat = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      B = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(B * dpr); canvas.height = Math.round(H * dpr);
      schaal = Math.min((B * 0.86) / 284, (H * 0.9) / 374);
      cel = 9 * schaal;
      ox = (B - 284 * schaal) / 2 - 128 * schaal;
      oy = (H - 374 * schaal) / 2 - 82 * schaal;
      const eerste = delen.length === 0;
      CELLEN.forEach(([cx, cy], i) => {
        const tx = ox + cx * schaal, ty = oy + cy * schaal;
        if (eerste) {
          const hoek = Math.atan2(ty - H / 2, tx - B / 2) + (Math.random() - 0.5) * 1.2;
          delen.push({
            tx, ty, x: Math.random() * B, y: Math.random() * H,
            vx: 0, vy: 0, r: (Math.random() - 0.5) * 3, vr: 0,
            richt: [Math.cos(hoek), Math.sin(hoek)],
            los: 0, hitte: 1,
          });
        } else {
          delen[i].tx = tx; delen[i].ty = ty;
        }
      });
    };

    const verspreid = (kracht = 1) => {
      const nu = performance.now();
      delen.forEach((d) => {
        const hoek = Math.random() * Math.PI * 2;
        const v = (6 + Math.random() * 18) * kracht;
        d.vx += Math.cos(hoek) * v; d.vy += Math.sin(hoek) * v;
        d.vr += (Math.random() - 0.5) * 0.9;
        d.los = nu + 500 + Math.random() * 700 + (d.ty / H) * 600;
      });
      start();
    };

    const bouwOp = () => {
      const nu = performance.now();
      delen.forEach((d) => { d.los = nu + 150 + (d.ty / H) * 900 + Math.random() * 350; });
      start();
    };

    const stap = (nu) => {
      raf = 0;
      // Hoe verder de bezoeker scrollt, hoe meer het logo uit elkaar waait.
      let spreiding = 0;
      if (held && !minderBeweging) {
        const r = held.getBoundingClientRect();
        spreiding = Math.min(1, Math.max(0, (-r.top - r.height * 0.3) / (r.height * 0.7))) ** 2;
      }
      let beweging = 0;
      for (const d of delen) {
        let ax = 0, ay = 0;
        if (uiteen || nu < d.los) {
          // Chaos: rustig zweven, weg van de vorm.
          ax += Math.sin(nu / 900 + d.ty) * 0.04;
          ay += Math.cos(nu / 1100 + d.tx) * 0.04;
          if (d.x < 0 || d.x > B) d.vx *= -1;
          if (d.y < 0 || d.y > H) d.vy *= -1;
          d.vr += (Math.random() - 0.5) * 0.01;
        } else {
          const doelX = d.tx + d.richt[0] * spreiding * B * 0.6;
          const doelY = d.ty + d.richt[1] * spreiding * H * 0.6;
          ax += (doelX - d.x) * 0.06;
          ay += (doelY - d.y) * 0.06;
          d.vr += -d.r * 0.08;
        }
        if (muis) {
          const dx = d.x - muis.x, dy = d.y - muis.y, af = Math.hypot(dx, dy);
          const straal = Math.max(70, cel * 9);
          if (af < straal && af > 0.01) {
            const f = (1 - af / straal) * 3.2;
            ax += (dx / af) * f; ay += (dy / af) * f;
            d.vr += (Math.random() - 0.5) * 0.05;
          }
        }
        d.vx = (d.vx + ax) * 0.82; d.vy = (d.vy + ay) * 0.82;
        d.vr *= 0.86;
        d.x += d.vx; d.y += d.vy; d.r += d.vr;
        const snelheid = Math.abs(d.vx) + Math.abs(d.vy);
        d.hitte = Math.max(d.hitte * 0.93, Math.min(1, snelheid / 6));
        beweging += snelheid + Math.abs(d.vr) * 20 + Math.abs(d.tx - d.x) * 0.01 * (uiteen ? 0 : 1);
      }
      teken();
      const rustig = beweging / delen.length < 0.02 && !muis;
      if (zichtbaar && (!rustig || uiteen || delen.some((d) => nu < d.los))) raf = requestAnimationFrame(stap);
    };

    const teken = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const z = cel * 0.8;
      for (const kleur of [PAPIER, ROOD]) {
        ctx.fillStyle = kleur;
        for (const d of delen) {
          if ((d.hitte > 0.35) !== (kleur === ROOD)) continue;
          const c = Math.cos(d.r) * dpr, s = Math.sin(d.r) * dpr;
          ctx.setTransform(c, s, -s, c, d.x * dpr, d.y * dpr);
          ctx.fillRect(-z / 2, -z / 2, z, z);
        }
      }
    };

    const start = () => { if (!raf && zichtbaar) raf = requestAnimationFrame(stap); };

    maat();
    if (minderBeweging) {
      delen.forEach((d) => { d.x = d.tx; d.y = d.ty; d.r = 0; d.hitte = 0; });
      if (uiteen) delen.forEach((d) => { d.x = Math.random() * B; d.y = Math.random() * H; d.r = Math.random() * 3; });
      teken();
    } else if (!uiteen) {
      bouwOp();
    } else {
      start();
    }

    new ResizeObserver(() => {
      maat();
      if (minderBeweging) { delen.forEach((d) => { if (!uiteen) { d.x = d.tx; d.y = d.ty; } }); teken(); } else start();
    }).observe(canvas);

    new IntersectionObserver(([e]) => { zichtbaar = e.isIntersecting; if (zichtbaar) start(); }).observe(canvas);
    document.addEventListener("visibilitychange", () => { zichtbaar = !document.hidden; if (zichtbaar) start(); });

    if (!minderBeweging) {
      addEventListener("scroll", start, { passive: true });
      canvas.addEventListener("pointermove", (e) => {
        const r = canvas.getBoundingClientRect();
        muis = { x: e.clientX - r.left, y: e.clientY - r.top };
        start();
      });
      canvas.addEventListener("pointerleave", () => { muis = null; start(); });
      canvas.addEventListener("click", () => { uiteen = false; verspreid(); });
    }

    figuur.querySelector("[data-schud]")?.addEventListener("click", () => {
      if (minderBeweging) return;
      uiteen = false; verspreid(1.3);
    });
    figuur.querySelector("[data-heel]")?.addEventListener("click", (e) => {
      uiteen = false;
      e.currentTarget.textContent = "Het logo is weer heel";
      if (minderBeweging) { delen.forEach((d) => { d.x = d.tx; d.y = d.ty; d.r = 0; }); teken(); } else bouwOp();
    });
  });
})();
