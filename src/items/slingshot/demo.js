import "../../lib/objects/index.js";
import { clamp, dist, localPoint, fitCanvas } from "../../lib/util.js";
import { ILLO, TONE } from "../../lib/draw.js";
import { drawObject } from "../../lib/objects.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .slingshot-root { position: absolute; inset: 0; background: var(--board); cursor: crosshair; }
    .slingshot-root.is-pulling { cursor: grabbing; }
  `);
  const root = document.createElement("div");
  root.className = "slingshot-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const C = {
    ink: api.color("--ink") || "#1b1b1a",
    ink3: api.color("--ink-3") || "#9a9790",
    accent: api.color("--accent") || "#ff5a36",
    cue: ILLO.paper,     // 큐볼: 종이색 (펠트가 장면의 색 하나, 강조색은 최대로 당겼을 때의 고리뿐)
    ball: TONE[2]        // 나머지 공: 톤 면, 외곽선 없음
  };
  const K = 0.14;   // 당긴 거리 → 발사 속도 비율

  /* ---------- 당구대 ---------- */
  const T = { x: 0, y: 0, w: 0, h: 0, s: 1, r: 12, pr: 22, wide: true };
  const pockets = [];
  const balls = [];   // [0] = 큐볼
  let pocketed = 0, rackPending = false;

  const layout = () => {
    const { w, h } = size;
    const m = w < 600 ? 18 : 40;
    const top = w < 600 ? 56 : 64;
    const ox = T.x, oy = T.y, ow = T.w, oh = T.h;
    T.x = m; T.y = top; T.w = w - m * 2; T.h = h - top - m;
    T.wide = T.w >= T.h;
    T.s = clamp(Math.min(T.w, T.h) / 420, 0.6, 1.2);
    T.r = 12 * T.s; T.pr = 21 * T.s;
    pockets.length = 0;
    const { x, y } = T, x2 = T.x + T.w, y2 = T.y + T.h;
    pockets.push([x, y], [x2, y], [x, y2], [x2, y2]);
    if (T.wide) pockets.push([(x + x2) / 2, y], [(x + x2) / 2, y2]);
    else pockets.push([x, (y + y2) / 2], [x2, (y + y2) / 2]);
    if (ow) balls.forEach(b => {   // 크기가 바뀌면 같은 비율 위치로 옮긴다
      b.x = T.x + (b.x - ox) / ow * T.w; b.y = T.y + (b.y - oy) / oh * T.h; b.r = T.r;
    });
  };
  // 긴 축 기준 좌표(u: 0~1, v: -0.5~0.5)를 화면 좌표로
  const at = (u, v) => T.wide ? { x: T.x + T.w * u, y: T.y + T.h * (0.5 + v) } : { x: T.x + T.w * (0.5 + v), y: T.y + T.h * (1 - u) };
  const cueHome = () => at(0.25, 0);
  const rack = () => {
    balls.length = 1;
    const d = T.r * 2.05 / (T.wide ? T.w : T.h);
    const dv = T.r * 2.05 / (T.wide ? T.h : T.w);
    let k = 0;
    for (let col = 0; col < 3; col++) for (let row = 0; row <= col; row++) {
      if (k++ >= 6) break;
      const p = at(0.7 + col * d * 0.87, (row - col / 2) * dv);
      balls.push({ x: p.x, y: p.y, vx: 0, vy: 0, r: T.r, cue: false, gone: 0, alive: true, born: 0 });
    }
  };
  layout();
  const h0 = cueHome();
  balls.push({ x: h0.x, y: h0.y, vx: 0, vy: 0, r: T.r, cue: true, gone: 0, alive: true, born: 1 });
  rack();
  api.onResize(layout);

  /* ---------- 조준 ---------- */
  let pull = null;   // { sx, sy, rx, ry }
  let last = null;
  const cue = () => balls[0];
  const moving = () => balls.some(b => b.alive && Math.hypot(b.vx, b.vy) > 0.02);
  const pullVec = () => {
    if (!pull) return { x: 0, y: 0, len: 0 };
    let x = pull.rx, y = pull.ry;
    const m = S.maxPull * T.s, d = Math.hypot(x, y);
    if (d > m) { x *= m / d; y *= m / d; }
    return { x, y, len: Math.min(d, m) };
  };

  api.on(root, "pointerdown", e => {
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    const c = cue();
    if (!c.alive || Math.hypot(c.vx, c.vy) > 0.05) { api.flash("큐볼이 멈춘 뒤에 쏜다", "idle"); return; }
    const p = localPoint(root, e);
    pull = { sx: p.x, sy: p.y, rx: 0, ry: 0 };
    root.classList.add("is-pulling");
    api.hideHint();
  });
  api.on(root, "pointermove", e => {
    if (!pull) return;
    const p = localPoint(root, e);
    pull.rx = p.x - pull.sx; pull.ry = p.y - pull.sy;
  });
  const release = () => {
    if (!pull) return;
    const v = pullVec();
    pull = null;
    root.classList.remove("is-pulling");
    if (v.len < 8 * T.s) { api.flash("조금 더 당겨야 쏜다", "idle"); return; }
    const c = cue();
    c.vx = -v.x * K * S.power; c.vy = -v.y * K * S.power;
    last = { len: v.len, speed: Math.hypot(c.vx, c.vy), angle: Math.atan2(-c.vy, c.vx) * 180 / Math.PI };
  };
  api.on(root, "pointerup", release);
  api.on(root, "pointercancel", release);

  /* ---------- 물리 (위에서 본 당구대: 중력 없음) ---------- */
  const step = () => {
    const x1 = T.x, y1 = T.y, x2 = T.x + T.w, y2 = T.y + T.h;
    for (const b of balls) {
      if (!b.alive) continue;
      b.x += b.vx; b.y += b.vy;
      b.vx *= S.friction; b.vy *= S.friction;
      if (Math.hypot(b.vx, b.vy) < 0.03) b.vx = b.vy = 0;
      if (b.x < x1 + b.r) { b.x = x1 + b.r; b.vx = Math.abs(b.vx) * S.bounce; }
      if (b.x > x2 - b.r) { b.x = x2 - b.r; b.vx = -Math.abs(b.vx) * S.bounce; }
      if (b.y < y1 + b.r) { b.y = y1 + b.r; b.vy = Math.abs(b.vy) * S.bounce; }
      if (b.y > y2 - b.r) { b.y = y2 - b.r; b.vy = -Math.abs(b.vy) * S.bounce; }
      for (const [px, py] of pockets) {
        if (dist(b.x, b.y, px, py) < T.pr * 0.95) {
          b.alive = false; b.gone = 0; b.px = px; b.py = py;
          if (b.cue) {
            api.flash("큐볼이 빠졌다 · 제자리에 다시 놓는다", "alt");
            api.timeout(() => { const hh = cueHome(); Object.assign(b, { x: hh.x, y: hh.y, vx: 0, vy: 0, alive: true, born: 0 }); }, 700);
          } else {
            pocketed++;
            const left = balls.filter(o => !o.cue && o.alive).length;
            api.flash(left ? `넣었다 · 남은 공 ${left}` : "모두 넣었다 · 다시 세운다", "ok");
            if (!left && !rackPending) { rackPending = true; api.timeout(() => { rack(); rackPending = false; }, 1100); }
          }
          break;
        }
      }
    }
    // 공끼리 부딪힘 (같은 무게, 탄성 충돌)
    for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
      const A = balls[i], B = balls[j];
      if (!A.alive || !B.alive) continue;
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy), md = A.r + B.r;
      if (d >= md || d === 0) continue;
      const nx = dx / d, ny = dy / d, over = (md - d) / 2;
      A.x -= nx * over; A.y -= ny * over; B.x += nx * over; B.y += ny * over;
      const rel = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
      if (rel >= 0) continue;
      const j2 = -(1 + 0.95) * rel / 2;
      A.vx -= j2 * nx; A.vy -= j2 * ny; B.vx += j2 * nx; B.vy += j2 * ny;
    }
  };

  /* 조준선: 쏘는 방향으로 첫 쿠션이나 공에 닿을 때까지 */
  const castAim = (x, y, dx, dy) => {
    const r = cue().r;
    let tMin = Infinity, hitBall = null;
    const x1 = T.x + r, y1 = T.y + r, x2 = T.x + T.w - r, y2 = T.y + T.h - r;
    if (dx > 0) tMin = Math.min(tMin, (x2 - x) / dx); if (dx < 0) tMin = Math.min(tMin, (x1 - x) / dx);
    if (dy > 0) tMin = Math.min(tMin, (y2 - y) / dy); if (dy < 0) tMin = Math.min(tMin, (y1 - y) / dy);
    for (const b of balls) {
      if (b.cue || !b.alive) continue;
      const fx = b.x - x, fy = b.y - y, proj = fx * dx + fy * dy;
      if (proj <= 0) continue;
      const perp2 = fx * fx + fy * fy - proj * proj, R = r + b.r;
      if (perp2 > R * R) continue;
      const t = proj - Math.sqrt(R * R - perp2);
      if (t < tMin) { tMin = t; hitBall = b; }
    }
    return { x: x + dx * tMin, y: y + dy * tMin, ball: hitBall };
  };

  /* ---------- 그리기 ---------- */
  const circle = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); };
  let guideA = S.guide ? 1 : 0, acc = 0;

  api.frame(dt => {
    acc += dt;
    let n = 0;
    while (acc >= 16.67 && n < 4) { step(); acc -= 16.67; n++; }
    if (n === 4) acc = 0;
    guideA += ((S.guide ? 1 : 0) - guideA) * 0.15;
    balls.forEach(b => { if (b.born < 1) b.born = Math.min(1, b.born + dt / 250); if (!b.alive && b.gone < 1) b.gone = Math.min(1, b.gone + dt / 220); });

    const { w, h } = size;
    g.clearRect(0, 0, w, h);

    // 당구대: 카탈로그 pool-table (위에서 본 색 펠트). 사물의 펠트(안쪽 면)가 공이 튀는 영역 T와 정확히 겹치도록
    // 긴 축이 가로가 되게 돌리고 가로만 따로 늘린다. 사물 비례: 바깥 2h × 1.1h, 쿠션 띠 0.08h → 펠트 1.84h × 0.94h
    {
      const long = T.wide ? T.w : T.h, short = T.wide ? T.h : T.w;
      const oh = short / 0.94, sx = long / (1.84 * oh);
      g.save();
      g.translate(T.x + T.w / 2, T.y + T.h / 2);
      if (!T.wide) g.rotate(-Math.PI / 2);
      g.scale(sx, 1);
      drawObject(g, "pool-table", 0, oh * 0.55, oh, { color: ILLO.green });
      g.restore();
    }
    // 포켓: 물리에서 쓰는 자리(펠트 모서리·긴 변 가운데)에 잉크 원. 사물의 포켓과 겹쳐 하나로 보인다
    g.fillStyle = C.ink;
    pockets.forEach(([px, py]) => { circle(px, py, T.pr); g.fill(); });
    const hh = cueHome();
    circle(hh.x, hh.y, 2.5); g.fillStyle = "rgba(255,253,246,.6)"; g.fill();

    // 공: 외곽선 없는 면
    for (const b of balls) {
      if (!b.alive) {
        if (b.gone < 1) { circle(b.px + (b.x - b.px) * (1 - b.gone), b.py + (b.y - b.py) * (1 - b.gone), b.r * (1 - b.gone)); g.fillStyle = b.cue ? C.cue : C.ball; g.fill(); }
        continue;
      }
      circle(b.x, b.y, b.r * b.born);
      g.fillStyle = b.cue ? C.cue : C.ball; g.fill();
    }

    // 당김선과 조준선
    const c = cue();
    const v = pullVec();
    if (pull && v.len > 1) {
      const m = S.maxPull * T.s;
      circle(c.x, c.y, m); g.setLineDash([3, 5]); g.strokeStyle = v.len >= m - 0.5 ? C.accent : "rgba(0,0,0,.28)"; g.lineWidth = 1; g.stroke(); g.setLineDash([]);
      g.strokeStyle = C.ink; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(c.x + v.x, c.y + v.y); g.stroke();
      circle(c.x + v.x, c.y + v.y, 5); g.fillStyle = C.ink; g.fill();
      if (guideA > 0.01 && v.len > 3) {
        const ux = -v.x / v.len, uy = -v.y / v.len;
        const hit = castAim(c.x, c.y, ux, uy);
        g.globalAlpha = guideA;
        g.setLineDash([6, 6]); g.strokeStyle = C.ink; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(c.x + ux * c.r, c.y + uy * c.r); g.lineTo(hit.x, hit.y); g.stroke(); g.setLineDash([]);
        circle(hit.x, hit.y, c.r); g.strokeStyle = C.ink; g.lineWidth = 1; g.stroke();
        if (hit.ball) {   // 맞은 공이 나갈 방향
          const nx = hit.ball.x - hit.x, ny = hit.ball.y - hit.y, nl = Math.hypot(nx, ny) || 1;
          g.beginPath(); g.moveTo(hit.ball.x, hit.ball.y); g.lineTo(hit.ball.x + nx / nl * 60 * T.s, hit.ball.y + ny / nl * 60 * T.s); g.stroke();
        }
        g.globalAlpha = 1;
      }
    }

    // 읽는 값과 상태
    if (pull) {
      const vx = -v.x * K * S.power, vy = -v.y * K * S.power;
      api.read("pull", Math.round(v.len));
      api.read("angle", v.len > 1 ? Math.round(Math.atan2(-vy, vx) * 180 / Math.PI) + "°" : "–");
      api.read("speed", Math.hypot(vx, vy).toFixed(1));
      api.status(`조준 중 · 힘 ${Math.round(v.len / (S.maxPull * T.s) * 100)}%`, "active");
    } else {
      if (last) { api.read("pull", Math.round(last.len)); api.read("angle", Math.round(last.angle) + "°"); api.read("speed", last.speed.toFixed(1)); }
      if (moving()) api.status("굴러가는 중 · 마찰로 느려진다", "alt");
      else api.status("대기", "idle");
    }
    api.read("pocketed", pocketed);
  });
}
