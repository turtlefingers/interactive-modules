import { clamp, localPoint } from "../../lib/util.js";

const SHAPE_PATH = {
  circle: `<circle cx="50" cy="50" r="46"/>`,
  square: `<rect x="5" y="5" width="90" height="90"/>`,
  tri: `<path d="M50 5 95 92H5z"/>`
};
const SHAPE_NAME = { circle: "원", square: "네모", tri: "세모" };
const FILL = { none: "transparent", grey: "var(--toggle-off)", ink: "var(--ink)", accent: "var(--accent)" };
const FILL_NAME = { none: "빈", grey: "회색", ink: "검정", accent: "강조색" };
const FILL_LABEL = { none: "비움", grey: "회색", ink: "검정", accent: "강조색" };

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .cm-demo { position: absolute; inset: 0; background: var(--board); overflow: hidden; }
    .cm-demo.grid { background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
    .cm-obj { position: absolute; pointer-events: none; }
    .cm-obj.anim { transition: left .35s cubic-bezier(.3,1,.4,1), top .35s cubic-bezier(.3,1,.4,1); }
    .cm-obj svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .cm-obj svg > * { pointer-events: all; stroke: var(--ink); stroke-width: 1.5; vector-effect: non-scaling-stroke; cursor: grab; transition: fill .15s; }
    .cm-obj.note { pointer-events: auto; cursor: grab; background: var(--note); border: 1.5px solid var(--ink); padding: 12px 14px;
      font-size: 13px; line-height: 1.5; color: var(--ink); transition: transform .2s; }
    .cm-obj.note b { display: block; font-weight: 600; margin-bottom: 4px; }
    .cm-obj.dragging, .cm-obj.dragging * { cursor: grabbing !important; }
    .cm-mark { position: absolute; pointer-events: none; border: 1.5px dashed var(--accent); border-radius: 4px; display: none; }
    .cm-menu { position: absolute; z-index: 45; min-width: 190px; padding: 5px; background: var(--panel); border: 1px solid var(--ink-3);
      border-radius: 6px; font-size: 13px; color: var(--ink); user-select: none; }
    .cm-head { padding: 6px 10px 6px; color: var(--ink-3); border-bottom: 1px solid var(--line); margin-bottom: 4px; }
    .cm-item { display: flex; align-items: center; gap: 8px; width: 100%; border: 0; background: none; font: inherit; color: inherit; text-align: left;
      padding: 7px 10px; border-radius: 4px; cursor: default; }
    .cm-item .ic { width: 14px; height: 14px; flex: none; }
    .cm-item .ic > * { stroke: var(--ink); stroke-width: 1.2; vector-effect: non-scaling-stroke; }
    .cm-item .lb { flex: 1; }
    .cm-item .ar { color: var(--ink-3); }
    .cm-item.on { background: var(--ink); color: var(--on-ink); }
    .cm-item.on .ar { color: var(--on-ink); }
    .cm-item.on .ic > * { stroke: var(--on-ink); }
    .cm-item.danger .lb { color: var(--accent); }
    .cm-item.on.danger { background: var(--accent); }
    .cm-item.on.danger .lb { color: #fff; }
    .cm-item[disabled] { color: var(--ink-3); }
    .cm-item.cur .lb::after { content: " ·  지금"; color: var(--ink-3); }
    .cm-sep { height: 1px; background: var(--line); margin: 4px 6px; }
    .cm-inline { display: flex; align-items: center; gap: 6px; padding: 5px 10px; }
    .cm-inline .lb { flex: 1; color: var(--ink-2); }
    .cm-inline button { width: 24px; height: 24px; padding: 4px; border: 1px solid transparent; border-radius: 4px; background: none; cursor: default; }
    .cm-inline button:hover, .cm-inline button.cur { border-color: var(--ink); }
    .cm-inline button svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .cm-inline button svg > * { stroke: var(--ink); stroke-width: 1.2; vector-effect: non-scaling-stroke; }
  `);

  const root = document.createElement("div");
  root.className = "cm-demo grid";
  el.appendChild(root);
  const mark = document.createElement("div");
  mark.className = "cm-mark";
  root.appendChild(mark);

  /* ---------- 개체 ---------- */
  let objs = [], nid = 0;
  const maxZ = () => objs.reduce((m, o) => Math.max(m, o.z), 0);
  const nameOf = o => o.type === "note" ? "메모" : `${FILL_NAME[o.fill]} ${SHAPE_NAME[o.shape]}`;
  const icon = (shape, fill = "none") => `<svg class="ic" viewBox="0 0 100 100">${SHAPE_PATH[shape].replace("/>", ` fill="${FILL[fill]}"/>`)}</svg>`;

  function make(o) {
    o.id = ++nid;
    o.z = o.z || maxZ() + 1;
    o.el = document.createElement("div");
    o.el.className = "cm-obj " + o.type;
    if (o.type === "note") o.el.innerHTML = `<b>메모</b>우클릭하면<br>메뉴가 달라진다`;
    o.el.dataset.id = o.id;
    root.insertBefore(o.el, mark);
    objs.push(o);
    draw(o);
    return o;
  }
  function draw(o) {
    const s = o.s;
    if (o.type === "note") {
      o.el.style.cssText += `;left:${o.x - s * .75}px;top:${o.y - s * .5}px;width:${s * 1.5}px;min-height:${s}px;z-index:${o.z};transform:rotate(${o.tilt}deg)`;
    } else {
      o.el.style.cssText += `;left:${o.x - s / 2}px;top:${o.y - s / 2}px;width:${s}px;height:${s}px;z-index:${o.z}`;
      const k = o.shape + o.fill;
      if (o._k !== k) { o._k = k; o.el.innerHTML = `<svg viewBox="0 0 100 100">${SHAPE_PATH[o.shape].replace("/>", ` fill="${FILL[o.fill]}"/>`)}</svg>`; }
    }
  }
  const objOf = t => { const n = t.closest && t.closest(".cm-obj"); return n ? objs.find(o => o.el === n) : null; };

  const { w: W0, h: H0 } = api.size();
  const U = clamp(Math.min(W0, H0) / 7, 70, 120);
  make({ type: "shape", shape: "circle", fill: "ink", x: W0 * .3, y: H0 * .36, s: U * 1.1 });
  make({ type: "shape", shape: "square", fill: "grey", x: W0 * .55, y: H0 * .3, s: U });
  make({ type: "shape", shape: "tri", fill: "accent", x: W0 * .7, y: H0 * .6, s: U * 1.05 });
  make({ type: "shape", shape: "circle", fill: "none", x: W0 * .5, y: H0 * .52, s: U * .8 });
  make({ type: "note", x: W0 * .28, y: H0 * .68, s: U, tilt: -3 });

  /* ---------- 명령 ---------- */
  let lastAct = "–";
  const did = (text, kind = "ok") => { lastAct = text; api.flash(text, kind); };
  const toFront = o => { o.z = maxZ() + 1; draw(o); };
  const dup = o => {
    const c = make({ type: o.type, shape: o.shape, fill: o.fill, s: o.s, tilt: o.tilt, x: o.x + 26, y: o.y + 26 });
    c.el.animate([{ opacity: 0, transform: `${c.type === "note" ? `rotate(${c.tilt}deg) ` : ""}scale(.8)` }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
  };
  const remove = o => {
    objs = objs.filter(x => x !== o);
    const a = o.el.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(.7)" }], { duration: 160, easing: "ease-in", fill: "forwards" });
    a.onfinish = () => o.el.remove();
  };
  const tidy = () => {
    const { w, h } = api.size();
    const list = [...objs].sort((a, b) => a.x - b.x);
    const gap = 24, total = list.reduce((m, o) => m + (o.type === "note" ? o.s * 1.5 : o.s), 0) + gap * (list.length - 1);
    let x = Math.max(24, (w - total) / 2);
    list.forEach(o => {
      const ow = o.type === "note" ? o.s * 1.5 : o.s;
      o.x = x + ow / 2; o.y = h / 2; x += ow + gap;
      o.el.classList.add("anim"); draw(o);
      api.timeout(() => o.el.classList.remove("anim"), 400);
    });
  };

  function menuFor(target, p) {
    if (!target) {
      return { title: "바탕", items: [
        { label: "여기에 도형 추가", sub: ["circle", "square", "tri"].map(sh => ({ label: SHAPE_NAME[sh], icon: icon(sh), run: () => {
          const o = make({ type: "shape", shape: sh, fill: "none", x: p.x, y: p.y, s: U * .9 });
          o.el.animate([{ opacity: 0, transform: "scale(.6)" }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
          did(`${SHAPE_NAME[sh]} 추가`);
        } })) },
        { label: "여기에 메모 추가", run: () => { const o = make({ type: "note", x: p.x, y: p.y, s: U, tilt: 0 }); o.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 }); did("메모 추가"); } },
        "sep",
        { label: "모두 정렬", disabled: objs.length < 2, run: () => { tidy(); did("모두 정렬"); } },
        { label: root.classList.contains("grid") ? "격자 숨기기" : "격자 보이기", run: () => { root.classList.toggle("grid"); did("격자 전환"); } }
      ] };
    }
    const o = target, front = o.z === maxZ();
    const common = [
      { label: "복제", run: () => { dup(o); did(`${nameOf(o)} 복제`); } },
      { label: "맨 앞으로", disabled: front, run: () => { toFront(o); did(`${nameOf(o)} 맨 앞으로`); } },
      "sep",
      { label: "삭제", danger: true, run: () => { did(`${nameOf(o)} 삭제`, "alt"); remove(o); } }
    ];
    if (o.type === "note") {
      return { title: "메모", items: [
        { label: o.tilt ? "바로 세우기" : "기울이기", run: () => { o.tilt = o.tilt ? 0 : -6; draw(o); did(o.tilt ? "메모 기울이기" : "메모 바로 세우기"); } },
        ...common
      ] };
    }
    return { title: nameOf(o), items: [
      { label: "채우기", sub: ["none", "grey", "ink", "accent"].map(f => ({ label: FILL_LABEL[f], icon: icon("square", f), cur: o.fill === f,
        run: () => { o.fill = f; draw(o); did(`채우기 → ${FILL_LABEL[f]}`); } })) },
      { label: "모양", sub: ["circle", "square", "tri"].map(sh => ({ label: SHAPE_NAME[sh], icon: icon(sh), cur: o.shape === sh,
        run: () => { o.shape = sh; draw(o); did(`모양 → ${SHAPE_NAME[sh]}`); } })) },
      ...common
    ] };
  }

  /* ---------- 메뉴 ---------- */
  let menu = null; // { el, spec, items, active, sub, target }
  const W = () => el.clientWidth, H = () => el.clientHeight;

  function place(node, x, y, flipX) {
    const mw = node.offsetWidth, mh = node.offsetHeight, pad = 8;
    let left = x, top = y, ox = "left", oy = "top";
    if (flipX !== undefined ? flipX : x + mw > W() - pad) { left = (flipX !== undefined ? flipX : x) - mw; ox = "right"; }
    if (top + mh > H() - pad) { if (y - mh >= pad) { top = y - mh; oy = "bottom"; } else top = H() - pad - mh; }
    left = clamp(left, pad, W() - pad - mw); top = clamp(top, pad, H() - pad - mh);
    node.style.left = left + "px"; node.style.top = top + "px";
    node.style.transformOrigin = `${ox} ${oy}`;
    return { left, top, mw, mh };
  }
  function appear(node) {
    if (S.anim === "fade") node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: "ease-out" });
    else if (S.anim === "scale") node.animate([{ opacity: 0, transform: "scale(.85)" }, { opacity: 1, transform: "scale(1)" }], { duration: 130, easing: "cubic-bezier(.2,.8,.3,1)" });
  }

  function buildList(node, items, onPick, withInline) {
    const btns = [];
    items.forEach(it => {
      if (it === "sep") { node.insertAdjacentHTML("beforeend", `<div class="cm-sep"></div>`); return; }
      if (it.sub && withInline) {
        const row = document.createElement("div");
        row.className = "cm-inline";
        row.innerHTML = `<span class="lb">${it.label}</span>` + it.sub.map((s, j) => `<button data-j="${j}" title="${s.label}" class="${s.cur ? "cur" : ""}">${s.icon.replace('class="ic" ', "")}</button>`).join("");
        row.querySelectorAll("button").forEach(b => b.addEventListener("click", () => onPick(it.sub[+b.dataset.j])));
        node.appendChild(row);
        return;
      }
      const b = document.createElement("button");
      b.className = "cm-item" + (it.danger ? " danger" : "") + (it.cur ? " cur" : "");
      if (it.disabled) b.disabled = true;
      b.innerHTML = `${it.icon || ""}<span class="lb">${it.label}</span>${it.sub ? `<span class="ar">›</span>` : ""}`;
      node.appendChild(b);
      btns.push({ b, it });
    });
    return btns;
  }

  function openMenu(p, target) {
    closeMenu(true);
    const spec = menuFor(target, p);
    const node = document.createElement("div");
    node.className = "cm-menu";
    node.innerHTML = `<div class="cm-head">${spec.title}</div>`;
    root.appendChild(node);
    menu = { el: node, target, items: [], active: -1, sub: null, p };
    menu.items = buildList(node, spec.items, pick, !S.submenu);
    menu.items.forEach(({ b, it }, i) => {
      b.addEventListener("pointerenter", () => { setActive(i); if (it.sub) openSub(i); else closeSub(); });
      b.addEventListener("click", () => { if (it.sub) openSub(i); else pick(it); });
    });
    const r = place(node, p.x, p.y);
    appear(node);
    if (target && S.mark) showMark(target);
    api.read("target", target ? nameOf(target) : "바탕");
    api.read("pos", `${Math.round(r.left)}, ${Math.round(r.top)}`);
  }
  function setActive(i) {
    if (!menu) return;
    menu.active = i;
    menu.items.forEach(({ b }, j) => b.classList.toggle("on", j === i));
  }
  function openSub(i) {
    if (!menu) return;
    const { b, it } = menu.items[i];
    if (!it.sub || (menu.sub && menu.sub.parent === i)) return;
    closeSub();
    const node = document.createElement("div");
    node.className = "cm-menu";
    root.appendChild(node);
    const items = buildList(node, it.sub, pick, false);
    const sub = { el: node, items, parent: i, active: -1 };
    items.forEach(({ b: sb, it: sit }, j) => {
      sb.addEventListener("pointerenter", () => { sub.active = j; items.forEach(({ b: x }, k) => x.classList.toggle("on", k === j)); });
      sb.addEventListener("click", () => pick(sit));
    });
    const mr = menu.el.getBoundingClientRect(), br = b.getBoundingClientRect(), er = el.getBoundingClientRect();
    const right = mr.right - er.left - 3, left = mr.left - er.left + 3;
    const fits = right + node.offsetWidth <= W() - 8;
    place(node, fits ? right : left, br.top - er.top - 6, fits ? undefined : left);
    appear(node);
    menu.sub = sub;
  }
  function closeSub() { if (menu && menu.sub) { menu.sub.el.remove(); menu.sub = null; } }
  function closeMenu(instant) {
    if (!menu) return;
    const m = menu; menu = null;
    mark.style.display = "none";
    [m.el, m.sub && m.sub.el].filter(Boolean).forEach(n => {
      if (instant || S.anim === "none") n.remove();
      else { const a = n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 90, fill: "forwards" }); a.onfinish = () => n.remove(); }
    });
  }
  function pick(it) {
    if (!it || it.disabled) return;
    closeMenu();
    it.run();
  }
  function showMark(o) {
    const r = o.el.getBoundingClientRect(), er = el.getBoundingClientRect(), pad = 6;
    mark.style.cssText = `display:block;left:${r.left - er.left - pad}px;top:${r.top - er.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px;z-index:${maxZ() + 1}`;
  }

  /* ---------- 입력 ---------- */
  let longPress = null, lastLong = 0, drag = null;

  api.on(root, "contextmenu", e => {
    api.hideHint();
    if (longPress) { clearTimeout(longPress.t); longPress = null; }
    if (S.native === "native" || (S.native === "shift" && e.shiftKey)) {
      closeMenu(true);
      api.flash("브라우저 기본 메뉴 · 무엇을 눌러도 같은 메뉴", "idle");
      api.read("target", "(기본 메뉴)");
      return;
    }
    e.preventDefault();
    if (performance.now() - lastLong < 800) return;
    if (e.target.closest(".cm-menu")) return;
    openMenu(localPoint(el, e), objOf(e.target));
  });

  api.on(root, "pointerdown", e => {
    api.read("button", ["0 · 왼쪽", "1 · 가운데", "2 · 오른쪽"][e.button] || e.button);
    if (e.target.closest(".cm-menu")) return;
    if (menu) { closeMenu(); if (e.button === 0) return; }
    if (e.button !== 0) return;
    const o = objOf(e.target);
    const p = localPoint(el, e);
    if (e.pointerType === "touch") {
      longPress = { x: p.x, y: p.y, t: api.timeout(() => {
        lastLong = performance.now();
        if (drag) { drag.o.el.classList.remove("dragging"); drag = null; }
        openMenu(p, o);
        api.flash("길게 누르기로 메뉴 열기", "ok");
      }, 500) };
    }
    if (!o) return;
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    drag = { o, dx: p.x - o.x, dy: p.y - o.y, moved: false };
  });
  api.on(root, "pointermove", e => {
    const p = localPoint(el, e);
    if (longPress && Math.hypot(p.x - longPress.x, p.y - longPress.y) > 8) { clearTimeout(longPress.t); longPress = null; }
    if (!drag) return;
    drag.moved = true;
    drag.o.el.classList.add("dragging");
    drag.o.x = clamp(p.x - drag.dx, 0, W()); drag.o.y = clamp(p.y - drag.dy, 0, H());
    draw(drag.o);
  });
  const up = () => {
    if (longPress) { clearTimeout(longPress.t); longPress = null; }
    if (drag) { drag.o.el.classList.remove("dragging"); drag = null; }
  };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);

  api.on(window, "keydown", e => {
    if (!menu) return;
    if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
    const list = menu.sub ? menu.sub.items : menu.items;
    const cur = menu.sub ? menu.sub.active : menu.active;
    const step = d => {
      let i = cur;
      for (let k = 0; k < list.length; k++) { i = (i + d + list.length) % list.length; if (!list[i].b.disabled) break; }
      if (menu.sub) { menu.sub.active = i; list.forEach(({ b }, k) => b.classList.toggle("on", k === i)); }
      else { setActive(i); closeSub(); }
    };
    if (e.key === "Escape") { e.preventDefault(); if (menu.sub) closeSub(); else { closeMenu(); did("Esc · 아무것도 하지 않고 닫음", "idle"); } }
    else if (e.key === "ArrowDown") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); step(-1); }
    else if (e.key === "ArrowRight" && !menu.sub && cur >= 0 && list[cur].it.sub) { e.preventDefault(); openSub(cur); if (menu.sub) { menu.sub.active = 0; menu.sub.items[0].b.classList.add("on"); } }
    else if (e.key === "ArrowLeft" && menu.sub) { e.preventDefault(); closeSub(); }
    else if (e.key === "Enter" && cur >= 0) {
      e.preventDefault();
      const it = list[cur].it;
      if (it.sub) { openSub(cur); if (menu.sub) { menu.sub.active = 0; menu.sub.items[0].b.classList.add("on"); } }
      else pick(it);
    }
  });
  api.on(window, "blur", () => closeMenu(true));
  api.onResize(() => closeMenu(true));
  api.onParam(k => {
    if (k === "mark" && menu) { if (S.mark && menu.target) showMark(menu.target); else mark.style.display = "none"; }
    if ((k === "submenu" || k === "native") && menu) closeMenu(true);
  });

  api.frame(() => {
    api.read("last", lastAct);
    if (menu) api.status(menu.sub ? "하위 메뉴 열림" : `메뉴 열림 · ${menu.target ? nameOf(menu.target) : "바탕"}`, "active");
    else if (drag && drag.moved) api.status("옮기는 중 (왼쪽 버튼)", "alt");
    else api.status("대기", "idle");
  });
}
