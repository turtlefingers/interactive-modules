import { clamp, lerp, localPoint, fitCanvas } from "../../lib/util.js";
import { ILLO, ILLO_CYCLE, circle, roundRect, dot } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;
  api.css(`
    .single-shot-root { position: absolute; inset: 0; cursor: crosshair; background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
  `);
  const root = document.createElement("div");
  root.className = "single-shot-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const C = { ink: api.color("--ink"), ink3: api.color("--ink-3"), acc: api.color("--accent"), note: api.color("--note"), line: api.color("--line") };
  const LW = 3; // 그림 키트와 같은 외곽선 굵기
  let colorN = 0;

  const gun = { x: 0, y: 0, ang: -Math.PI / 4, recoil: 0, flash: 0, shake: 0 };
  const ptr = { x: 0, y: 0, has: false, down: false, downT: 0 };
  const shots = [], sparks = [], targets = [];
  let count = 0, hits = 0, lastSpeed = 0, lastAng = 0;

  const origin = (px, py) => {
    if (S.origin === "bottom") return { x: size.w / 2, y: size.h - 40 };
    if (S.origin === "click") return { x: px, y: py };
    return { x: 56, y: size.h - 56 };
  };
  const place = t => {
    t.r = 20;
    for (let n = 0; n < 30; n++) {
      t.x = size.w * (0.25 + Math.random() * 0.68); t.y = size.h * (0.14 + Math.random() * 0.5);
      if (targets.every(o => o === t || Math.hypot(o.x - t.x, o.y - t.y) > 90)) break;
    }
    t.dead = 0; t.hit = 0; t.born = 0; t.c = ILLO_CYCLE[colorN++ % ILLO_CYCLE.length];
  };
  for (let i = 0; i < 4; i++) { const t = {}; targets.push(t); place(t); }
  api.onResize(() => targets.forEach(t => { t.x = clamp(t.x, 30, size.w - 30); t.y = clamp(t.y, 30, size.h - 80); }));

  const aimAt = (o, px, py) => S.origin === "click" ? -Math.PI / 2 : Math.atan2(py - o.y, px - o.x);

  const fire = (px, py) => {
    const o = origin(px, py);
    const a = aimAt(o, px, py);
    gun.ang = a;
    const sp = S.speed;
    const tip = S.origin === "click" ? 0 : 40;
    shots.push({ x: o.x + Math.cos(a) * tip, y: o.y + Math.sin(a) * tip, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, trail: [], life: 0 });
    count++; lastSpeed = sp; lastAng = a;
    if (S.recoil) { gun.recoil = 12; gun.flash = 1; gun.shake = 1; }
    else gun.flash = 0.6;
  };

  api.on(root, "pointermove", e => { const p = localPoint(root, e); ptr.x = p.x; ptr.y = p.y; ptr.has = true; });
  api.on(root, "pointerleave", () => { ptr.has = false; });
  api.on(root, "pointerdown", e => {
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    const p = localPoint(root, e); ptr.x = p.x; ptr.y = p.y; ptr.has = true;
    ptr.down = true; ptr.downT = performance.now();
    fire(p.x, p.y); // 누르는 순간 딱 한 발
    api.hideHint();
  });
  const up = () => { ptr.down = false; };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);

  const burst = (x, y) => {
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3.5;
      sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1 });
    }
  };

  api.frame(dt => {
    const k = dt / 16.67;
    const grav = S.gravity;
    // 포대 방향은 커서를 향한다 (클릭 지점 발사 모드 제외)
    if (S.origin !== "click" && ptr.has) {
      const o = origin(); const ta = Math.atan2(ptr.y - o.y, ptr.x - o.x);
      let d = ta - gun.ang; d = Math.atan2(Math.sin(d), Math.cos(d));
      gun.ang += d * (1 - Math.pow(0.75, k));
    }
    gun.recoil = lerp(gun.recoil, 0, 1 - Math.pow(0.8, k));
    gun.flash = Math.max(0, gun.flash - dt / 90);
    gun.shake = Math.max(0, gun.shake - dt / 140);

    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      s.trail.push(s.x, s.y); if (s.trail.length > 40) s.trail.splice(0, 2);
      s.vy += grav * k; s.x += s.vx * k; s.y += s.vy * k; s.life += dt;
      let gone = s.x < -40 || s.x > size.w + 40 || s.y > size.h + 40 || s.y < -600 || s.life > 8000;
      for (const t of targets) {
        if (t.dead || gone) continue;
        if (Math.hypot(s.x - t.x, s.y - t.y) < t.r + 5) { gone = true; t.dead = 1; hits++; burst(t.x, t.y); api.flash(`명중 · ${hits}개`, "ok", 900); }
      }
      if (gone) shots.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i]; p.x += p.vx * k; p.y += p.vy * k; p.vx *= 0.93; p.vy *= 0.93; p.life -= dt / 450;
      if (p.life <= 0) sparks.splice(i, 1);
    }
    for (const t of targets) {
      if (t.dead) { t.dead += dt; if (t.dead > 900) { place(t); } }
      else if (t.born < 1) t.born = Math.min(1, t.born + dt / 250);
    }

    /* ---------- 그리기 ---------- */
    const sh = S.recoil ? gun.shake * 3 : 0;
    g.clearRect(0, 0, size.w, size.h);
    g.save(); g.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);

    // 표적: 외곽선이 있는 납작한 동심원 과녁
    for (const t of targets) {
      if (t.dead) continue;
      const s = Math.max(0.01, t.born);
      g.save(); g.translate(t.x, t.y); g.scale(s, s);
      circle(g, 0, 0, t.r, { fill: t.c, lw: LW });
      circle(g, 0, 0, t.r * 0.55, { fill: ILLO.paper, lw: LW });
      dot(g, 0, 0, 3.5);
      g.restore();
    }

    // 예상 궤적 (포대 모드에서 커서를 올려두면)
    if (S.origin !== "click" && ptr.has && !ptr.down) {
      const o = origin(); const a = Math.atan2(ptr.y - o.y, ptr.x - o.x);
      let x = o.x + Math.cos(a) * 40, y = o.y + Math.sin(a) * 40, vx = Math.cos(a) * S.speed, vy = Math.sin(a) * S.speed;
      g.fillStyle = "rgba(0,0,0,.18)";
      for (let i = 0; i < 90; i++) {
        vy += grav; x += vx; y += vy;
        if (i % 3 === 0) { g.beginPath(); g.arc(x, y, 1.5, 0, Math.PI * 2); g.fill(); }
        if (x < 0 || x > size.w || y > size.h) break;
      }
    }

    // 발사체: 가는 꼬리선 + 외곽선이 있는 점
    for (const s of shots) {
      g.strokeStyle = C.ink3; g.lineWidth = 1.5; g.beginPath();
      for (let i = 0; i < s.trail.length; i += 2) i ? g.lineTo(s.trail[i], s.trail[i + 1]) : g.moveTo(s.trail[i], s.trail[i + 1]);
      g.lineTo(s.x, s.y); g.stroke();
      circle(g, s.x, s.y, 5, { fill: ILLO.orange, lw: LW });
    }
    for (const p of sparks) { g.globalAlpha = p.life; dot(g, p.x, p.y, 2); }
    g.globalAlpha = 1;

    // 포대
    // 포대: 외곽선이 있는 납작한 받침 + 포신
    if (S.origin !== "click") {
      const o = origin();
      g.save(); g.translate(o.x, o.y); g.rotate(gun.ang);
      roundRect(g, -gun.recoil, -7, 42, 14, 4, { fill: ILLO.grey, lw: LW });
      if (gun.flash > 0) circle(g, 48 - gun.recoil, 0, 3 + gun.flash * 4, { fill: ILLO.yellow, lw: LW }); // 포구 섬광: 작은 원 하나
      g.restore();
      circle(g, o.x, o.y, 18, { fill: ptr.down ? ILLO.orange : ILLO.blue, lw: LW });
    } else if (gun.flash > 0 && shots.length) {
      const s = shots[shots.length - 1];
      g.globalAlpha = gun.flash;
      circle(g, s.trail[0] ?? s.x, s.trail[1] ?? s.y, 18 * (1.4 - gun.flash), { fill: null, lw: LW });
      g.globalAlpha = 1;
    }
    g.restore();

    const held = ptr.down ? performance.now() - ptr.downT : 0;
    api.read("count", count);
    api.read("angle", count ? Math.round(-lastAng * 180 / Math.PI) + "°" : "–");
    api.read("speed", count ? lastSpeed.toFixed(0) : "–");
    api.read("hits", hits);
    if (ptr.down && held > 350) api.status("누르고 있어도 한 발뿐 · 떼고 다시 클릭해야 한다", "alt");
    else if (ptr.down) api.status(`발사 · ${count}번째`, "active");
    else if (shots.length) api.status(`날아가는 중 · ${shots.length}발`, "active");
    else api.status("대기 · 클릭 한 번에 한 발", "idle");
  });
}
