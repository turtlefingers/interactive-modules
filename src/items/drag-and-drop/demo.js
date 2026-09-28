import { clamp, dist, localPoint } from "../../lib/util.js";
import { ILLO, TONE } from "../../lib/draw.js";
import { peepSVG, peepBox, outfit } from "../../lib/figure.js";
import { objectCanvas } from "../../lib/objects.js";
import "../../lib/objects/index.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .drag-and-drop-root { position: absolute; inset: 0; overflow: hidden; background: var(--board); }
    .drag-and-drop-root.is-dragging, .drag-and-drop-root.is-dragging * { cursor: grabbing !important; }
    .drag-and-drop-gridlines { position: absolute; inset: 0; opacity: 0; transition: opacity .3s; pointer-events: none;
      background-image: linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px); }
    .drag-and-drop-root.show-grid .drag-and-drop-gridlines { opacity: 1; }
    .drag-and-drop-tray { position: absolute; border: 1px dashed rgba(0,0,0,.2); border-radius: 18px; pointer-events: none; }
    .drag-and-drop-tray span { position: absolute; left: 14px; top: 10px; font-size: 13px; color: var(--ink-3); }
    .drag-and-drop-char { position: absolute; left: 0; top: 0; pointer-events: none; z-index: 1; }
    .drag-and-drop-char svg, .drag-and-drop-part svg, .drag-and-drop-part canvas { display: block; width: 100% !important; height: 100% !important; overflow: visible; }
    .drag-and-drop-slot { position: absolute; left: 0; top: 0; border-radius: 50%; border: 2px dashed var(--ink-3);
      opacity: 0; transform: scale(.7); transition: opacity .2s, transform .25s cubic-bezier(.3,1.6,.5,1), background-color .2s, border-color .2s;
      pointer-events: none; z-index: 2; }
    .drag-and-drop-slot.is-shown { opacity: .55; transform: scale(1); }
    .drag-and-drop-slot.is-hot { opacity: 1; border-color: var(--accent); background: var(--accent-soft); transform: scale(1.12); }
    .drag-and-drop-slot.is-pulse { animation: drag-and-drop-pulse .5s ease-out; }
    @keyframes drag-and-drop-pulse { 0% { opacity: 1; transform: scale(1); border-color: var(--accent); } 100% { opacity: 0; transform: scale(1.6); border-color: var(--accent); } }
    .drag-and-drop-ghost { position: absolute; left: 0; top: 0; border: 2px dashed var(--accent); border-radius: 12px; opacity: 0;
      pointer-events: none; transition: opacity .15s; z-index: 3; }
    .drag-and-drop-ghost.is-shown { opacity: .8; }
    .drag-and-drop-part { position: absolute; left: 0; top: 0; cursor: grab; touch-action: none;
      transition: transform .38s cubic-bezier(.3,1.35,.5,1), opacity .3s; }
    .drag-and-drop-part.is-held { transition: none; }
    .drag-and-drop-part.is-held.is-step { transition: transform .08s ease-out; }
    .drag-and-drop-part-in { width: 100%; height: 100%; transition: transform .22s cubic-bezier(.3,1.6,.5,1), filter .22s;
      filter: drop-shadow(0 0 0 rgba(0,0,0,0)); }
    .drag-and-drop-root:not(.is-dragging) .drag-and-drop-part:hover .drag-and-drop-part-in { transform: translateY(-3px); }
    .drag-and-drop-root.lift .drag-and-drop-part.is-held .drag-and-drop-part-in { transform: scale(1.1) rotate(-3deg);
      filter: drop-shadow(0 12px 10px rgba(0,0,0,.2)); }
    .drag-and-drop-root:not(.lift) .drag-and-drop-part .drag-and-drop-part-in { transform: none; }
    .drag-and-drop-part { opacity: 1; }
    .drag-and-drop-root.blend .drag-and-drop-part { mix-blend-mode: multiply; opacity: .78; }
  `);

  const root = document.createElement("div");
  root.className = "drag-and-drop-root";
  el.appendChild(root);
  const gridEl = document.createElement("div"); gridEl.className = "drag-and-drop-gridlines"; root.appendChild(gridEl);
  const tray = document.createElement("div"); tray.className = "drag-and-drop-tray"; tray.innerHTML = "<span>파츠</span>"; root.appendChild(tray);

  /* ---------- 캐릭터: Open Peeps 사람 (서 있음). 경계 상자를 재서 높이 340(배율 1 기준) 상자에 세로 맞춤으로 넣는다 ---------- */
  const INK = ILLO.ink;
  const FIG = { body: "ShirtBW", face: "Calm", hair: "Short", colors: outfit(ILLO.blue) };
  const BOX = peepBox(FIG);                 // peepInner 좌표계 {x, y, w, h}
  const CH = 340, U = CH / BOX.h, CW = BOX.w * U;   // U: 그림 단위 → 배율 1 px
  const charEl = document.createElement("div");
  charEl.className = "drag-and-drop-char";
  charEl.innerHTML = peepSVG(FIG);
  root.appendChild(charEl);

  /* ---------- 파츠: 사물 카탈로그(hat, glasses, scarf, bag)를 objectCanvas 로 그린다. 스티커만 실루엣 SVG ----------
     자리(slot)는 peepInner 좌표(머리 그룹 translate(225 0), 짧은 머리의 머리통 x 270~665 · y 110~585, 얼굴 translate(384 186))로 적고
     캐릭터 상자(CW×CH) 기준 px로 바꿔 둔다: 머리 위, 눈, 목, 손. 스티커는 아무 데나
     w·h 는 배율 1일 때 파츠 상자 크기이며 캔버스 비례와 같아야 한다 (pad 가 음수면 사물 위 여백을 잘라 상자를 꼭 맞춘다) */
  const at = (ix, iy) => [(ix - BOX.x) * U, (iy - BOX.y) * U];
  const starPath = (cx, cy, r) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; return `${i ? "L" : "M"}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`; }).join(" ") + " Z";
  const PARTS = [
    { id: "hat", name: "모자", w: 66, h: 44, slot: at(467, 110), obj: () => objectCanvas("hat", 40, { color: TONE[5] }, { w: 66, pad: 2 }) },
    { id: "glasses", name: "안경", w: 70, h: 24, slot: at(484, 305), obj: () => objectCanvas("glasses", 40, { color: INK }, { w: 70, pad: -8 }) },
    { id: "scarf", name: "목도리", w: 60, h: 44, slot: at(460, 620), obj: () => objectCanvas("scarf", 60, { color: ILLO.red }, { w: 60, pad: -8 }) },
    { id: "bag", name: "가방", w: 40, h: 68, slot: at(-140, 1780), obj: () => objectCanvas("bag", 60, { color: TONE[4] }, { w: 40, pad: 4 }) },
    { id: "sticker", name: "스티커", w: 50, h: 50, slot: null,
      svg: `<svg viewBox="0 0 64 64"><path d="${starPath(32, 32, 28)}" fill="${ILLO.blue}"/></svg>` }
  ];
  const slotCount = PARTS.filter(p => p.slot).length;

  let zTop = 20;
  const parts = PARTS.map((d, i) => {
    const node = document.createElement("div");
    node.className = "drag-and-drop-part";
    node.innerHTML = `<div class="drag-and-drop-part-in">${d.svg || ""}</div>`;
    if (d.obj) node.firstElementChild.appendChild(d.obj());
    node.style.zIndex = 10 + i;
    root.appendChild(node);
    let slotEl = null;
    if (d.slot) { slotEl = document.createElement("div"); slotEl.className = "drag-and-drop-slot"; root.appendChild(slotEl); }
    return { d, i, node, slotEl, x: 0, y: 0, attached: false, moved: false, z: 10 + i };
  });
  const ghost = document.createElement("div"); ghost.className = "drag-and-drop-ghost"; root.appendChild(ghost);

  /* ---------- 배치 ---------- */
  const L = { s: 1, cx: 0, cy: 0, cells: [] };
  const slotPos = d => ({ x: L.cx + (d.slot[0] - CW / 2) * L.s, y: L.cy + (d.slot[1] - CH / 2) * L.s });
  const put = (p, x, y) => { p.x = x; p.y = y; p.node.style.transform = `translate(${x - p.d.w * L.s / 2}px, ${y - p.d.h * L.s / 2}px)`; };
  const layout = () => {
    const w = el.clientWidth, h = el.clientHeight;
    let tr;
    if (w >= 640) {
      L.s = clamp(Math.min(h * 0.68 / CH, w * 0.4 / CW), 0.5, 1.5);
      L.cx = w * 0.33; L.cy = h * 0.54;
      tr = { x: w * 0.6, y: h * 0.16, w: w * 0.35, h: h * 0.72 };
      L.cells = [0, 1, 2, 3, 4, 5].map(k => ({ x: tr.x + tr.w * (k % 2 ? 0.72 : 0.28), y: tr.y + tr.h * (0.2 + Math.floor(k / 2) * 0.3) }));
    } else {
      L.s = clamp(Math.min(h * 0.46 / CH, w * 0.62 / CW), 0.4, 1.2);
      L.cx = w * 0.5; L.cy = h * 0.37;
      tr = { x: w * 0.04, y: h * 0.68, w: w * 0.92, h: h * 0.29 };
      L.cells = [0, 1, 2, 3, 4, 5].map(k => ({ x: tr.x + tr.w * (0.18 + (k % 3) * 0.32), y: tr.y + tr.h * (Math.floor(k / 3) ? 0.72 : 0.34) }));
    }
    Object.assign(tray.style, { left: tr.x + "px", top: tr.y + "px", width: tr.w + "px", height: tr.h + "px" });
    Object.assign(charEl.style, { width: CW * L.s + "px", height: CH * L.s + "px", transform: `translate(${L.cx - CW / 2 * L.s}px, ${L.cy - CH / 2 * L.s}px)` });
    parts.forEach(p => {
      const pw = p.d.w * L.s, ph = p.d.h * L.s;
      p.node.style.width = pw + "px"; p.node.style.height = ph + "px";
      if (p.slotEl) {
        const sp = slotPos(p.d), r = Math.max(p.d.w, p.d.h) * L.s * 0.62;
        Object.assign(p.slotEl.style, { width: r * 2 + "px", height: r * 2 + "px", left: sp.x - r + "px", top: sp.y - r + "px" });
      }
      if (p.attached) { const sp = slotPos(p.d); put(p, sp.x, sp.y); }
      else if (!p.moved) put(p, L.cells[p.i].x, L.cells[p.i].y);
      else put(p, clamp(p.x, 10, w - 10), clamp(p.y, 10, h - 10));
    });
  };
  layout();
  api.onResize(layout);

  const applyModes = () => {
    root.classList.toggle("show-grid", !!S.snapGrid);
    root.classList.toggle("lift", !!S.lift);
    root.classList.toggle("blend", !!S.blend);
    const gs = S.gridSize;
    gridEl.style.backgroundSize = `${gs}px ${gs}px`;
    gridEl.style.backgroundPosition = `${-gs / 2}px ${-gs / 2}px, 0 0, 0 0`;
  };
  applyModes();

  /* ---------- 드래그 ---------- */
  const drag = { p: null, ox: 0, oy: 0, sx: 0, sy: 0, cand: null, moved: 0 };
  const candidate = (x, y) => {
    const p = drag.p, w = el.clientWidth, h = el.clientHeight;
    if (S.snapSlots && p.d.slot) {
      const sp = slotPos(p.d);
      if (dist(x, y, sp.x, sp.y) < 75 * L.s + 10) return { kind: "slot", x: sp.x, y: sp.y };
    }
    if (S.snapGrid) {
      const gs = S.gridSize;
      const gx = Math.round(x / gs), gy = Math.round(y / gs);
      return { kind: "grid", x: clamp(gx * gs, 0, w), y: clamp(gy * gs, 0, h), gx, gy };
    }
    return { kind: "free", x, y };
  };
  const showSlots = on => parts.forEach(p => { if (p.slotEl) p.slotEl.classList.toggle("is-shown", on && S.snapSlots && !p.attached); });

  api.on(root, "pointerdown", e => {
    const node = e.target.closest(".drag-and-drop-part");
    if (!node) return;
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    const p = parts.find(o => o.node === node);
    const pt = localPoint(root, e);
    drag.p = p; drag.ox = p.x - pt.x; drag.oy = p.y - pt.y; drag.sx = p.x; drag.sy = p.y; drag.moved = 0;
    drag.cand = { kind: "free", x: p.x, y: p.y };
    if (p.attached) { p.attached = false; api.flash(`${p.d.name} 떼어냄`, "alt", 900); }
    if (S.front) { zTop++; p.node.style.zIndex = zTop; }
    p.node.classList.add("is-held"); p.node.classList.remove("is-attached");
    root.classList.add("is-dragging");
    showSlots(true);
    api.hideHint();
  });
  api.on(root, "pointermove", e => {
    const p = drag.p;
    if (!p) return;
    const pt = localPoint(root, e);
    const w = el.clientWidth, h = el.clientHeight;
    const x = clamp(pt.x + drag.ox, 0, w), y = clamp(pt.y + drag.oy, 0, h);
    p.moved = true;
    drag.moved = dist(x, y, drag.sx, drag.sy);
    const c = drag.cand = candidate(x, y);
    parts.forEach(o => o.slotEl && o.slotEl.classList.toggle("is-hot", o === p && c.kind === "slot"));
    p.node.classList.toggle("is-step", c.kind === "grid");
    if (c.kind === "grid") {
      put(p, c.x, c.y);
      Object.assign(ghost.style, { width: p.d.w * L.s + 12 + "px", height: p.d.h * L.s + 12 + "px", transform: `translate(${c.x - p.d.w * L.s / 2 - 6}px, ${c.y - p.d.h * L.s / 2 - 6}px)` });
      ghost.classList.add("is-shown");
    } else {
      ghost.classList.remove("is-shown");
      if (c.kind === "slot") put(p, x + (c.x - x) * 0.35, y + (c.y - y) * 0.35);   // 자리 근처에서는 살짝 끌려간다
      else put(p, x, y);
    }
    api.read("pos", `${Math.round(p.x)}, ${Math.round(p.y)}`);
    api.read("moved", Math.round(drag.moved));
    api.read("drop", c.kind === "slot" ? `${p.d.name} 자리` : c.kind === "grid" ? `격자 ${c.gx}, ${c.gy}` : "빈 곳");
  });
  const end = () => {
    const p = drag.p;
    if (!p) return;
    const c = drag.cand;
    drag.p = null;
    p.node.classList.remove("is-held", "is-step");
    root.classList.remove("is-dragging");
    ghost.classList.remove("is-shown");
    parts.forEach(o => o.slotEl && o.slotEl.classList.remove("is-hot"));
    showSlots(false);
    put(p, c.x, c.y);
    if (c.kind === "slot") {
      p.attached = true;
      p.node.classList.add("is-attached");
      p.slotEl.classList.remove("is-pulse"); void p.slotEl.offsetWidth; p.slotEl.classList.add("is-pulse");
      const n = parts.filter(o => o.attached).length;
      api.flash(n === slotCount ? "모든 파츠를 붙였다" : `${p.d.name} 부착 · ${n} / ${slotCount}`, "ok");
    }
    api.read("drop", c.kind === "slot" ? `${p.d.name} 자리` : c.kind === "grid" ? `격자 ${c.gx}, ${c.gy}` : "빈 곳");
  };
  api.on(root, "pointerup", end);
  api.on(root, "pointercancel", end);

  api.onParam(k => {
    applyModes();
    if (k === "front" && !S.front) parts.forEach(p => { p.node.style.zIndex = p.z; });
    if (k === "snapSlots" && !S.snapSlots) parts.forEach(p => { if (p.slotEl) p.slotEl.classList.remove("is-shown", "is-hot"); });
  });

  api.frame(() => {
    const n = parts.filter(o => o.attached).length;
    api.read("attached", `${n} / ${slotCount}`);
    if (drag.p) api.status(`옮기는 중 · ${drag.p.d.name}${drag.cand.kind === "slot" ? " · 놓으면 붙는다" : drag.cand.kind === "grid" ? " · 격자에 맞춰 이동" : ""}`, "active");
    else api.status("대기", "idle");
  });
}
