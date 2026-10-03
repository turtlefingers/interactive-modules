import { clamp, PALETTE, localPoint } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;
  const HEAD = 32;

  api.css(`
    .node-wiring-root { position: absolute; inset: 0; background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
    .node-wiring-root.dragging, .node-wiring-root.dragging * { cursor: crosshair !important; }
    .node-wiring-root.moving, .node-wiring-root.moving * { cursor: grabbing !important; }
    .node-wiring-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
    .node-wiring-link .base { fill: none; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; transition: stroke-width .15s, opacity .15s; }
    .node-wiring-link .flow { fill: none; stroke: rgba(255,255,255,.9); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1 13; pointer-events: none; transition: opacity .25s; }
    .node-wiring-link .hit { fill: none; stroke: transparent; stroke-width: 18; cursor: pointer; pointer-events: stroke; }
    .node-wiring-link:hover .base { stroke-width: 7; opacity: .6; }
    .node-wiring-link.gone { opacity: 0; transition: opacity .2s; }
    .node-wiring-ring { fill: none; stroke: var(--accent); stroke-width: 1; stroke-dasharray: 3 4; opacity: .55; pointer-events: none; }
    .node-wiring-node { position: absolute; left: 0; top: 0; background: var(--note); border-radius: var(--r-card);
      box-shadow: 0 0 0 1px rgba(27,27,26,.18); font-size: 13px; color: var(--ink); }
    .node-wiring-node .head { height: ${HEAD}px; display: flex; align-items: center; gap: 8px; padding: 0 12px; font-weight: 700;
      border-bottom: 1px solid var(--note-line); cursor: grab; border-radius: var(--r-card) var(--r-card) 0 0; }
    .node-wiring-node .head i { width: 8px; height: 8px; border-radius: 50%; background: var(--ink-3); flex: none; }
    .node-wiring-node .head small { margin-left: auto; font-weight: 500; color: var(--ink-3); font-size: 11px; }
    .node-wiring-node .sw { position: absolute; border-radius: 6px; box-shadow: inset 0 0 0 1px rgba(0,0,0,.08); transition: background .25s; }
    .node-wiring-node .sw.pick { cursor: pointer; }
    .node-wiring-node .sw.pick:hover { box-shadow: inset 0 0 0 2px rgba(0,0,0,.25); }
    .node-wiring-node .sw.empty { background: repeating-linear-gradient(135deg, transparent 0 6px, rgba(0,0,0,.07) 6px 12px) !important; }
    .node-wiring-node .lbl { position: absolute; font-size: 11px; color: var(--ink-2); transform: translateY(-50%); }
    .node-wiring-node .val { position: absolute; left: 0; right: 0; text-align: center; font-size: 11px; color: var(--ink-2); font-family: var(--mono); }
    .node-wiring-port { position: absolute; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%;
      background: var(--note); border: 3px solid var(--ink-2); cursor: crosshair; box-sizing: border-box;
      transition: transform .15s, border-color .15s, background .15s; z-index: 2; }
    .node-wiring-port::before { content: ""; position: absolute; inset: -10px; border-radius: 50%; }
    .node-wiring-port:hover { transform: scale(1.3); border-color: var(--ink); }
    .node-wiring-port.on { background: var(--ink-2); }
    .node-wiring-port.can { transform: scale(1.45); border-color: var(--accent); }
    .node-wiring-port.hot { transform: scale(1.8); border-color: var(--accent); background: var(--accent); }
  `);

  const root = document.createElement("div");
  root.className = "node-wiring-root";
  el.appendChild(root);
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "node-wiring-svg");
  root.appendChild(svg);
  const ringLayer = document.createElementNS(NS, "g"); svg.appendChild(ringLayer);
  const linkLayer = document.createElementNS(NS, "g"); svg.appendChild(linkLayer);
  const dragLayer = document.createElementNS(NS, "g"); svg.appendChild(dragLayer);

  const COLORS = PALETTE.slice(0, 6);
  const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const rgb2hex = c => "#" + c.map(v => Math.round(v).toString(16).padStart(2, "0")).join("");

  /* ---------- 노드 정의 ---------- */
  // ins/outs: 단자 y 오프셋 (노드 위쪽 기준)
  const nodes = [
    { id: "a", kind: "src", title: "색 A", col: 0, fx: 0.06, fy: 0.14, h: HEAD + 64, ins: [], outs: [HEAD + 32] },
    { id: "b", kind: "src", title: "색 B", col: 1, fx: 0.06, fy: 0.40, h: HEAD + 64, ins: [], outs: [HEAD + 32] },
    { id: "c", kind: "src", title: "색 C", col: 3, fx: 0.06, fy: 0.66, h: HEAD + 64, ins: [], outs: [HEAD + 32] },
    { id: "mix", kind: "mix", title: "믹서", fx: 0.40, fy: 0.30, h: HEAD + 96, ins: [HEAD + 26, HEAD + 70], outs: [HEAD + 48], inNames: ["A", "B"] },
    { id: "out", kind: "out", title: "화면", fx: 0.72, fy: 0.34, h: HEAD + 124, ins: [HEAD + 62], outs: [] }
  ];
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  let NW = 150;

  nodes.forEach(n => {
    const d = document.createElement("div");
    d.className = "node-wiring-node";
    d.style.height = n.h + "px";
    let body = `<div class="head"><i></i>${n.title}<small>${n.kind === "src" ? "출력" : n.kind === "mix" ? "섞기" : "입력"}</small></div>`;
    if (n.kind === "src") body += `<div class="sw pick" title="클릭하면 색이 바뀐다"></div>`;
    if (n.kind === "mix") { body += `<div class="lbl">A</div><div class="lbl">B</div><div class="sw"></div>`; }
    if (n.kind === "out") body += `<div class="sw"></div><div class="val"></div>`;
    d.innerHTML = body;
    n.el = d; n.sw = d.querySelector(".sw"); n.val = d.querySelector(".val");
    n.lbls = [...d.querySelectorAll(".lbl")];
    n.portEls = { in: [], out: [] };
    n.ins.forEach((y, i) => { const p = document.createElement("span"); p.className = "node-wiring-port"; p.dataset.node = n.id; p.dataset.dir = "in"; p.dataset.i = i; d.appendChild(p); n.portEls.in.push(p); });
    n.outs.forEach((y, i) => { const p = document.createElement("span"); p.className = "node-wiring-port"; p.dataset.node = n.id; p.dataset.dir = "out"; p.dataset.i = i; d.appendChild(p); n.portEls.out.push(p); });
    root.appendChild(d);
  });

  function layoutNodes(first) {
    const { w, h } = api.size();
    const oldNW = NW;
    NW = w < 560 ? 112 : 150;
    nodes.forEach(n => {
      if (first || n.x === undefined) {
        n.y = n.fy * h;
        if (w < 560) n.x = n.kind === "src" ? 8 : n.kind === "mix" ? (w - NW) / 2 : w - NW - 8;
        else n.x = n.kind === "out" ? Math.min(n.fx * w, w - NW - 24) : n.fx * w;
      }
      n.x = clamp(n.x, 8, Math.max(8, w - NW - 8)); n.y = clamp(n.y, 56, Math.max(56, h - n.h - 64));
      n.el.style.width = NW + "px";
      const pad = 12;
      if (n.kind === "src") Object.assign(n.sw.style, { left: pad + "px", right: pad + 8 + "px", top: HEAD + 12 + "px", height: "40px" });
      if (n.kind === "mix") {
        Object.assign(n.sw.style, { left: "34px", right: "22px", top: HEAD + 30 + "px", height: "36px" });
        n.lbls.forEach((l, i) => { l.style.left = "14px"; l.style.top = n.ins[i] + "px"; });
      }
      if (n.kind === "out") { Object.assign(n.sw.style, { left: "20px", right: pad + "px", top: HEAD + 12 + "px", height: "78px" }); n.val.style.top = HEAD + 98 + "px"; }
      n.portEls.in.forEach((p, i) => { p.style.left = "0px"; p.style.top = n.ins[i] + "px"; });
      n.portEls.out.forEach((p, i) => { p.style.left = NW + "px"; p.style.top = n.outs[i] + "px"; });
    });
    if (oldNW !== NW) nodes.forEach(n => { n.x = clamp(n.x, 8, Math.max(8, api.size().w - NW - 8)); });
  }
  layoutNodes(true);
  api.onResize(() => layoutNodes(false));

  const portPos = (nodeId, dir, i) => {
    const n = byId[nodeId];
    return dir === "out" ? { x: n.x + NW, y: n.y + n.outs[i] } : { x: n.x, y: n.y + n.ins[i] };
  };
  const nodeName = (id, dir, i) => {
    const n = byId[id];
    if (dir === "out") return `${n.title} · 출력`;
    return n.inNames ? `${n.title} · 입력 ${n.inNames[i]}` : `${n.title} · 입력`;
  };

  /* ---------- 연결 ---------- */
  const links = []; // { from: nodeId, to: nodeId, i: inputIndex, g, base, flow, hit }
  function addLink(from, to, i) {
    for (let k = links.length - 1; k >= 0; k--) if (links[k].to === to && links[k].i === i) removeLink(links[k], true);
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "node-wiring-link");
    const base = document.createElementNS(NS, "path"); base.setAttribute("class", "base");
    const flow = document.createElementNS(NS, "path"); flow.setAttribute("class", "flow");
    const hit = document.createElementNS(NS, "path"); hit.setAttribute("class", "hit");
    const title = document.createElementNS(NS, "title"); title.textContent = "클릭하면 연결이 끊어진다";
    hit.appendChild(title);
    g.append(base, flow, hit);
    linkLayer.appendChild(g);
    const L = { from, to, i, g, base, flow, hit };
    hit.addEventListener("pointerdown", e => {
      e.preventDefault(); e.stopPropagation();
      removeLink(L);
      api.flash(`연결을 끊었다 · ${byId[from].title} → ${byId[to].title}`, "alt");
      api.hideHint();
    });
    links.push(L);
    return L;
  }
  function removeLink(L, instant) {
    const k = links.indexOf(L);
    if (k >= 0) links.splice(k, 1);
    if (instant) { L.g.remove(); return; }
    L.g.classList.add("gone");
    L.hit.style.pointerEvents = "none";
    api.timeout(() => L.g.remove(), 220);
  }
  addLink("a", "mix", 0);
  addLink("b", "mix", 1);

  /* ---------- 케이블 모양 ---------- */
  function cablePath(p1, p2) {
    // p1: 출력 쪽, p2: 입력 쪽
    if (S.cable === "straight") return `M${p1.x},${p1.y} L${p2.x},${p2.y}`;
    if (S.cable === "ortho") {
      if (p2.x > p1.x + 32) {
        const mx = (p1.x + p2.x) / 2;
        return `M${p1.x},${p1.y} H${mx} V${p2.y} H${p2.x}`;
      }
      const my = (p1.y + p2.y) / 2;
      return `M${p1.x},${p1.y} H${p1.x + 20} V${my} H${p2.x - 20} V${p2.y} H${p2.x}`;
    }
    const dx = Math.max(50, Math.abs(p2.x - p1.x) * 0.5);
    return `M${p1.x},${p1.y} C${p1.x + dx},${p1.y} ${p2.x - dx},${p2.y} ${p2.x},${p2.y}`;
  }

  /* ---------- 값 흐름 ---------- */
  const values = {};
  function compute() {
    nodes.forEach(n => { if (n.kind === "src") values[n.id] = hex2rgb(COLORS[n.col]); });
    const inputOf = (id, i) => { const L = links.find(l => l.to === id && l.i === i); return L ? values[L.from] || null : null; };
    const A = inputOf("mix", 0), B = inputOf("mix", 1);
    values.mix = A && B ? A.map((v, k) => (v + B[k]) / 2) : A || B || null;
    values.out = inputOf("out", 0);
  }

  /* ---------- 끌기 ---------- */
  const drag = { on: false, anchor: null, x: 0, y: 0, snap: null, near: Infinity, id: -1, path: null, flow: null };
  const moveNode = { on: false, n: null, ox: 0, oy: 0, id: -1 };
  const retracts = []; // 놓친 선이 빨려 들어가는 애니메이션

  const compatible = (anchor, node, dir) => node !== anchor.node && dir !== anchor.dir;
  function allPorts() {
    const list = [];
    nodes.forEach(n => {
      n.ins.forEach((_, i) => list.push({ node: n.id, dir: "in", i, el: n.portEls.in[i] }));
      n.outs.forEach((_, i) => list.push({ node: n.id, dir: "out", i, el: n.portEls.out[i] }));
    });
    return list;
  }
  const PORTS = allPorts();

  function startCable(anchor, x, y) {
    drag.on = true; drag.anchor = anchor; drag.x = x; drag.y = y; drag.snap = null;
    const color = anchor.dir === "out" ? values[anchor.node] : null;
    drag.path = document.createElementNS(NS, "path");
    drag.path.setAttribute("class", "base");
    drag.path.style.cssText = `fill:none;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke:${color ? rgb2hex(color) : api.color("--ink-3")}`;
    dragLayer.appendChild(drag.path);
    root.classList.add("dragging");
    // 연결 가능한 단자 표시
    ringLayer.innerHTML = "";
    PORTS.forEach(p => {
      if (!compatible(anchor, p.node, p.dir)) return;
      p.el.classList.toggle("can", S.highlight);
      if (S.highlight) {
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("class", "node-wiring-ring"); c.setAttribute("r", S.snap);
        c.dataset.port = `${p.node}:${p.dir}:${p.i}`;
        ringLayer.appendChild(c);
      }
    });
    api.hideHint();
  }

  api.on(root, "pointerdown", e => {
    const port = e.target.closest(".node-wiring-port");
    const head = e.target.closest(".head");
    const pick = e.target.closest(".sw.pick");
    const p = localPoint(el, e);
    if (port) {
      e.preventDefault();
      root.setPointerCapture(e.pointerId);
      drag.id = e.pointerId;
      const node = port.dataset.node, dir = port.dataset.dir, i = +port.dataset.i;
      if (dir === "in") {
        const L = links.find(l => l.to === node && l.i === i);
        if (L) {
          // 연결된 입력 단자를 끌면 선이 뽑혀 나온다
          removeLink(L, true);
          compute();
          startCable({ node: L.from, dir: "out", i: 0 }, p.x, p.y);
          api.flash("선을 뽑았다 · 다른 단자에 꽂거나 놓아서 버리기", "alt");
          return;
        }
      }
      startCable({ node, dir, i }, p.x, p.y);
      return;
    }
    if (pick) {
      const n = nodes.find(q => q.el === pick.closest(".node-wiring-node"));
      n.col = (n.col + 1) % COLORS.length;
      api.flash(`${n.title}의 색을 바꿨다 · 이어진 노드가 따라 바뀐다`, "ok");
      api.hideHint();
      return;
    }
    if (head) {
      e.preventDefault();
      const n = nodes.find(q => q.el === head.parentElement);
      root.setPointerCapture(e.pointerId);
      moveNode.on = true; moveNode.n = n; moveNode.ox = p.x - n.x; moveNode.oy = p.y - n.y; moveNode.id = e.pointerId;
      root.appendChild(n.el); // 맨 앞으로
      root.classList.add("moving");
    }
  });
  api.on(root, "pointermove", e => {
    const p = localPoint(el, e);
    if (moveNode.on && e.pointerId === moveNode.id) {
      const { w, h } = api.size(), n = moveNode.n;
      n.x = clamp(p.x - moveNode.ox, 4, w - NW - 4); n.y = clamp(p.y - moveNode.oy, 4, h - n.h - 4);
      return;
    }
    if (!drag.on || e.pointerId !== drag.id) return;
    drag.x = p.x; drag.y = p.y;
  });
  const end = e => {
    if (moveNode.on && e.pointerId === moveNode.id) { moveNode.on = false; root.classList.remove("moving"); return; }
    if (!drag.on || e.pointerId !== drag.id) return;
    drag.on = false;
    root.classList.remove("dragging");
    PORTS.forEach(p => p.el.classList.remove("can", "hot"));
    ringLayer.innerHTML = "";
    const a = drag.anchor;
    if (drag.snap) {
      const s = drag.snap;
      const out = a.dir === "out" ? a : s, inp = a.dir === "out" ? s : a;
      addLink(out.node, inp.node, inp.i);
      drag.path.remove();
      api.flash(`연결됨 · ${byId[out.node].title} → ${byId[inp.node].title}`, "ok");
    } else {
      const ap = portPos(a.node, a.dir, a.i);
      retracts.push({ path: drag.path, a, x: drag.x, y: drag.y, sx: drag.x, sy: drag.y, t: 0, ap });
    }
    drag.path = null; drag.snap = null;
  };
  api.on(root, "pointerup", end);
  api.on(root, "pointercancel", end);

  api.onParam(k => {
    if (k === "flow") links.forEach(L => { L.flow.style.opacity = S.flow ? 1 : 0; });
  });

  /* ---------- 루프 ---------- */
  let dash = 0;
  api.frame(dt => {
    compute();
    nodes.forEach(n => {
      n.el.style.transform = `translate(${n.x}px, ${n.y}px)`;
      const v = values[n.id];
      const dot = n.el.querySelector(".head i");
      dot.style.background = v ? rgb2hex(v) : "";
      if (n.sw) {
        n.sw.classList.toggle("empty", !v);
        n.sw.style.background = v ? rgb2hex(v) : "";
      }
      if (n.val) n.val.textContent = v ? rgb2hex(v) : "신호 없음";
      n.portEls.in.forEach((pe, i) => pe.classList.toggle("on", links.some(l => l.to === n.id && l.i === i)));
      n.portEls.out.forEach(pe => pe.classList.toggle("on", links.some(l => l.from === n.id)));
    });

    dash -= dt * 0.045;
    const grey = api.color("--ink-3");
    links.forEach(L => {
      const d = cablePath(portPos(L.from, "out", 0), portPos(L.to, "in", L.i));
      L.base.setAttribute("d", d); L.flow.setAttribute("d", d); L.hit.setAttribute("d", d);
      const v = values[L.from];
      L.base.style.stroke = v ? rgb2hex(v) : grey;
      L.flow.style.opacity = S.flow && v ? 1 : 0;
      L.flow.style.strokeDashoffset = dash;
    });

    // 끄는 선
    let near = Infinity;
    if (drag.on) {
      const a = drag.anchor;
      let best = null;
      PORTS.forEach(p => {
        if (!compatible(a, p.node, p.dir)) return;
        const pp = portPos(p.node, p.dir, p.i);
        const d = Math.hypot(pp.x - drag.x, pp.y - drag.y);
        if (d < near) { near = d; best = { ...p, pp }; }
      });
      drag.snap = best && near <= S.snap ? best : null;
      PORTS.forEach(p => p.el.classList.toggle("hot", !!drag.snap && p.el === drag.snap.el));
      ringLayer.querySelectorAll("circle").forEach(c => {
        const [n, dir, i] = c.dataset.port.split(":");
        const pp = portPos(n, dir, +i);
        c.setAttribute("cx", pp.x); c.setAttribute("cy", pp.y); c.setAttribute("r", S.snap);
      });
      const ap = portPos(a.node, a.dir, a.i);
      const loose = drag.snap ? drag.snap.pp : { x: drag.x, y: drag.y };
      drag.path.setAttribute("d", a.dir === "out" ? cablePath(ap, loose) : cablePath(loose, ap));
    }
    for (let k = retracts.length - 1; k >= 0; k--) {
      const r = retracts[k];
      r.t = Math.min(1, r.t + dt / 200);
      const e = 1 - Math.pow(1 - r.t, 3);
      const ap = portPos(r.a.node, r.a.dir, r.a.i);
      const x = r.sx + (ap.x - r.sx) * e, y = r.sy + (ap.y - r.sy) * e;
      r.path.setAttribute("d", r.a.dir === "out" ? cablePath(ap, { x, y }) : cablePath({ x, y }, ap));
      r.path.style.opacity = 1 - e * 0.6;
      if (r.t >= 1) { r.path.remove(); retracts.splice(k, 1); }
    }

    // 읽는 값
    api.read("from", drag.on ? nodeName(drag.anchor.node, drag.anchor.dir, drag.anchor.i) : "–");
    api.read("near", drag.on && near < Infinity ? Math.round(near) : "–");
    api.read("links", links.length);
    api.read("out", values.out ? rgb2hex(values.out) : "신호 없음");

    if (drag.on && drag.snap) api.status(`단자에 달라붙음 · 놓으면 ${nodeName(drag.snap.node, drag.snap.dir, drag.snap.i)}에 연결`, "ok");
    else if (drag.on) api.status("선을 반대쪽 단자에 가까이 가져가면 → 달라붙는다", "active");
    else if (moveNode.on) api.status(`${moveNode.n.title} 노드를 옮기는 중 · 선이 따라온다`, "alt");
    else api.status(values.out ? "화면 노드가 색을 받고 있다" : "대기 · 화면 노드에 아직 신호가 없다", "idle");
  });
}
