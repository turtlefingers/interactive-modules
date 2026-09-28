import { clamp, lerp, localPoint, fitCanvas } from "../../lib/util.js";
import { ILLO, roundRect, dot, line as inkLine } from "../../lib/draw.js";

const A0 = 1.5;         // 기준 비율
const BAR = 28;         // 제목 줄 높이
const HINT = { handle: "창 모서리를 끌기", window: "브라우저 창 크기를 바꿔 보기" };

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .vr-demo { position: absolute; inset: 0; background: var(--board); }
    .vr-frame { position: absolute; border: 1.5px solid var(--ink); background: var(--note); }
    .vr-bar { height: ${BAR}px; border-bottom: 1px solid var(--ink-3); display: flex; align-items: center; gap: 6px; padding: 0 10px;
      font-size: 13px; color: var(--ink-2); white-space: nowrap; overflow: hidden; font-variant-numeric: tabular-nums; }
    .vr-bar i { width: 8px; height: 8px; border-radius: 50%; border: 1px solid var(--ink-3); flex: none; }
    .vr-bar span { margin-left: 6px; }
    .vr-h { position: absolute; z-index: 3; touch-action: none; }
    .vr-h.r { top: 0; right: -8px; width: 16px; height: 100%; cursor: ew-resize; }
    .vr-h.b { left: 0; bottom: -8px; height: 16px; width: 100%; cursor: ns-resize; }
    .vr-h.rb { right: -9px; bottom: -9px; width: 18px; height: 18px; cursor: nwse-resize; }
    .vr-h.rb::after { content: ""; position: absolute; inset: 3px; background: var(--ink); }
    .vr-demo.win .vr-h { display: none; }
    .vr-demo canvas { pointer-events: none; z-index: 2; }
  `);

  const root = document.createElement("div");
  root.className = "vr-demo";
  el.appendChild(root);
  const frame = document.createElement("div");
  frame.className = "vr-frame";
  frame.innerHTML = `<div class="vr-bar"><i></i><i></i><i></i><span>창</span></div>
    <div class="vr-h r" data-h="r"></div><div class="vr-h b" data-h="b"></div><div class="vr-h rb" data-h="rb"></div>`;
  root.appendChild(frame);
  const label = frame.querySelector(".vr-bar span");
  const { g, size } = fitCanvas(api, { parent: root });
  const C = { note: api.color("--note"), ink: api.color("--ink"), ink3: api.color("--ink-3") };

  /* ---------- 창 크기 ---------- */
  let fw = 0, fh = 0;                // 손잡이 방식에서 원하는 창 크기
  const box = { w: 0, h: 0 };        // ResizeObserver가 알려준 실제 크기
  const vel = { w: 0, h: 0 };        // 크기 변화 속도 px/s
  let lastRO = { w: 0, h: 0, t: performance.now() };

  const margins = () => ({ top: 64, side: 24, bottom: 24 });
  const limits = () => {
    const m = margins();
    return { maxW: Math.max(160, size.w - m.side * 2), maxH: Math.max(140, size.h - m.top - m.bottom) };
  };
  function place() {
    const m = margins();
    if (S.source === "window") {
      root.classList.add("win");
      Object.assign(frame.style, { left: m.side + "px", right: m.side + "px", top: m.top + "px", bottom: m.bottom + "px", width: "", height: "" });
    } else {
      root.classList.remove("win");
      const L = limits();
      fw = clamp(fw, 160, L.maxW); fh = clamp(fh, 140, L.maxH);
      const cy = m.top + (size.h - m.top - m.bottom) / 2;
      Object.assign(frame.style, { right: "", bottom: "", width: fw + "px", height: fh + "px",
        left: (size.w - fw) / 2 + "px", top: cy - fh / 2 + "px" });
    }
  }
  {
    const L = limits();
    fw = Math.min(L.maxW, 620); fh = Math.min(L.maxH, 380);
  }
  place();
  api.onResize(place);

  const ro = new ResizeObserver(entries => {
    const r = entries[entries.length - 1].contentRect;
    const now = performance.now(), dt = Math.max(8, now - lastRO.t);
    if (lastRO.w) {
      vel.w = lerp(vel.w, (r.width - lastRO.w) / dt * 1000, .6);
      vel.h = lerp(vel.h, (r.height - lastRO.h) / dt * 1000, .6);
    }
    lastRO = { w: r.width, h: r.height, t: now };
    box.w = r.width; box.h = r.height;
  });
  ro.observe(frame);
  api.cleanup(() => ro.disconnect());

  /* ---------- 손잡이 ---------- */
  let drag = null;
  api.on(frame, "pointerdown", e => {
    const hnd = e.target.closest(".vr-h");
    if (!hnd || S.source !== "handle") return;
    e.preventDefault();
    frame.setPointerCapture(e.pointerId);
    drag = hnd.dataset.h;
    api.hideHint();
  });
  api.on(frame, "pointermove", e => {
    if (!drag) return;
    const p = localPoint(el, e), m = margins();
    const cx = size.w / 2, cy = m.top + (size.h - m.top - m.bottom) / 2;
    if (drag.includes("r")) fw = Math.abs(p.x - cx) * 2;
    if (drag.includes("b")) fh = Math.abs(p.y - cy) * 2;
    place();
  });
  const end = () => { drag = null; };
  api.on(frame, "pointerup", end);
  api.on(frame, "pointercancel", end);
  api.onParam(k => {
    if (k === "source") { place(); api.hint(HINT[S.source]); }
  });

  /* ---------- 캐릭터 ---------- */
  const sizes = [1, .78, 1.12];
  let Rs = null;
  const chars = sizes.map(k => ({ k, d: 1, v: 0, x: null, y: null }));

  function slots(cw, ch, r) {
    const a = cw / ch;
    const n = chars.length;
    if (!S.layout || a >= 1.25) return chars.map((c, i) => ({ x: cw * (i + 1) / (n + 1), stack: -1 }));
    if (a >= .8) return [{ x: cw * .5 - r * 1.1, stack: -1 }, { x: cw * .5, stack: "pyr" }, { x: cw * .5 + r * 1.1, stack: -1 }];
    return chars.map((c, i) => ({ x: cw * .5, stack: i }));
  }

  // 그림 키트 규칙: 3px 검정 외곽선, 평면 단색, 얼굴은 점 두 개와 선 하나. 몸은 눌린 둥근 덩어리
  const LW = 3;
  const COLORS = [ILLO.blue, ILLO.orange, ILLO.green];
  function drawChar(x, gy, r, sx, sy, squint, color) {
    const rx = r * sx, ry = r * sy, cy = gy - ry;
    const lw = Math.min(LW, r * 0.14);
    roundRect(g, x - rx, cy - ry, rx * 2, ry * 2, Math.min(rx, ry) * 0.7, { fill: color, lw });
    const ey = cy - ry * .15, ex = rx * .4, er = Math.max(2, r * .09);
    [-1, 1].forEach(s => {
      if (squint) inkLine(g, [[x + s * ex - er * 1.5, ey], [x + s * ex + er * 1.5, ey]], { lw });   // 힘든 눈: 선
      else dot(g, x + s * ex, ey, er);
    });
    const my = cy + ry * .3, mw = rx * .22;
    inkLine(g, [[x - mw, my], [x + mw, my]], { lw });
  }

  api.frame((dt) => {
    const { w, h } = size;
    g.clearRect(0, 0, w, h);
    if (!box.w) return;
    vel.w *= .86; vel.h *= .86;
    const fr = frame.getBoundingClientRect(), er = el.getBoundingClientRect();
    const left = fr.left - er.left + 1.5, top = fr.top - er.top + 1.5 + BAR;
    const cw = box.w, ch = box.h - BAR;
    if (ch <= 10) return;
    const a = cw / ch;
    const amt = S.amount;
    const kA = clamp(Math.log(a / A0) * .38 * amt, -.42, .42);
    const kV = clamp(vel.h / 1400 * amt, -.45, .45) - clamp(vel.w / 2600 * amt, -.2, .2);
    const target = clamp(1 - kA + kV, .4, 1.8);
    const floor = ch - 14;
    let R = clamp(Math.min(ch * .24, cw / 6.2), 14, 90);
    if (S.layout && a < 1.25) R = Math.max(10, Math.min(R, a < .8 ? (ch - 24) / (6 * Math.max(1, target)) : (ch - 24) / (4.2 * Math.max(1, target)), cw / 4.8));
    Rs = Rs === null || drag ? R : lerp(Rs, R, .15); R = Rs;
    const sl = slots(cw, ch, R);

    g.save();
    g.beginPath(); g.rect(left, top, cw, ch); g.clip();
    g.translate(left, top);
    inkLine(g, [[12, floor], [cw - 12, floor]], { lw: LW });

    let stackY = floor, squashSum = 0;
    chars.forEach((c, i) => {
      if (S.jiggle) { c.v += (target - c.d) * .14; c.v *= .8; c.d += c.v; }
      else { c.v = 0; c.d = lerp(c.d, target, .18); }
      c.d = clamp(c.d, .3, 2);
      const sy = c.d, sx = Math.pow(sy, -.7);
      const r = R * c.k;
      squashSum += sy;
      // 목표 자리
      const s = sl[i];
      let tx = s.x, ty = floor;
      if (s.stack === "pyr") {
        const r0 = R * chars[0].k * chars[0].d, r2 = R * chars[2].k * chars[2].d;
        ty = floor - Math.min(r0, r2) * 2 + r * .15;
      } else if (typeof s.stack === "number" && s.stack >= 0) {
        ty = stackY; stackY -= r * sy * 2;
      }
      if (c.x === null) { c.x = tx; c.y = ty; }
      c.x = lerp(c.x, tx, .14); c.y = lerp(c.y, ty, .14);
      drawChar(c.x, c.y, r, sx, sy, Math.abs(1 - sy) > .3, COLORS[i % COLORS.length]);
    });
    g.restore();

    const avg = squashSum / chars.length;
    label.textContent = `창 ${Math.round(box.w)} × ${Math.round(box.h)}`;
    const sp = Math.hypot(vel.w, vel.h);
    api.read("size", `${Math.round(box.w)} × ${Math.round(box.h)}`);
    api.read("ratio", a.toFixed(2));
    api.read("speed", Math.round(sp));
    api.read("squash", `${Math.round((1 - avg) * 100)}`);
    if (drag || sp > 30) api.status(vel.h < -30 ? "빠르게 줄이는 중 · 눌림" : vel.h > 30 ? "빠르게 늘리는 중 · 늘어남" : "크기 바꾸는 중", "active");
    else if (chars.some(c => Math.abs(c.v) > .004)) api.status("출렁이는 중", "alt");
    else api.status(avg < .9 ? "넓은 창 · 눌린 모양" : avg > 1.1 ? "좁은 창 · 늘어난 모양" : "기준 비율", "idle");
  });
}
