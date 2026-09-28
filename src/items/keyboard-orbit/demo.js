import { clamp, mod, fitCanvas } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .keyboard-orbit-pad { position: absolute; right: 16px; bottom: 16px; z-index: 40; padding: 10px;
      background: var(--chip-bg); border-radius: var(--r-box); box-shadow: var(--chip-shadow); }
    .keyboard-orbit-keys { display: grid; grid-template-columns: repeat(3, 44px); grid-template-rows: repeat(2, 44px); gap: 6px; }
    .keyboard-orbit-key { display: grid; place-items: center; border-radius: 8px; border: 1.5px solid rgba(0,0,0,.16); color: var(--ink);
      font-size: 18px; font-weight: 600; cursor: pointer; touch-action: none; user-select: none; transition: background .08s, color .08s, border-color .08s; }
    .keyboard-orbit-key.on { background: var(--accent); border-color: var(--accent); color: #fff; }
    .keyboard-orbit-key.up { grid-column: 2; grid-row: 1; } .keyboard-orbit-key.left { grid-column: 1; grid-row: 2; }
    .keyboard-orbit-key.down { grid-column: 2; grid-row: 2; } .keyboard-orbit-key.right { grid-column: 3; grid-row: 2; }
    .keyboard-orbit-cap { margin-top: 8px; font-size: 13px; color: var(--ink-2); text-align: center; }
    @media (max-width: 600px) { .keyboard-orbit-keys { grid-template-columns: repeat(3, 40px); grid-template-rows: repeat(2, 40px); } }
  `);

  const { g, size } = fitCanvas(api);
  const C = { board: api.color("--board") || "#efe9dd", ink: api.color("--ink") || "#1b1b1a", accent: api.color("--accent") || "#ff5a36" };
  const FONT = "13px " + (getComputedStyle(el).fontFamily || "sans-serif");

  /* ---------- 조작 패드 ---------- */
  const pad = document.createElement("div");
  pad.className = "keyboard-orbit-pad";
  pad.innerHTML = `<div class="keyboard-orbit-keys">
      <div class="keyboard-orbit-key up" data-d="up">↑</div><div class="keyboard-orbit-key left" data-d="left">←</div>
      <div class="keyboard-orbit-key down" data-d="down">↓</div><div class="keyboard-orbit-key right" data-d="right">→</div>
    </div><div class="keyboard-orbit-cap">←→ 좌우 · ↑↓ 위아래</div>`;
  el.appendChild(pad);
  const keyEls = {};
  pad.querySelectorAll("[data-d]").forEach(k => { keyEls[k.dataset.d] = k; });

  const CODES = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
  const keyDown = new Set(), padDown = new Set();
  const held = d => padDown.has(d) || [...keyDown].some(c => CODES[c] === d);

  /* ---------- 장면: 볼록한 입체 몇 개 ---------- */
  const box = (x0, y0, z0, x1, y1, z1) => ({
    v: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]],
    f: [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0]]
  });
  // 집: 몸통 + 지붕을 하나의 볼록 입체로
  const house = (() => {
    const x0 = -150, x1 = -10, z0 = -60, z1 = 60, h = 110, top = 180;
    return {
      v: [[x0, 0, z0], [x1, 0, z0], [x1, h, z0], [x0, h, z0], [x0, 0, z1], [x1, 0, z1], [x1, h, z1], [x0, h, z1], [x0, top, 0], [x1, top, 0]],
      f: [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 8, 7], [1, 5, 6, 9, 2], [3, 2, 9, 8], [7, 6, 9, 8], [4, 5, 1, 0]],
      mark: 0   // 앞면 (카메라 쪽, -z) 강조
    };
  })();
  const objects = [
    house,
    box(50, 0, -20, 110, 210, 40),
    box(40, 0, 90, 90, 50, 140),
    box(-120, 0, 110, -70, 30, 160)
  ];
  const LIGHT = (() => { const l = [-0.45, 0.85, -0.35]; const n = Math.hypot(...l); return l.map(v => v / n); })();
  objects.forEach(o => {
    o.c = [0, 1, 2].map(k => o.v.reduce((a, p) => a + p[k], 0) / o.v.length);
    o.faces = o.f.map((idx, fi) => {
      const pts = idx.map(i => o.v[i]);
      const c = [0, 1, 2].map(k => pts.reduce((a, p) => a + p[k], 0) / pts.length);
      const a = pts[0], b = pts[1], d = pts[2];
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
      let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const out = [c[0] - o.c[0], c[1] - o.c[1], c[2] - o.c[2]];
      if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0) n = n.map(x => -x);
      const len = Math.hypot(...n); n = n.map(x => x / len);
      const lit = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
      return { idx, c, n, shade: 0.72 + 0.28 * lit, mark: o.mark === fi };
    });
  });

  /* ---------- 카메라 각도 ---------- */
  const D2R = Math.PI / 180;
  const cam = { yaw: 30, pitch: 25, ty: 30, tp: 25, vy: 0, vp: 0 };
  const PMIN = 5, PMAX = 85;

  const stepSize = () => (S.mode === "45" ? 45 : 90);
  const stepPress = d => {
    if (S.mode === "smooth") return;
    const st = stepSize();
    if (d === "left" || d === "right") {
      const dir = d === "right" ? 1 : -1;
      if (Math.abs(cam.ty + dir * st - cam.yaw) > st * 2.01) return;
      cam.ty += dir * st;
    } else {
      const dir = d === "up" ? 1 : -1;
      cam.tp += dir * 15;
      if (S.limit) cam.tp = clamp(cam.tp, PMIN, PMAX);
    }
  };
  api.onParam(k => {
    if (k === "mode" && S.mode !== "smooth") {
      const st = stepSize();
      cam.ty = Math.round(cam.yaw / st) * st; cam.tp = Math.round(cam.pitch / 15) * 15;
      if (S.limit) cam.tp = clamp(cam.tp, PMIN, PMAX);
      cam.vy = cam.vp = 0;
    }
    if (k === "mode" && S.mode === "smooth") { cam.ty = cam.yaw; cam.tp = cam.pitch; }
    if (k === "limit" && S.limit) {
      // 범위 밖이면 가장 가까운 경계로 돌아온다
      const p = mod(cam.pitch + 180, 360) - 180;
      cam.pitch = p; cam.tp = clamp(p, PMIN, PMAX);
    }
  });

  /* ---------- 입력 ---------- */
  // 사이드바의 글자 입력칸, 슬라이더에 포커스가 있으면 반응하지 않는다 (체크박스는 예외: Space가 토글을 다시 뒤집지 않도록)
  const fromField = e => { const f = e.target && e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"); return !!f && !(f.type === "checkbox" || f.type === "radio"); };
  api.on(window, "keydown", e => {
    if (fromField(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    const d = CODES[e.code]; if (!d) return;
    e.preventDefault(); api.hideHint();
    keyDown.add(e.code);
    stepPress(d);
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
      padDown.add(d); api.hideHint(); stepPress(d);
    });
    const up = () => padDown.delete(d);
    api.on(k, "pointerup", up); api.on(k, "pointercancel", up); api.on(k, "lostpointercapture", up);
  });

  /* ---------- 투영 ---------- */
  const DIST = 950;
  let F = 1, CX = 0, CY = 0, cy = 1, sy = 0, cp = 1, sp = 0;
  const rot = p => {
    const x1 = p[0] * cy - p[2] * sy, z1 = p[0] * sy + p[2] * cy;
    const y2 = p[1] * cp + z1 * sp, z2 = -p[1] * sp + z1 * cp;
    return [x1, y2, z2];
  };
  const view = p => { const r = rot([p[0], p[1] - 80, p[2]]); r[2] += DIST; return r; };
  const proj = r => [CX + r[0] * F / r[2], CY - r[1] * F / r[2]];
  const shadeCol = (k, base) => `rgb(${Math.round(base[0] * k)},${Math.round(base[1] * k)},${Math.round(base[2] * k)})`;
  const WALL = [252, 250, 244], ACC = [255, 90, 54];

  api.frame(dt => {
    const s = dt / 1000;
    const { w, h } = size;
    const ix = (held("right") ? 1 : 0) - (held("left") ? 1 : 0);
    const iy = (held("up") ? 1 : 0) - (held("down") ? 1 : 0);

    if (S.mode === "smooth") {
      const tvy = ix * S.speed, tvp = iy * S.speed * 0.7;
      if (S.inertia) {
        const k = 1 - Math.exp(-(ix ? 5 : 2.2) * s), kp = 1 - Math.exp(-(iy ? 5 : 2.2) * s);
        cam.vy += (tvy - cam.vy) * k; cam.vp += (tvp - cam.vp) * kp;
        if (!ix && Math.abs(cam.vy) < 0.5) cam.vy = 0;
        if (!iy && Math.abs(cam.vp) < 0.5) cam.vp = 0;
      } else { cam.vy = tvy; cam.vp = tvp; }
      cam.yaw += cam.vy * s;
      cam.pitch += cam.vp * s;
      cam.ty = cam.yaw;
      if (S.limit) {
        // 경계 밖이면 부드럽게 안으로
        if (cam.pitch > PMAX) { cam.pitch += (PMAX - cam.pitch) * (1 - Math.exp(-14 * s)); if (cam.vp > 0) cam.vp = 0; }
        if (cam.pitch < PMIN) { cam.pitch += (PMIN - cam.pitch) * (1 - Math.exp(-14 * s)); if (cam.vp < 0) cam.vp = 0; }
      }
      cam.tp = cam.pitch;
    } else {
      const k = 1 - Math.exp(-10 * s);
      const py = cam.yaw, pp = cam.pitch;
      cam.yaw += (cam.ty - cam.yaw) * k; cam.pitch += (cam.tp - cam.pitch) * k;
      if (Math.abs(cam.ty - cam.yaw) < 0.01) cam.yaw = cam.ty;
      if (Math.abs(cam.tp - cam.pitch) < 0.01) cam.pitch = cam.tp;
      cam.vy = (cam.yaw - py) / Math.max(s, 1e-3); cam.vp = (cam.pitch - pp) / Math.max(s, 1e-3);
    }

    cy = Math.cos(cam.yaw * D2R); sy = Math.sin(cam.yaw * D2R);
    cp = Math.cos(cam.pitch * D2R); sp = Math.sin(cam.pitch * D2R);
    F = Math.min(w, h) * 0.62 * DIST / 420;
    CX = w / 2; CY = h * 0.5;

    g.clearRect(0, 0, w, h);
    g.fillStyle = C.board; g.fillRect(0, 0, w, h);

    // 바닥
    const G = 220;
    const drawGround = below => {
      const corners = [[-G, 0, -G], [G, 0, -G], [G, 0, G], [-G, 0, G]].map(p => proj(view(p)));
      g.beginPath(); corners.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
      g.fillStyle = below ? "rgba(239,233,221,.88)" : "rgba(0,0,0,.035)"; g.fill();
      g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 1; g.stroke();
      g.strokeStyle = "rgba(0,0,0,.1)"; g.beginPath();
      for (let t = -G + 55; t < G; t += 55) {
        let a = proj(view([t, 0, -G])), b = proj(view([t, 0, G])); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
        a = proj(view([-G, 0, t])); b = proj(view([G, 0, t])); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
      }
      g.stroke();
      // 앞쪽 표시
      const f = proj(view([0, 0, -G - 24]));
      g.fillStyle = C.accent; g.font = FONT; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText("앞", f[0], f[1]);
    };
    const below = Math.sin(cam.pitch * D2R) < 0;
    if (!below) drawGround(false);

    // 입체: 먼 것부터
    const list = objects.map(o => ({ o, z: view(o.c)[2] })).sort((a, b) => b.z - a.z);
    g.lineJoin = "round";
    list.forEach(({ o }) => {
      const vp = o.v.map(view);
      const sp2 = vp.map(proj);
      o.faces.forEach(f => {
        const n = rot(f.n), c = view(f.c);
        if (n[0] * c[0] + n[1] * c[1] + n[2] * c[2] >= 0) return;   // 뒷면은 그리지 않는다
        g.beginPath();
        f.idx.forEach((i, k) => (k ? g.lineTo(sp2[i][0], sp2[i][1]) : g.moveTo(sp2[i][0], sp2[i][1])));
        g.closePath();
        g.fillStyle = shadeCol(f.shade, f.mark ? ACC : WALL); g.fill();
        g.strokeStyle = C.ink; g.lineWidth = 1.2; g.stroke();
      });
    });
    if (below) drawGround(true);

    /* ---- 패드와 읽는 값 ---- */
    ["up", "down", "left", "right"].forEach(d => keyEls[d].classList.toggle("on", held(d)));
    const arrows = [["up", "↑"], ["down", "↓"], ["left", "←"], ["right", "→"]].filter(([d]) => held(d)).map(([, a]) => a).join(" ");
    api.read("keys", arrows || "–");
    api.read("yaw", `${Math.round(mod(cam.yaw, 360))}°`);
    api.read("pitch", `${Math.round(mod(cam.pitch + 180, 360) - 180)}°`);
    api.read("vel", `${Math.round(cam.vy)}, ${Math.round(cam.vp)}`);

    const moving = Math.abs(cam.vy) > 0.5 || Math.abs(cam.vp) > 0.5;
    const pinned = S.limit && S.mode === "smooth" && iy && ((iy > 0 && cam.pitch >= PMAX - 0.5) || (iy < 0 && cam.pitch <= PMIN + 0.5));
    if (pinned) api.status(`위아래 한계 · ${iy > 0 ? PMAX : PMIN}°에서 멈춤`, "alt");
    else if (ix || iy) api.status(S.mode === "smooth" ? "누르는 동안 계속 회전" : `${S.mode}° 단위로 회전`, "active");
    else if (moving) api.status(S.mode === "smooth" ? "관성으로 도는 중" : "다음 각도로 맞춰지는 중", "alt");
    else api.status("대기", "idle");
  });
}
