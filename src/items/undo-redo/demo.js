import { clamp } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;
  const INK = "#1b1b1a";
  const ACC = api.color("--accent") || "#ff5a36";
  const STYLES = [
    { name: "먹색", fill: INK, op: 1 },
    { name: "회색", fill: "#a8a39a", op: 1 },
    { name: "윤곽", fill: "#fbf8f1", op: 0 },
    { name: "주황", fill: ACC, op: 1 }
  ];
  const KINDS = ["circle", "square", "triangle"];
  const SZ = 56;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const K_UNDO = isMac ? "⌘Z" : "Ctrl+Z", K_REDO = isMac ? "⇧⌘Z" : "Ctrl+Y";

  api.css(`
    .undo-redo-root { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 14px; padding: 64px 28px 72px; }
    .undo-redo-board { position: relative; flex: 1 1 auto; min-height: 160px; border: 1px solid var(--line); border-radius: var(--r-card);
      cursor: crosshair; overflow: hidden; touch-action: none;
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
    .undo-redo-shape { position: absolute; width: ${SZ}px; height: ${SZ}px; margin: -${SZ / 2}px 0 0 -${SZ / 2}px; cursor: grab; }
    .undo-redo-shape svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .undo-redo-shape .body { stroke: ${INK}; stroke-width: 1.5; stroke-linejoin: round; }
    .undo-redo-root.anim .undo-redo-shape { transition: left .32s cubic-bezier(.2,.8,.2,1), top .32s cubic-bezier(.2,.8,.2,1); }
    .undo-redo-root.anim .undo-redo-shape .body { transition: fill .3s, fill-opacity .3s; }
    .undo-redo-root .undo-redo-shape.dragging { transition: none !important; cursor: grabbing; z-index: 5; }
    .undo-redo-bar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .undo-redo-btn { font: inherit; font-size: 13px; font-weight: 600; color: var(--ink); background: transparent; cursor: pointer;
      border: 1px solid rgba(0,0,0,.2); border-radius: var(--r-pill); padding: 8px 14px; display: flex; gap: 8px; align-items: center;
      transition: border-color .15s, opacity .2s, background .15s; }
    .undo-redo-btn:hover:not([disabled]) { border-color: var(--ink); }
    .undo-redo-btn:active:not([disabled]), .undo-redo-btn.pressed { background: rgba(0,0,0,.07); }
    .undo-redo-btn[disabled] { opacity: .3; cursor: default; }
    .undo-redo-btn kbd { font: inherit; font-weight: 500; color: var(--ink-3); }
    .undo-redo-spacer { flex: 1; }
    .undo-redo-tlwrap { transition: max-height .35s cubic-bezier(.2,.8,.2,1), opacity .3s; max-height: 90px; overflow: hidden; }
    .undo-redo-tlwrap.off { max-height: 0; opacity: 0; }
    .undo-redo-tl { display: flex; gap: 6px; overflow-x: auto; padding: 4px 2px 8px; scrollbar-width: thin; }
    .undo-redo-tile { flex: none; font: inherit; width: 62px; padding: 4px; border: 1px solid rgba(0,0,0,.14); border-radius: 7px; background: transparent;
      cursor: pointer; display: flex; flex-direction: column; gap: 3px; align-items: center; transition: opacity .25s, border-color .2s; }
    .undo-redo-tile:hover { border-color: var(--ink-3); }
    .undo-redo-tile svg { width: 52px; height: 36px; display: block; }
    .undo-redo-tile span { font-size: 11px; color: var(--ink-2); white-space: nowrap; }
    .undo-redo-tile.cur { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
    .undo-redo-tile.future { opacity: .38; border-style: dashed; }
    .undo-redo-tile.gone { pointer-events: none; }
  `);

  /* ---------- DOM ---------- */
  const root = document.createElement("div");
  root.className = "undo-redo-root";
  el.appendChild(root);
  root.innerHTML = `
    <div class="undo-redo-board"></div>
    <div class="undo-redo-bar">
      <button class="undo-redo-btn" data-act="undo">↶ 되돌리기 <kbd>${K_UNDO}</kbd></button>
      <button class="undo-redo-btn" data-act="redo">↷ 다시하기 <kbd>${K_REDO}</kbd></button>
      <div class="undo-redo-spacer"></div>
      <button class="undo-redo-btn" data-act="clear">모두 지우기</button>
    </div>
    <div class="undo-redo-tlwrap"><div class="undo-redo-tl"></div></div>`;
  const board = root.querySelector(".undo-redo-board");
  const tl = root.querySelector(".undo-redo-tl"), tlWrap = root.querySelector(".undo-redo-tlwrap");
  const btn = a => root.querySelector(`[data-act="${a}"]`);

  /* ---------- 기록 ---------- */
  let uid = 0, sid = 0;
  const copy = shapes => shapes.map(s => ({ ...s }));
  const states = [{ uid: uid++, label: "처음", shapes: [
    { id: sid++, kind: "circle", x: 0.3, y: 0.45, st: 0 },
    { id: sid++, kind: "square", x: 0.5, y: 0.55, st: 1 },
    { id: sid++, kind: "triangle", x: 0.7, y: 0.42, st: 2 }] }];
  let cur = 0;
  const now = () => states[cur].shapes;

  const shapeSVG = (kind, s = SZ) => {
    const m = 2, e = s - 2;
    if (kind === "circle") return `<circle class="body" cx="${s / 2}" cy="${s / 2}" r="${s / 2 - m}"/>`;
    if (kind === "square") return `<rect class="body" x="${m + 2}" y="${m + 2}" width="${e - m - 4}" height="${e - m - 4}" rx="3"/>`;
    return `<path class="body" d="M${s / 2} ${m} L${e} ${e - 3} H${m} Z"/>`;
  };
  const els = new Map();
  const styleEl = (node, st) => {
    const b = node.querySelector(".body");
    b.style.fill = STYLES[st].fill; b.style.fillOpacity = STYLES[st].op;
  };
  const renderShapes = () => {
    const list = now(), seen = new Set();
    list.forEach(s => {
      seen.add(s.id);
      let node = els.get(s.id);
      if (!node) {
        node = document.createElement("div");
        node.className = "undo-redo-shape";
        node.dataset.id = s.id;
        node.innerHTML = `<svg viewBox="0 0 ${SZ} ${SZ}">${shapeSVG(s.kind)}</svg>`;
        node.style.left = s.x * 100 + "%"; node.style.top = s.y * 100 + "%";
        board.appendChild(node);
        els.set(s.id, node);
        styleEl(node, s.st);
        if (S.animate) node.animate([{ transform: "scale(.3)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 260, easing: "cubic-bezier(.3,1.5,.5,1)" });
        return;
      }
      node.style.left = s.x * 100 + "%"; node.style.top = s.y * 100 + "%";
      styleEl(node, s.st);
    });
    els.forEach((node, id) => {
      if (seen.has(id)) return;
      els.delete(id);
      if (S.animate) node.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(.3)", opacity: 0 }], { duration: 200, easing: "ease-in", fill: "forwards" }).onfinish = () => node.remove();
      else node.remove();
    });
  };

  /* ---------- 기록 줄 ---------- */
  const tiles = new Map();
  const thumb = shapes => `<svg viewBox="0 0 100 70">${shapes.map(s => {
    const x = s.x * 100, y = s.y * 70, r = 7, f = STYLES[s.st];
    const a = `fill="${f.fill}" fill-opacity="${f.op}" stroke="${INK}" stroke-width="1"`;
    if (s.kind === "circle") return `<circle cx="${x}" cy="${y}" r="${r}" ${a}/>`;
    if (s.kind === "square") return `<rect x="${x - r + 1}" y="${y - r + 1}" width="${2 * r - 2}" height="${2 * r - 2}" ${a}/>`;
    return `<path d="M${x} ${y - r} L${x + r} ${y + r - 1} H${x - r} Z" ${a}/>`;
  }).join("")}</svg>`;
  const renderTimeline = (dropped = []) => {
    const live = new Set(states.map(s => s.uid));
    // 버려진 칸: 떨어지며 사라진다
    tiles.forEach((node, id) => {
      if (live.has(id)) return;
      tiles.delete(id);
      node.classList.add("gone");
      const trimmed = !dropped.includes(id);
      if (S.animate) node.animate(trimmed
        ? [{ opacity: .5, transform: "none" }, { opacity: 0, transform: "translateX(-30px)" }]
        : [{ opacity: .38, transform: "none" }, { opacity: 0, transform: "translateY(26px) rotate(8deg)" }],
      { duration: 380, easing: "ease-in", fill: "forwards" }).onfinish = () => node.remove();
      else node.remove();
    });
    states.forEach((s, i) => {
      let node = tiles.get(s.uid);
      if (!node) {
        node = document.createElement("button");
        node.className = "undo-redo-tile";
        node.dataset.uid = s.uid;
        node.innerHTML = `${thumb(s.shapes)}<span>${s.label}</span>`;
        tiles.set(s.uid, node);
        const before = [...tl.children].find(c => !c.classList.contains("gone") && +c.dataset.uid > s.uid);
        tl.insertBefore(node, before || null);
        if (S.animate && i > 0) node.animate([{ opacity: 0, transform: "translateX(12px)" }, { opacity: 1, transform: "none" }], { duration: 240, easing: "ease-out" });
      }
      node.classList.toggle("cur", i === cur);
      node.classList.toggle("future", i > cur);
    });
    const c = tiles.get(states[cur].uid);
    if (c) {
      const l = c.offsetLeft - tl.clientWidth / 2 + c.offsetWidth / 2;
      tl.scrollTo({ left: Math.max(0, l), behavior: S.animate ? "smooth" : "auto" });
    }
    btn("undo").disabled = cur === 0;
    btn("redo").disabled = cur === states.length - 1;
    btn("clear").disabled = now().length === 0;
  };

  const trim = () => {
    while (states.length > S.limit + 1 && cur > 0) { states.shift(); cur--; }
  };
  const commit = (label, shapes) => {
    const discarded = states.splice(cur + 1).map(s => s.uid);
    states.push({ uid: uid++, label, shapes: copy(shapes) });
    cur = states.length - 1;
    trim();
    if (discarded.length) api.flash(`되돌린 뒤 새 작업 · 앞쪽 기록 ${discarded.length}개를 버렸다`, "alt", 2200);
    renderShapes(); renderTimeline(discarded);
    api.hideHint();
  };
  const press = a => { const b = btn(a); b.classList.add("pressed"); api.timeout(() => b.classList.remove("pressed"), 140); };
  const undo = () => { if (cur === 0) return; cur--; press("undo"); renderShapes(); renderTimeline(); };
  const redo = () => { if (cur >= states.length - 1) return; cur++; press("redo"); renderShapes(); renderTimeline(); };

  /* ---------- 보드 입력 ---------- */
  let drag = null;
  api.on(board, "pointerdown", e => {
    e.preventDefault();
    const r = board.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    const node = e.target.closest(".undo-redo-shape");
    if (node) {
      board.setPointerCapture(e.pointerId);
      const s = now().find(s => s.id === +node.dataset.id);
      drag = { id: s.id, node, sx: e.clientX, sy: e.clientY, ox: s.x, oy: s.y, x: s.x, y: s.y, moved: false };
      return;
    }
    const shapes = copy(now());
    const kind = KINDS[sid % 3];
    shapes.push({ id: sid++, kind, x: clamp(px, 0.04, 0.96), y: clamp(py, 0.06, 0.94), st: sid % 2 });
    commit("추가", shapes);
  });
  api.on(board, "pointermove", e => {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    if (!drag.moved) { drag.moved = true; drag.node.classList.add("dragging"); }
    const r = board.getBoundingClientRect();
    drag.x = clamp(drag.ox + dx / r.width, 0.04, 0.96); drag.y = clamp(drag.oy + dy / r.height, 0.06, 0.94);
    drag.node.style.left = drag.x * 100 + "%"; drag.node.style.top = drag.y * 100 + "%";
  });
  const endDrag = () => {
    if (!drag) return;
    const d = drag; drag = null;
    d.node.classList.remove("dragging");
    const shapes = copy(now()), s = shapes.find(s => s.id === d.id);
    if (d.moved) { s.x = d.x; s.y = d.y; commit("이동", shapes); }
    else { s.st = (s.st + 1) % STYLES.length; commit("색 바꾸기", shapes); }
  };
  api.on(board, "pointerup", endDrag);
  api.on(board, "pointercancel", endDrag);

  api.on(root, "click", e => {
    const t = e.target.closest(".undo-redo-tile");
    if (t && !t.classList.contains("gone")) {
      const i = states.findIndex(s => s.uid === +t.dataset.uid);
      if (i >= 0 && i !== cur) { cur = i; renderShapes(); renderTimeline(); api.hideHint(); }
      return;
    }
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    api.hideHint();
    if (b.dataset.act === "undo") undo();
    if (b.dataset.act === "redo") redo();
    if (b.dataset.act === "clear" && now().length) commit("모두 지우기", []);
  });
  api.on(root, "pointerdown", e => { if (e.target.closest("button")) e.preventDefault(); });
  api.on(window, "keydown", e => {
    if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
    const mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
    if (mod && k === "z") { e.preventDefault(); api.hideHint(); e.shiftKey ? redo() : undo(); }
    else if (mod && k === "y") { e.preventDefault(); api.hideHint(); redo(); }
  });

  const applyModes = () => {
    root.classList.toggle("anim", !!S.animate);
    tlWrap.classList.toggle("off", !S.timeline);
  };
  api.onParam(k => {
    applyModes();
    if (k === "limit") {
      const before = states.length;
      trim();
      if (states.length !== before) { renderTimeline(); api.flash(`한도를 넘은 오래된 기록 ${before - states.length}개를 지웠다`, "alt"); }
    }
  });
  applyModes();
  renderShapes(); renderTimeline();

  api.frame(() => {
    const redoN = states.length - 1 - cur;
    api.read("pos", `${cur + 1} / ${states.length}`);
    api.read("undo", cur);
    api.read("redo", redoN);
    api.read("last", states[cur].label);
    if (drag && drag.moved) api.status("옮기는 중 · 놓으면 기록된다", "active");
    else if (redoN > 0) api.status(`되돌린 상태 · 다시하기 ${redoN}개 남음 · 새 작업을 하면 버려진다`, "alt");
    else api.status(`최신 상태 · 기록 ${states.length - 1} / ${S.limit}단계`, "idle");
  });
}
