import { clamp, localPoint, fitCanvas } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .orbit-root { position: absolute; inset: 0; background: var(--board); }
    .orbit-root.drag { cursor: grab; }
    .orbit-root.drag.is-grabbing { cursor: grabbing; }
  `);
  const root = document.createElement("div");
  root.className = "orbit-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const INK = api.color("--ink") || "#1b1b1a";
  const ACC = api.color("--accent") || "#ff5a36";
  const FONT = "13px " + (getComputedStyle(el).fontFamily || "sans-serif");

  /* ---------- 장면 (단위: 월드, y가 위) — keyboard-orbit과 같은 그림체: 납작한 면, 가는 잉크 선, 강조면 하나 ---------- */
  const faces = []; // { pts: [[x,y,z]...], n: [x,y,z], mark }
  // markFront: 앞면(+z, 받침의 '앞' 쪽)을 강조면으로
  const box = (cx, cz, w, d, h, y0 = 0, markFront = false) => {
    const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, y1 = y0 + h;
    faces.push({ pts: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], n: [0, 1, 0] });
    faces.push({ pts: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], n: [0, 0, 1], mark: markFront });
    faces.push({ pts: [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], n: [0, 0, -1] });
    faces.push({ pts: [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], n: [1, 0, 0] });
    faces.push({ pts: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], n: [-1, 0, 0] });
  };
  const pyramid = (cx, cz, b, h) => {
    const r = b / 2, top = [cx, h, cz];
    const c = [[cx - r, 0, cz - r], [cx + r, 0, cz - r], [cx + r, 0, cz + r], [cx - r, 0, cz + r]];
    for (let i = 0; i < 4; i++) {
      const a = c[i], bb = c[(i + 1) % 4];
      const mx = (a[0] + bb[0]) / 2 - cx, mz = (a[2] + bb[2]) / 2 - cz;
      const len = Math.hypot(mx, mz) || 1, k = r / h; // 옆면 기울기만큼 위를 향한다
      const n = [mx / len, k, mz / len], nl = Math.hypot(...n);
      faces.push({ pts: [bb, a, top], n: n.map(v => v / nl) });
    }
  };
  box(-18, 12, 50, 50, 50);
  box(-18, 12, 26, 26, 22, 50);
  box(46, -34, 22, 22, 92, 0, true); // 가장 높은 기둥의 앞면 하나만 강조색: 방향을 읽는 기준
  box(42, 48, 52, 26, 14);
  box(-58, -46, 24, 24, 24);
  pyramid(-62, 52, 34, 40);
  pyramid(8, -62, 26, 30);

  const DISC_R = 112, DISC_T = 9;
  // 면의 명도를 정하는 빛 방향
  const L = (() => { const v = [-0.45, 1, 0.6], l = Math.hypot(...v); return v.map(x => x / l); })();
  const WALL = [252, 250, 244], ACC_RGB = [255, 90, 54];

  /* ---------- 카메라 ---------- */
  const BASE_PITCH = 26;
  const cam = { yaw: -24, pitch: BASE_PITCH, ty: -24, tp: BASE_PITCH, baseYaw: -24, dragPitch: BASE_PITCH, vy: 0, vp: 0 };
  let F = 1, cx = 0, cy = 0;
  const D = 520;
  let cosY = 1, sinY = 0, cosP = 1, sinP = 0;
  const setup = () => {
    const { w, h } = size;
    F = Math.min(w, h * 1.15) * 1.45;
    cx = w / 2; cy = h * 0.52;
    const y = cam.yaw * Math.PI / 180, p = cam.pitch * Math.PI / 180;
    cosY = Math.cos(y); sinY = Math.sin(y); cosP = Math.cos(p); sinP = Math.sin(p);
  };
  // 월드 → 카메라 공간 (x 오른쪽, y 위, z 앞으로의 깊이)
  const toCam = (x, y, z) => {
    const x1 = x * cosY + z * sinY, z1 = -x * sinY + z * cosY, y1 = y - 30;
    const yy = y1 * cosP - z1 * sinP;
    const zz = y1 * sinP + z1 * cosP;
    return [x1, yy, D - zz];
  };
  const proj = ([x, y, z]) => [cx + x * F / z, cy - y * F / z];
  const P = (x, y, z) => proj(toCam(x, y, z));
  // 카메라의 월드 위치 (toCam의 역변환)
  const camPos = () => [-D * cosP * sinY, D * sinP + 30, D * cosP * cosY];

  const shade = (f) => {
    const n = f.n, rgb = f.mark ? ACC_RGB : WALL;
    const d = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
    const b = 0.72 + 0.28 * d; // 면마다 평평한 명도 차이만 준다 (keyboard-orbit과 같은 값)
    return `rgb(${Math.round(rgb[0] * b)},${Math.round(rgb[1] * b)},${Math.round(rgb[2] * b)})`;
  };
  const path = pts => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };

  const draw = () => {
    const { w, h } = size;
    g.clearRect(0, 0, w, h);
    const C = camPos();
    const SEG = 72;
    const ring = (r, y) => { const a = []; for (let i = 0; i < SEG; i++) { const t = i / SEG * Math.PI * 2; a.push(P(Math.cos(t) * r, y, Math.sin(t) * r)); } return a; };

    // 받침: 납작한 회색 원판 + 격자 (keyboard-orbit의 격자 바닥과 같은 톤)
    const bottom = ring(DISC_R, -DISC_T), top = ring(DISC_R, 0);
    g.fillStyle = "rgba(0,0,0,.08)"; path(bottom); g.fill();
    // 옆면: 위아래 링 사이를 잇는 띠
    for (let i = 0; i < SEG; i++) {
      const j = (i + 1) % SEG;
      g.beginPath(); g.moveTo(...top[i]); g.lineTo(...top[j]); g.lineTo(...bottom[j]); g.lineTo(...bottom[i]); g.closePath(); g.fill();
    }
    g.fillStyle = "rgba(0,0,0,.035)"; path(top); g.fill();
    // 받침 위 격자
    g.save(); path(top); g.clip();
    g.strokeStyle = "rgba(0,0,0,.1)"; g.lineWidth = 1; g.beginPath();
    for (let t = -DISC_R + 28; t < DISC_R; t += 28) {
      let a = P(t, 0, -DISC_R), b = P(t, 0, DISC_R); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
      a = P(-DISC_R, 0, t); b = P(DISC_R, 0, t); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
    }
    g.stroke();
    g.restore();
    g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 1; path(top); g.stroke();
    // 앞쪽 표시
    const fm = P(0, 0, DISC_R + 16);
    g.fillStyle = ACC; g.font = FONT; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("앞", fm[0], fm[1]);

    // 면 정렬 (먼 것부터)
    const vis = [];
    for (const f of faces) {
      let mx = 0, my = 0, mz = 0;
      f.pts.forEach(p => { mx += p[0]; my += p[1]; mz += p[2]; });
      const k = f.pts.length; mx /= k; my /= k; mz /= k;
      const toC = [C[0] - mx, C[1] - my, C[2] - mz];
      if (toC[0] * f.n[0] + toC[1] * f.n[1] + toC[2] * f.n[2] <= 0) continue;
      vis.push({ f, depth: toCam(mx, my, mz)[2] });
    }
    vis.sort((a, b) => b.depth - a.depth);
    g.lineJoin = "round";
    for (const { f } of vis) {
      path(f.pts.map(p => P(...p)));
      g.fillStyle = shade(f); g.fill();
      g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke();
    }

    // 방위 표시 (오른쪽 아래)
    const gx = w - 46, gy = h - 46;
    g.save();
    g.strokeStyle = "rgba(0,0,0,.2)"; g.lineWidth = 1; g.beginPath(); g.arc(gx, gy, 28, 0, Math.PI * 2); g.stroke();
    const yr = cam.yaw * Math.PI / 180;
    // 위에서 본 받침: 앞쪽 표시가 어디를 향하는지
    const fx = Math.sin(yr), fy = Math.cos(yr);
    g.strokeStyle = "rgba(0,0,0,.25)"; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + fx * 20, gy + fy * 20); g.stroke();
    g.fillStyle = ACC; g.beginPath(); g.arc(gx + fx * 20, gy + fy * 20, 4, 0, Math.PI * 2); g.fill();
    g.fillStyle = INK; g.beginPath(); g.arc(gx, gy + 20, 3, 0, Math.PI * 2); g.fill();
    g.restore();
  };

  /* ---------- 입력 ---------- */
  const ptr = { inside: false, nx: 0, ny: 0, tnx: 0, tny: 0, down: false, lx: 0, ly: 0, dx: 0, dy: 0, sx: 0, sy: 0, samples: [], idle: 0 };
  const applyMode = () => root.classList.toggle("drag", !!S.pressOnly);
  applyMode();
  const norm360 = () => {
    const k = Math.round(cam.baseYaw / 360) * 360;
    cam.baseYaw -= k; cam.yaw -= k; cam.ty -= k;
  };
  api.onParam((k, v) => {
    if (k === "limit" && v) norm360();
    if (k === "pressOnly") {
      applyMode();
      norm360();
      if (v) { cam.baseYaw = cam.yaw; cam.dragPitch = cam.pitch; cam.vy = cam.vp = 0; }
      else { cam.baseYaw = cam.yaw - ptr.nx * S.range; }
    }
  });

  api.on(root, "pointermove", e => {
    const q = localPoint(el, e), { w, h } = size;
    ptr.inside = true;
    ptr.tnx = clamp((q.x - w / 2) / (w / 2), -1, 1);
    ptr.tny = clamp((q.y - h / 2) / (h / 2), -1, 1);
    if (!S.pressOnly) { api.hideHint(); ptr.idle = 0; }
    if (ptr.down && S.pressOnly) {
      const mx = e.clientX - ptr.lx, my = e.clientY - ptr.ly;
      ptr.lx = e.clientX; ptr.ly = e.clientY;
      ptr.dx = e.clientX - ptr.sx; ptr.dy = e.clientY - ptr.sy;
      cam.baseYaw += mx * 0.45;
      cam.dragPitch += my * 0.35;
      const now = performance.now();
      ptr.samples.push({ x: e.clientX, y: e.clientY, t: now });
      while (ptr.samples.length > 2 && now - ptr.samples[0].t > 90) ptr.samples.shift();
      ptr.idle = 0;
    }
  });
  api.on(root, "pointerleave", () => { ptr.inside = false; ptr.tnx = 0; ptr.tny = 0; });
  api.on(root, "pointerdown", e => {
    e.preventDefault();
    if (!S.pressOnly) { ptr.inside = true; return; }
    root.setPointerCapture(e.pointerId);
    ptr.down = true; ptr.lx = ptr.sx = e.clientX; ptr.ly = ptr.sy = e.clientY; ptr.dx = ptr.dy = 0;
    ptr.samples = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
    cam.vy = cam.vp = 0;
    root.classList.add("is-grabbing");
    api.hideHint();
  });
  const up = () => {
    if (!ptr.down) return;
    ptr.down = false; root.classList.remove("is-grabbing");
    const s = ptr.samples, a = s[0], b = s[s.length - 1];
    if (S.inertia && s.length > 1 && performance.now() - b.t < 60) {
      const dt = Math.max(1, b.t - a.t);
      cam.vy = (b.x - a.x) / dt * 16.67 * 0.45;
      cam.vp = (b.y - a.y) / dt * 16.67 * 0.35;
    }
  };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);

  /* ---------- 루프 ---------- */
  let autoDir = 1;
  api.frame(dt => {
    const range = S.range, free = !S.limit, LIM = 60;
    ptr.idle += dt;
    ptr.nx += (ptr.tnx - ptr.nx) * 0.25; ptr.ny += (ptr.tny - ptr.ny) * 0.25;
    const autoOn = S.autoRotate && (!S.pressOnly || (!ptr.down && ptr.idle > 1200 && Math.abs(cam.vy) < 0.05));
    let inertiaNow = false;

    if (!S.pressOnly) {
      if (S.autoRotate) cam.baseYaw += dt * 0.012;
      cam.ty = cam.baseYaw + ptr.nx * range;
      cam.tp = clamp(BASE_PITCH + ptr.ny * Math.min(range, 60) * 0.6, 2, 85);
    } else {
      if (!ptr.down && (Math.abs(cam.vy) > 0.02 || Math.abs(cam.vp) > 0.02)) {
        cam.baseYaw += cam.vy; cam.dragPitch += cam.vp;
        cam.vy *= 0.93; cam.vp *= 0.93;
        inertiaNow = true;
      } else if (!ptr.down) { cam.vy = cam.vp = 0; }
      if (autoOn) cam.baseYaw += dt * 0.012 * autoDir;
      if (!free) {
        if (cam.baseYaw > LIM) { cam.baseYaw = LIM; cam.vy = 0; autoDir = -1; }
        if (cam.baseYaw < -LIM) { cam.baseYaw = -LIM; cam.vy = 0; autoDir = 1; }
      }
      const pMin = free ? 2 : 10, pMax = free ? 85 : 60;
      const cp = clamp(cam.dragPitch, pMin, pMax);
      if (cp !== cam.dragPitch) cam.vp = 0;
      cam.dragPitch = cp;
      cam.ty = cam.baseYaw; cam.tp = cam.dragPitch;
    }
    const f = S.smooth;
    cam.yaw += (cam.ty - cam.yaw) * f;
    cam.pitch += (cam.tp - cam.pitch) * f;
    setup();
    draw();

    const yawShown = ((cam.yaw % 360) + 540) % 360 - 180;
    api.read("yaw", `${yawShown.toFixed(0)}°`);
    api.read("pitch", `${cam.pitch.toFixed(0)}°`);
    api.read("input", S.pressOnly ? `Δ ${Math.round(ptr.dx)}, ${Math.round(ptr.dy)}` : `${ptr.nx.toFixed(2)}, ${ptr.ny.toFixed(2)}`);
    api.read("vel", `${Math.abs(cam.ty - cam.yaw).toFixed(1)}°`);

    if (ptr.down) api.status("궤도 회전 중 · 끄는 만큼 돈다", "active");
    else if (inertiaNow) api.status("관성으로 도는 중", "alt");
    else if (!S.pressOnly && ptr.inside) api.status("커서 위치만큼 기울이는 중", "active");
    else if (autoOn) api.status("자동 회전 중", "alt");
    else api.status("대기", "idle");
  });
}
