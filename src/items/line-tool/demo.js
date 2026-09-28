import { localPoint, fitCanvas } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;
  api.css(`
    .line-tool-root { position: absolute; inset: 0; cursor: crosshair; background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
  `);
  const root = document.createElement("div");
  root.className = "line-tool-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });

  const INK = api.color("--ink") || "#1b1b1a";
  const INK2 = api.color("--ink-2") || "#5d5b57";
  const ACC = api.color("--accent") || "#ff5a36";
  const BOARD = api.color("--board") || "#efe9dd";
  const STEP = Math.PI / 4;

  const lines = [];                 // 확정된 선 { x1, y1, x2, y2, chain }
  const cur = { down: false, id: -1, sx: 0, sy: 0, ex: 0, ey: 0, rx: 0, ry: 0, snapped: false };
  const chain = { on: false, x: 0, y: 0, fx: 0, fy: 0, n: 0, id: 0 };
  let shift = false, hover = null, chainSeq = 0;

  const snapOn = () => S.snap === "always" || (S.snap === "shift" && shift);
  function solveEnd(sx, sy, rx, ry) {
    const dx = rx - sx, dy = ry - sy, len = Math.hypot(dx, dy);
    if (!snapOn() || len < 1) return { x: rx, y: ry, snapped: false };
    const a = Math.round(Math.atan2(dy, dx) / STEP) * STEP;
    return { x: sx + Math.cos(a) * len, y: sy + Math.sin(a) * len, snapped: true };
  }
  const mathAngle = (dx, dy) => { let a = Math.atan2(-dy, dx) * 180 / Math.PI; if (a < 0) a += 360; return Math.round(a) % 360; };

  const endChain = msg => {
    if (!chain.on) return;
    chain.on = false; hover = null;
    if (msg) api.flash(msg, "ok");
  };

  api.on(root, "pointerdown", e => {
    if (e.button !== 0) return;
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    shift = e.shiftKey;
    const p = localPoint(el, e);
    cur.down = true; cur.id = e.pointerId;
    if (chain.on) { cur.sx = chain.x; cur.sy = chain.y; } else { cur.sx = p.x; cur.sy = p.y; }
    cur.rx = p.x; cur.ry = p.y;
    const r = solveEnd(cur.sx, cur.sy, p.x, p.y);
    cur.ex = r.x; cur.ey = r.y; cur.snapped = r.snapped;
    api.hideHint();
  });
  api.on(root, "pointermove", e => {
    shift = e.shiftKey;
    const p = localPoint(el, e);
    if (cur.down && e.pointerId === cur.id) { cur.rx = p.x; cur.ry = p.y; }
    else if (chain.on) hover = p;
  });
  const end = e => {
    if (!cur.down || e.pointerId !== cur.id) return;
    cur.down = false;
    const len = Math.hypot(cur.ex - cur.sx, cur.ey - cur.sy);
    if (len < 4) return;
    let ex = cur.ex, ey = cur.ey, closed = false;
    if (chain.on && chain.n >= 2 && Math.hypot(ex - chain.fx, ey - chain.fy) < 12) { ex = chain.fx; ey = chain.fy; closed = true; }
    if (S.poly && !chain.on) { chain.on = true; chain.fx = cur.sx; chain.fy = cur.sy; chain.n = 0; chain.id = ++chainSeq; }
    lines.push({ x1: cur.sx, y1: cur.sy, x2: ex, y2: ey, chain: chain.on ? chain.id : 0 });
    if (chain.on) {
      chain.n++; chain.x = ex; chain.y = ey; hover = { x: cur.rx, y: cur.ry };
      if (closed) endChain("시작점에 닿아 닫힌 도형이 되었다");
    } else api.flash(`선을 확정했다 · ${Math.round(len)}px`, "ok");
  };
  api.on(root, "pointerup", end);
  api.on(root, "pointercancel", end);
  api.on(root, "dblclick", () => endChain("이어 긋기를 끝냈다"));
  api.on(root, "pointerleave", () => { hover = null; });

  api.on(window, "keydown", e => {
    if (e.key === "Shift") { shift = true; return; }
    if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
    if (e.key === "Escape" || e.key === "Enter") {
      if (chain.on) { e.preventDefault(); endChain("이어 긋기를 끝냈다"); }
      return;
    }
    if (e.key === "Backspace" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z")) {
      e.preventDefault();
      const L = lines.pop();
      if (!L) return;
      if (chain.on && L.chain === chain.id) {
        chain.n--; chain.x = L.x1; chain.y = L.y1;
        if (chain.n <= 0) endChain();
      }
      api.flash("마지막 선을 지웠다", "alt");
    }
  });
  api.on(window, "keyup", e => { if (e.key === "Shift") shift = false; });
  api.on(window, "blur", () => { shift = false; });

  api.onParam(k => { if (k === "poly" && !S.poly) endChain("이어 긋기를 끝냈다"); });

  /* ---------- 그리기 ---------- */
  function arrowHead(x1, y1, x2, y2, w, color) {
    const a = Math.atan2(y2 - y1, x2 - x1), s = 7 + w * 2;
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(x2 + Math.cos(a) * w * 0.6, y2 + Math.sin(a) * w * 0.6);
    g.lineTo(x2 - Math.cos(a - 0.45) * s, y2 - Math.sin(a - 0.45) * s);
    g.lineTo(x2 - Math.cos(a + 0.45) * s, y2 - Math.sin(a + 0.45) * s);
    g.closePath(); g.fill();
  }
  function drawLine(x1, y1, x2, y2, w, color, arrows) {
    g.strokeStyle = color; g.lineWidth = w; g.lineCap = "round";
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    if (arrows === "end" || arrows === "both") arrowHead(x1, y1, x2, y2, w, color);
    if (arrows === "both") arrowHead(x2, y2, x1, y1, w, color);
  }
  function label(text, x, y) {
    g.font = `600 13px ${getComputedStyle(el).fontFamily}`;
    const tw = g.measureText(text).width;
    g.fillStyle = BOARD; g.fillRect(x - 4, y - 11, tw + 8, 20);
    g.fillStyle = INK; g.textBaseline = "middle"; g.fillText(text, x, y);
  }

  api.frame(() => {
    const { w, h } = size;
    g.clearRect(0, 0, w, h);

    // 이어 긋기 중이면 커서까지 미리보기
    let pv = null;
    if (cur.down) {
      const r = solveEnd(cur.sx, cur.sy, cur.rx, cur.ry);
      cur.ex = r.x; cur.ey = r.y; cur.snapped = r.snapped;
      pv = { sx: cur.sx, sy: cur.sy, ex: r.x, ey: r.y, snapped: r.snapped, live: true };
    } else if (chain.on && hover) {
      const r = solveEnd(chain.x, chain.y, hover.x, hover.y);
      pv = { sx: chain.x, sy: chain.y, ex: r.x, ey: r.y, snapped: r.snapped, live: false };
    }

    // 스냅 안내선
    if (pv && pv.snapped) {
      const a = Math.atan2(pv.ey - pv.sy, pv.ex - pv.sx), L = Math.hypot(w, h);
      g.strokeStyle = ACC; g.globalAlpha = 0.35; g.lineWidth = 1; g.setLineDash([6, 6]);
      g.beginPath(); g.moveTo(pv.sx - Math.cos(a) * L, pv.sy - Math.sin(a) * L); g.lineTo(pv.sx + Math.cos(a) * L, pv.sy + Math.sin(a) * L); g.stroke();
      g.setLineDash([]); g.globalAlpha = 1;
    }

    // 확정된 선
    lines.forEach(L => drawLine(L.x1, L.y1, L.x2, L.y2, S.width, INK, S.arrow));
    if (chain.on) { g.fillStyle = INK; g.beginPath(); g.arc(chain.fx, chain.fy, 3.5, 0, Math.PI * 2); g.fill(); }

    // 미리보기
    let len = 0, ang = 0;
    if (pv) {
      const dx = pv.ex - pv.sx, dy = pv.ey - pv.sy;
      len = Math.hypot(dx, dy); ang = mathAngle(dx, dy);
      if (S.label && len > 8) {
        // 시작점의 수평 기준선과 각도 호
        g.strokeStyle = INK2; g.lineWidth = 1; g.setLineDash([3, 4]);
        g.beginPath(); g.moveTo(pv.sx, pv.sy); g.lineTo(pv.sx + 44, pv.sy); g.stroke(); g.setLineDash([]);
        const am = ang * Math.PI / 180;
        g.beginPath(); g.arc(pv.sx, pv.sy, 26, 0, -am, true); g.stroke();
      }
      g.globalAlpha = pv.live ? 1 : 0.55;
      drawLine(pv.sx, pv.sy, pv.ex, pv.ey, Math.max(2, S.width), ACC, S.arrow);
      g.globalAlpha = 1;
      g.fillStyle = ACC; g.beginPath(); g.arc(pv.sx, pv.sy, 4, 0, Math.PI * 2); g.fill();
      g.strokeStyle = ACC; g.lineWidth = 1.5; g.beginPath(); g.arc(pv.ex, pv.ey, 5, 0, Math.PI * 2); g.stroke();
      if (S.label && len > 8) {
        const right = pv.ex < w - 140;
        label(`${Math.round(len)}px · ${ang}°${pv.snapped ? " 고정" : ""}`, right ? pv.ex + 14 : pv.ex - 130, pv.ey + (pv.ey < 40 ? 22 : -18));
      }
    }

    // 읽는 값
    api.read("start", pv ? `${Math.round(pv.sx)}, ${Math.round(pv.sy)}` : "–");
    api.read("len", pv ? Math.round(len) : "–");
    api.read("ang", pv ? ang + "°" : "–");
    api.read("count", lines.length);

    if (cur.down && cur.snapped) api.status(`각도 스냅 · ${ang}°에 맞춰졌다`, "alt");
    else if (cur.down) api.status(`긋는 중 · 떼면 확정${S.snap === "shift" ? " (Shift: 45° 단위)" : ""}`, "active");
    else if (chain.on) api.status(`이어 긋기 · ${chain.n}개 · 더블클릭이나 Esc로 끝내기`, "alt");
    else api.status(lines.length ? `대기 · 백스페이스로 마지막 선 지우기` : "대기", "idle");
  });
}
