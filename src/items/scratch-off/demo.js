import { clamp, localPoint, fitCanvas } from "../../lib/util.js";
import { TONE } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .scratch-off-root { position: absolute; inset: 0; cursor: crosshair; background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
    .scratch-off-card { position: absolute; border-radius: 16px; overflow: hidden; background: ${TONE[0]};
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; gap: 10px; padding: 24px; }
    .scratch-off-card .scratch-off-small { font-size: 13px; color: var(--ink-2); position: relative; }
    .scratch-off-card .scratch-off-big { font-size: clamp(30px, 6.4vw, 58px); font-weight: 800; letter-spacing: -.045em;
      color: var(--ink); line-height: 1.12; position: relative; word-break: keep-all; }
    .scratch-off-card .scratch-off-big em { font-style: normal; color: var(--accent); }
    .scratch-off-card .scratch-off-foot { font-size: 15px; color: var(--ink-2); position: relative; }
  `);

  const root = document.createElement("div");
  root.className = "scratch-off-root";
  el.appendChild(root);

  /* ---------- 숨은 메시지 (덮개 아래) ---------- */
  const card = document.createElement("div");
  card.className = "scratch-off-card";
  card.innerHTML = `
    <div class="scratch-off-small">숨어 있던 메시지</div>
    <div class="scratch-off-big">긁어낸 만큼<br><em>보인다</em></div>
    <div class="scratch-off-foot">오늘의 행운 번호 · 07 · 12 · 33</div>`;
  root.appendChild(card);

  const { cv, g, size } = fitCanvas(api, { parent: root });
  cv.style.pointerEvents = "none";

  /* ---------- 덮개 격자 ---------- */
  const C = { x: 0, y: 0, w: 0, h: 0 };
  let ts = S.tile, cols = 0, rows = 0, alive = new Uint8Array(0), aliveCount = 0, total = 1;
  let art = null, live = null, lg = null;
  let removed = 0, strokeLen = 0, autoDone = false;
  const pieces = [];
  let queue = [];   // 자동 벗기기 대기열 { i, at }

  const makeCanvas = (w, h) => {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * size.dpr)); c.height = Math.max(1, Math.round(h * size.dpr));
    return c;
  };

  // 덮개 그림: 톤 면 하나 + 잉크 글씨 (타일 사이 선은 두르지 않는다)
  function buildArt() {
    art = makeCanvas(C.w, C.h);
    const a = art.getContext("2d");
    a.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
    a.save();
    a.beginPath(); a.roundRect(0, 0, C.w, C.h, 16); a.clip();
    a.fillStyle = TONE[2]; a.fillRect(0, 0, C.w, C.h);
    a.textAlign = "center"; a.textBaseline = "middle";
    a.fillStyle = TONE[5];
    a.font = `700 ${clamp(C.w / 14, 22, 36)}px Pretendard Variable, Pretendard, system-ui, sans-serif`;
    a.fillText("여기를 긁어보세요", C.w / 2, C.h / 2);
    a.restore();
  }

  const clearTile = i => {
    const tx = (i % cols) * ts, ty = Math.floor(i / cols) * ts, d = size.dpr;
    const x0 = Math.floor(tx * d), y0 = Math.floor(ty * d);
    lg.clearRect(x0, y0, Math.ceil((tx + ts) * d) - x0, Math.ceil((ty + ts) * d) - y0);
  };

  function buildLive() {
    live = makeCanvas(C.w, C.h);
    lg = live.getContext("2d");
    lg.drawImage(art, 0, 0);
    for (let i = 0; i < alive.length; i++) if (!alive[i]) clearTile(i);
  }

  // 격자를 다시 만든다. 이미 벗겨진 자리는 비율 좌표로 옮겨서 유지한다.
  function rebuildGrid() {
    const old = { cols, rows, alive, ts, w: C.w0 || C.w, h: C.h0 || C.h };
    ts = S.tile;
    cols = Math.ceil(C.w / ts); rows = Math.ceil(C.h / ts);
    alive = new Uint8Array(cols * rows).fill(1);
    if (old.alive.length) {
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const u = Math.min(1, (i + 0.5) * ts / C.w), v = Math.min(1, (j + 0.5) * ts / C.h);
        const oi = clamp(Math.floor(u * old.w / old.ts), 0, old.cols - 1), oj = clamp(Math.floor(v * old.h / old.ts), 0, old.rows - 1);
        alive[j * cols + i] = old.alive[oj * old.cols + oi];
      }
    }
    total = alive.length;
    aliveCount = alive.reduce((s, v) => s + v, 0);
    C.w0 = C.w; C.h0 = C.h;
    if (queue.length) { queue = []; autoDone = false; }
    buildArt(); buildLive();
  }

  function layout() {
    const { w, h } = size;
    C.w = Math.round(Math.min(w - 40, 640));
    C.h = Math.round(clamp(h - 170, 220, 380));
    C.x = Math.round((w - C.w) / 2); C.y = Math.round((h - C.h) / 2 - 8);
    Object.assign(card.style, { left: C.x + "px", top: C.y + "px", width: C.w + "px", height: C.h + "px" });
    rebuildGrid();
  }
  layout();
  api.onResize(layout);

  /* ---------- 긁기 ---------- */
  const detach = (i, vx, vy, delayScale = 1) => {
    if (!alive[i]) return;
    alive[i] = 0; aliveCount--; removed++;
    clearTile(i);
    const tx = (i % cols) * ts, ty = Math.floor(i / cols) * ts;
    const p = { src: art, sx: tx, sy: ty, ts, x: C.x + tx + ts / 2, y: C.y + ty + ts / 2, rot: 0, a: 1, t: 0, rest: 0, s: 1 };
    if (S.mode === "fall") {
      p.vx = vx * 0.25 + (Math.random() - 0.5) * 140 * delayScale;
      p.vy = Math.min(0, vy * 0.15) - Math.random() * 160;
      p.vr = (Math.random() - 0.5) * 10;
      p.fall = true;
    } else p.fall = false;
    pieces.push(p);
    if (pieces.length > 3200) pieces.splice(0, pieces.length - 3200);
  };

  function scratchSeg(x0, y0, x1, y1, vx, vy) {
    const r = S.brush / 2, pad = r + ts;
    const lx0 = x0 - C.x, ly0 = y0 - C.y, lx1 = x1 - C.x, ly1 = y1 - C.y;
    const i0 = clamp(Math.floor((Math.min(lx0, lx1) - pad) / ts), 0, cols - 1), i1 = clamp(Math.floor((Math.max(lx0, lx1) + pad) / ts), 0, cols - 1);
    const j0 = clamp(Math.floor((Math.min(ly0, ly1) - pad) / ts), 0, rows - 1), j1 = clamp(Math.floor((Math.max(ly0, ly1) + pad) / ts), 0, rows - 1);
    if (Math.max(lx0, lx1) < -pad || Math.min(lx0, lx1) > C.w + pad || Math.max(ly0, ly1) < -pad || Math.min(ly0, ly1) > C.h + pad) return;
    const dx = lx1 - lx0, dy = ly1 - ly0, L2 = dx * dx + dy * dy;
    const reach = r + ts * 0.35;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const k = j * cols + i;
      if (!alive[k]) continue;
      const cx = (i + 0.5) * ts, cy = (j + 0.5) * ts;
      let t = L2 ? ((cx - lx0) * dx + (cy - ly0) * dy) / L2 : 0;
      t = clamp(t, 0, 1);
      if (Math.hypot(cx - (lx0 + dx * t), cy - (ly0 + dy * t)) <= reach) detach(k, vx, vy);
    }
  }

  const ptr = { down: false, in: false, x: -99, y: -99, vx: 0, vy: 0, lt: 0 };
  api.on(root, "pointerenter", () => { ptr.in = true; });
  api.on(root, "pointerleave", () => { ptr.in = false; });
  api.on(root, "pointerdown", e => {
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    const p = localPoint(root, e);
    ptr.down = true; ptr.in = true; ptr.x = p.x; ptr.y = p.y; ptr.vx = ptr.vy = 0; ptr.lt = performance.now();
    scratchSeg(p.x, p.y, p.x, p.y, 0, 0);
    api.hideHint();
  });
  api.on(root, "pointermove", e => {
    const p = localPoint(root, e), now = performance.now();
    if (ptr.down) {
      const dt = Math.max(8, now - ptr.lt) / 1000;
      ptr.vx = ptr.vx * 0.5 + (p.x - ptr.x) / dt * 0.5; ptr.vy = ptr.vy * 0.5 + (p.y - ptr.y) / dt * 0.5;
      strokeLen += Math.hypot(p.x - ptr.x, p.y - ptr.y);
      scratchSeg(ptr.x, ptr.y, p.x, p.y, ptr.vx, ptr.vy);
    }
    ptr.x = p.x; ptr.y = p.y; ptr.lt = now;
  });
  const up = () => { ptr.down = false; };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);

  api.onParam(k => {
    if (k === "tile") rebuildGrid();
    if (k === "auto" || k === "threshold") { if (!S.auto) queue = []; }
  });

  /* ---------- 자동 벗기기 ---------- */
  function autoReveal() {
    autoDone = true;
    const ox = clamp(ptr.x - C.x, 0, C.w), oy = clamp(ptr.y - C.y, 0, C.h), now = performance.now();
    queue = [];
    for (let k = 0; k < alive.length; k++) if (alive[k]) {
      const cx = (k % cols + 0.5) * ts, cy = (Math.floor(k / cols) + 0.5) * ts;
      queue.push({ i: k, at: now + Math.hypot(cx - ox, cy - oy) * 1.3 + Math.random() * 90 });
    }
    queue.sort((a, b) => a.at - b.at);
    api.flash(`${S.threshold}%를 넘어서 나머지가 저절로 벗겨진다`, "ok", 2200);
  }

  /* ---------- 루프 ---------- */
  const floorY = () => size.h - 6;
  api.frame((dt) => {
    const s = dt / 1000, now = performance.now();
    const pct = (1 - aliveCount / total) * 100;
    if (S.auto && !autoDone && aliveCount > 0 && pct >= S.threshold) autoReveal();
    if (!S.auto && pct < S.threshold) autoDone = false;
    if (queue.length) {
      let n = 0;
      while (queue.length && queue[0].at <= now && n < 400) { const q = queue.shift(); detach(q.i, 0, 0, 0.6); n++; }
    }

    g.clearRect(0, 0, size.w, size.h);
    g.drawImage(live, C.x, C.y, C.w, C.h);

    // 떨어지는 조각
    const fy = floorY(), d = size.dpr;
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      p.t += s;
      if (p.fall) {
        if (p.rest === 0) {
          p.vy += 1900 * s; p.x += p.vx * s; p.y += p.vy * s; p.rot += p.vr * s;
          if (p.y > fy - p.ts / 2) {
            p.y = fy - p.ts / 2;
            if (Math.abs(p.vy) > 160) { p.vy *= -0.28; p.vx *= 0.6; p.vr *= 0.5; }
            else { p.rest = 0.0001; p.vx = p.vy = 0; }
          }
        } else {
          p.rest += s;
          if (p.rest > 1.6) p.a -= s * 1.2;
        }
        if (p.x < -40 || p.x > size.w + 40) p.a = 0;
      } else {
        p.s -= s * 4.5; p.a = p.s;
      }
      if (p.a <= 0 || p.s <= 0) { pieces.splice(i, 1); continue; }
      const c = Math.cos(p.rot) * p.s, sn = Math.sin(p.rot) * p.s;
      g.globalAlpha = p.a;
      g.setTransform(c * d, sn * d, -sn * d, c * d, p.x * d, p.y * d);
      g.drawImage(p.src, p.sx * d, p.sy * d, p.ts * d, p.ts * d, -p.ts / 2, -p.ts / 2, p.ts, p.ts);
    }
    g.globalAlpha = 1;
    g.setTransform(d, 0, 0, d, 0, 0);

    // 브러시 크기 표시
    if (ptr.in || ptr.down) {
      g.beginPath(); g.arc(ptr.x, ptr.y, S.brush / 2, 0, Math.PI * 2);
      g.strokeStyle = ptr.down ? "rgba(255,90,54,.9)" : "rgba(27,27,26,.45)";
      g.lineWidth = 1.5; g.setLineDash(ptr.down ? [] : [4, 4]); g.stroke(); g.setLineDash([]);
    }

    api.read("pct", pct.toFixed(1) + "%");
    api.read("count", removed);
    api.read("len", Math.round(strokeLen) + "px");
    api.read("left", aliveCount);

    if (aliveCount === 0) api.status("모두 드러남 · 처음 상태로 다시 덮을 수 있다", "ok");
    else if (queue.length) api.status("나머지 덮개가 저절로 벗겨지는 중", "alt");
    else if (ptr.down) api.status(`긁는 중 · ${pct.toFixed(0)}% 드러남`, "active");
    else if (pieces.some(p => p.fall && p.rest === 0)) api.status("긁힌 조각이 중력으로 떨어지는 중", "alt");
    else api.status(pct > 0 ? `대기 · ${pct.toFixed(0)}% 드러남` : "대기", "idle");
  });
}
