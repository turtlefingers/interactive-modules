import { localPoint, fitCanvas } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;
  api.css(`
    .shape-tool-root { position: absolute; inset: 0; cursor: crosshair; background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
    .shape-tool-keys { position: absolute; right: 16px; bottom: 16px; display: flex; gap: 6px; pointer-events: none; z-index: 40; }
    .shape-tool-keys span { font-size: 13px; padding: 6px 10px; border-radius: 6px; color: var(--ink-3);
      box-shadow: inset 0 0 0 1px rgba(27,27,26,.18); background: var(--board); transition: color .12s, box-shadow .12s; }
    .shape-tool-keys span b { font-weight: 700; margin-right: 6px; }
    @media (max-width: 600px) { .shape-tool-keys { flex-direction: column; align-items: flex-end; } }
    .shape-tool-keys span.on { color: var(--accent); box-shadow: inset 0 0 0 1.5px var(--accent); }
  `);
  const root = document.createElement("div");
  root.className = "shape-tool-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const keys = document.createElement("div");
  keys.className = "shape-tool-keys";
  keys.innerHTML = `<span data-k="shift"><b>Shift</b>비율 고정</span><span data-k="alt"><b>Alt ⌥</b>중심에서</span>`;
  root.appendChild(keys);
  const keyEls = { shift: keys.querySelector('[data-k="shift"]'), alt: keys.querySelector('[data-k="alt"]') };

  const INK = api.color("--ink") || "#1b1b1a";
  const INK3 = api.color("--ink-3") || "#9a9790";
  const ACC = api.color("--accent") || "#ff5a36";
  const BOARD = api.color("--board") || "#efe9dd";

  const shapes = [];
  const cur = { down: false, id: -1, sx: 0, sy: 0, px: 0, py: 0 };
  let shift = false, alt = false;

  const fromCenter = () => (S.origin === "center") !== alt;
  const locked = () => S.square || shift;
  function box(sx, sy, px, py) {
    let dx = px - sx, dy = py - sy;
    if (locked()) { const m = Math.max(Math.abs(dx), Math.abs(dy)); dx = (dx < 0 ? -1 : 1) * m; dy = (dy < 0 ? -1 : 1) * m; }
    let x0, y0, x1, y1;
    if (fromCenter()) { x0 = sx - dx; y0 = sy - dy; x1 = sx + dx; y1 = sy + dy; }
    else { x0 = sx; y0 = sy; x1 = sx + dx; y1 = sy + dy; }
    return { x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) };
  }
  function path(type, b, sides) {
    g.beginPath();
    if (type === "rect") g.rect(b.x, b.y, b.w, b.h);
    else if (type === "ellipse") g.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, b.h / 2, 0, 0, Math.PI * 2);
    else {
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      for (let k = 0; k < sides; k++) {
        const a = -Math.PI / 2 + k * Math.PI * 2 / sides;
        const x = cx + Math.cos(a) * b.w / 2, y = cy + Math.sin(a) * b.h / 2;
        k ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath();
    }
  }

  api.on(root, "pointerdown", e => {
    if (e.button !== 0) return;
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    shift = e.shiftKey; alt = e.altKey;
    const p = localPoint(el, e);
    Object.assign(cur, { down: true, id: e.pointerId, sx: p.x, sy: p.y, px: p.x, py: p.y });
    api.hideHint();
  });
  api.on(root, "pointermove", e => {
    if (!cur.down || e.pointerId !== cur.id) return;
    shift = e.shiftKey; alt = e.altKey;
    const p = localPoint(el, e);
    cur.px = p.x; cur.py = p.y;
  });
  const end = e => {
    if (!cur.down || e.pointerId !== cur.id) return;
    cur.down = false;
    const b = box(cur.sx, cur.sy, cur.px, cur.py);
    if (b.w < 3 && b.h < 3) return;
    shapes.push({ type: S.shape, sides: S.sides, b });
    api.flash(`도형을 확정했다 · ${Math.round(b.w)} × ${Math.round(b.h)}`, "ok");
  };
  api.on(root, "pointerup", end);
  api.on(root, "pointercancel", end);

  api.on(window, "keydown", e => {
    if (e.key === "Shift") { shift = true; return; }
    if (e.key === "Alt") { alt = true; e.preventDefault(); return; }
    if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
    if (e.key === "Backspace" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z")) {
      e.preventDefault();
      if (shapes.pop()) api.flash("마지막 도형을 지웠다", "alt");
    }
  });
  api.on(window, "keyup", e => { if (e.key === "Shift") shift = false; if (e.key === "Alt") { alt = false; e.preventDefault(); } });
  api.on(window, "blur", () => { shift = false; alt = false; });

  function dimLabel(text, x, y) {
    g.font = `600 13px ${getComputedStyle(el).fontFamily}`;
    const tw = g.measureText(text).width;
    g.fillStyle = BOARD; g.fillRect(x - 4, y - 11, tw + 8, 20);
    g.fillStyle = INK; g.textBaseline = "middle"; g.fillText(text, x, y);
  }

  api.frame(() => {
    const { w, h } = size;
    g.clearRect(0, 0, w, h);

    shapes.forEach(s => {
      path(s.type, s.b, s.sides);
      g.fillStyle = "rgba(27,27,26,.06)"; g.fill();
      g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
    });

    let b = null;
    if (cur.down) {
      b = box(cur.sx, cur.sy, cur.px, cur.py);
      if (S.dims) {
        g.strokeStyle = INK3; g.lineWidth = 1; g.setLineDash([4, 4]);
        g.strokeRect(b.x + 0.5, b.y + 0.5, b.w, b.h); g.setLineDash([]);
      }
      path(S.shape, b, S.sides);
      g.strokeStyle = ACC; g.lineWidth = 2; g.stroke();
      // 시작점: 모서리면 점, 중심이면 십자
      g.fillStyle = ACC; g.strokeStyle = ACC; g.lineWidth = 1.5;
      if (fromCenter()) {
        g.beginPath(); g.moveTo(cur.sx - 8, cur.sy); g.lineTo(cur.sx + 8, cur.sy); g.moveTo(cur.sx, cur.sy - 8); g.lineTo(cur.sx, cur.sy + 8); g.stroke();
      } else { g.beginPath(); g.arc(cur.sx, cur.sy, 4, 0, Math.PI * 2); g.fill(); }
      g.beginPath(); g.arc(cur.px, cur.py, 4, 0, Math.PI * 2); g.stroke();
      if (S.dims && (b.w > 4 || b.h > 4)) {
        const txt = `${Math.round(b.w)} × ${Math.round(b.h)}${locked() ? " · 1:1" : ""}`;
        const lx = Math.min(b.x + b.w + 10, w - 120), ly = Math.min(b.y + b.h + 16, h - 70);
        dimLabel(txt, lx, ly);
      }
    }

    keyEls.shift.classList.toggle("on", locked());
    keyEls.alt.classList.toggle("on", fromCenter());

    api.read("start", cur.down ? `${Math.round(cur.sx)}, ${Math.round(cur.sy)}` : "–");
    api.read("size", b ? `${Math.round(b.w)} × ${Math.round(b.h)}` : "–");
    api.read("origin", fromCenter() ? "중심" : "모서리");
    api.read("count", shapes.length);

    if (cur.down) api.status(`그리는 중 · 시작점이 ${fromCenter() ? "중심" : "모서리"}${locked() ? " · 비율 1:1" : ""} · 떼면 확정`, "active");
    else api.status(shapes.length ? "대기 · 백스페이스로 마지막 도형 지우기" : "대기", "idle");
  });
}
