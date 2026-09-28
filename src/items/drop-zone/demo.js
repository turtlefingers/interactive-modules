import { clamp, dist, localPoint, fitCanvas } from "../../lib/util.js";
import { ILLO, shape, tube, circle as kCircle, ellipse as kEllipse, leaf as kLeaf } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .drop-zone-root { position: absolute; inset: 0; background: var(--board); }
    .drop-zone-root.is-over { cursor: grab; }
    .drop-zone-root.is-holding { cursor: grabbing; }
  `);
  const root = document.createElement("div");
  root.className = "drop-zone-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const C = {
    ink: api.color("--ink") || "#1b1b1a",
    ink2: api.color("--ink-2") || "#5d5b57",
    ink3: api.color("--ink-3") || "#9a9790",
    accent: api.color("--accent") || "#ff5a36",
    accentSoft: api.color("--accent-soft") || "#ffe7e0",
    fill: api.color("--toggle-off") || "#d6d2ca",
    note: api.color("--note") || "#fffdf6"
  };
  const font = getComputedStyle(el).fontFamily;

  /* ---------- 좌표 ---------- */
  const V = { cx: 0, cy: 0, sc: 1 };
  const fit = () => { V.cx = size.w / 2; V.cy = size.h * 0.5; V.sc = clamp(Math.min(size.w / 680, size.h / 540), 0.45, 1.5); };
  fit();
  api.onResize(fit);
  const toDesign = p => ({ x: (p.x - V.cx) / V.sc, y: (p.y - V.cy) / V.sc });
  const lw = w => w / V.sc;

  /* ---------- 장면: 씨앗 상자와 화단 두 개 ---------- */
  const TRAY = { x: -150, y: -210, w: 300, h: 70 };
  const POCKETS = [-90, 0, 90].map(x => ({ x, y: TRAY.y + TRAY.h / 2 }));
  const BEDS = [{ name: "왼쪽 화단", x0: -310, x1: -40 }, { name: "오른쪽 화단", x0: 40, x1: 310 }];
  const BED_Y = 150, BED_H = 70, GAP = 48;

  const seeds = [];
  const plants = [];
  const makeSeed = (type, pocket) => {
    const p = POCKETS[pocket];
    if (seeds.some(s => s.pocket === pocket)) return;
    seeds.push({ type, pocket, x: p.x, y: p.y, tx: p.x, ty: p.y, vx: 0, vy: 0, s: 0, sv: 0 });
  };
  [0, 1, 2].forEach(i => makeSeed(i, i));

  let held = null;   // { o, ox, oy }
  const zoneAt = (x, y) => {
    const bed = BEDS.find(b => x > b.x0 + 12 && x < b.x1 - 12 && y > BED_Y - 60 && y < BED_Y + BED_H);
    if (!bed) return { kind: "none" };
    if (plants.some(p => Math.abs(p.x - x) < GAP)) return { kind: "crowded", bed };
    return { kind: "ok", bed };
  };

  /* ---------- 포인터 ---------- */
  const pick = d => { for (let i = seeds.length - 1; i >= 0; i--) { const o = seeds[i]; if (o.s > 0.5 && dist(d.x, d.y, o.x, o.y) < 22) return o; } return null; };
  api.on(root, "pointerdown", e => {
    e.preventDefault();
    const d = toDesign(localPoint(root, e));
    const o = pick(d);
    if (!o) return;
    root.setPointerCapture(e.pointerId);
    held = { o, ox: o.x - d.x, oy: o.y - d.y };
    seeds.splice(seeds.indexOf(o), 1); seeds.push(o);
    if (o.pocket != null) {   // 상자에서 꺼내면 그 칸에 새 씨앗이 채워진다
      const pk = o.pocket; o.pocket = null;
      api.timeout(() => makeSeed(o.type, pk), 450);
    }
    root.classList.add("is-holding");
    api.hideHint();
  });
  api.on(root, "pointermove", e => {
    const d = toDesign(localPoint(root, e));
    api.read("pos", `${Math.round(d.x)}, ${Math.round(d.y)}`);
    if (!held) { root.classList.toggle("is-over", !!pick(d)); return; }
    const o = held.o;
    o.x = o.tx = clamp(d.x + held.ox, -V.cx / V.sc, (size.w - V.cx) / V.sc);
    o.y = o.ty = clamp(d.y + held.oy, -V.cy / V.sc, (size.h - V.cy) / V.sc);
  });
  const up = () => {
    if (!held) return;
    const o = held.o;
    held = null;
    root.classList.remove("is-holding");
    const z = zoneAt(o.x, o.y);
    if (z.kind === "ok") {
      seeds.splice(seeds.indexOf(o), 1);
      plants.push({ x: o.x, type: o.type, t: S.growth === "pop" ? 1 : 0, s: S.growth === "pop" ? 0.3 : 1, sv: 0 });
      api.flash(`${z.bed.name}에 심었다`, "ok");
      return;
    }
    if (S.invalid === "return") {
      // 비어 있는 칸으로 되돌아간다
      const free = POCKETS.findIndex((_, i) => !seeds.some(s => s !== o && s.pocket === i));
      if (free >= 0) { o.pocket = free; o.tx = POCKETS[free].x; o.ty = POCKETS[free].y; }
      else { seeds.splice(seeds.indexOf(o), 1); }
      api.flash(z.kind === "crowded" ? "자리가 좁다 · 상자로 돌아간다" : "화단 밖이다 · 상자로 돌아간다", "idle");
    } else {
      api.flash(z.kind === "crowded" ? "자리가 좁다 · 그 자리에 남는다" : "화단 밖이다 · 그 자리에 남는다", "idle");
    }
  };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);

  api.onParam((k, v) => {
    // 되돌아가기로 바꾸면, 흩어져 있던 씨앗을 모두 상자 쪽으로 정리한다
    if (k === "invalid" && v === "return") {
      seeds.filter(s => s.pocket == null && (!held || held.o !== s)).forEach(s => {
        const free = POCKETS.findIndex((_, i) => !seeds.some(o => o.pocket === i));
        if (free >= 0) { s.pocket = free; s.tx = POCKETS[free].x; s.ty = POCKETS[free].y; } else s.gone = true;
      });
    }
  });

  /* ---------- 그리기 (그림 키트 스타일: 3px 외곽선 + 평면 단색) ---------- */
  const circle = (x, y, r) => { g.beginPath(); g.arc(x, y, Math.max(0, r), 0, Math.PI * 2); };
  const SEED_COLOR = [ILLO.orange, ILLO.yellow, ILLO.green];
  const drawSeed = (o, hot) => {
    g.save(); g.translate(o.x, o.y); g.scale(o.s, o.s);
    const L = lw(3) / Math.max(0.3, o.s), fill = hot ? ILLO.red : SEED_COLOR[o.type];
    if (o.type === 0) kCircle(g, 0, 0, 8, { fill, lw: L });
    else if (o.type === 1) kEllipse(g, 0, 0, 11, 7, { fill, lw: L }, -0.4);
    else shape(g, c => { c.moveTo(0, -12); c.quadraticCurveTo(10, 2, 0, 9); c.quadraticCurveTo(-10, 2, 0, -12); }, { fill, lw: L });
    g.restore();
  };
  const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const drawPlant = p => {
    const x = p.x, y = BED_Y;
    const stem = ease(p.t / 0.5), leaf = ease((p.t - 0.45) / 0.3), head = ease((p.t - 0.7) / 0.3);
    const H = [120, 100, 90][p.type];
    g.save(); g.translate(x, y); g.scale(p.s, p.s);
    const L = lw(3) / Math.max(0.3, p.s);
    if (p.t < 0.08) kCircle(g, 0, -4, 6, { fill: SEED_COLOR[p.type], lw: L });
    // 줄기 (나무는 굵은 몸통)
    if (stem > 0.02) tube(g, [[0, 0], [0, -H * stem]], { color: p.type === 2 ? ILLO.orange : ILLO.green, w: p.type === 2 ? 14 : 5, lw: L });
    if (leaf > 0.05 && p.type !== 2) {
      const lh = H * 0.45;
      kLeaf(g, -13 * leaf, -lh, { size: 26 * leaf, angle: 0.5, lw: L });
      kLeaf(g, 13 * leaf, -lh + 0.12 * H, { size: 26 * leaf, angle: -0.5, lw: L });
    }
    if (head > 0.05) {
      const hy = -H;
      if (p.type === 0) {
        // 데이지: 꽃잎 원 여섯 개 + 가운데
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; kCircle(g, Math.cos(a) * 13 * head, hy + Math.sin(a) * 13 * head, 8 * head, { fill: ILLO.paper, lw: L }); }
        kCircle(g, 0, hy, 7 * head, { fill: ILLO.yellow, lw: L });
      } else if (p.type === 1) {
        // 튤립
        const r = 15 * head;
        shape(g, c => {
          c.moveTo(-r, hy - r * 0.6); c.lineTo(-r * 0.4, hy - r * 0.1); c.lineTo(0, hy - r * 0.8); c.lineTo(r * 0.4, hy - r * 0.1); c.lineTo(r, hy - r * 0.6);
          c.quadraticCurveTo(r, hy + r * 0.9, 0, hy + r * 0.9); c.quadraticCurveTo(-r, hy + r * 0.9, -r, hy - r * 0.6); c.closePath();
        }, { fill: ILLO.pink, lw: L });
      } else {
        // 나무: 둥근 수관
        kCircle(g, 0, hy - 10 * head, 30 * head, { fill: ILLO.green, lw: L });
      }
    }
    g.restore();
  };

  api.frame(dt => {
    const { w, h } = size;
    g.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    g.translate(V.cx, V.cy); g.scale(V.sc, V.sc);
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `${13 / V.sc}px ${font}`;

    const z = held ? zoneAt(held.o.x, held.o.y) : null;

    // 씨앗 상자
    g.strokeStyle = C.ink; g.lineWidth = lw(1.5); g.strokeRect(TRAY.x, TRAY.y, TRAY.w, TRAY.h);
    POCKETS.forEach(p => { circle(p.x, p.y, 20); g.strokeStyle = C.ink3; g.lineWidth = lw(1); g.stroke(); });
    g.fillStyle = C.ink3; g.fillText("씨앗", TRAY.x + TRAY.w / 2, TRAY.y - 16);

    // 화단 (드롭 존)
    g.beginPath(); g.moveTo(-340, BED_Y); g.lineTo(340, BED_Y); g.strokeStyle = C.ink3; g.lineWidth = lw(1); g.stroke();
    BEDS.forEach(b => {
      const active = held && S.highlight;
      const hot = active && z && z.bed === b;
      g.fillStyle = hot && z.kind === "ok" ? C.accentSoft : C.fill;
      g.fillRect(b.x0, BED_Y, b.x1 - b.x0, BED_H);
      g.strokeStyle = C.ink; g.lineWidth = lw(3); g.lineCap = "round";
      g.beginPath(); g.moveTo(b.x0, BED_Y); g.lineTo(b.x1, BED_Y); g.stroke();
      if (active) {   // 놓을 수 있는 곳 전체를 알린다
        g.setLineDash([lw(6), lw(5)]);
        g.strokeStyle = hot && z.kind === "ok" ? C.accent : C.ink2; g.lineWidth = lw(hot ? 2.5 : 1.5);
        g.strokeRect(b.x0 - 6, BED_Y - 64, b.x1 - b.x0 + 12, BED_H + 70);
        g.setLineDash([]);
        g.fillStyle = hot ? (z.kind === "ok" ? C.accent : C.ink2) : C.ink3;
        g.fillText(hot ? (z.kind === "ok" ? "여기에 심기" : "자리가 좁다") : "심을 수 있는 곳", (b.x0 + b.x1) / 2, BED_Y + BED_H + 20);
      }
    });

    // 식물
    plants.forEach(p => {
      if (p.t < 1) p.t = Math.min(1, p.t + dt / 1500);
      p.sv = (p.sv + (1 - p.s) * 0.18) * 0.7; p.s += p.sv;
      drawPlant(p);
    });

    // 씨앗 (들고 있는 것은 맨 위)
    for (let i = seeds.length - 1; i >= 0; i--) {
      const o = seeds[i];
      o.sv = (o.sv + ((o.gone ? 0 : 1) - o.s) * 0.2) * 0.68; o.s += o.sv;
      if (o.gone && o.s < 0.05) { seeds.splice(i, 1); continue; }
      if (!held || held.o !== o) { o.vx = (o.vx + (o.tx - o.x) * 0.16) * 0.7; o.vy = (o.vy + (o.ty - o.y) * 0.16) * 0.7; o.x += o.vx; o.y += o.vy; }
    }
    seeds.forEach(o => drawSeed(o, held && held.o === o));
    // 좁은 자리 표시
    if (held && S.highlight && z.kind === "crowded") {
      const o = held.o;
      g.strokeStyle = C.ink2; g.lineWidth = lw(2);
      g.beginPath(); g.moveTo(o.x - 7, BED_Y - 7); g.lineTo(o.x + 7, BED_Y + 7); g.moveTo(o.x + 7, BED_Y - 7); g.lineTo(o.x - 7, BED_Y + 7); g.stroke();
    }

    api.read("zone", held ? (z.kind === "ok" ? `${z.bed.name} · 심을 수 있음` : z.kind === "crowded" ? "자리가 좁음" : "영역 밖") : "–");
    api.read("planted", plants.length);
    if (held) api.status(z.kind === "ok" ? "드롭 존 위 · 놓으면 심는다" : "옮기는 중 · 영역 밖", z.kind === "ok" ? "active" : "idle");
    else if (plants.some(p => p.t < 1)) api.status("자라는 중", "alt");
    else api.status("대기", "idle");
  });
}
