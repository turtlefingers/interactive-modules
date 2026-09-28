import { clamp, dist, rng, localPoint, fitCanvas } from "../../lib/util.js";
import { ILLO, face, circle as inkCircle } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .break-apart-root { position: absolute; inset: 0; background: var(--board); }
    .break-apart-root.is-over { cursor: grab; }
    .break-apart-root.is-holding { cursor: grabbing; }
  `);
  const root = document.createElement("div");
  root.className = "break-apart-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const C = { ink: ILLO.ink, ink3: api.color("--ink-3") || "#9a9790" };
  const LW = 3;   // 그림 선 굵기 (화면 px 기준, 키트와 동일)
  // 대상별 평면 단색: [기본, 집었을 때]
  const FILLS = { bar: [ILLO.orange, ILLO.yellow], pizza: [ILLO.yellow, ILLO.orange], character: [ILLO.blue, ILLO.yellow] };
  const rand = rng(11);

  /* ---------- 좌표: 가운데 기준 설계 좌표(약 640×480)를 화면에 맞춘다 ---------- */
  const V = { cx: 0, cy: 0, sc: 1 };
  const fit = () => {
    V.cx = size.w / 2; V.cy = size.h * 0.52;
    V.sc = clamp(Math.min(size.w / 640, size.h / 560), 0.42, 1.5);
  };
  fit();
  api.onResize(fit);
  const toDesign = p => ({ x: (p.x - V.cx) / V.sc, y: (p.y - V.cy) / V.sc });

  /* ---------- 대상 만들기 ---------- */
  let pieces = [], kind = "";
  const roundRect = (p, x, y, w, h, r) => {
    p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r);
    p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath();
  };
  const piece = (o) => ({ x: o.hx, y: o.hy, tx: o.hx, ty: o.hy, vx: 0, vy: 0, rot: 0, trot: 0, free: false, ...o });

  const build = () => {
    kind = S.target;
    pieces = [];
    if (kind === "bar") {
      const CW = 86, CH = 66, cols = 4, rows = 3;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const path = new Path2D(); roundRect(path, -CW / 2 + 3, -CH / 2 + 3, CW - 6, CH - 6, 5);
        const anchors = [];
        if (c > 0) anchors.push([-CW / 2 + 3, -12], [-CW / 2 + 3, 12]);
        if (c < cols - 1) anchors.push([CW / 2 - 3, -12], [CW / 2 - 3, 12]);
        if (r > 0) anchors.push([-16, -CH / 2 + 3], [16, -CH / 2 + 3]);
        if (r < rows - 1) anchors.push([-16, CH / 2 - 3], [16, CH / 2 - 3]);
        pieces.push(piece({ path, hx: (c - (cols - 1) / 2) * CW, hy: (r - (rows - 1) / 2) * CH, anchors,
          deco: gg => { gg.strokeStyle = C.ink; gg.lineWidth = LW / V.sc; gg.lineJoin = "round"; gg.beginPath(); gg.roundRect(-CW / 2 + 15, -CH / 2 + 15, CW - 30, CH - 30, 3); gg.stroke(); } }));
      }
    } else if (kind === "pizza") {
      const R = 170, N = 8;
      for (let i = 0; i < N; i++) {
        const a0 = i / N * Math.PI * 2 - Math.PI / 2, a1 = (i + 1) / N * Math.PI * 2 - Math.PI / 2, am = (a0 + a1) / 2;
        const hx = Math.cos(am) * R * 0.55, hy = Math.sin(am) * R * 0.55;
        const path = new Path2D(); path.moveTo(-hx, -hy); path.arc(-hx, -hy, R, a0, a1); path.closePath();
        const anchors = [0.3, 0.6, 0.85].flatMap(k => [[Math.cos(a0 + 0.04) * R * k - hx, Math.sin(a0 + 0.04) * R * k - hy], [Math.cos(a1 - 0.04) * R * k - hx, Math.sin(a1 - 0.04) * R * k - hy]]);
        const tops = [0.4, 0.72].map((k, j) => { const a = am + (j ? -0.12 : 0.14); return [Math.cos(a) * R * k - hx, Math.sin(a) * R * k - hy]; });
        pieces.push(piece({ path, hx, hy, anchors,
          deco: gg => {
            // 가장자리 빵 테두리 선과 페퍼로니 (평면 단색 + 외곽선)
            gg.strokeStyle = C.ink; gg.lineWidth = LW / V.sc; gg.lineCap = "round";
            gg.beginPath(); gg.arc(-hx, -hy, R - 18, a0 + 0.04, a1 - 0.04); gg.stroke();
            tops.forEach(([x, y]) => inkCircle(gg, x, y, 10, { fill: ILLO.red, lw: LW / V.sc }));
          } }));
      }
    } else {
      // 캐릭터: 몸통은 떨어지지 않고, 귀, 팔, 다리, 코를 떼어낼 수 있다
      // 부위는 키트의 tube/도형처럼 뭉툭한 캡슐과 원 (3px 외곽선, 평면 단색)
      const part = (hx, hy, make, joint, fill) => {
        const path = new Path2D(); make(path);
        pieces.push(piece({ path, hx, hy, anchors: [[joint[0] - 5, joint[1]], [joint[0] + 5, joint[1]]], joint, fill }));
      };
      part(-62, -118, p => p.arc(0, 0, 28, 0, Math.PI * 2), [8, 22]);
      part(62, -118, p => p.arc(0, 0, 28, 0, Math.PI * 2), [-8, 22]);
      part(-132, 10, p => roundRect(p, -38, -15, 76, 30, 15), [30, 0]);
      part(132, 10, p => roundRect(p, -38, -15, 76, 30, 15), [-30, 0]);
      part(-44, 142, p => roundRect(p, -17, -36, 34, 72, 16), [0, -28], ILLO.ink);
      part(44, 142, p => roundRect(p, -17, -36, 34, 72, 16), [0, -28], ILLO.ink);
      part(0, -10, p => p.arc(0, 0, 13, 0, Math.PI * 2), [0, 0], ILLO.red);
    }
    held = null;
  };
  let held = null;   // { p, sx, sy, ox, oy, broken }
  build();

  /* ---------- 포인터 ---------- */
  const hitTest = (p, d) => {
    const c = Math.cos(-p.rot), s = Math.sin(-p.rot);
    const lx = (d.x - p.x) * c - (d.y - p.y) * s, ly = (d.x - p.x) * s + (d.y - p.y) * c;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    const hit = g.isPointInPath(p.path, lx, ly);
    g.restore();
    return hit;
  };
  const order = () => [...pieces.filter(p => !p.free), ...pieces.filter(p => p.free && (!held || held.p !== p)), ...(held ? [held.p] : [])];
  const pick = d => { const o = order(); for (let i = o.length - 1; i >= 0; i--) if (hitTest(o[i], d)) return o[i]; return null; };
  const breakOff = (h, d) => {
    h.broken = true; h.p.free = true;
    h.p.trot = kind === "character" ? 0 : (rand() - 0.5) * 0.35;
    h.p.tx = d.x + h.ox; h.p.ty = d.y + h.oy;
    api.flash("떼어냈다", "ok", 900);
  };

  api.on(root, "pointerdown", e => {
    e.preventDefault();
    const pt = localPoint(root, e), d = toDesign(pt);
    const p = pick(d);
    if (!p) return;
    root.setPointerCapture(e.pointerId);
    held = { p, sx: pt.x, sy: pt.y, ox: p.x - d.x, oy: p.y - d.y, broken: p.free, pull: 0 };
    if (!p.free && S.threshold <= 0) breakOff(held, d);
    root.classList.add("is-holding");
    api.hideHint();
  });
  api.on(root, "pointermove", e => {
    const pt = localPoint(root, e), d = toDesign(pt);
    if (!held) { root.classList.toggle("is-over", !!pick(d)); return; }
    const p = held.p;
    const rx = pt.x - held.sx, ry = pt.y - held.sy;
    held.pull = Math.hypot(rx, ry);
    if (held.broken) {
      p.tx = clamp(d.x + held.ox, -V.cx / V.sc, (size.w - V.cx) / V.sc);
      p.ty = clamp(d.y + held.oy, -V.cy / V.sc, (size.h - V.cy) / V.sc);
      return;
    }
    if (held.pull >= S.threshold) { breakOff(held, d); return; }
    // 저항: 한계 전까지는 당긴 거리의 일부만 늘어난다
    p.tx = p.hx + rx * 0.3 / V.sc; p.ty = p.hy + ry * 0.3 / V.sc;
  });
  const up = () => {
    if (!held) return;
    const h = held, p = h.p;
    held = null;
    root.classList.remove("is-holding");
    if (!h.broken) { p.tx = p.hx; p.ty = p.hy; if (h.pull > 4) api.flash("저항을 넘지 못해 제자리로 돌아간다", "idle"); return; }
    if (S.reattach && dist(p.tx, p.ty, p.hx, p.hy) < 55) {
      p.tx = p.hx; p.ty = p.hy; p.trot = 0; p.free = false;
      api.flash("제자리에 다시 붙였다", "ok");
    }
  };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);

  api.onParam(k => {
    if (k === "target") { build(); root.classList.remove("is-holding"); }
  });

  /* ---------- 그리기 ---------- */
  const drawPiece = (p, hot) => {
    g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
    g.fillStyle = hot ? FILLS[kind][1] : (p.fill || FILLS[kind][0]); g.fill(p.path);
    g.strokeStyle = C.ink; g.lineWidth = LW / V.sc; g.lineJoin = "round"; g.stroke(p.path);
    if (p.deco) p.deco(g);
    g.restore();
  };
  const drawHole = p => {
    g.save(); g.translate(p.hx, p.hy);
    g.setLineDash([5 / V.sc, 5 / V.sc]); g.strokeStyle = C.ink3; g.lineWidth = 1 / V.sc; g.stroke(p.path); g.setLineDash([]);
    g.restore();
  };

  api.frame(() => {
    for (const p of pieces) {
      const tight = held && held.p === p;
      const k = tight ? 0.5 : 0.2, damp = tight ? 0.45 : 0.68;
      p.vx = (p.vx + (p.tx - p.x) * k) * damp; p.vy = (p.vy + (p.ty - p.y) * k) * damp;
      p.x += p.vx; p.y += p.vy;
      p.rot += (p.trot - p.rot) * 0.2;
    }

    const { w, h } = size;
    g.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    g.translate(V.cx, V.cy); g.scale(V.sc, V.sc);

    // 떼어낼 수 없는 바탕: 접시, 몸통
    if (kind === "pizza") inkCircle(g, 0, 0, 192, { fill: ILLO.paper, lw: LW / V.sc });
    if (kind === "character") inkCircle(g, 0, 10, 100, { fill: FILLS.character[0], lw: LW / V.sc });

    const moved = p => p.free || Math.hypot(p.x - p.hx, p.y - p.hy) > 1;
    pieces.forEach(p => { if (moved(p)) drawHole(p); });

    // 캐릭터 얼굴(키트): 무언가를 떼어내는 중이면 놀란 얼굴
    if (kind === "character") {
      const pulling = held && !held.broken && held.pull > 4;
      face(g, 0, 10, 100, { mood: pulling ? "surprised" : "happy", lw: LW / V.sc, eyeGap: 0.36 });
    }

    const o = order();
    o.forEach(p => { if (!p.free) drawPiece(p, held && held.p === p); });

    // 당기는 동안의 저항선 (붙어 있던 자리와 조각을 잇는 선)
    if (held && !held.broken) {
      const p = held.p, stretch = Math.hypot(p.x - p.hx, p.y - p.hy);
      if (stretch > 0.5) {
        g.strokeStyle = C.ink; g.lineWidth = Math.max(0.5, 1.5 - stretch / 40) / V.sc;
        g.beginPath();
        p.anchors.forEach(([ax, ay]) => { g.moveTo(p.hx + ax, p.hy + ay); g.lineTo(p.x + ax, p.y + ay); });
        g.stroke();
      }
    }
    o.forEach(p => { if (p.free) drawPiece(p, held && held.p === p); });

    // 읽는 값과 상태
    const n = pieces.filter(p => p.free).length;
    api.read("pull", held ? Math.round(held.pull) : 0);
    api.read("need", S.threshold);
    api.read("count", `${n} / ${pieces.length}`);
    if (held && !held.broken) api.status(`당기는 중 · 저항 ${Math.round(clamp(held.pull / Math.max(1, S.threshold), 0, 1) * 100)}%`, "active");
    else if (held) api.status("떼어낸 조각을 옮기는 중", "alt");
    else api.status("대기", "idle");
  });
}
