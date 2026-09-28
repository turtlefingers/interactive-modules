import { clamp, mod, rng, fitCanvas } from "../../lib/util.js";
import { ILLO, person, shape } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .directional-move-pad { position: absolute; right: 16px; bottom: 16px; z-index: 40; display: flex; align-items: flex-end; gap: 14px;
      padding: 12px; background: var(--chip-bg); border-radius: var(--r-box); box-shadow: var(--chip-shadow); }
    .directional-move-keys { display: grid; grid-template-columns: repeat(3, 44px); grid-template-rows: repeat(2, 44px); gap: 6px; }
    .directional-move-key { display: grid; place-items: center; border-radius: 8px; border: 1.5px solid rgba(0,0,0,.16); color: var(--ink);
      font-size: 18px; font-weight: 600; cursor: pointer; touch-action: none; user-select: none; transition: background .08s, color .08s, border-color .08s; }
    .directional-move-key.on { background: var(--accent); border-color: var(--accent); color: #fff; }
    .directional-move-key.up { grid-column: 2; grid-row: 1; }
    .directional-move-key.left { grid-column: 1; grid-row: 2; }
    .directional-move-key.down { grid-column: 2; grid-row: 2; }
    .directional-move-key.right { grid-column: 3; grid-row: 2; }
    .directional-move-vec { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 13px; color: var(--ink-2); }
    .directional-move-vec .box { position: relative; width: 72px; height: 72px; border-radius: 8px; border: 1px solid rgba(0,0,0,.12); }
    .directional-move-vec .ring { position: absolute; left: 9px; top: 9px; width: 52px; height: 52px; border-radius: 50%; border: 1px dashed rgba(0,0,0,.3); }
    .directional-move-vec .dot { position: absolute; left: 35px; top: 35px; width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 50%; background: var(--accent); }
    .directional-move-vec svg { position: absolute; inset: 0; overflow: visible; }
    @media (max-width: 600px) {
      .directional-move-keys { grid-template-columns: repeat(3, 40px); grid-template-rows: repeat(2, 40px); }
      .directional-move-vec { display: none; }
    }
  `);

  const { g, size } = fitCanvas(api);
  const C = {
    board: api.color("--board") || "#efe9dd",
    ink: api.color("--ink") || "#1b1b1a",
    note: api.color("--note") || "#fffdf6",
    accent: api.color("--accent") || "#ff5a36"
  };

  /* ---------- 조작 패드 ---------- */
  const pad = document.createElement("div");
  pad.className = "directional-move-pad";
  pad.innerHTML = `
    <div class="directional-move-vec"><div class="box"><div class="ring"></div><svg><line x1="35" y1="35" x2="35" y2="35" stroke="${C.accent}" stroke-width="1.5" stroke-linecap="round"/></svg><div class="dot"></div></div><span>입력 벡터</span></div>
    <div class="directional-move-keys">
      <div class="directional-move-key up" data-d="up">↑</div>
      <div class="directional-move-key left" data-d="left">←</div>
      <div class="directional-move-key down" data-d="down">↓</div>
      <div class="directional-move-key right" data-d="right">→</div>
    </div>`;
  el.appendChild(pad);
  const keyEls = {};
  pad.querySelectorAll("[data-d]").forEach(k => { keyEls[k.dataset.d] = k; });
  const vecDot = pad.querySelector(".dot"), vecLine = pad.querySelector("line");

  const CODES = {
    ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down",
    ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right"
  };
  const keyDown = new Set();   // 키보드로 누른 방향 (code)
  const padDown = new Set();   // 화면 버튼으로 누른 방향
  const held = d => padDown.has(d) || [...keyDown].some(c => CODES[c] === d);

  // 사이드바의 글자 입력칸, 슬라이더에 포커스가 있으면 반응하지 않는다 (체크박스는 예외: Space가 토글을 다시 뒤집지 않도록)
  const fromField = e => { const f = e.target && e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"); return !!f && !(f.type === "checkbox" || f.type === "radio"); };
  api.on(window, "keydown", e => {
    if (fromField(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (!CODES[e.code]) return;
    e.preventDefault();
    keyDown.add(e.code);
    api.hideHint();
  });
  api.on(window, "keyup", e => {
    if (!CODES[e.code]) return;
    keyDown.delete(e.code);
    if (!fromField(e)) e.preventDefault();
  });
  api.on(window, "blur", () => { keyDown.clear(); padDown.clear(); });

  Object.entries(keyEls).forEach(([d, k]) => {
    api.on(k, "pointerdown", e => {
      e.preventDefault(); e.stopPropagation();
      k.setPointerCapture(e.pointerId);
      padDown.add(d); api.hideHint();
    });
    const up = () => padDown.delete(d);
    api.on(k, "pointerup", up); api.on(k, "pointercancel", up); api.on(k, "lostpointercapture", up);
  });

  /* ---------- 바닥 장식 (움직임이 보이도록) ---------- */
  const rand = rng(11);
  const deco = [];
  for (let i = 0; i < 40; i++) deco.push({ u: rand(), v: rand() });

  /* ---------- 캐릭터 ---------- */
  const R = 26, TOP = 80, BOT = 10;   // 발 위치 기준 여백 (머리가 화면 밖으로 나가지 않게)
  const P = { x: size.w / 2, y: size.h / 2 + 30, vx: 0, vy: 0, face: -Math.PI / 2, bump: 0, walk: 0 };
  const steps = [];         // 발자국
  let stepSide = 1, stepAcc = 0, lastWall = 0;
  api.onResize(() => { P.x = clamp(P.x, R, Math.max(R, size.w - R)); P.y = clamp(P.y, TOP, Math.max(TOP, size.h - BOT)); });

  const angDiff = (a, b) => mod(b - a + Math.PI, Math.PI * 2) - Math.PI;
  const ARROW = { up: "↑", down: "↓", left: "←", right: "→" };

  // (x, y)는 발바닥. 몸 둘레의 작은 삼각형이 바라보는 방향이다
  const MID = 36;   // 발에서 몸 가운데까지
  const drawChar = (x, y, moving) => {
    const fx = Math.cos(P.face), fy = Math.sin(P.face);
    const step = moving ? Math.abs(Math.sin(P.walk)) : 0;
    person(g, x, y - step * 3, {
      h: 72, color: ILLO.orange, pose: "stand",
      mood: P.bump > 0.3 ? "surprised" : "happy",
      look: { x: fx, y: fy }, facing: fx >= 0 ? 1 : -1,
      squash: step * 0.05 + P.bump * 0.18
    });
    const cx = x, cy = y - MID;
    shape(g, c => {
      const tx = cx + fx * 52, ty = cy + fy * 52, bx = cx + fx * 40, by = cy + fy * 40;
      c.moveTo(tx, ty); c.lineTo(bx - fy * 8, by + fx * 8); c.lineTo(bx + fy * 8, by - fx * 8); c.closePath();
    }, { fill: ILLO.ink, lw: 0 });
  };

  api.frame(dt => {
    const s = dt / 1000;
    const { w, h } = size;
    const L = held("left"), Rt = held("right"), U = held("up"), D = held("down");
    const ix = (Rt ? 1 : 0) - (L ? 1 : 0), iy = (D ? 1 : 0) - (U ? 1 : 0);

    // 목표 속도
    let tvx = 0, tvy = 0, mx = 0, my = 0;
    if (S.scheme === "tank") {
      P.face += ix * 3.4 * s;
      const fwd = -iy;
      mx = Math.cos(P.face) * fwd; my = Math.sin(P.face) * fwd;
      tvx = mx * S.speed; tvy = my * S.speed;
    } else {
      mx = ix; my = iy;
      if (S.norm && mx && my) { mx *= Math.SQRT1_2; my *= Math.SQRT1_2; }
      tvx = mx * S.speed; tvy = my * S.speed;
      if (ix || iy) P.face += angDiff(P.face, Math.atan2(iy, ix)) * (1 - Math.exp(-16 * s));
    }
    const hasInput = tvx !== 0 || tvy !== 0;

    // 가속 · 마찰
    if (S.accel) {
      if (hasInput) { const k = 1 - Math.exp(-6 * s); P.vx += (tvx - P.vx) * k; P.vy += (tvy - P.vy) * k; }
      else { const f = Math.pow(S.friction, s * 60); P.vx *= f; P.vy *= f; if (Math.hypot(P.vx, P.vy) < 2) P.vx = P.vy = 0; }
    } else { P.vx = tvx; P.vy = tvy; }

    P.x += P.vx * s; P.y += P.vy * s;

    // 가장자리
    let hitWall = false;
    if (S.edge === "wrap") { P.x = mod(P.x, w); P.y = mod(P.y, h); }
    else {
      if (P.x < R || P.x > w - R) { P.x = clamp(P.x, R, w - R); P.vx = 0; hitWall = true; }
      if (P.y < TOP || P.y > h - BOT) { P.y = clamp(P.y, TOP, h - BOT); P.vy = 0; hitWall = true; }
      if (hitWall && hasInput && performance.now() - lastWall > 250) { P.bump = 1; lastWall = performance.now(); }
    }
    P.bump *= Math.pow(0.001, s);

    const spd = Math.hypot(P.vx, P.vy);
    P.walk += spd * s * 0.12;

    // 발자국
    stepAcc += spd * s;
    if (stepAcc > 26) {
      stepAcc = 0; stepSide *= -1;
      const a = Math.atan2(P.vy, P.vx) + Math.PI / 2;
      steps.push({ x: P.x + Math.cos(a) * 9 * stepSide, y: P.y + Math.sin(a) * 9 * stepSide, t: 1 });
      if (steps.length > 80) steps.shift();
    }

    /* ---- 그리기 ---- */
    g.clearRect(0, 0, w, h);
    g.fillStyle = C.board; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(0,0,0,.045)"; g.lineWidth = 1;
    g.beginPath();
    for (let x = 100; x < w; x += 100) { g.moveTo(x + .5, 0); g.lineTo(x + .5, h); }
    for (let y = 100; y < h; y += 100) { g.moveTo(0, y + .5); g.lineTo(w, y + .5); }
    g.stroke();
    // 움직임이 보이도록 바닥에 작은 + 표시
    g.strokeStyle = "rgba(0,0,0,.16)"; g.lineWidth = 1.2; g.beginPath();
    deco.forEach(d => { const x = Math.round(d.u * w) + .5, y = Math.round(d.v * h) + .5; g.moveTo(x - 4, y); g.lineTo(x + 4, y); g.moveTo(x, y - 4); g.lineTo(x, y + 4); });
    g.stroke();
    // 벽 테두리
    if (S.edge === "wall") {
      g.strokeStyle = hitWall ? C.accent : "rgba(0,0,0,.25)"; g.lineWidth = hitWall ? 3 : 1.5;
      g.strokeRect(2, 2, w - 4, h - 4);
    } else {
      g.setLineDash([6, 8]); g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 1.5;
      g.strokeRect(2, 2, w - 4, h - 4); g.setLineDash([]);
    }
    // 발자국
    for (let i = steps.length - 1; i >= 0; i--) {
      const st = steps[i];
      st.t -= s * 0.5;
      if (st.t <= 0) { steps.splice(i, 1); continue; }
      g.fillStyle = `rgba(0,0,0,${0.13 * st.t})`;
      g.beginPath(); g.arc(st.x, st.y, 4, 0, Math.PI * 2); g.fill();
    }
    // 탱크 방식: 앞 방향 표시
    if (S.scheme === "tank") {
      g.strokeStyle = "rgba(0,0,0,.3)"; g.lineWidth = 1; g.setLineDash([4, 6]);
      g.beginPath(); g.moveTo(P.x + Math.cos(P.face) * 58, P.y - MID + Math.sin(P.face) * 58);
      g.lineTo(P.x + Math.cos(P.face) * 150, P.y - MID + Math.sin(P.face) * 150); g.stroke(); g.setLineDash([]);
    }
    // 캐릭터 (무한 반복이면 가장자리에서 반대편에도 그린다)
    const offs = [[0, 0]];
    if (S.edge === "wrap") {
      const ex = P.x < R + 12 ? w : P.x > w - R - 12 ? -w : 0;
      const ey = P.y < TOP ? h : P.y > h - BOT - 20 ? -h : 0;
      if (ex) offs.push([ex, 0]); if (ey) offs.push([0, ey]); if (ex && ey) offs.push([ex, ey]);
    }
    offs.forEach(([ox, oy]) => drawChar(P.x + ox, P.y + oy, spd > 5));

    /* ---- 패드와 읽는 값 ---- */
    ["up", "down", "left", "right"].forEach(d => keyEls[d].classList.toggle("on", held(d)));
    const dx = S.scheme === "tank" ? ix : mx, dy = S.scheme === "tank" ? iy : my;
    vecDot.style.transform = `translate(${dx * 26}px, ${dy * 26}px)`;
    vecLine.setAttribute("x2", 35 + dx * 26); vecLine.setAttribute("y2", 35 + dy * 26);

    const keys = ["up", "down", "left", "right"].filter(held).map(d => ARROW[d]).join(" ");
    api.read("keys", keys || "–");
    api.read("vec", S.scheme === "tank" ? `회전 ${ix}, 전진 ${-iy}` : `${mx.toFixed(2)}, ${my.toFixed(2)}`);
    api.read("speed", Math.round(spd));
    api.read("angle", `${Math.round(mod(P.face * 180 / Math.PI + 90, 360))}°`);

    if (hitWall && hasInput) api.status("벽에 막힘", "alt");
    else if (hasInput && S.scheme === "tank") api.status(ix && !iy ? "제자리 회전 중 · 탱크" : "바라보는 방향으로 이동 · 탱크", "active");
    else if (hasInput) api.status(ix && iy ? `대각선 이동 · ${Math.round(spd)}px/s` : "이동 중 · 8방향", "active");
    else if (spd > 0) api.status("손을 뗐다 · 미끄러지는 중", "alt");
    else if (S.scheme === "tank" && ix) api.status("제자리 회전 중 · 탱크", "active");
    else api.status("대기", "idle");
  });
}
