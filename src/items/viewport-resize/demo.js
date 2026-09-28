import { clamp, lerp, localPoint, fitCanvas } from "../../lib/util.js";
import { TONE, LINE, line as inkLine } from "../../lib/draw.js";
import { drawHumaaan, preload, PEOPLE } from "../../lib/figure.js";

const A0 = 1.5;         // 기준 비율
const BAR = 28;         // 제목 줄 높이
const HINT = { handle: "창 모서리를 끌기", window: "브라우저 창 크기를 바꿔 보기" };
// 사람 셋(Humaaans): 옷은 서로 다르되 색은 파랑·주황 둘, 나머지는 톤
const FIGS = [PEOPLE[0], PEOPLE[1], { ...PEOPLE[3], bottom: "SkinnyJeans" }];

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
  preload(FIGS);
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
  const KH = 2.2;                                            // 키 = R × k × KH
  const sqOf = d => clamp(1 - d, -.35, .45);                 // 세로 배율 → drawHumaaan squash (눌림 +, 늘어남 −)
  const heightOf = (R, c) => R * c.k * KH * (1 - sqOf(c.d)); // 실제로 그려지는 키

  function slots(cw, ch, r) {
    const a = cw / ch;
    const n = chars.length;
    if (!S.layout || a >= 1.25) return chars.map((c, i) => ({ x: cw * (i + 1) / (n + 1), stack: -1 }));
    if (a >= .8) return [{ x: cw * .5 - r * 1.2, stack: -1 }, { x: cw * .5, stack: "pyr" }, { x: cw * .5 + r * 1.2, stack: -1 }];
    return chars.map((c, i) => ({ x: cw * .5, stack: i }));
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
    const tallest = Math.max(1, Math.min(target, 1.35));   // 늘어남은 최대 1.35배까지만 그려진다
    let R = clamp(Math.min(ch * .22, cw / 6.2), 14, 90);
    if (S.layout && a < 1.25) R = Math.max(10, Math.min(R, a < .8 ? (ch - 24) / (6.4 * tallest) : (ch - 24) / (4.2 * tallest), cw / 4.8));
    Rs = Rs === null || drag ? R : lerp(Rs, R, .15); R = Rs;
    const sl = slots(cw, ch, R);

    g.save();
    g.beginPath(); g.rect(left, top, cw, ch); g.clip();
    g.translate(left, top);
    // 바닥: 톤 면 + 가는 잉크 선
    g.fillStyle = TONE[0]; g.fillRect(0, floor, cw, ch - floor);
    inkLine(g, [[12, floor], [cw - 12, floor]], { lw: LINE });

    let stackY = floor, squashSum = 0;
    chars.forEach((c, i) => {
      if (S.jiggle) { c.v += (target - c.d) * .14; c.v *= .8; c.d += c.v; }
      else { c.v = 0; c.d = lerp(c.d, target, .18); }
      c.d = clamp(c.d, .3, 2);
      const sy = c.d;
      squashSum += sy;
      const squash = sqOf(sy);
      const H = R * c.k * KH, hh = H * (1 - squash);
      // 목표 자리
      const s = sl[i];
      let tx = s.x, ty = floor;
      if (s.stack === "pyr") {
        ty = floor - Math.min(heightOf(R, chars[0]), heightOf(R, chars[2])) * .86;   // 양옆 사람 어깨 위
      } else if (typeof s.stack === "number" && s.stack >= 0) {
        ty = stackY; stackY -= hh * .96;
      }
      if (c.x === null) { c.x = tx; c.y = ty; }
      c.x = lerp(c.x, tx, .14); c.y = lerp(c.y, ty, .14);
      drawHumaaan(g, FIGS[i], c.x, c.y, H, { squash });
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
