import { clamp, dist, localPoint } from "../../lib/util.js";
import { ILLO } from "../../lib/draw.js";

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
    .drag-and-drop-char svg, .drag-and-drop-part svg { display: block; width: 100%; height: 100%; overflow: visible; }
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

  /* ---------- 캐릭터 (그림 키트 규칙: 3px 검정 외곽선, 평면 단색, 점 두 개와 선 하나) ---------- */
  const INK = ILLO.ink, PAPER = ILLO.paper;
  const LINE = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const charEl = document.createElement("div");
  charEl.className = "drag-and-drop-char";
  charEl.innerHTML = `<svg viewBox="0 0 260 340" fill="none">
    <circle cx="24" cy="222" r="15" fill="${ILLO.yellow}" ${LINE}/><circle cx="236" cy="222" r="15" fill="${ILLO.yellow}" ${LINE}/>
    <ellipse cx="130" cy="190" rx="104" ry="132" fill="${PAPER}" ${LINE}/>
    <circle cx="100" cy="150" r="7" fill="${INK}"/><circle cx="160" cy="150" r="7" fill="${INK}"/>
    <path d="M112 224 Q130 240 148 224" ${LINE}/>
  </svg>`;
  root.appendChild(charEl);

  /* ---------- 파츠 ---------- */
  const starPath = (cx, cy, r) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; return `${i ? "L" : "M"}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`; }).join(" ") + " Z";
  const PARTS = [
    { id: "hat", name: "모자", w: 120, h: 86, slot: [130, 36],
      svg: `<svg viewBox="0 0 120 86"><rect x="28" y="4" width="64" height="64" rx="4" fill="${ILLO.blue}" ${LINE}/><rect x="28" y="46" width="64" height="12" fill="${ILLO.red}" ${LINE}/><rect x="4" y="64" width="112" height="14" rx="7" fill="${ILLO.blue}" ${LINE}/></svg>` },
    { id: "glasses", name: "안경", w: 130, h: 50, slot: [130, 150],
      svg: `<svg viewBox="0 0 130 50"><circle cx="34" cy="25" r="20" fill="${PAPER}" ${LINE}/><circle cx="96" cy="25" r="20" fill="${PAPER}" ${LINE}/><path d="M54 22 Q65 14 76 22" ${LINE}/><path d="M14 22 L4 18 M116 22 L126 18" ${LINE}/></svg>` },
    { id: "mustache", name: "콧수염", w: 100, h: 40, slot: [130, 196],
      svg: `<svg viewBox="0 0 100 40"><path d="M50 14 C40 2 20 4 12 16 C6 26 0 24 2 16 C0 34 22 40 38 30 C44 26 48 22 50 20 C52 22 56 26 62 30 C78 40 100 34 98 16 C100 24 94 26 88 16 C80 4 60 2 50 14Z" fill="${INK}"/></svg>` },
    { id: "bowtie", name: "나비넥타이", w: 80, h: 44, slot: [130, 272],
      svg: `<svg viewBox="0 0 80 44"><path d="M40 22 L4 4 L4 40 Z M40 22 L76 4 L76 40 Z" fill="${ILLO.red}" ${LINE}/><rect x="31" y="12" width="18" height="20" rx="5" fill="${ILLO.red}" ${LINE}/></svg>` },
    { id: "flower", name: "꽃", w: 64, h: 96, slot: [240, 186],
      svg: `<svg viewBox="0 0 64 96"><path d="M32 40 L32 92" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M32 40 L32 92" stroke="${ILLO.green}" stroke-width="5" stroke-linecap="round"/>${[0, 1, 2, 3, 4].map(k => { const a = k / 5 * Math.PI * 2 - Math.PI / 2; return `<circle cx="${32 + Math.cos(a) * 15}" cy="${28 + Math.sin(a) * 15}" r="10" fill="${ILLO.pink}" ${LINE}/>`; }).join("")}<circle cx="32" cy="28" r="8" fill="${ILLO.yellow}" ${LINE}/></svg>` },
    { id: "star", name: "별 스티커", w: 72, h: 72, slot: null,
      svg: `<svg viewBox="0 0 72 72"><path d="${starPath(36, 36, 32)}" fill="${ILLO.yellow}" ${LINE}/></svg>` }
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
    return { d, i, node, slotEl, x: 0, y: 0, attached: false, moved: false, z: 10 + i };
  });
  const ghost = document.createElement("div"); ghost.className = "drag-and-drop-ghost"; root.appendChild(ghost);

  /* ---------- 배치 ---------- */
  const L = { s: 1, cx: 0, cy: 0, cells: [] };
  const slotPos = d => ({ x: L.cx + (d.slot[0] - 130) * L.s, y: L.cy + (d.slot[1] - 170) * L.s });
  const put = (p, x, y) => { p.x = x; p.y = y; p.node.style.transform = `translate(${x - p.d.w * L.s / 2}px, ${y - p.d.h * L.s / 2}px)`; };
  const layout = () => {
    const w = el.clientWidth, h = el.clientHeight;
    let tr;
    if (w >= 640) {
      L.s = clamp(Math.min(h * 0.68 / 340, w * 0.4 / 260), 0.5, 1.5);
      L.cx = w * 0.33; L.cy = h * 0.54;
      tr = { x: w * 0.6, y: h * 0.16, w: w * 0.35, h: h * 0.72 };
      L.cells = [0, 1, 2, 3, 4, 5].map(k => ({ x: tr.x + tr.w * (k % 2 ? 0.72 : 0.28), y: tr.y + tr.h * (0.2 + Math.floor(k / 2) * 0.3) }));
    } else {
      L.s = clamp(Math.min(h * 0.46 / 340, w * 0.62 / 260), 0.4, 1.2);
      L.cx = w * 0.5; L.cy = h * 0.37;
      tr = { x: w * 0.04, y: h * 0.68, w: w * 0.92, h: h * 0.29 };
      L.cells = [0, 1, 2, 3, 4, 5].map(k => ({ x: tr.x + tr.w * (0.18 + (k % 3) * 0.32), y: tr.y + tr.h * (Math.floor(k / 3) ? 0.72 : 0.34) }));
    }
    Object.assign(tray.style, { left: tr.x + "px", top: tr.y + "px", width: tr.w + "px", height: tr.h + "px" });
    Object.assign(charEl.style, { width: 260 * L.s + "px", height: 340 * L.s + "px", transform: `translate(${L.cx - 130 * L.s}px, ${L.cy - 170 * L.s}px)` });
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
