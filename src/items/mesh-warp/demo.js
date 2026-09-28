import { clamp, localPoint, fitCanvas } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;
  api.css(`
    .mesh-warp-root { position: absolute; inset: 0; cursor: default; }
    .mesh-warp-root.over { cursor: grab; }
    .mesh-warp-root.grabbing { cursor: grabbing; }
  `);
  const root = document.createElement("div");
  root.className = "mesh-warp-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });

  const COLS = 14, ROWS = 10;           // 칸 수
  const NX = COLS + 1, NY = ROWS + 1;    // 꼭짓점 수
  const N = NX * NY;
  const rest = new Float32Array(N * 2);  // 원래 위치 (화면 좌표)
  const base = new Float32Array(N * 2);  // "그대로 남기"로 쌓인 변형
  const disp = new Float32Array(N * 2);  // 현재 변형
  const vel = new Float32Array(N * 2);
  const weight = new Float32Array(N);    // 잡은 점 기준 끌려오는 정도
  let F = { x: 0, y: 0, w: 0, h: 0, cw: 0, ch: 0 };
  let tex = null, TS = 1;

  const note = api.color("--note") || "#fffdf6";
  const accent = api.color("--accent") || "#ff5a36";

  /* ---------- 무늬(텍스처) ---------- */
  function buildTexture() {
    TS = Math.min(2, window.devicePixelRatio || 1);
    tex = document.createElement("canvas");
    tex.width = Math.ceil(F.w * TS); tex.height = Math.ceil(F.h * TS);
    const t = tex.getContext("2d");
    t.scale(TS, TS);
    t.fillStyle = note; t.fillRect(0, 0, F.w, F.h);
    t.fillStyle = "rgba(27,27,26,.07)";
    for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
      if ((i + j) % 2) t.fillRect(i * F.cw, j * F.ch, F.cw + 0.5, F.ch + 0.5);
    }
    // 가운데 원: 늘어나면 모양이 휜다
    const cx = F.w / 2, cy = F.h / 2, r = Math.min(F.w, F.h) * 0.3;
    t.lineWidth = 3; t.strokeStyle = accent;
    t.beginPath(); t.arc(cx, cy, r, 0, Math.PI * 2); t.stroke();
    t.strokeStyle = "rgba(27,27,26,.5)"; t.lineWidth = 1.5;
    t.beginPath(); t.moveTo(cx - r, cy); t.lineTo(cx + r, cy); t.moveTo(cx, cy - r); t.lineTo(cx, cy + r); t.stroke();
    t.strokeStyle = "rgba(27,27,26,.35)"; t.lineWidth = 1;
    t.strokeRect(0.5, 0.5, F.w - 1, F.h - 1);
  }

  function layout() {
    const w = size.w, h = size.h;
    const fw = Math.min(w - 64, 680), fh = Math.min(h - 150, fw * ROWS / COLS);
    const fw2 = Math.min(fw, fh * COLS / ROWS);
    F = { w: fw2, h: fh, x: (w - fw2) / 2, y: (h - fh) / 2 + 10, cw: fw2 / COLS, ch: fh / ROWS };
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const k = (j * NX + i) * 2;
      rest[k] = F.x + i * F.cw; rest[k + 1] = F.y + j * F.ch;
    }
    buildTexture();
  }
  layout();
  api.onResize(layout);

  const isEdge = k => { const i = k % NX, j = (k / NX) | 0; return i === 0 || j === 0 || i === NX - 1 || j === NY - 1; };
  const px = k => rest[k * 2] + disp[k * 2];
  const py = k => rest[k * 2 + 1] + disp[k * 2 + 1];

  /* ---------- 포인터 ---------- */
  const ptr = { down: false, id: -1, grab: -1, sx: 0, sy: 0, dx: 0, dy: 0, hx: -1, hy: -1, over: false };
  const nearest = (x, y) => {
    let best = -1, bd = Infinity;
    for (let k = 0; k < N; k++) {
      const d = (px(k) - x) ** 2 + (py(k) - y) ** 2;
      if (d < bd) { bd = d; best = k; }
    }
    return { k: best, d: Math.sqrt(bd) };
  };
  const insideFabric = (x, y) => {
    const n = nearest(x, y);
    return n.d < Math.max(F.cw, F.ch) * 1.1 ? n : null;
  };
  function computeWeights() {
    const gx = px(ptr.grab), gy = py(ptr.grab), R = S.radius;
    let count = 0;
    for (let k = 0; k < N; k++) {
      if (S.pinEdges && isEdge(k)) { weight[k] = 0; continue; }
      const d = Math.hypot(px(k) - gx, py(k) - gy);
      const t = clamp(1 - d / R, 0, 1);
      weight[k] = k === ptr.grab ? 1 : t * t * (3 - 2 * t); // smoothstep
      if (weight[k] > 0.01) count++;
    }
    return count;
  }
  let affected = 0;

  api.on(root, "pointerdown", e => {
    const p = localPoint(el, e);
    const n = insideFabric(p.x, p.y);
    if (!n) return;
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    ptr.down = true; ptr.id = e.pointerId; ptr.grab = n.k;
    ptr.sx = p.x; ptr.sy = p.y; ptr.dx = ptr.dy = 0;
    // 지금 모양을 새 기준으로 삼는다
    for (let k = 0; k < N * 2; k++) base[k] = disp[k];
    affected = computeWeights();
    root.classList.add("grabbing");
    api.hideHint();
  });
  api.on(root, "pointermove", e => {
    const p = localPoint(el, e);
    ptr.hx = p.x; ptr.hy = p.y;
    if (ptr.down && e.pointerId === ptr.id) {
      ptr.dx = p.x - ptr.sx; ptr.dy = p.y - ptr.sy;
    } else if (!ptr.down) {
      ptr.over = !!insideFabric(p.x, p.y);
      root.classList.toggle("over", ptr.over);
    }
  });
  api.on(root, "pointerleave", () => { if (!ptr.down) { ptr.over = false; ptr.hx = -1; } });
  const end = e => {
    if (!ptr.down || e.pointerId !== ptr.id) return;
    ptr.down = false;
    root.classList.remove("grabbing");
    if (S.release === "stay") {
      for (let k = 0; k < N; k++) { base[k * 2] += weight[k] * ptr.dx; base[k * 2 + 1] += weight[k] * ptr.dy; }
    } else base.fill(0);
    ptr.dx = ptr.dy = 0;
    weight.fill(0);
  };
  api.on(root, "pointerup", end);
  api.on(root, "pointercancel", end);

  api.onParam(k => {
    if (k === "release" && S.release === "spring" && !ptr.down) base.fill(0);
    if (k === "pinEdges" && S.pinEdges) {
      // 테두리 고정을 켜면 테두리의 쌓인 변형을 풀어준다
      for (let q = 0; q < N; q++) if (isEdge(q)) { base[q * 2] = 0; base[q * 2 + 1] = 0; }
    }
    if ((k === "radius" || k === "pinEdges") && ptr.down) affected = computeWeights();
  });

  /* ---------- 그리기 ---------- */
  function drawTri(x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2, sx, sy, sw, sh) {
    // 이음새가 보이지 않도록 클립 삼각형을 무게중심에서 살짝 키운다
    const cx = (x0 + x1 + x2) / 3, cy = (y0 + y1 + y2) / 3;
    const grow = (x, y) => { const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1; return [x + dx / l * 0.7, y + dy / l * 0.7]; };
    const a0 = grow(x0, y0), a1 = grow(x1, y1), a2 = grow(x2, y2);
    const du1 = u1 - u0, dv1 = v1 - v0, du2 = u2 - u0, dv2 = v2 - v0;
    const det = du1 * dv2 - du2 * dv1;
    if (!det) return;
    const dx1 = x1 - x0, dy1 = y1 - y0, dx2 = x2 - x0, dy2 = y2 - y0;
    const a = (dx1 * dv2 - dx2 * dv1) / det, c = (dx2 * du1 - dx1 * du2) / det;
    const b = (dy1 * dv2 - dy2 * dv1) / det, d = (dy2 * du1 - dy1 * du2) / det;
    const e = x0 - a * u0 - c * v0, f = y0 - b * u0 - d * v0;
    g.save();
    g.beginPath(); g.moveTo(a0[0], a0[1]); g.lineTo(a1[0], a1[1]); g.lineTo(a2[0], a2[1]); g.closePath();
    g.clip();
    g.transform(a, b, c, d, e, f);
    g.drawImage(tex, sx, sy, sw, sh, sx, sy, sw, sh);
    g.restore();
  }

  let gridA = 0;
  api.frame(() => {
    // 물리: 목표 = 쌓인 변형 + 끌기 * 가중치. 스프링으로 따라가고, 이웃과 살짝 평균을 맞춘다
    const k1 = S.stiffness, damp = 0.78;
    let maxPull = 0;
    for (let k = 0; k < N; k++) {
      const pinned = S.pinEdges && isEdge(k);
      for (let a = 0; a < 2; a++) {
        const q = k * 2 + a;
        if (pinned) { disp[q] += (0 - disp[q]) * 0.2; vel[q] = 0; continue; }
        const target = base[q] + weight[k] * (a ? ptr.dy : ptr.dx);
        // 이웃 평균 (천처럼 매끄럽게)
        const i = k % NX, j = (k / NX) | 0;
        let s = 0, n = 0;
        if (i > 0) { s += disp[q - 2]; n++; } if (i < NX - 1) { s += disp[q + 2]; n++; }
        if (j > 0) { s += disp[q - NX * 2]; n++; } if (j < NY - 1) { s += disp[q + NX * 2]; n++; }
        const lap = n ? s / n - disp[q] : 0;
        const grabbed = ptr.down && k === ptr.grab;
        vel[q] = (vel[q] + (target - disp[q]) * k1 + lap * (grabbed ? 0 : 0.08)) * damp;
        disp[q] += vel[q];
        if (grabbed) disp[q] += (target - disp[q]) * 0.5; // 잡은 점은 손에 딱 붙는다
      }
      const m = Math.hypot(disp[k * 2], disp[k * 2 + 1]);
      if (m > maxPull) maxPull = m;
    }

    const { w, h } = size;
    g.clearRect(0, 0, w, h);
    // 무늬 삼각형
    let maxStretch = 1;
    for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
      const k00 = j * NX + i, k10 = k00 + 1, k01 = k00 + NX, k11 = k01 + 1;
      const u0 = i * F.cw * TS, v0 = j * F.ch * TS, u1 = (i + 1) * F.cw * TS, v1 = (j + 1) * F.ch * TS;
      const sx = Math.max(0, u0 - 2), sy = Math.max(0, v0 - 2);
      const sw = Math.min(tex.width, u1 + 2) - sx, sh = Math.min(tex.height, v1 + 2) - sy;
      const X00 = px(k00), Y00 = py(k00), X10 = px(k10), Y10 = py(k10), X01 = px(k01), Y01 = py(k01), X11 = px(k11), Y11 = py(k11);
      drawTri(X00, Y00, X10, Y10, X11, Y11, u0, v0, u1, v0, u1, v1, sx, sy, sw, sh);
      drawTri(X00, Y00, X11, Y11, X01, Y01, u0, v0, u1, v1, u0, v1, sx, sy, sw, sh);
      const edge = Math.max(Math.hypot(X10 - X00, Y10 - Y00) / F.cw, Math.hypot(X01 - X00, Y01 - Y00) / F.ch);
      if (edge > maxStretch) maxStretch = edge;
    }

    // 격자선
    gridA += ((S.grid ? 1 : 0) - gridA) * 0.15;
    if (gridA > 0.01) {
      g.strokeStyle = `rgba(27,27,26,${0.45 * gridA})`; g.lineWidth = 1;
      g.beginPath();
      for (let j = 0; j < NY; j++) { for (let i = 0; i < NX; i++) { const k = j * NX + i; i ? g.lineTo(px(k), py(k)) : g.moveTo(px(k), py(k)); } }
      for (let i = 0; i < NX; i++) { for (let j = 0; j < NY; j++) { const k = j * NX + i; j ? g.lineTo(px(k), py(k)) : g.moveTo(px(k), py(k)); } }
      g.stroke();
      g.fillStyle = `rgba(27,27,26,${0.6 * gridA})`;
      for (let k = 0; k < N; k++) { g.beginPath(); g.arc(px(k), py(k), S.pinEdges && isEdge(k) ? 2.6 : 1.8, 0, Math.PI * 2); g.fill(); }
      if (ptr.down) {
        for (let k = 0; k < N; k++) if (weight[k] > 0.01) {
          g.fillStyle = `rgba(255,90,54,${(0.25 + 0.75 * weight[k]) * gridA})`;
          g.beginPath(); g.arc(px(k), py(k), 2 + 2.5 * weight[k], 0, Math.PI * 2); g.fill();
        }
      }
    }

    // 고정된 테두리 표시(작은 못)
    if (S.pinEdges) {
      g.fillStyle = "rgba(27,27,26,.55)";
      [[0, 0], [NX - 1, 0], [0, NY - 1], [NX - 1, NY - 1]].forEach(([i, j]) => { const k = j * NX + i; g.beginPath(); g.arc(px(k), py(k), 4, 0, Math.PI * 2); g.fill(); });
    }

    // 영향 반경 미리보기 / 잡은 점
    if (ptr.down) {
      const gx = px(ptr.grab), gy = py(ptr.grab);
      g.strokeStyle = accent; g.lineWidth = 1.5; g.setLineDash([4, 5]);
      g.beginPath(); g.arc(ptr.sx, ptr.sy, S.radius, 0, Math.PI * 2); g.globalAlpha = 0.35; g.stroke(); g.globalAlpha = 1;
      g.beginPath(); g.moveTo(ptr.sx, ptr.sy); g.lineTo(gx, gy); g.stroke();
      g.setLineDash([]);
      g.fillStyle = accent;
      g.beginPath(); g.arc(gx, gy, 7, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = 2; g.stroke();
    } else if (ptr.over && ptr.hx >= 0) {
      const n = nearest(ptr.hx, ptr.hy);
      g.strokeStyle = "rgba(27,27,26,.25)"; g.lineWidth = 1; g.setLineDash([4, 5]);
      g.beginPath(); g.arc(px(n.k), py(n.k), S.radius, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      g.fillStyle = "rgba(27,27,26,.7)";
      g.beginPath(); g.arc(px(n.k), py(n.k), 4.5, 0, Math.PI * 2); g.fill();
    }

    // 읽는 값
    if (ptr.down) {
      api.read("vertex", `${ptr.grab % NX}, ${(ptr.grab / NX) | 0}`);
      api.read("pull", Math.round(Math.hypot(ptr.dx, ptr.dy)));
      api.read("count", affected);
    } else {
      api.read("pull", 0);
    }
    api.read("stretch", Math.round((maxStretch - 1) * 100) + "%");

    const moving = maxPull > 0.5 && vel.some(v => Math.abs(v) > 0.05);
    if (ptr.down) api.status(`당기는 중 · 꼭짓점 ${affected}개가 함께 끌려온다`, "active");
    else if (moving && S.release === "spring") api.status("탄성으로 되돌아가는 중", "alt");
    else if (maxPull > 0.5 && S.release === "stay") api.status("늘어난 모양 그대로 남아 있다", "ok");
    else api.status("대기", "idle");
  });
}
