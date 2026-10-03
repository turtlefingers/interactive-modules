import { clamp, dist, rng, localPoint, fitCanvas } from "../../lib/util.js";
import { ILLO, TONE } from "../../lib/draw.js";
import { drawObject } from "../../lib/objects.js";
import "../../lib/objects/index.js";

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
  const C = { ink: ILLO.ink, ink3: api.color("--ink-3") || "#9a9790", board: api.color("--board") || ILLO.cream };
  const HOT = ILLO.orange; // 집었을 때의 강조색 (장면에 하나)
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

  /* ---------- 대상 만들기 ----------
     바탕(온전한 초콜릿·피자·스티커 시트)은 사물 카탈로그가 그리고, 조각은 카탈로그의 칸·칼선·스티커 자리와 같은 기하로 만든다.
     조각이 자리에 붙어 있는 동안은 카탈로그 그림이 그 조각을 대신하고, 움직이거나 떼어낸 조각만 위에 따로 그린다.
     아래 상수는 src/lib/objects/props.js(chocolate B, pizza A)와 scene.js(sticker-sheet C)의 비례를 옮긴 것이다. */
  let pieces = [], kind = "";
  const piece = (o) => ({ x: o.hx, y: o.hy, tx: o.hx, ty: o.hy, vx: 0, vy: 0, rot: 0, trot: 0, free: false, ...o });
  const base = { draw: () => {}, patch: () => {} }; // 바탕 그리기 · 빠진 자리 메우기(접시·종이·빈 구멍)

  // 초콜릿 B: 30×66 판(아래 가운데 기준), 홈은 y -50 · -34 · -18, 세로 x 0. 포장지가 아래 절반을 덮는다
  const CH = { s: 4, base: 132 };
  const wrapper = c => { const s = CH.s, b = CH.base; c.moveTo(-19 * s, b - 30 * s); c.lineTo(-8 * s, b - 34 * s); c.lineTo(2 * s, b - 28 * s); c.lineTo(12 * s, b - 36 * s); c.lineTo(19 * s, b - 31 * s); c.lineTo(19 * s, b); c.lineTo(-19 * s, b); c.closePath(); };
  // 피자 A: 반지름 30, 접시 38, 칼선 각도 0.15 · 1.2 · 2.25 (가운데를 지나는 세 줄 → 여섯 조각)
  const PZ = { s: 5, r: 150, cuts: [0.15, 1.2, 2.25] };
  // 스티커 시트 C: 폭 0.36h · 높이 0.96h 띠, 아래 가운데 기준 0.05 기울임, 여섯 칸, 스티커 크기 0.7w
  const ST = { h: 440, tilt: 0.05, order: [0, 2, 5, 6, 3, 4] };
  const stickerPath = (k, s) => {
    const p = new Path2D();
    if (k === 0) p.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    else if (k === 2) { p.moveTo(-s * 0.42, s * 0.1); p.quadraticCurveTo(0, -s * 0.5, s * 0.42, -s * 0.1); p.quadraticCurveTo(0, s * 0.5, -s * 0.42, s * 0.1); p.closePath(); }
    else if (k === 3) { p.arc(0, 0, s * 0.4, Math.PI * 0.6, Math.PI * 1.6); p.closePath(); }
    else if (k === 4) p.roundRect(-s * 0.36, -s * 0.36, s * 0.72, s * 0.72, s * 0.14);
    else if (k === 5) { p.moveTo(0, s * 0.42); p.quadraticCurveTo(s * 0.38, 0, 0, -s * 0.42); p.quadraticCurveTo(-s * 0.38, 0, 0, s * 0.42); p.closePath(); }
    else p.roundRect(-s * 0.44, -s * 0.18, s * 0.88, s * 0.36, s * 0.18);
    return p;
  };
  const rotated = (path, ang) => { const q = new Path2D(); q.addPath(path, new DOMMatrix().rotate(ang * 180 / Math.PI)); return q; };

  const build = () => {
    kind = S.target;
    pieces = [];
    if (kind === "bar") {
      const s = CH.s, b = CH.base, cols = 2, rows = [-66, -50, -34, -18, 0].map(v => b + v * s);
      for (let r = 0; r < 4; r++) for (let c = 0; c < cols; c++) {
        const y0 = rows[r], y1 = rows[r + 1], hh = y1 - y0, ww = 15 * s;
        const path = new Path2D(); path.roundRect(-ww / 2 + 1, -hh / 2 + 1, ww - 2, hh - 2, 2);
        const anchors = [];
        if (c > 0) anchors.push([-ww / 2 + 1, -hh * 0.3], [-ww / 2 + 1, hh * 0.3]);
        if (c < cols - 1) anchors.push([ww / 2 - 1, -hh * 0.3], [ww / 2 - 1, hh * 0.3]);
        if (r > 0) anchors.push([-ww * 0.3, -hh / 2 + 1], [ww * 0.3, -hh / 2 + 1]);
        if (r < 3) anchors.push([-ww * 0.3, hh / 2 - 1], [ww * 0.3, hh / 2 - 1]);
        pieces.push(piece({ path, hx: (c - 0.5) * ww, hy: (y0 + y1) / 2, anchors, fill: TONE[4], w: ww, h: hh }));
      }
      base.draw = () => drawObject(g, "chocolate", 0, b, 84 * s, { color: TONE[4] });
      // 빠진 칸은 판을 뚫고 바닥이 보인다. 포장지 아래의 칸은 포장지가 가린다
      base.patch = p => { g.save(); g.beginPath(); g.rect(-400, -400, 800, 800); wrapper(g); g.clip("evenodd"); g.fillStyle = C.board; g.fillRect(p.hx - p.w / 2, p.hy - p.h / 2, p.w, p.h); g.restore(); };
    } else if (kind === "pizza") {
      const R = PZ.r, N = 6, B = [...PZ.cuts, ...PZ.cuts.map(a => a + Math.PI)];
      for (let i = 0; i < N; i++) {
        const a0 = B[i], a1 = B[(i + 1) % N] + (i === N - 1 ? Math.PI * 2 : 0), am = (a0 + a1) / 2;
        const hx = Math.cos(am) * R * 0.55, hy = Math.sin(am) * R * 0.55;
        const path = new Path2D(); path.moveTo(-hx, -hy); path.arc(-hx, -hy, R, a0, a1); path.closePath();
        const anchors = [0.3, 0.6, 0.85].flatMap(k => [[Math.cos(a0 + 0.04) * R * k - hx, Math.sin(a0 + 0.04) * R * k - hy], [Math.cos(a1 - 0.04) * R * k - hx, Math.sin(a1 - 0.04) * R * k - hy]]);
        pieces.push(piece({ path, hx, hy, anchors, pizza: true }));
      }
      base.draw = () => drawObject(g, "pizza", 0, 38 * PZ.s, 84 * PZ.s, { color: ILLO.yellow, accent: HOT });
      base.patch = p => { g.save(); g.translate(p.hx, p.hy); g.fillStyle = TONE[1]; g.fill(p.path); g.restore(); }; // 빠진 자리엔 접시
    } else {
      const H = ST.h, w = 0.36 * H, sh = 0.96 * H, cell = sh / 6, s = w * 0.7, by = sh / 2, ct = Math.cos(ST.tilt), st = Math.sin(ST.tilt);
      for (let i = 0; i < 6; i++) {
        const lx = (i % 2 ? 1 : -1) * w * 0.04, ly = -sh + cell * (i + 0.5); // 시트 아래 가운데 기준, 기울이기 전
        const hx = lx * ct - ly * st, hy = by + lx * st + ly * ct;
        const path = rotated(stickerPath(ST.order[i], s), ST.tilt + (i - 2) * 0.1);
        const anchors = [[-s * 0.3, -s * 0.3], [s * 0.3, -s * 0.3], [-s * 0.3, s * 0.3], [s * 0.3, s * 0.3]];
        pieces.push(piece({ path, hx, hy, anchors, fill: i === 3 ? ILLO.pink : [TONE[3], TONE[2], TONE[4]][i % 3] }));
      }
      base.draw = () => drawObject(g, "sticker-sheet", 0, by, H, { color: ILLO.pink });
      base.patch = p => { g.save(); g.translate(p.hx, p.hy); g.fillStyle = ILLO.paper; g.fill(p.path); g.restore(); }; // 뗀 자리엔 종이
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
    h.p.trot = (rand() - 0.5) * 0.35;
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
    if (!h.broken) { p.tx = p.hx; p.ty = p.hy; if (h.pull > 4) api.flash("저항 한계 전에 놓음 → 조각이 제자리로 돌아간다", "idle"); return; }
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
  // 조각: 초콜릿 칸과 스티커는 단색 면, 피자 조각은 카탈로그 피자를 조각 모양으로 오려 낸다. 집으면 강조색
  const drawPiece = (p, hot) => {
    g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
    if (p.pizza) {
      g.clip(p.path);
      drawObject(g, "pizza", -p.hx, -p.hy + 38 * PZ.s, 84 * PZ.s, hot ? { color: HOT, accent: HOT } : { color: ILLO.yellow, accent: HOT });
    } else { g.fillStyle = hot ? HOT : p.fill; g.fill(p.path); }
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

    // 바탕: 카탈로그의 온전한 초콜릿 판 · 피자 한 판 · 스티커 시트
    base.draw();

    const moved = p => p.free || Math.hypot(p.x - p.hx, p.y - p.hy) > 1;
    const shown = p => moved(p) || (held && held.p === p); // 자리에서 벗어났거나 집은 조각만 따로 그린다
    pieces.forEach(p => { if (shown(p)) base.patch(p); });
    pieces.forEach(p => { if (moved(p)) drawHole(p); });

    const o = order();
    o.forEach(p => { if (!p.free && shown(p)) drawPiece(p, held && held.p === p); });

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
