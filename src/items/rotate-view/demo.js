import { clamp, mod, localPoint, fitCanvas } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;
  const W = 1200, H = 800, RAD = Math.PI / 180, SNAP = 6;

  api.css(`
    .rotate-view-root { position: absolute; inset: 0; background: var(--board); cursor: grab; }
    .rotate-view-root.grabbing { cursor: grabbing; }
    .rotate-view-root.rot, .rotate-view-root.rot.grabbing { cursor: crosshair; }
    .rotate-view-compass { position: absolute; right: 16px; bottom: 16px; z-index: 40; display: flex; align-items: center; gap: 10px;
      font: inherit; font-size: 13px; color: var(--ink-2); background: var(--board); border: 0; padding: 4px 4px 4px 12px; border-radius: 30px;
      box-shadow: inset 0 0 0 1px rgba(27,27,26,.2); cursor: pointer; font-variant-numeric: tabular-nums; }
    .rotate-view-compass:hover { color: var(--ink); }
    .rotate-view-compass svg { width: 40px; height: 40px; display: block; }
  `);
  const root = document.createElement("div");
  root.className = "rotate-view-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const compass = document.createElement("button");
  compass.className = "rotate-view-compass";
  compass.title = "누르면 0°로 돌아간다";
  compass.innerHTML = `<span class="deg">0°</span><svg viewBox="-20 -20 40 40"><circle r="18" fill="none" stroke="rgba(27,27,26,.25)"/><g class="needle"><path d="M0 -13 L4 0 L-4 0Z" fill="var(--accent)"/><path d="M0 13 L4 0 L-4 0Z" fill="var(--ink-3)"/></g></svg>`;
  root.appendChild(compass);
  const needle = compass.querySelector(".needle"), degEl = compass.querySelector(".deg");

  const INK = api.color("--ink") || "#1b1b1a";
  const INK2 = api.color("--ink-2") || "#5d5b57";
  const ACC = api.color("--accent") || "#ff5a36";
  const NOTE = api.color("--note") || "#fffdf6";
  const FONT = getComputedStyle(el).fontFamily;

  /* ---------- 카메라 ----------
     화면 = a + s·R(θ)·(보드 좌표 − w)  : 기준점 a(화면)와 그 아래 보드 좌표 w를 붙잡고 돌린다 */
  const cam = { th: 0, raw: 0, tgt: 0, ax: 0, ay: 0, wx: W / 2, wy: H / 2, s: 1 };
  function layout() {
    const { w, h } = size;
    cam.s = Math.min((w - 60) / W, (h - 150) / H, 1);
  }
  layout();
  cam.ax = size.w / 2; cam.ay = size.h / 2 + 10;
  api.onResize(layout);

  const wrap180 = a => mod(a + 180, 360) - 180;
  function setPivot(px, py) {
    const dx = (px - cam.ax) / cam.s, dy = (py - cam.ay) / cam.s;
    const c = Math.cos(-cam.th * RAD), sn = Math.sin(-cam.th * RAD);
    cam.wx += dx * c - dy * sn; cam.wy += dx * sn + dy * c;
    cam.ax = px; cam.ay = py;
  }
  let snapped = false, lastInput = "–", gestureTotal = 0, gestureStartTh = 0, pivotShow = 0, lastWheelT = 0;
  function snapOf(raw) {
    if (!S.snap) return { a: raw, on: false };
    const k = Math.round(raw / 90) * 90;
    return Math.abs(raw - k) <= SNAP ? { a: k, on: true } : { a: raw, on: false };
  }
  function rotateBy(delta, px, py, label) {
    const { w, h } = size;
    if (S.pivot === "center" || px === undefined) setPivot(w / 2, h / 2); else setPivot(px, py);
    cam.raw += delta;
    const r = snapOf(cam.raw);
    if (r.on && !snapped) api.flash(`${mod(Math.round(r.a), 360)}°에 딱 맞춰졌다`, "ok", 900);
    snapped = r.on; cam.tgt = r.a;
    if (!S.smooth) cam.th = cam.tgt;
    gestureTotal += delta; lastInput = label; pivotShow = 1;
    api.hideHint();
  }
  function reset() {
    const n = Math.round(cam.raw / 360) * 360;
    cam.raw -= n; cam.tgt -= n; cam.th -= n;
    setPivot(size.w / 2, size.h / 2);
    gestureStartTh = cam.th; gestureTotal = -cam.raw;
    cam.raw = 0; cam.tgt = 0; snapped = true;
    if (!S.smooth) cam.th = 0;
    lastInput = "나침반"; pivotShow = 1;
  }
  api.on(compass, "click", () => { reset(); api.flash("0°로 되돌렸다", "ok"); });

  /* ---------- 휠 ---------- */
  api.on(root, "wheel", e => {
    e.preventDefault();
    const p = localPoint(el, e);
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    if (e.shiftKey) {
      const raw = e.deltaY || e.deltaX, d = raw * unit;
      const notch = Math.abs(d) >= 40 && Number.isInteger(raw);
      const now = performance.now();
      if (now - lastWheelT > 400) { gestureTotal = 0; gestureStartTh = cam.th; }
      lastWheelT = now;
      rotateBy(notch ? Math.sign(d) * 15 : clamp(d, -40, 40) * 0.3, p.x, p.y, "Shift + 휠");
    } else if (e.ctrlKey || e.metaKey) {
      lastInput = "핀치 (이 데모는 회전만)";
    } else {
      cam.ax -= e.deltaX * unit; cam.ay -= e.deltaY * unit;
      lastInput = "휠 (이동)";
    }
  }, { passive: false });

  // 사파리: 트랙패드 두 손가락 회전
  let gRot = 0;
  api.on(root, "gesturestart", e => { e.preventDefault(); gRot = 0; gestureTotal = 0; gestureStartTh = cam.th; });
  api.on(root, "gesturechange", e => {
    e.preventDefault();
    const p = localPoint(el, e);
    rotateBy(e.rotation - gRot, p.x, p.y, "트랙패드 회전");
    gRot = e.rotation;
  });
  api.on(root, "gestureend", e => e.preventDefault());

  /* ---------- 키 ---------- */
  let rHeld = false;
  api.on(window, "keydown", e => {
    if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
    if (e.code === "KeyR" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); rHeld = true; root.classList.add("rot"); }
    if (e.key === "0" || e.key === "Escape") { e.preventDefault(); reset(); }
  });
  api.on(window, "keyup", e => { if (e.code === "KeyR") { rHeld = false; root.classList.toggle("rot", S.drag === "rotate"); } });
  api.on(window, "blur", () => { rHeld = false; root.classList.toggle("rot", S.drag === "rotate"); });

  /* ---------- 포인터 ---------- */
  const pts = new Map();
  let mode = null, lastAng = 0, lastMid = null;
  const center = () => ({ x: size.w / 2, y: size.h / 2 });
  const angleAt = (o, p) => Math.atan2(p.y - o.y, p.x - o.x) / RAD;
  const pair = () => { const [a, b] = [...pts.values()]; return { ang: angleAt(a, b), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }; };

  api.on(root, "pointerdown", e => {
    if (e.target.closest(".rotate-view-compass")) return;
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    const p = localPoint(el, e);
    pts.set(e.pointerId, p);
    root.classList.add("grabbing");
    gestureTotal = 0; gestureStartTh = cam.th;
    if (pts.size === 2) {
      const q = pair();
      mode = "two"; lastAng = q.ang; lastMid = q.mid;
    } else if (pts.size === 1) {
      if (rHeld || S.drag === "rotate") { mode = "rotate"; lastAng = angleAt(center(), p); }
      else mode = "pan";
    }
  });
  api.on(root, "pointermove", e => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId), p = localPoint(el, e);
    pts.set(e.pointerId, p);
    if (mode === "pan") { cam.ax += p.x - prev.x; cam.ay += p.y - prev.y; lastInput = "끌기 (이동)"; api.hideHint(); }
    else if (mode === "rotate") {
      const c = center();
      if (Math.hypot(p.x - c.x, p.y - c.y) < 12) return;
      const a = angleAt(c, p);
      const d = wrap180(a - lastAng); lastAng = a;
      rotateBy(d, c.x, c.y, rHeld ? "R + 끌기" : "끌어서 회전");
      cam.ax = c.x; cam.ay = c.y;
    } else if (mode === "two" && pts.size === 2) {
      const q = pair();
      if (S.pivot !== "center") { cam.ax += q.mid.x - lastMid.x; cam.ay += q.mid.y - lastMid.y; }
      rotateBy(wrap180(q.ang - lastAng), q.mid.x, q.mid.y, "두 손가락 회전");
      lastAng = q.ang; lastMid = q.mid;
    }
  });
  const up = e => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pts.size === 1 && mode === "two") { mode = "pan"; }
    if (!pts.size) { mode = null; root.classList.remove("grabbing"); }
  };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);

  api.onParam(k => {
    if (k === "snap") { const r = snapOf(cam.raw); cam.tgt = r.a; snapped = r.on; }
    if (k === "smooth" && !S.smooth) cam.th = cam.tgt;
    if (k === "drag") root.classList.toggle("rot", S.drag === "rotate" || rHeld);
  });
  root.classList.toggle("rot", S.drag === "rotate");

  /* ---------- 보드 그리기 (보드 좌표) ---------- */
  function drawWorld() {
    const lw = 1 / cam.s;
    g.fillStyle = NOTE; g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(27,27,26,.06)"; g.lineWidth = lw; g.beginPath();
    for (let x = 100; x < W; x += 100) { g.moveTo(x, 0); g.lineTo(x, H); }
    for (let y = 100; y < H; y += 100) { g.moveTo(0, y); g.lineTo(W, y); }
    g.stroke();
    g.strokeStyle = "rgba(27,27,26,.35)"; g.lineWidth = 1.5 * lw; g.strokeRect(0, 0, W, H);

    // 위쪽 화살표
    g.strokeStyle = INK; g.lineWidth = 3; g.lineCap = "round"; g.lineJoin = "round";
    g.beginPath(); g.moveTo(W / 2, 170); g.lineTo(W / 2, 70); g.stroke();
    g.fillStyle = ACC; g.beginPath(); g.moveTo(W / 2, 46); g.lineTo(W / 2 + 16, 76); g.lineTo(W / 2 - 16, 76); g.closePath(); g.fill();
    g.fillStyle = INK; g.font = `700 22px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("위", W / 2 + 36, 110);

    // 집
    const hx = 170, hy = 330;
    g.strokeStyle = INK; g.lineWidth = 3;
    g.strokeRect(hx, hy + 110, 240, 200);
    g.beginPath(); g.moveTo(hx - 20, hy + 110); g.lineTo(hx + 120, hy); g.lineTo(hx + 260, hy + 110); g.stroke();
    g.strokeRect(hx + 95, hy + 210, 50, 100);
    g.strokeRect(hx + 30, hy + 150, 44, 44);
    g.beginPath(); g.moveTo(hx - 60, hy + 310); g.lineTo(hx + 300, hy + 310); g.stroke();

    // 글자
    g.textAlign = "left";
    g.fillStyle = INK; g.font = `700 48px ${FONT}`; g.fillText("가나다라", 620, 330);
    g.fillStyle = INK2; g.font = `500 22px ${FONT}`;
    g.fillText("화면을 돌려도 보드 위의", 620, 400);
    g.fillText("개체 각도는 그대로다", 620, 434);
    // 선 몇 개 (그림 연습 느낌)
    g.strokeStyle = "rgba(27,27,26,.3)"; g.lineWidth = 2;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(620, 520 + i * 36); g.lineTo(1040 - i * 40, 520 + i * 36); g.stroke(); }
    g.lineCap = "butt"; g.lineJoin = "miter";
  }

  api.frame(dt => {
    if (S.smooth) {
      const k = 1 - Math.pow(1 - 0.28, dt / 16.67);
      cam.th += (cam.tgt - cam.th) * k;
      if (Math.abs(cam.tgt - cam.th) < 0.01) cam.th = cam.tgt;
    } else cam.th = cam.tgt;

    const { w, h } = size, dpr = size.dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    g.save();
    g.translate(cam.ax, cam.ay); g.rotate(cam.th * RAD); g.scale(cam.s, cam.s); g.translate(-cam.wx, -cam.wy);
    drawWorld();
    g.restore();

    // 기준점 · 스냅 안내선 · 돈 각도
    const active = pts.size > 0 || pivotShow > 0;
    if (pts.size === 0) pivotShow = Math.max(0, pivotShow - dt / 900);
    if (active && lastInput !== "끌기 (이동)" && lastInput !== "휠 (이동)" && lastInput !== "–") {
      const alpha = pts.size ? 1 : Math.min(1, pivotShow * 2);
      g.globalAlpha = alpha;
      if (snapped) {
        g.strokeStyle = ACC; g.lineWidth = 1; g.setLineDash([6, 6]); g.globalAlpha = alpha * 0.6;
        g.beginPath(); g.moveTo(0, cam.ay); g.lineTo(w, cam.ay); g.moveTo(cam.ax, 0); g.lineTo(cam.ax, h); g.stroke();
        g.setLineDash([]); g.globalAlpha = alpha;
      }
      g.strokeStyle = ACC; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(cam.ax - 9, cam.ay); g.lineTo(cam.ax + 9, cam.ay); g.moveTo(cam.ax, cam.ay - 9); g.lineTo(cam.ax, cam.ay + 9); g.stroke();
      const a0 = (gestureStartTh - 90) * RAD, a1 = (cam.th - 90) * RAD;
      if (Math.abs(a1 - a0) > 0.01) {
        g.beginPath(); g.arc(cam.ax, cam.ay, 44, a0, a1, a1 < a0); g.stroke();
        g.fillStyle = ACC; g.beginPath(); g.arc(cam.ax + Math.cos(a1) * 44, cam.ay + Math.sin(a1) * 44, 3, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
    }

    const shown = Math.round(wrap180(cam.th));
    needle.setAttribute("transform", `rotate(${cam.th})`);
    const dtxt = (shown === -180 ? 180 : shown) + "°";
    if (degEl.textContent !== dtxt) degEl.textContent = dtxt;
    api.read("angle", dtxt);
    api.read("delta", Math.round(gestureTotal) + "°");
    api.read("pivot", `${Math.round(cam.ax)}, ${Math.round(cam.ay)}`);
    api.read("input", lastInput);

    if ((mode === "rotate" || mode === "two") && snapped) api.status(`${mod(Math.round(cam.tgt), 360)}°에 맞춰짐 · 더 돌리면 풀린다`, "ok");
    else if (mode === "rotate" || mode === "two") api.status(`회전 중 · ${dtxt}`, "active");
    else if (mode === "pan") api.status("끌어서 이동 중 · R을 누른 채 끌면 → 화면이 돈다", "alt");
    else if (Math.abs(cam.tgt - cam.th) > 0.05) api.status(`회전 중 · ${dtxt}`, "active");
    else if (rHeld) api.status("R 누름 · 끌면 화면 가운데를 중심으로 돈다", "alt");
    else api.status(`대기 · ${dtxt}`, "idle");
  });
}
