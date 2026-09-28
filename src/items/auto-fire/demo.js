import { clamp, lerp, localPoint, fitCanvas } from "../../lib/util.js";
import { ILLO, TONE, shape, circle, roundRect, dot } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;
  api.css(`
    .auto-fire-root { position: absolute; inset: 0; cursor: crosshair; background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
  `);
  const root = document.createElement("div");
  root.className = "auto-fire-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const FONT = getComputedStyle(root).fontFamily;
  const C = { ink: api.color("--ink"), ink3: api.color("--ink-3"), acc: api.color("--accent"), note: api.color("--note") };
  const ACC = C.acc || ILLO.orange; // 장면의 강조색 하나

  const gun = { x: 0, y: 0, ang: -Math.PI / 2, recoil: 0, flash: 0 };
  const ptr = { x: 0, y: 0, has: false, down: false, key: false, holdT: 0, shots: 0, acc: 0 };
  const bullets = [], parts = [], sparks = [];
  const fireTimes = [];
  let total = 0, hits = 0;

  const targets = [];
  const place = (t, first) => {
    t.r = 22 + Math.random() * 8;
    t.x = first ? size.w * (0.15 + Math.random() * 0.7) : (Math.random() < 0.5 ? -t.r : size.w + t.r);
    t.y = size.h * (0.12 + Math.random() * 0.4);
    t.vx = (0.4 + Math.random() * 0.7) * (t.x > size.w / 2 ? -1 : 1);
    t.hp = 3; t.hit = 0; t.dead = 0; t.c = ACC;
  };
  const layout = () => { gun.x = size.w / 2; gun.y = size.h - 56; };
  layout();
  api.onResize(layout);
  for (let i = 0; i < 5; i++) { const t = {}; place(t, true); targets.push(t); }

  const aimAngle = () => {
    if (!S.aim || !ptr.has) return -Math.PI / 2;
    const a = Math.atan2(ptr.y - gun.y, ptr.x - gun.x);
    if (a > 0) return ptr.x < gun.x ? -Math.PI + 0.15 : -0.15; // 포대보다 아래를 가리키면 수평 끝에서 멈춘다
    return clamp(a, -Math.PI + 0.15, -0.15);
  };

  const fire = () => {
    const spread = (S.spread * Math.PI / 180);
    const tip = 46 - gun.recoil;
    const mx = gun.x + Math.cos(gun.ang) * tip, my = gun.y + Math.sin(gun.ang) * tip;
    if (S.mode === "particle") {
      for (let i = 0; i < 5; i++) {
        const a = gun.ang + (Math.random() - 0.5) * (spread + 0.12), sp = 5 + Math.random() * 6;
        parts.push({ x: mx, y: my, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, s: 3 + Math.random() * 4, c: Math.random() < 0.6 ? ACC : TONE[3] });
      }
    } else {
      const a = gun.ang + (Math.random() - 0.5) * spread, sp = 15;
      bullets.push({ x: mx, y: my, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp });
    }
    gun.recoil = 7; gun.flash = 1;
    ptr.shots++; total++;
    fireTimes.push(performance.now());
  };

  const press = () => {
    if (ptr.down) return;
    ptr.down = true; ptr.holdT = 0; ptr.shots = 0; ptr.acc = 0;
    gun.ang = aimAngle();
    fire();
    api.hideHint();
  };
  const release = () => { ptr.down = false; };

  api.on(root, "pointermove", e => { const p = localPoint(root, e); ptr.x = p.x; ptr.y = p.y; ptr.has = true; });
  api.on(root, "pointerdown", e => {
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    const p = localPoint(root, e); ptr.x = p.x; ptr.y = p.y; ptr.has = true;
    press();
  });
  api.on(root, "pointerup", release);
  api.on(root, "pointercancel", release);
  api.on(window, "keydown", e => {
    if (e.target.closest("input, textarea, [contenteditable]")) return;
    if (e.code !== "Space") return;
    e.preventDefault();
    if (!e.repeat) { ptr.key = true; press(); }
  });
  api.on(window, "keyup", e => { if (e.code === "Space" && ptr.key) { ptr.key = false; release(); } });
  api.on(window, "blur", release);

  const burst = (x, y, c, n) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 4;
      sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, c });
    }
  };

  api.frame(dt => {
    const k = dt / 16.67;
    // 조준
    const ta = aimAngle();
    gun.ang = lerp(gun.ang, ta, 1 - Math.pow(0.7, k));
    gun.recoil = lerp(gun.recoil, 0, 1 - Math.pow(0.75, k));
    gun.flash = Math.max(0, gun.flash - dt / 60);

    // 연사: 누르고 있는 동안 일정 간격으로 발사
    if (ptr.down) {
      ptr.holdT += dt; ptr.acc += dt;
      const iv = 1000 / S.rate;
      while (ptr.acc >= iv) { ptr.acc -= iv; fire(); }
    }
    const now = performance.now();
    while (fireTimes.length && now - fireTimes[0] > 1000) fireTimes.shift();

    // 이동
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * k; b.y += b.vy * k;
      let gone = b.x < -20 || b.x > size.w + 20 || b.y < -20;
      for (const t of targets) {
        if (t.dead || gone) continue;
        if (Math.hypot(b.x - t.x, b.y - t.y) < t.r + 3) {
          gone = true; t.hp--; t.hit = 1; burst(b.x, b.y, t.c, 5);
          if (t.hp <= 0) { t.dead = 1; hits++; burst(t.x, t.y, t.c, 22); api.flash(`명중 · 표적 ${hits}개 격파`, "ok", 900); }
        }
      }
      if (gone) bullets.splice(i, 1);
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx * k; p.y += p.vy * k; p.vy += 0.16 * k; p.vx *= Math.pow(0.99, k);
      p.life -= dt / 1500;
      if (p.life <= 0 || p.y > size.h + 10) parts.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx * k; s.y += s.vy * k; s.vx *= 0.94; s.vy *= 0.94; s.life -= dt / 500;
      if (s.life <= 0) sparks.splice(i, 1);
    }
    for (const t of targets) {
      t.hit = Math.max(0, t.hit - dt / 150);
      if (t.dead) { t.dead += dt; if (t.dead > 1200) place(t, false); continue; }
      t.x += t.vx * k;
      if (t.x < -t.r * 2 || t.x > size.w + t.r * 2) place(t, false);
    }

    /* ---------- 그리기 ---------- */
    g.clearRect(0, 0, size.w, size.h);
    // 표적: 외곽선 없는 톤 동심원 + 강조색 중심점. 남은 체력만큼 바깥 고리 조각이 남는다
    for (const t of targets) {
      if (t.dead) continue;
      const s = 1 + t.hit * 0.15;
      g.save(); g.translate(t.x, t.y); g.scale(s, s);
      circle(g, 0, 0, t.r, { fill: TONE[1] });
      circle(g, 0, 0, t.r * 0.58, { fill: TONE[3] });
      dot(g, 0, 0, t.r * 0.2, ACC);
      for (let i = 0; i < 3; i++) {
        if (i >= t.hp) continue;
        const a0 = -Math.PI / 2 + i * (Math.PI * 2 / 3) + 0.14;
        shape(g, c => c.arc(0, 0, t.r * 0.8, a0, a0 + Math.PI * 2 / 3 - 0.28), { fill: null, lw: 1.5, stroke: TONE[4] });
      }
      // 맞은 순간: 짧게 강조색 고리 하나
      if (t.hit > 0) { g.globalAlpha = t.hit; circle(g, 0, 0, t.r + 4 + (1 - t.hit) * 6, { fill: null, lw: 1.5, stroke: ACC }); g.globalAlpha = 1; }
      g.restore();
    }
    // 발사체: 강조색 점
    for (const b of bullets) circle(g, b.x, b.y, 5, { fill: ACC });
    for (const p of parts) { g.globalAlpha = clamp(p.life * 1.5, 0, 1); circle(g, p.x, p.y, p.s * (0.5 + p.life * 0.5) + 1, { fill: p.c }); }
    for (const s of sparks) { g.globalAlpha = s.life; dot(g, s.x, s.y, 2.5, s.c); }
    g.globalAlpha = 1;

    // 조준선
    if (S.aim && ptr.has && !ptr.down) {
      g.setLineDash([4, 8]); g.strokeStyle = "rgba(0,0,0,.15)"; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(gun.x, gun.y); g.lineTo(gun.x + Math.cos(gun.ang) * 2000, gun.y + Math.sin(gun.ang) * 2000); g.stroke();
      g.setLineDash([]);
    }
    // 포대: 외곽선 없는 톤 면 — 반원 받침 + 포신
    g.save(); g.translate(gun.x, gun.y);
    g.save(); g.rotate(gun.ang);
    roundRect(g, -gun.recoil, -9, 48, 18, 5, { fill: TONE[5] });
    if (gun.flash > 0) { g.globalAlpha = gun.flash; circle(g, 52 - gun.recoil, 0, 3 + gun.flash * 3, { fill: ACC }); g.globalAlpha = 1; } // 포구 섬광: 작은 점 하나
    g.restore();
    shape(g, c => { c.arc(0, 0, 26, Math.PI, 0); c.lineTo(34, 16); c.lineTo(-34, 16); c.closePath(); }, { fill: TONE[4] });
    g.restore();

    // 누르는 동안 발사 리듬 표시
    if (ptr.down) {
      const iv = 1000 / S.rate;
      g.strokeStyle = C.acc; g.lineWidth = 3;
      g.beginPath(); g.arc(gun.x, gun.y, 36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (ptr.acc / iv)); g.stroke();
    }

    const deg = Math.round(-gun.ang * 180 / Math.PI);
    api.read("hold", ptr.down ? (ptr.holdT / 1000).toFixed(1) + "초" : "–");
    api.read("shots", ptr.shots);
    api.read("rate", fireTimes.length + "발/초");
    api.read("angle", deg + "°");
    if (ptr.down) api.status(`누르는 중 · 연사 ${ptr.shots}발 · ${(ptr.holdT / 1000).toFixed(1)}초`, "active");
    else api.status(total ? `멈춤 · 총 ${total}발 · 격파 ${hits}` : "대기", "idle");
  });
}
