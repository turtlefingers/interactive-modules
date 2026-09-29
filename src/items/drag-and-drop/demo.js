import { clamp, dist, localPoint } from "../../lib/util.js";
import { ILLO } from "../../lib/draw.js";
import { peepSVG, peepBox, peepPartSVG, peepPartBox, outfit } from "../../lib/figure.js";

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
    .drag-and-drop-char svg { display: block; width: 100% !important; height: 100% !important; overflow: visible; }
    .drag-and-drop-part svg { position: absolute; display: block; overflow: visible; }
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
    .drag-and-drop-part { position: absolute; left: 0; top: 0; cursor: grab; touch-action: none; }
    .drag-and-drop-root.is-live .drag-and-drop-part { transition: transform .38s cubic-bezier(.3,1.35,.5,1), opacity .3s; }
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
    /* 붙은 파츠: 사람 그림이 그 파츠를 쓴 모습으로 다시 그려지므로 썸네일은 투명해진다(집을 수 있게 자리는 지킨다) */
    .drag-and-drop-root .drag-and-drop-part.is-attached { opacity: 0; }
  `);

  const root = document.createElement("div");
  root.className = "drag-and-drop-root";
  el.appendChild(root);
  const gridEl = document.createElement("div"); gridEl.className = "drag-and-drop-gridlines"; root.appendChild(gridEl);
  const tray = document.createElement("div"); tray.className = "drag-and-drop-tray"; tray.innerHTML = "<span>파츠</span>"; root.appendChild(tray);

  /* ---------- 캐릭터: Open Peeps 사람 (서 있음). 파츠를 붙이면 그 부품(모자·안경·수염)을 쓴 모습으로 다시 그린다 ----------
     경계 상자는 기본 모습과 다 붙인 모습의 합집합으로 고정해, 부품이 바뀌어도 그림이 움직이지 않게 한다.
     높이 340(배율 1 기준) 상자에 세로 맞춤으로 넣는다 */
  const COLORS = outfit(ILLO.paper);
  const BASE = { body: "RestingBW", face: "Calm", hair: "Short", accessory: "None", facialHair: "None", colors: COLORS };
  const WEAR = { hat: ["hair", "Beanie"], glasses: ["accessory", "GlassRound"], beard: ["facialHair", "Full"] };
  const FULL = { ...BASE, hair: "Beanie", accessory: "GlassRound", facialHair: "Full" };
  const union = (a, b) => { const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }; };
  const BOX = union(peepBox(BASE), peepBox(FULL));   // peepInner 좌표계 {x, y, w, h}
  const CH = 340, U = CH / BOX.h, CW = BOX.w * U;    // U: 그림 단위 → 배율 1 px
  const charEl = document.createElement("div");
  charEl.className = "drag-and-drop-char";
  root.appendChild(charEl);
  const worn = {};                                    // kind → 부품 이름 (붙은 것만)
  const renderFigure = () => { charEl.innerHTML = peepSVG({ ...BASE, ...worn }, BOX); };
  renderFigure();

  /* ---------- 파츠: 사람 그림의 부품 그 자체를 잘라 낸 썸네일 (같은 선·같은 색). 스티커만 자리 없는 실루엣 ----------
     자리(slot)는 그 부품의 경계 상자 가운데(peepInner 좌표: 머리 그룹 translate(225 0) 안의 hair / accessory(47 241) / facialHair(123 338))이고,
     썸네일 viewBox 도 같은 상자이므로 자리에 맞춰 놓으면 사람 그림의 부품과 정확히 겹친다(그 뒤 그림을 다시 그리고 썸네일은 투명해진다).
     썸네일 크기는 사람 그림과 같은 배율(U)이며, 집기 쉽도록 상자 둘레에 PAD px 를 더한다.
     모자(Beanie)는 머리 부품에 머리통이 같이 들어 있어, 띠 아랫선(왼쪽 x 250·y≈215 → 오른쪽 x 600·y≈132)을 따라 비스듬히 오려 낸다 */
  const PAD = 10;
  const hatBox = peepPartBox("hair", "Beanie");
  const HAT = { x: hatBox.x, y: hatBox.y, w: hatBox.w, h: 180 };
  const hatClip = `M${HAT.x - 40} ${HAT.y - 40}H${HAT.x + HAT.w + 40}V119L${HAT.x - 40} 239Z`;
  const partDef = (id, name, kind, part, extra = {}) => {
    const box = extra.box || peepPartBox(kind, part);
    return { id, name, kind, part, box, w: box.w * U + PAD * 2, h: box.h * U + PAD * 2, slot: [(box.x + box.w / 2 - BOX.x) * U, (box.y + box.h / 2 - BOX.y) * U],
      svg: peepPartSVG(kind, part, { colors: COLORS, pad: 0, box, clip: extra.clip }) };
  };
  const starPath = (cx, cy, r) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; return `${i ? "L" : "M"}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`; }).join(" ") + " Z";
  const PARTS = [
    partDef("hat", "모자", ...WEAR.hat, { box: HAT, clip: hatClip }),
    partDef("glasses", "안경", ...WEAR.glasses),
    partDef("beard", "수염", ...WEAR.beard),
    { id: "sticker", name: "스티커", w: 40 + PAD * 2, h: 40 + PAD * 2, slot: null,
      svg: `<svg viewBox="0 0 64 64"><path d="${starPath(32, 32, 28)}" fill="${ILLO.orange}"/></svg>` }
  ];
  const slotCount = PARTS.filter(p => p.slot).length;

  let zTop = 20;
  const parts = PARTS.map((d, i) => {
    const node = document.createElement("div");
    node.className = "drag-and-drop-part";
    node.innerHTML = `<div class="drag-and-drop-part-in">${d.svg}</div>`;
    node.style.zIndex = 10 + i;
    root.appendChild(node);
    let slotEl = null;
    if (d.slot) { slotEl = document.createElement("div"); slotEl.className = "drag-and-drop-slot"; root.appendChild(slotEl); }
    return { d, i, node, slotEl, x: 0, y: 0, attached: false, moved: false, z: 10 + i, svg: node.querySelector("svg") };
  });
  /* 붙였다 뗐다: 사람 그림을 다시 그린다 */
  const wear = (p, on) => { if (!p.d.kind) return; if (on) worn[p.d.kind] = p.d.part; else delete worn[p.d.kind]; renderFigure(); };
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
      const pw = p.d.w * L.s, ph = p.d.h * L.s, pad = PAD * L.s;
      p.node.style.width = pw + "px"; p.node.style.height = ph + "px";
      Object.assign(p.svg.style, { left: pad + "px", top: pad + "px", width: pw - pad * 2 + "px", height: ph - pad * 2 + "px" });
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
  // 첫 배치는 전환 없이 제자리에 놓고, 그 뒤부터 움직임에 전환을 건다 (처음 그릴 때 왼쪽 위에서 날아오지 않게)
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("is-live")));

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
    if (p.attached) { p.attached = false; wear(p, false); api.flash(`${p.d.name} 떼어냄`, "alt", 900); }
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
      // 썸네일이 자리에 내려앉은 뒤(전환 .38s) 사람 그림을 그 부품을 쓴 모습으로 바꾸고 썸네일은 사라진다
      api.timeout(() => { if (p.attached && drag.p !== p) { wear(p, true); p.node.classList.add("is-attached"); } }, 340);
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
