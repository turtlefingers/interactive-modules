import { rng, clamp, dist, localPoint, fitCanvas } from "../../lib/util.js";
import { TONE } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .magnet-root { position: absolute; inset: 0; cursor: none; background: var(--board); }
  `);
  const root = document.createElement("div");
  root.className = "magnet-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });

  const C = { ink: api.color("--ink") || "#1b1b1a", ink3: api.color("--ink-3") || "#9a9790", accent: api.color("--accent") || "#ff5a36" };

  /* ---------- 개체 ---------- */
  const SHAPES = ["circle", "square", "tri", "ring"];
  let items = [];
  const build = () => {
    const { w, h } = size;
    const rand = rng(11);
    const cell = 64;
    const cols = Math.max(4, Math.floor(w / cell)), rows = Math.max(4, Math.floor(h / cell));
    const cw = w / cols, ch = h / rows;
    items = [];
    for (let gy = 0; gy < rows; gy++) for (let gx = 0; gx < cols; gx++) {
      if (rand() < 0.5) continue;
      const x = (gx + 0.2 + rand() * 0.6) * cw, y = (gy + 0.2 + rand() * 0.6) * ch;
      if (x < 230 && y < 60) continue; // 안내 자리 비우기
      items.push({
        x, y, vx: 0, vy: 0, r: 7 + rand() * 6, shape: SHAPES[Math.floor(rand() * SHAPES.length)],
        rot: rand() * Math.PI * 2, state: "free", immune: false, lean: 0
      });
    }
  };
  build();
  let lastW = size.w, lastH = size.h;
  api.onResize(() => {
    const sx = size.w / (lastW || 1), sy = size.h / (lastH || 1);
    items.forEach(o => { if (o.state !== "stuck") { o.x *= sx; o.y *= sy; } });
    lastW = size.w; lastH = size.h;
  });

  let stuck = [];

  /* ---------- 포인터 ---------- */
  const p = { x: size.w / 2, y: size.h / 2, inside: false, down: false, sx: 0, sy: 0, moved: 0, speed: 0, lx: 0, ly: 0, lt: 0 };
  const active = () => p.inside && (!S.pressOnly || p.down);
  const setPos = e => {
    const q = localPoint(el, e);
    const now = performance.now();
    if (p.lt) p.speed = p.speed * 0.6 + (Math.hypot(q.x - p.lx, q.y - p.ly) / Math.max(1, now - p.lt) * 16.67) * 0.4;
    p.lx = q.x; p.ly = q.y; p.lt = now;
    p.x = q.x; p.y = q.y;
  };

  const dropAll = (reason) => {
    if (!stuck.length) return 0;
    const n = stuck.length;
    stuck.forEach(o => {
      let dx = o.x - p.x, dy = o.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 1.5) { const a = Math.random() * Math.PI * 2; dx = Math.cos(a); dy = Math.sin(a); }
      const sp = 5 + Math.random() * 7;
      o.vx = dx / (d || 1) * sp + (Math.random() - 0.5) * 3;
      o.vy = dy / (d || 1) * sp + (Math.random() - 0.5) * 3;
      o.state = "dropped"; o.immune = !S.pressOnly;
    });
    stuck = [];
    if (reason) api.flash(`${n}개를 떨어뜨림 · ${reason}`, "ok");
    return n;
  };

  api.on(root, "pointerenter", e => { p.inside = true; setPos(e); });
  api.on(root, "pointermove", e => {
    p.inside = true; setPos(e);
    if (p.down) p.moved = Math.max(p.moved, Math.hypot(p.x - p.sx, p.y - p.sy));
    api.hideHint();
  });
  api.on(root, "pointerleave", e => { if (!p.down) { p.inside = false; p.lt = 0; p.speed = 0; } });
  api.on(root, "pointerdown", e => {
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    p.inside = true; p.down = true; setPos(e);
    p.sx = p.x; p.sy = p.y; p.moved = 0;
    if (S.pressOnly) items.forEach(o => { o.immune = false; });
    api.hideHint();
  });
  const up = e => {
    if (!p.down) return;
    p.down = false;
    if (S.pressOnly) dropAll("손을 떼서 자석이 꺼짐");
    else if (p.moved < 6) {
      if (S.release) { if (!dropAll("클릭")) api.flash("붙은 개체가 없다", "idle"); }
      else if (stuck.length) api.flash("떼기가 꺼져 있다 · 계속 붙어 있다", "alt");
    }
    if (e.pointerType !== "mouse") { p.inside = false; }
  };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);

  api.onParam((k, v) => {
    if (k === "pressOnly" && v && !p.down) dropAll("누르고 있을 때만 켜짐");
  });

  /* ---------- 배치 ---------- */
  const GOLD = 2.39996;
  const targets = (t) => {
    const mode = S.arrange;
    if (mode === "cluster") {
      stuck.forEach((o, i) => {
        const r = 12.5 * Math.sqrt(i + 0.35);
        o.tx = p.x + Math.cos(i * GOLD) * r; o.ty = p.y + Math.sin(i * GOLD) * r;
      });
    } else if (mode === "orbit") {
      let i = 0, ring = 0;
      while (i < stuck.length) {
        const cap = 6 + ring * 5, R = 32 + ring * 24;
        const n = Math.min(cap, stuck.length - i);
        const w = (ring % 2 ? -1 : 1) * 0.0016 / (1 + ring * 0.35);
        for (let k = 0; k < n; k++) {
          const a = t * w + (k / cap) * Math.PI * 2 + ring * 0.7;
          const o = stuck[i + k];
          o.tx = p.x + Math.cos(a) * R; o.ty = p.y + Math.sin(a) * R;
        }
        i += n; ring++;
      }
    } else { // tail
      let px = p.x, py = p.y, pr = 10;
      stuck.forEach(o => {
        let dx = o.x - px, dy = o.y - py;
        const d = Math.hypot(dx, dy);
        if (d < 0.01) { dx = 0; dy = 1; } else { dx /= d; dy /= d; }
        const gap = (pr + o.r) * 0.9;
        o.tx = px + dx * gap; o.ty = py + dy * gap;
        px = o.tx; py = o.ty; pr = o.r;
      });
    }
  };

  /* ---------- 그리기 ---------- */
  const drawShape = (o, x, y) => {
    g.save();
    g.translate(x, y); g.rotate(o.rot);
    const col = o.state === "stuck" ? C.accent : TONE[3]; // 바닥에 있으면 톤, 붙으면 강조색 (외곽선 없는 실루엣)
    g.fillStyle = col; g.strokeStyle = col;
    const r = o.r;
    if (o.shape === "circle") { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill(); }
    else if (o.shape === "square") { g.beginPath(); g.roundRect(-r * 0.88, -r * 0.88, r * 1.76, r * 1.76, 3); g.fill(); }
    else if (o.shape === "tri") { g.beginPath(); g.moveTo(0, -r * 1.1); g.lineTo(r * 1.0, r * 0.75); g.lineTo(-r * 1.0, r * 0.75); g.closePath(); g.fill(); }
    else { g.beginPath(); g.arc(0, 0, r * 0.78, 0, Math.PI * 2); g.lineWidth = r * 0.45; g.stroke(); }
    g.restore();
  };
  const drawMagnet = (on) => {
    const { x, y } = p;
    g.save();
    // 반경: 얇은 점선 원
    g.beginPath(); g.arc(x, y, S.radius, 0, Math.PI * 2);
    g.setLineDash([4, 5]);
    g.strokeStyle = on ? C.ink : C.ink3; g.globalAlpha = on ? 0.45 : 0.35; g.lineWidth = 1; g.stroke();
    g.setLineDash([]); g.globalAlpha = 1;
    // 커서 자리: 작은 십자
    g.strokeStyle = C.ink; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + 6, y); g.moveTo(x, y - 6); g.lineTo(x, y + 6); g.stroke();
    g.restore();
  };

  /* ---------- 루프 ---------- */
  let wasFull = false;
  api.frame((dt, t) => {
    const { w, h } = size;
    const on = active();
    const R = S.radius;

    // 1. 붙잡기: 반경 안에 들어온 자유 개체는 그 순간부터 계속 붙는다
    let near = Infinity;
    for (const o of items) {
      if (o.state === "stuck") continue;
      const d = dist(o.x, o.y, p.x, p.y);
      if (o.immune && d > R + 24) o.immune = false;
      if (o.state === "free" || o.state === "dropped") near = Math.min(near, d);
      if (on && !o.immune && d < R) {
        o.state = "stuck"; stuck.push(o);
        o.vx *= 0.3; o.vy *= 0.3;
      }
      // 반경 밖 가까이에 있으면 살짝 끌리는 기색
      const leanT = on && !o.immune && d < R * 1.7 ? clamp(1 - (d - R) / (R * 0.7), 0, 1) : 0;
      o.lean += (leanT - o.lean) * 0.2;
    }

    // 2. 붙은 개체의 목표 위치
    targets(t);

    // 3. 움직임
    const k = S.strength;
    for (const o of items) {
      if (o.state === "stuck") {
        o.vx += (o.tx - o.x) * k; o.vy += (o.ty - o.y) * k;
        o.vx *= 0.72; o.vy *= 0.72;
        o.x += o.vx; o.y += o.vy;
        o.rot += o.vx * 0.02;
      } else if (o.state === "dropped") {
        o.x += o.vx; o.y += o.vy;
        o.vx *= 0.9; o.vy *= 0.9; o.rot += o.vx * 0.03;
        if (o.x < o.r || o.x > w - o.r) { o.vx *= -0.6; o.x = clamp(o.x, o.r, w - o.r); }
        if (o.y < o.r || o.y > h - o.r) { o.vy *= -0.6; o.y = clamp(o.y, o.r, h - o.r); }
        if (Math.hypot(o.vx, o.vy) < 0.08) { o.state = "free"; o.vx = o.vy = 0; }
      } else {
        o.x = clamp(o.x, o.r, w - o.r); o.y = clamp(o.y, o.r, h - o.r);
      }
    }

    // 4. 그리기
    g.clearRect(0, 0, w, h);
    for (const o of items) {
      if (o.state === "stuck") continue;
      let x = o.x, y = o.y;
      if (o.lean > 0.01) {
        const d = dist(o.x, o.y, p.x, p.y) || 1;
        const j = Math.sin(t * 0.06 + o.r * 10) * 0.8 * o.lean;
        x += (p.x - o.x) / d * 5 * o.lean + j; y += (p.y - o.y) / d * 5 * o.lean - j;
      }
      g.globalAlpha = o.immune ? 0.45 : 1;
      drawShape(o, x, y);
    }
    g.globalAlpha = 1;
    if (p.inside || stuck.length) {
      for (let i = stuck.length - 1; i >= 0; i--) drawShape(stuck[i], stuck[i].x, stuck[i].y);
      if (p.inside) drawMagnet(on);
    }

    // 5. 읽는 값과 상태
    api.read("near", near === Infinity ? "–" : Math.round(near) + "px");
    api.read("count", `${stuck.length} / ${items.length}`);
    api.read("pos", p.inside ? `${Math.round(p.x)}, ${Math.round(p.y)}` : "–");
    api.read("speed", p.inside ? p.speed.toFixed(1) : "0.0");
    if (p.speed > 0.01) p.speed *= 0.9;

    const full = stuck.length === items.length && items.length > 0;
    if (full && !wasFull) api.flash(S.pressOnly ? "전부 붙었다 · 손을 떼면 떨어진다" : "전부 붙었다 · 클릭하면 떨어뜨린다", "ok", 2200);
    wasFull = full;

    if (S.pressOnly && !p.down) api.status(p.inside ? "자석 꺼짐 · 누르면 켜진다" : "대기", "idle");
    else if (on && stuck.length) api.status(`끌어당기는 중 · ${stuck.length}개 붙음`, "active");
    else if (on) api.status("자석 켜짐 · 개체에 다가가면 → 붙는다", "alt");
    else if (stuck.length) api.status(`${stuck.length}개가 붙은 채 대기`, "idle");
    else api.status("대기", "idle");
  });
}
