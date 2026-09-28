import { rng, clamp, mod, PALETTE, PALETTE_SOFT } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;
  const W = 3000, H = 2000;

  api.css(`
    .pan-demo { position: absolute; inset: 0; cursor: grab;
      background-color: var(--stage-out);
      background-image: radial-gradient(var(--stage-dot) 1.4px, transparent 1.6px);
      background-size: 28px 28px; }
    .pan-demo.is-grabbing, .pan-demo.is-grabbing * { cursor: grabbing !important; }
    .pan-layer { position: absolute; left: 0; top: 0; will-change: transform; }
    .pan-tile { position: absolute; width: ${W}px; height: ${H}px; }
    .pan-tile.copy { display: none; }
    .wrap-mode .pan-tile.copy { display: block; }
    .pan-board { position: absolute; inset: 0; background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; box-shadow: 0 0 0 2px rgba(0,0,0,.25); }
    .pan-zone { position: absolute; width: 1000px; height: 1000px; border: 1px dashed rgba(0,0,0,.06);
      display: grid; place-items: center; font-size: 520px; font-weight: 900; color: rgba(0,0,0,.03); letter-spacing: -.05em; line-height: 1; }
    .pan-card { position: absolute; border-radius: var(--r-card); overflow: hidden; box-shadow: var(--shadow-card); cursor: pointer;
      transition: transform .25s cubic-bezier(.3,1.6,.5,1), box-shadow .2s; }
    .pan-card.note { background: var(--note); padding: 16px; }
    .pan-card.note .ln { height: 6px; border-radius: 3px; background: var(--note-line); margin-bottom: 10px; }
    .pan-card.dot { border-radius: 50%; box-shadow: none; }
    .pan-demo:not(.is-grabbing) .pan-card:hover { transform: translateY(-3px) scale(1.015); box-shadow: var(--shadow-hover); z-index: 1000 !important; }
    .pan-demo:not(.is-grabbing) .pan-card.dot:hover { transform: scale(1.05); box-shadow: 0 6px 16px rgba(0,0,0,.1); }
    .pan-start { position: absolute; width: 16px; height: 16px; margin: -8px 0 0 -8px; border-radius: 50%;
      background: var(--accent); }
    .pan-minimap { position: absolute; right: 16px; bottom: 16px; z-index: 40; padding: 6px;
      background: var(--chip-bg); border-radius: var(--r-box); box-shadow: var(--chip-shadow); cursor: pointer; }
    .pan-minimap canvas { display: block; border-radius: 4px; }
    @media (max-width: 900px) { .pan-minimap canvas { width: 130px !important; height: auto !important; } }
  `);

  /* ---------- 보드 ---------- */
  const root = document.createElement("div");
  root.className = "pan-demo";
  el.appendChild(root);
  const world = document.createElement("div");
  world.className = "pan-layer";
  root.appendChild(world);

  const rand = rng(7);
  const cards = [];
  const letters = "ABCDEF";
  for (let zy = 0; zy < 2; zy++) for (let zx = 0; zx < 3; zx++) {
    const letter = letters[zy * 3 + zx]; let n = 1;
    for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) {
      if (rand() < 0.28) continue;
      const kind = rand() < 0.55 ? "photo" : rand() < 0.6 ? "note" : "dot";
      let w = 130 + rand() * 130, h = kind === "dot" ? w : 100 + rand() * 140;
      if (kind === "dot") { w = h = 90 + rand() * 70; }
      const x = zx * 1000 + gx * 333 + 20 + rand() * (333 - w - 40);
      const y = zy * 1000 + gy * 333 + 20 + rand() * (333 - h - 40);
      const p = Math.floor(rand() * PALETTE.length);
      cards.push({ x, y, w, h, kind, c1: PALETTE[p], c2: PALETTE_SOFT[p], id: `${letter}-${String(n++).padStart(2, "0")}` });
    }
  }
  let th = `<div class="pan-board"></div>`;
  for (let i = 0; i < 6; i++) th += `<div class="pan-zone" style="left:${(i % 3) * 1000}px;top:${Math.floor(i / 3) * 1000}px">${letters[i]}</div>`;
  th += `<div class="pan-start" style="left:${W / 2}px;top:${H / 2}px"></div>`;
  cards.forEach((c, i) => {
    const st = `left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px;`;
    if (c.kind === "photo") th += `<div class="pan-card photo" data-i="${i}" style="${st}background:${c.c2}"></div>`;
    else if (c.kind === "note") th += `<div class="pan-card note" data-i="${i}" style="${st}"><div class="ln" style="width:70%"></div><div class="ln"></div><div class="ln" style="width:85%"></div></div>`;
    else th += `<div class="pan-card dot" data-i="${i}" style="${st}background:${c.c1}"></div>`;
  });
  [[0, 0], [W, 0], [0, H], [W, H]].forEach(([x, y], i) => {
    const t = document.createElement("div");
    t.className = "pan-tile" + (i ? " copy" : "");
    t.style.left = x + "px"; t.style.top = y + "px";
    t.innerHTML = th;
    world.appendChild(t);
  });

  // 개체마다 깊이: 1 = 보드 높이, 클수록 앞, 작을수록 뒤 (패럴랙스용)
  const drand = rng(21);
  cards.forEach(c => { c.depth = 0.55 + drand() * 1.15; });
  const cardEls = [];
  world.querySelectorAll(".pan-tile").forEach(t => {
    const ox = parseFloat(t.style.left), oy = parseFloat(t.style.top);
    t.querySelectorAll(".pan-card").forEach(node => {
      const c = cards[+node.dataset.i];
      cardEls.push({ node, c, cx: ox + c.x + c.w / 2, cy: oy + c.y + c.h / 2 });
      node.style.zIndex = Math.round(c.depth * 100);
    });
  });
  let px = 0; // 패럴랙스 적용 정도 0~1

  /* ---------- 카메라 ---------- */
  const cam = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0, gliding: false, jump: false };
  const ptr = { down: false, moved: false, sx: 0, sy: 0, lx: 0, ly: 0, samples: [], downCard: null, dx: 0, dy: 0 };
  let vw = 0, vh = 0;
  const bounds = () => {
    const x0 = W >= vw ? 0 : (W - vw) / 2, x1 = W >= vw ? W - vw : x0;
    const y0 = H >= vh ? 0 : (H - vh) / 2, y1 = H >= vh ? H - vh : y0;
    return { x0, x1, y0, y1 };
  };
  const resize = () => { vw = el.clientWidth; vh = el.clientHeight; };
  resize();
  api.onResize(resize);
  cam.tx = cam.x = W / 2 - vw / 2; cam.ty = cam.y = H / 2 - vh / 2;

  const applyModes = () => root.classList.toggle("wrap-mode", S.bound === "wrap");
  applyModes();
  api.onParam((k, v) => {
    if (k === "bound") {
      if (v !== "wrap") { cam.x = cam.tx = mod(cam.x, W); cam.y = cam.ty = mod(cam.y, H); }
      applyModes();
    }
  });

  /* ---------- 포인터 ---------- */
  api.on(root, "pointerdown", e => {
    if (e.target.closest(".pan-minimap")) return;
    e.preventDefault();
    getSelection().removeAllRanges();
    root.setPointerCapture(e.pointerId);
    ptr.down = true; ptr.moved = false;
    ptr.sx = ptr.lx = e.clientX; ptr.sy = ptr.ly = e.clientY;
    ptr.dx = ptr.dy = 0; ptr.samples = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
    ptr.downCard = e.target.closest(".pan-card");
    cam.gliding = false; cam.vx = cam.vy = 0;
    if (S.bound === "wrap") { cam.x = cam.tx = mod(cam.x, W); cam.y = cam.ty = mod(cam.y, H); }
    root.classList.add("is-grabbing");
  });
  api.on(root, "pointermove", e => {
    if (!ptr.down) return;
    const now = performance.now();
    ptr.samples.push({ x: e.clientX, y: e.clientY, t: now });
    while (ptr.samples.length > 2 && now - ptr.samples[0].t > 100) ptr.samples.shift();
    ptr.dx = e.clientX - ptr.sx; ptr.dy = e.clientY - ptr.sy;
    if (!ptr.moved) {
      if (Math.hypot(ptr.dx, ptr.dy) < S.threshold) return;
      ptr.moved = true;
      api.hideHint();
    }
    let mx = -(e.clientX - ptr.lx), my = -(e.clientY - ptr.ly);
    ptr.lx = e.clientX; ptr.ly = e.clientY;
    if (S.axis === "x") my = 0;
    if (S.axis === "y") mx = 0;
    if (S.bound === "bounce") {
      const b = bounds();
      if ((cam.tx < b.x0 && mx < 0) || (cam.tx > b.x1 && mx > 0)) mx *= 0.3;
      if ((cam.ty < b.y0 && my < 0) || (cam.ty > b.y1 && my > 0)) my *= 0.3;
    }
    cam.tx += mx; cam.ty += my;
  });
  const endPointer = () => {
    if (!ptr.down) return;
    ptr.down = false;
    root.classList.remove("is-grabbing");
    if (!ptr.moved) {
      if (ptr.downCard) api.flash(`팬이 아닌 클릭으로 인식 · 카드 ${cards[+ptr.downCard.dataset.i].id}`, "ok");
      return;
    }
    // 떼는 순간의 속도 → 관성
    const s = ptr.samples, a = s[0], b = s[s.length - 1];
    const dt = Math.max(1, b.t - a.t);
    if (S.inertia && performance.now() - b.t < 60) {
      cam.vx = -(b.x - a.x) / dt * 16.67;
      cam.vy = -(b.y - a.y) / dt * 16.67;
      if (S.axis === "x") cam.vy = 0;
      if (S.axis === "y") cam.vx = 0;
      const sp = Math.hypot(cam.vx, cam.vy), MAX = 70;
      if (sp > MAX) { cam.vx *= MAX / sp; cam.vy *= MAX / sp; }
      cam.gliding = true;
    }
  };
  api.on(root, "pointerup", endPointer);
  api.on(root, "pointercancel", endPointer);

  /* ---------- 미니맵 ---------- */
  const mmBox = document.createElement("div");
  mmBox.className = "pan-minimap"; mmBox.title = "클릭하면 그 위치로 이동";
  const mm = document.createElement("canvas");
  mmBox.appendChild(mm); root.appendChild(mmBox);
  const MMW = 180, MMS = MMW / W, MMH = H * MMS;
  const dpr = window.devicePixelRatio || 1;
  mm.width = MMW * dpr; mm.height = MMH * dpr; mm.style.width = MMW + "px"; mm.style.height = MMH + "px";
  const g = mm.getContext("2d"); g.scale(dpr, dpr);
  const MMC = { board: api.color("--board"), note: api.color("--ink-3"), accent: api.color("--accent"), soft: "rgba(255,90,54,.12)" };
  api.on(mmBox, "pointerdown", e => {
    e.stopPropagation();
    const r = mm.getBoundingClientRect();
    const wx = (e.clientX - r.left) / r.width * W, wy = (e.clientY - r.top) / r.height * H;
    if (S.bound === "wrap") { cam.x = mod(cam.x, W); cam.y = mod(cam.y, H); }
    cam.gliding = false; cam.vx = cam.vy = 0;
    cam.tx = wx - vw / 2; cam.ty = wy - vh / 2;
    if (S.bound !== "wrap") { const b = bounds(); cam.tx = clamp(cam.tx, b.x0, b.x1); cam.ty = clamp(cam.ty, b.y0, b.y1); }
    cam.jump = true;
  });
  const drawMinimap = (rx, ry) => {
    g.clearRect(0, 0, MMW, MMH);
    g.fillStyle = MMC.board; g.fillRect(0, 0, MMW, MMH);
    g.strokeStyle = "rgba(0,0,0,.12)"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(MMW / 3, 0); g.lineTo(MMW / 3, MMH); g.moveTo(MMW * 2 / 3, 0); g.lineTo(MMW * 2 / 3, MMH); g.moveTo(0, MMH / 2); g.lineTo(MMW, MMH / 2); g.stroke();
    cards.forEach(c => { g.fillStyle = c.kind === "note" ? MMC.note : c.c1; g.fillRect(c.x * MMS, c.y * MMS, Math.max(2, c.w * MMS), Math.max(2, c.h * MMS)); });
    g.strokeStyle = MMC.accent; g.lineWidth = 2; g.fillStyle = MMC.soft;
    const offs = S.bound === "wrap" ? [[0, 0], [-W, 0], [0, -H], [-W, -H]] : [[0, 0]];
    offs.forEach(([ox, oy]) => { const x = (rx + ox) * MMS, y = (ry + oy) * MMS; g.fillRect(x, y, vw * MMS, vh * MMS); g.strokeRect(x, y, vw * MMS, vh * MMS); });
  };

  /* ---------- 루프 ---------- */
  api.frame(() => {
    const b = bounds();
    if (cam.gliding && !ptr.down) {
      cam.tx += cam.vx; cam.ty += cam.vy;
      cam.vx *= S.friction; cam.vy *= S.friction;
      if (Math.hypot(cam.vx, cam.vy) < 0.05) { cam.gliding = false; cam.vx = cam.vy = 0; }
    }
    let springing = false;
    if (S.bound === "clamp") {
      const nx = clamp(cam.tx, b.x0, b.x1), ny = clamp(cam.ty, b.y0, b.y1);
      if (nx !== cam.tx) cam.vx = 0; if (ny !== cam.ty) cam.vy = 0;
      cam.tx = nx; cam.ty = ny;
    } else if (S.bound === "bounce" && !ptr.down) {
      const ex = clamp(cam.tx, b.x0, b.x1), ey = clamp(cam.ty, b.y0, b.y1);
      if (ex !== cam.tx) { cam.vx *= 0.55; cam.tx += (ex - cam.tx) * 0.16; springing = Math.abs(ex - cam.tx) > 0.5; if (!springing) cam.tx = ex; }
      if (ey !== cam.ty) { cam.vy *= 0.55; cam.ty += (ey - cam.ty) * 0.16; springing = springing || Math.abs(ey - cam.ty) > 0.5; if (Math.abs(ey - cam.ty) <= 0.5) cam.ty = ey; }
    }
    const f = cam.jump ? Math.min(S.follow, 0.14) : S.follow;
    cam.x += (cam.tx - cam.x) * f; cam.y += (cam.ty - cam.y) * f;
    if (Math.abs(cam.tx - cam.x) < 0.05 && Math.abs(cam.ty - cam.y) < 0.05) { cam.x = cam.tx; cam.y = cam.ty; cam.jump = false; }

    const wrap = S.bound === "wrap";
    const rx = wrap ? mod(cam.x, W) : cam.x, ry = wrap ? mod(cam.y, H) : cam.y;
    world.style.transform = `translate3d(${-rx}px,${-ry}px,0)`;
    root.style.backgroundPosition = `${-cam.x}px ${-cam.y}px`;

    // 패럴랙스: 화면 중심에서 멀수록, 앞에 있을수록 더 밀려난다
    const pxT = S.parallax ? 1 : 0;
    if (px !== pxT || S.parallax) {
      px += (pxT - px) * 0.12;
      if (Math.abs(pxT - px) < 0.002) px = pxT;
      const mx = rx + vw / 2, my = ry + vh / 2;
      for (const o of cardEls) {
        const k = (o.c.depth - 1) * px;
        if (k === 0) { o.node.style.translate = ""; o.node.style.scale = ""; continue; }
        o.node.style.translate = `${(o.cx - mx) * k}px ${(o.cy - my) * k}px`;
        o.node.style.scale = 1 + k * 0.35;
      }
    }
    drawMinimap(rx, ry);

    // 읽는 값
    const s = ptr.samples;
    let spd = 0;
    if (ptr.down && ptr.moved && s.length > 1) { const a = s[0], z = s[s.length - 1]; spd = Math.hypot(z.x - a.x, z.y - a.y) / Math.max(1, z.t - a.t) * 16.67; }
    else if (cam.gliding) spd = Math.hypot(cam.vx, cam.vy);
    api.read("dx", Math.round(ptr.dx)); api.read("dy", Math.round(ptr.dy));
    api.read("speed", spd.toFixed(1)); api.read("cam", `${Math.round(rx)}, ${Math.round(ry)}`);

    // 상태
    if (ptr.down && !ptr.moved) api.status(`누름 · 아직 이동 아님 (${Math.round(Math.hypot(ptr.dx, ptr.dy))} / ${S.threshold}px)`, "idle");
    else if (ptr.down) api.status("팬 중 · 뷰포트를 옮기는 중", "active");
    else if (springing) api.status("경계로 되돌아가는 중", "alt");
    else if (cam.gliding) api.status("관성으로 미끄러지는 중", "alt");
    else api.status("대기", "idle");
  });
}
