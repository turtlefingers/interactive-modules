import { clamp, lerp, fitCanvas } from "../../lib/util.js";
import { ILLO, person } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .jump-crouch-pad { position: absolute; right: 16px; bottom: 16px; z-index: 40; display: flex; gap: 6px; align-items: flex-end;
      padding: 10px; background: var(--chip-bg); border-radius: var(--r-box); box-shadow: var(--chip-shadow); }
    .jump-crouch-key { height: 44px; min-width: 44px; padding: 0 12px; display: grid; place-items: center; border-radius: 8px;
      border: 1.5px solid rgba(0,0,0,.16); color: var(--ink); font-size: 18px; font-weight: 600; cursor: pointer; touch-action: none; user-select: none; white-space: nowrap;
      transition: background .08s, color .08s, border-color .08s; }
    .jump-crouch-key.jump { min-width: 104px; font-size: 13px; }
    .jump-crouch-key.on { background: var(--accent); border-color: var(--accent); color: #fff; }
    .jump-crouch-gap { width: 6px; }
    @media (max-width: 600px) { .jump-crouch-key { height: 40px; min-width: 40px; } .jump-crouch-key.jump { min-width: 72px; } }
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
  pad.className = "jump-crouch-pad";
  pad.innerHTML = `
    <div class="jump-crouch-key" data-a="left">←</div>
    <div class="jump-crouch-key" data-a="down">↓</div>
    <div class="jump-crouch-key" data-a="right">→</div>
    <div class="jump-crouch-gap"></div>
    <div class="jump-crouch-key jump" data-a="jump">↑ · Space 점프</div>`;
  el.appendChild(pad);
  const keyEls = {};
  pad.querySelectorAll("[data-a]").forEach(k => { keyEls[k.dataset.a] = k; });

  const CODES = {
    ArrowUp: "jump", KeyW: "jump", Space: "jump",
    ArrowDown: "down", KeyS: "down",
    ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right"
  };
  const keyDown = new Set(), padDown = new Set();
  const held = a => padDown.has(a) || [...keyDown].some(c => CODES[c] === a);

  /* ---------- 월드 ---------- */
  const W = 40, H = 72, PH = 76;    // 캐릭터 폭, 키 (PH는 그림 키트에 주는 키)
  const JUMP_H = 170;               // 가득 눌렀을 때 점프 높이
  let groundY = 0, plats = [];
  const layout = () => {
    const { w, h } = size;
    groundY = Math.round(h * 0.74);
    const pw = clamp(w * 0.2, 110, 200);
    plats = [
      { x: w * 0.16, y: groundY - 120, w: pw },
      { x: w * 0.56, y: groundY - 215, w: pw * 1.1 },
      { x: w * 0.8, y: groundY - 110, w: pw * 0.8 }
    ];
  };
  layout();

  const P = { x: size.w * 0.35, y: groundY, vx: 0, vy: 0, onGround: true, face: 1, sx: 1, sy: 1, svx: 0, svy: 0,
    crouch: 0, airJumps: 0, leftGroundAt: 0, jumpedSinceGround: false, cut: false, airT: 0, holdT: 0, jumping: false };
  api.onResize(() => {
    const oldG = groundY; layout();
    if (P.onGround) P.y = P.y === oldG ? groundY : P.y;
    P.x = clamp(P.x, W / 2, size.w - W / 2);
    if (P.y > groundY) P.y = groundY;
  });

  const trail = [];      // 지금 점프의 궤적
  let lastArc = null;     // 지난 점프 궤적 (서서히 흐려짐)
  const ring = [];

  const kick = (sx, sy) => { if (!S.squash) return; P.sx = sx; P.sy = sy; };

  const jumpV = () => Math.sqrt(2 * S.gravity * JUMP_H);
  const tryJump = () => {
    const now = performance.now();
    const coyoteOk = !P.onGround && !P.jumpedSinceGround && now - P.leftGroundAt <= S.coyote;
    if (P.onGround || coyoteOk) {
      P.vy = -jumpV(); P.onGround = false; P.jumpedSinceGround = true; P.cut = false; P.jumping = true; P.holdT = 0;
      if (coyoteOk) api.flash(`코요테 타임 점프 · 떨어진 지 ${Math.round(now - P.leftGroundAt)}ms`, "ok");
      P.airJumps = S.double ? 1 : 0;
      trail.length = 0;
      kick(0.72, 1.35);
      return;
    }
    if (P.airJumps > 0) {
      P.airJumps--; P.vy = -jumpV() * 0.85; P.cut = false; P.jumping = true; P.holdT = 0;
      kick(0.75, 1.3);
      ring.push({ x: P.x, y: P.y, t: 1 });
      api.flash("2단 점프", "ok");
    }
  };
  const releaseJump = () => {
    if (S.hold && P.jumping && P.vy < 0 && !P.cut) { P.vy *= 0.42; P.cut = true; }
    P.jumping = false;
  };

  // 사이드바의 글자 입력칸, 슬라이더에 포커스가 있으면 반응하지 않는다 (체크박스는 예외: Space가 토글을 다시 뒤집지 않도록)
  const fromField = e => { const f = e.target && e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"); return !!f && !(f.type === "checkbox" || f.type === "radio"); };
  api.on(window, "keydown", e => {
    if (fromField(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    const a = CODES[e.code]; if (!a) return;
    e.preventDefault();
    api.hideHint();
    if (e.repeat) return;
    const was = held(a);
    keyDown.add(e.code);
    if (a === "jump" && !was) tryJump();
  });
  api.on(window, "keyup", e => {
    const a = CODES[e.code]; if (!a) return;
    if (!fromField(e)) e.preventDefault();
    keyDown.delete(e.code);
    if (a === "jump" && !held("jump")) releaseJump();
  });
  api.on(window, "blur", () => { keyDown.clear(); padDown.clear(); releaseJump(); });
  Object.entries(keyEls).forEach(([a, k]) => {
    api.on(k, "pointerdown", e => {
      e.preventDefault(); e.stopPropagation();
      k.setPointerCapture(e.pointerId);
      const was = held(a);
      padDown.add(a); api.hideHint();
      if (a === "jump" && !was) tryJump();
    });
    const up = () => { if (!padDown.has(a)) return; padDown.delete(a); if (a === "jump" && !held("jump")) releaseJump(); };
    api.on(k, "pointerup", up); api.on(k, "pointercancel", up); api.on(k, "lostpointercapture", up);
  });

  const FONT = "12px " + (getComputedStyle(el).fontFamily || "sans-serif");
  /* ---------- 그리기 도우미 ---------- */

  api.frame(dt => {
    const s = dt / 1000;
    const { w, h } = size;
    const now = performance.now();
    const L = held("left"), R = held("right"), D = held("down");

    // 앉기
    const crouching = D && P.onGround;
    P.crouch = lerp(P.crouch, crouching ? 1 : 0, 1 - Math.exp(-20 * s));

    // 가로 이동
    const dir = (R ? 1 : 0) - (L ? 1 : 0);
    if (dir) P.face = dir;
    const maxV = 300 * (crouching ? 0.35 : 1);
    P.vx = lerp(P.vx, dir * maxV, 1 - Math.exp(-(P.onGround ? 16 : 7) * s));

    // 세로: 중력
    if (P.jumping && P.vy < 0) P.holdT += dt;
    const prevY = P.y;
    P.vy += S.gravity * s * (P.vy > 0 ? 1.15 : 1);
    P.vy = Math.min(P.vy, 1400);
    P.x += P.vx * s; P.y += P.vy * s;
    P.x = clamp(P.x, W / 2, w - W / 2);

    // 착지 판정 (위에서 떨어질 때만 올라선다)
    let landed = null;
    if (P.vy >= 0) {
      if (P.y >= groundY) landed = groundY;
      for (const p of plats) {
        if (P.x > p.x - 8 && P.x < p.x + p.w + 8 && prevY <= p.y + 0.5 && P.y >= p.y) { landed = landed === null ? p.y : Math.min(landed, p.y); }
      }
    }
    if (landed !== null) {
      P.y = landed;
      if (!P.onGround) {
        const impact = P.vy;
        P.onGround = true; P.jumping = false; P.jumpedSinceGround = false; P.airJumps = 0;
        if (impact > 250) { kick(1 + Math.min(0.45, impact / 2600), 1 - Math.min(0.4, impact / 3000)); }
        if (trail.length > 4) lastArc = { pts: trail.slice(), t: 1, apex: Math.min(...trail.map(q => q.y)), base: trail[0].y };
        trail.length = 0;
      }
      P.vy = 0;
    } else {
      // 발밑에 바닥이 있는지 확인 (걸어서 떨어지는 경우)
      if (P.onGround) {
        let support = Math.abs(P.y - groundY) < 1;
        for (const p of plats) if (Math.abs(P.y - p.y) < 1 && P.x > p.x - 8 && P.x < p.x + p.w + 8) support = true;
        if (!support) { P.onGround = false; P.leftGroundAt = now; P.airJumps = S.double ? 1 : 0; trail.length = 0; }
      }
    }
    P.airT = P.onGround ? 0 : P.airT + s;
    if (!P.onGround) { trail.push({ x: P.x, y: P.y }); if (trail.length > 400) trail.shift(); }

    // 찌그러짐 (스프링)
    const tsx = S.squash ? (P.onGround ? 1 + P.crouch * 0.28 : 1 - clamp(Math.abs(P.vy) / 5000, 0, 0.12)) : 1;
    const tsy = S.squash ? (P.onGround ? 1 : 1 + clamp(Math.abs(P.vy) / 3500, 0, 0.2)) : 1;
    P.svx += ((tsx - P.sx) * 380 - P.svx * 18) * s; P.sx += P.svx * s;
    P.svy += ((tsy - P.sy) * 380 - P.svy * 18) * s; P.sy += P.svy * s;
    if (!S.squash) { P.sx = lerp(P.sx, 1, 0.3); P.sy = lerp(P.sy, 1, 0.3); }

    /* ---- 그리기 ---- */
    g.clearRect(0, 0, w, h);
    g.fillStyle = C.board; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(0,0,0,.04)"; g.lineWidth = 1; g.beginPath();
    for (let x = 100; x < w; x += 100) { g.moveTo(x + .5, 0); g.lineTo(x + .5, groundY); }
    for (let y = groundY - 100; y > 0; y -= 100) { g.moveTo(0, y + .5); g.lineTo(w, y + .5); }
    g.stroke();

    // 높이 눈금
    g.fillStyle = "rgba(0,0,0,.3)"; g.font = FONT; g.textAlign = "left";
    for (let k = 1; k * 50 < groundY - 40; k++) {
      const y = groundY - k * 50;
      g.fillRect(0, y, k % 2 ? 6 : 12, 1);
      if (k % 2 === 0) g.fillText(`${k * 50}`, 16, y + 4);
    }

    // 바닥
    g.fillStyle = C.ink; g.fillRect(0, groundY, w, 3);
    // 발판
    plats.forEach(p => {
      g.fillStyle = C.ink; g.fillRect(p.x, p.y, p.w, 3);
      g.strokeStyle = "rgba(0,0,0,.15)"; g.lineWidth = 1; g.beginPath();
      for (let x = p.x + 8; x < p.x + p.w; x += 10) { g.moveTo(x, p.y + 2); g.lineTo(x - 6, p.y + 10); }
      g.stroke();
    });

    // 지난 점프 궤적
    if (lastArc) {
      lastArc.t -= s * 0.35;
      if (lastArc.t <= 0) lastArc = null;
      else {
        g.fillStyle = `rgba(27,27,26,${0.35 * lastArc.t})`;
        lastArc.pts.forEach((q, i) => { if (i % 3 === 0) { g.beginPath(); g.arc(q.x, q.y - H / 2, 2.2, 0, Math.PI * 2); g.fill(); } });
        const top = lastArc.pts.reduce((a, b) => (b.y < a.y ? b : a));
        const hh = Math.round(lastArc.base - top.y);
        if (hh > 8) {
          g.strokeStyle = `rgba(27,27,26,${0.45 * lastArc.t})`; g.setLineDash([3, 4]); g.lineWidth = 1;
          g.beginPath(); g.moveTo(top.x - 30, top.y - H); g.lineTo(top.x + 30, top.y - H); g.stroke(); g.setLineDash([]);
          g.fillStyle = `rgba(27,27,26,${0.7 * lastArc.t})`; g.textAlign = "center";
          g.fillText(`${hh}px`, top.x, top.y - H - 8);
        }
      }
    }
    // 지금 점프 궤적
    g.fillStyle = "rgba(27,27,26,.4)";
    trail.forEach((q, i) => { if (i % 3 === 0) { g.beginPath(); g.arc(q.x, q.y - H / 2, 2.2, 0, Math.PI * 2); g.fill(); } });

    // 2단 점프 고리
    for (let i = ring.length - 1; i >= 0; i--) {
      const r = ring[i]; r.t -= s * 2.5; if (r.t <= 0) { ring.splice(i, 1); continue; }
      g.strokeStyle = `rgba(27,27,26,${r.t * 0.6})`; g.lineWidth = 1.5;
      g.beginPath(); g.ellipse(r.x, r.y, 18 + (1 - r.t) * 30, 5 + (1 - r.t) * 8, 0, 0, Math.PI * 2); g.stroke();
    }


    // 캐릭터
    const pose = !P.onGround ? "jump" : P.crouch > 0.5 ? "crouch" : "stand";
    const sq = S.squash ? clamp(1 - P.sy, -0.35, 0.45) : 0;
    const crouchSq = pose === "crouch" ? 0.12 : P.crouch * 0.3;     // 앉는 도중의 낮아짐
    person(g, P.x, P.y, {
      h: PH, color: ILLO.blue, pose,
      mood: pose === "crouch" ? "neutral" : !P.onGround && P.vy > 600 ? "surprised" : "happy",
      look: { x: P.face * 0.8, y: P.vy < -60 ? -1 : P.vy > 60 ? 1 : 0 }, facing: P.face,
      squash: sq + crouchSq
    });
    const bh = PH * (pose === "crouch" ? 0.84 : 1) * (1 - sq - crouchSq);

    // 코요테 타임 표시
    const coyoteLeft = !P.onGround && !P.jumpedSinceGround ? S.coyote - (now - P.leftGroundAt) : 0;
    if (coyoteLeft > 0 && S.coyote > 0) {
      const k = coyoteLeft / S.coyote;
      g.strokeStyle = C.ink; g.lineWidth = 2;
      g.beginPath(); g.arc(P.x, P.y - bh - 16, 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); g.stroke();
    }
    // 2단 점프 가능 표시
    if (S.double && !P.onGround && P.airJumps > 0) {
      g.fillStyle = C.ink; g.beginPath(); g.arc(P.x, P.y - bh - 14, 4, 0, Math.PI * 2); g.fill();
    }

    /* ---- 패드와 읽는 값 ---- */
    ["left", "right", "down", "jump"].forEach(a => keyEls[a].classList.toggle("on", held(a)));
    const keys = [["jump", "점프"], ["down", "↓"], ["left", "←"], ["right", "→"]].filter(([a]) => held(a)).map(([, l]) => l).join(" ");
    api.read("keys", keys || "–");
    api.read("height", Math.max(0, Math.round(groundY - P.y)));
    api.read("vy", Math.round(-P.vy));
    api.read("hold", P.onGround ? "–" : `${(P.holdT / 1000).toFixed(2)}초`);

    if (coyoteLeft > 0 && S.coyote > 0) api.status(`코요테 타임 · ${Math.round(coyoteLeft)}ms 안에 점프 가능`, "alt");
    else if (!P.onGround && P.vy < 0) api.status(S.hold && P.jumping ? "상승 중 · 누르고 있으면 더 높이" : "상승 중", "active");
    else if (!P.onGround) api.status("낙하 중", "alt");
    else if (crouching) api.status(dir ? "앉아서 기어가는 중" : "앉기", "active");
    else if (dir) api.status("걷는 중", "active");
    else api.status("대기", "idle");
  });
}
