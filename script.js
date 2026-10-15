const root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Tema terang / gelap ---------- */
try { const t = localStorage.getItem("tema"); if (t) root.dataset.theme = t } catch (e) { }
document.getElementById("theme").onclick = () => {
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme:dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("tema", root.dataset.theme) } catch (e) { }
};

/* ---------- Menu mobile ---------- */
const links = document.getElementById("links");
const menuBtn = document.getElementById("menu");
menuBtn.onclick = () => {
  const open = links.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
};
links.onclick = () => { links.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); };

document.getElementById("yr").textContent = new Date().getFullYear();

/* ---------- Animasi muncul saat scroll ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("show"); io.unobserve(e.target) } }), { threshold: .12 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* ---------- Menu aktif sesuai bagian yang dilihat ---------- */
const navLinks = [...links.querySelectorAll("a")];
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
}), { rootMargin: "-45% 0px -50% 0px" });
navLinks.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean).forEach(s => spy.observe(s));

/* ---------- Bar progres scroll ---------- */
const bar = document.getElementById("bar");
function progress() {
  const max = root.scrollHeight - root.clientHeight;
  bar.style.transform = "scaleX(" + (max > 0 ? root.scrollTop / max : 0) + ")";
}
addEventListener("scroll", progress, { passive: true });
progress();

/* ---------- Efek mengetik (ubah daftar kata sesuai selera) ---------- */
const typed = document.getElementById("typed");
const words = ["Mahasiswa Teknik Informatika", "Pengembang Web (PHP & JavaScript)", "Barista & Event Crew"];
if (!reduce) {
  let wi = 0, ci = 0, del = false;
  (function tick() {
    const w = words[wi];
    typed.textContent = w.slice(0, ci);
    let d;
    if (!del) { if (ci < w.length) { ci++; d = 70 } else { del = true; d = 1500 } }
    else { if (ci > 0) { ci--; d = 35 } else { del = false; wi = (wi + 1) % words.length; d = 300 } }
    setTimeout(tick, d);
  })();
}

/* ---------- Spotlight di kartu ---------- */
document.querySelectorAll(".card").forEach(card =>
  card.addEventListener("pointermove", e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--px", (e.clientX - r.left) + "px");
    card.style.setProperty("--py", (e.clientY - r.top) + "px");
  })
);

/* ---------- Background: partikel jaringan + cahaya mengikuti kursor ---------- */
const canvas = document.getElementById("net");
const glow = document.getElementById("glow");
if (canvas) {
  const ctx = canvas.getContext("2d");
  const colors = ["#7c3aed", "#06b6d4", "#ec4899", "#f59e0b", "#22c55e"];
  let w = 0, h = 0, pts = [], raf = 0;
  const mouse = { x: -1e4, y: -1e4 };

  function size(force) {
    const nw = innerWidth, nh = innerHeight;
    // abaikan perubahan tinggi kecil (address bar HP) agar partikel tidak reset
    if (!force && nw === w && Math.abs(nh - h) < 150) return;
    w = nw; h = nh;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(80, Math.round(w * h / 18000));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5,
      r: Math.random() * 1.8 + 1.2,
      c: colors[Math.random() * colors.length | 0]
    }));
  }

  function line(a, bx, by, alpha, width) {
    ctx.globalAlpha = alpha; ctx.strokeStyle = a.c; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(bx, by); ctx.stroke();
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 140 && d > 0) { p.x += dx / d * .8; p.y += dy / d * .8; } // menjauh pelan dari kursor
    }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) line(a, b.x, b.y, (1 - d / 130) * .35, 1);
      }
      const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (dm < 170) line(a, mouse.x, mouse.y, (1 - dm / 170) * .8, 1.4);
      ctx.globalAlpha = .85; ctx.fillStyle = a.c;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!reduce) raf = requestAnimationFrame(frame);
  }

  size(true);
  frame();

  addEventListener("resize", () => { size(false); if (reduce) frame(); });
  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(raf);
    if (!document.hidden && !reduce) raf = requestAnimationFrame(frame);
  });

  // kursor / sentuhan
  let queued = false;
  addEventListener("pointermove", e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      glow.style.setProperty("--mx", mouse.x + "px");
      glow.style.setProperty("--my", mouse.y + "px");
      queued = false;
    });
  }, { passive: true });
  const away = () => { mouse.x = mouse.y = -1e4; };
  root.addEventListener("pointerleave", away);
  addEventListener("pointerup", e => { if (e.pointerType !== "mouse") away(); });
}
