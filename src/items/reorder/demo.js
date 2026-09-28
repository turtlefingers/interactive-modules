import { clamp } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .reorder-root { position: absolute; inset: 0; background: var(--board); }
    .reorder-view { position: absolute; overflow-y: auto; overflow-x: hidden; touch-action: pan-y;
      border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); scrollbar-width: thin; }
    .reorder-content { position: relative; margin: 12px 0; }
    .reorder-item { position: absolute; left: 0; top: 0; display: flex; align-items: center; gap: 12px; padding: 0 14px 0 8px;
      background: var(--note); border: 1px solid var(--line); border-radius: var(--r-card); color: var(--ink);
      font-size: 15px; cursor: grab; touch-action: none; user-select: none;
      transition: transform .26s cubic-bezier(.2,.8,.2,1), width .26s, height .26s, scale .15s, box-shadow .15s, border-color .15s; }
    .reorder-root.handle-only .reorder-item { cursor: default; touch-action: pan-y; }
    .reorder-handle { flex: none; width: 28px; height: 36px; display: grid; place-items: center; cursor: grab; touch-action: none; border-radius: 6px; }
    .reorder-handle:hover { background: rgba(0,0,0,.05); }
    .reorder-handle svg { display: block; }
    .reorder-num { flex: none; width: 22px; font-size: 13px; color: var(--ink-3); font-variant-numeric: tabular-nums; }
    .reorder-title { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .reorder-root.is-grid .reorder-item { flex-direction: column; justify-content: center; gap: 4px; padding: 8px; text-align: center; }
    .reorder-root.is-grid .reorder-handle { position: absolute; left: 4px; top: 4px; width: 24px; height: 24px; }
    .reorder-root.is-grid .reorder-num { width: auto; font-size: 18px; color: var(--ink); font-weight: 600; }
    .reorder-root.is-grid .reorder-title { flex: none; width: 100%; font-size: 13px; color: var(--ink-2); }
    .reorder-item.is-dragging { z-index: 10; transition: scale .15s, box-shadow .15s, border-color .15s; border-color: var(--accent);
      box-shadow: var(--shadow-hover); cursor: grabbing; }
    .reorder-item.is-dragging { scale: 1.03; }
    .reorder-root.no-anim .reorder-item:not(.is-dragging), .reorder-root.no-anim .reorder-place { transition: none; }
    .reorder-root.is-dragging-any, .reorder-root.is-dragging-any * { cursor: grabbing !important; }
    .reorder-place { position: absolute; left: 0; top: 0; border-radius: var(--r-card); opacity: 0; pointer-events: none;
      transition: transform .26s cubic-bezier(.2,.8,.2,1), opacity .15s; display: flex; align-items: center; gap: 12px; padding: 0 14px 0 8px; font-size: 15px; }
    .reorder-place.is-on { opacity: 1; }
    .reorder-place.outline { border: 2px dashed var(--ink-3); }
    .reorder-place.ghost { background: var(--note); border: 1px solid var(--line); }
    .reorder-place.ghost.is-on { opacity: .4; }
    .reorder-root.is-grid .reorder-place { flex-direction: column; justify-content: center; gap: 4px; padding: 8px; text-align: center; }
  `);

  const root = document.createElement("div");
  root.className = "reorder-root";
  const view = document.createElement("div"); view.className = "reorder-view";
  const content = document.createElement("div"); content.className = "reorder-content";
  const place = document.createElement("div"); place.className = "reorder-place";
  view.appendChild(content); root.appendChild(view); el.appendChild(root);
  content.appendChild(place);

  const TITLES = ["기획안 쓰기", "레퍼런스 모으기", "스케치", "와이어프레임", "색 정하기", "글꼴 고르기", "아이콘 그리기",
    "프로토타입", "사용자 테스트", "모션 다듬기", "발표 자료", "발표 연습", "회고"];
  const HANDLE = `<svg width="10" height="16" viewBox="0 0 10 16">${[0, 1, 2].map(r => [0, 1].map(c => `<circle cx="${2 + c * 6}" cy="${2 + r * 6}" r="1.6" fill="currentColor"/>`).join("")).join("")}</svg>`;
  const items = TITLES.map((t, i) => {
    const node = document.createElement("div");
    node.className = "reorder-item";
    node.innerHTML = `<div class="reorder-handle" style="color:var(--ink-3)">${HANDLE}</div><div class="reorder-num">${i + 1}</div><div class="reorder-title">${t}</div>`;
    content.appendChild(node);
    return { id: i, node, title: t };
  });
  let order = items.slice();

  /* ---------- 배치 ---------- */
  const G = { grid: false, W: 0, cw: 0, ch: 0, gap: 8, cols: 1 };
  const slot = i => G.grid
    ? { x: (i % G.cols) * (G.cw + G.gap), y: Math.floor(i / G.cols) * (G.ch + G.gap) }
    : { x: 0, y: i * (G.ch + G.gap) };
  const setPos = (node, p) => { node.style.transform = `translate(${p.x}px, ${p.y}px)`; };
  const geom = () => {
    const w = el.clientWidth, h = el.clientHeight;
    G.grid = S.layout === "grid";
    const vw = Math.min(G.grid ? 560 : 440, w - 32), vh = Math.max(200, Math.min(h - 120, 480));
    Object.assign(view.style, { width: vw + "px", height: vh + "px", left: (w - vw) / 2 + "px", top: Math.max(60, (h - vh) / 2) + "px" });
    G.W = vw;
    if (G.grid) { G.gap = 10; G.cols = vw >= 460 ? 4 : 3; G.cw = (vw - (G.cols - 1) * G.gap) / G.cols; G.ch = Math.min(110, G.cw * 0.86); }
    else { G.gap = 8; G.cols = 1; G.cw = vw; G.ch = 52; }
    const rows = Math.ceil(items.length / G.cols);
    content.style.height = rows * (G.ch + G.gap) - G.gap + "px";
    items.forEach(it => { it.node.style.width = G.cw + "px"; it.node.style.height = G.ch + "px"; });
    place.style.width = G.cw + "px"; place.style.height = G.ch + "px";
    root.classList.toggle("is-grid", G.grid);
  };
  const layoutAll = (list = order, skip = null) => list.forEach((it, i) => { if (it !== skip) setPos(it.node, slot(i)); });
  const applyModes = () => {
    root.classList.toggle("handle-only", !!S.handleOnly);
    root.classList.toggle("no-anim", !S.animate);
    place.className = "reorder-place " + S.placeholder + (drag ? " is-on" : "");
  };

  /* ---------- 드래그 ---------- */
  let drag = null;   // { it, from, to, ox, oy, cx, cy, list }
  const toContent = (cx, cy) => {
    const r = content.getBoundingClientRect();
    return { x: cx - r.left, y: cy - r.top };
  };
  const targetIndex = (x, y) => {
    const n = items.length;
    if (!G.grid) return clamp(Math.round(y / (G.ch + G.gap)), 0, n - 1);
    const col = clamp(Math.round(x / (G.cw + G.gap)), 0, G.cols - 1);
    const row = Math.max(0, Math.round(y / (G.ch + G.gap)));
    return clamp(row * G.cols + col, 0, n - 1);
  };
  const updateDrag = () => {
    const p = toContent(drag.cx, drag.cy);
    let x = p.x - drag.ox, y = p.y - drag.oy;
    const maxY = parseFloat(content.style.height) - G.ch;
    y = clamp(y, -G.ch * 0.4, maxY + G.ch * 0.4);
    x = G.grid ? clamp(x, -G.cw * 0.3, G.W - G.cw * 0.7) : 0;   // 목록에서는 세로로만 움직인다
    setPos(drag.it.node, { x, y });
    const to = targetIndex(x, y);
    if (to !== drag.to) {
      drag.to = to;
      const rest = order.filter(o => o !== drag.it);
      rest.splice(to, 0, drag.it);
      drag.list = rest;
      layoutAll(rest, drag.it);
      setPos(place, slot(to));
    }
  };

  api.on(view, "pointerdown", e => {
    const node = e.target.closest(".reorder-item");
    if (!node || drag) return;
    if (S.handleOnly && !e.target.closest(".reorder-handle")) return;
    e.preventDefault();
    view.setPointerCapture(e.pointerId);
    const it = items.find(o => o.node === node);
    const from = order.indexOf(it);
    const p = toContent(e.clientX, e.clientY), s = slot(from);
    drag = { it, from, to: from, ox: p.x - s.x, oy: p.y - s.y, cx: e.clientX, cy: e.clientY, list: order.slice() };
    node.classList.add("is-dragging");
    root.classList.add("is-dragging-any");
    if (S.placeholder === "ghost") place.innerHTML = node.innerHTML; else place.innerHTML = "";
    place.style.transition = "none"; setPos(place, slot(from)); void place.offsetWidth; place.style.transition = "";
    applyModes();
    api.hideHint();
  });
  api.on(view, "pointermove", e => {
    if (!drag) return;
    drag.cx = e.clientX; drag.cy = e.clientY;
    updateDrag();
  });
  const end = () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    order = d.list;
    d.it.node.classList.remove("is-dragging");
    root.classList.remove("is-dragging-any");
    applyModes();
    layoutAll();
    if (d.to !== d.from) api.flash(`${d.from + 1}번째 → ${d.to + 1}번째로 옮겼다`, "ok");
  };
  api.on(view, "pointerup", end);
  api.on(view, "pointercancel", end);
  api.on(view, "scroll", () => { if (drag) updateDrag(); });

  geom(); applyModes();
  root.classList.add("no-anim"); layoutAll(); void content.offsetWidth; applyModes();
  api.onResize(() => { geom(); layoutAll(drag ? drag.list : order, drag ? drag.it : null); if (drag) updateDrag(); });
  api.onParam(k => {
    applyModes();
    if (k === "placeholder" && drag) place.innerHTML = S.placeholder === "ghost" ? drag.it.node.innerHTML : "";
    if (k === "layout") { geom(); layoutAll(drag ? drag.list : order, drag ? drag.it : null); if (drag) { setPos(place, slot(drag.to)); updateDrag(); } }
  });

  /* ---------- 자동 스크롤 ---------- */
  let scrollV = 0;
  api.frame(() => {
    scrollV = 0;
    if (drag && S.autoScroll) {
      const r = view.getBoundingClientRect(), edge = Math.min(64, r.height / 4);
      if (drag.cy < r.top + edge) scrollV = -(1 - Math.max(0, drag.cy - r.top) / edge) * 14;
      else if (drag.cy > r.bottom - edge) scrollV = (1 - Math.max(0, r.bottom - drag.cy) / edge) * 14;
      const before = view.scrollTop;
      if (scrollV) { view.scrollTop += scrollV; if (view.scrollTop === before) scrollV = 0; }
    }
    api.read("from", drag ? `${drag.from + 1}번째 · ${drag.it.title}` : "–");
    api.read("to", drag ? `${drag.to + 1}번째` : "–");
    api.read("shift", drag ? (drag.to - drag.from > 0 ? "+" : "") + (drag.to - drag.from) : "–");
    api.read("scroll", scrollV ? scrollV.toFixed(1) : 0);
    if (drag) api.status(scrollV ? "끄는 중 · 가장자리에서 자동 스크롤" : `끄는 중 · ${drag.to + 1}번째 자리에 놓인다`, scrollV ? "alt" : "active");
    else api.status("대기", "idle");
  });
}
