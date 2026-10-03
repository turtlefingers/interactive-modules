import "../../lib/objects/index.js";
import { rng, clamp, localPoint, fitCanvas } from "../../lib/util.js";
import { TONE } from "../../lib/draw.js";
import { drawObject } from "../../lib/objects.js";

export default function demo(api) {
  const { el, S } = api;
  const W = 3000, H = 2000;
  const TAU = Math.PI * 2;

  api.css(`
    .mouse-look-demo { position: absolute; inset: 0; cursor: crosshair; touch-action: none; background: var(--stage-out); }
  `);
  const root = document.createElement("div");
  root.className = "mouse-look-demo";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const C = { board: api.color("--board"), ink: api.color("--ink"), ink3: api.color("--ink-3"), accent: api.color("--accent"),
    note: api.color("--note"), line: api.color("--note-line") || "rgba(0,0,0,.08)" };

  /* ---------- 보드 내용 ---------- */
  const rand = rng(5);
  const cards = [];
  for (let zy = 0; zy < 2; zy++) for (let zx = 0; zx < 3; zx++) {
    for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) {
      if (rand() < 0.3) continue;
      const kind = rand() < 0.5 ? "photo" : rand() < 0.6 ? "note" : "dot";
      let w = 130 + rand() * 130, h = 100 + rand() * 140;
      if (kind === "dot") w = h = 80 + rand() * 80;
      const x = zx * 1000 + gx * 333 + 20 + rand() * (333 - w - 40);
      const y = zy * 1000 + gy * 333 + 20 + rand() * (333 - h - 40);
      const p = Math.floor(rand() * 4);
      cards.push({ x, y, w, h, kind, tone: p % 2 ? TONE[2] : TONE[1] });
    }
  }
  const LET = "ABCDEF";
  const FONT = "900 520px " + getComputedStyle(el).fontFamily;

  /* ---------- 카메라 ---------- */
  const cam = { x: 0, y: 0, tx: 0, ty: 0, spd: 0 };
  const maxX = () => Math.max(0, W - size.w), maxY = () => Math.max(0, H - size.h);
  cam.x = cam.tx = maxX() / 2; cam.y = cam.ty = maxY() / 2;
  const cur = { x: size.w / 2, y: size.h / 2, inside: false };
  let moved = false, eb = S.mode === "edge" ? 1 : 0, edgeDist = Infinity, edgeV = { x: 0, y: 0 };
  let guideA = S.guide ? 1 : 0; // 가이드선 표시 정도 (토글 시 부드럽게)

  const move = e => {
    const p = localPoint(el, e);
    cur.x = p.x; cur.y = p.y; cur.inside = true;
    if (!moved) { moved = true; api.hideHint(); }
  };
  api.on(root, "pointermove", move);
  api.on(root, "pointerdown", move);
  api.on(root, "pointerleave", () => { cur.inside = false; root.style.cursor = ""; });
  api.on(root, "pointerup", e => { if (e.pointerType !== "mouse") cur.inside = false; });

  api.frame(dt => {
    const step = dt / 16.67;
    const w = size.w, h = size.h, mx = maxX(), my = maxY();
    eb += ((S.mode === "edge" ? 1 : 0) - eb) * (1 - Math.pow(0.85, step));
    edgeV.x = edgeV.y = 0; edgeDist = Infinity;

    if (S.mode === "map") {
      if (cur.inside) {
        const nx = clamp(cur.x / w, 0, 1), ny = clamp(cur.y / h, 0, 1);
        cam.tx = mx / 2 + (nx - 0.5) * mx * S.range;
        cam.ty = S.axis === "x" ? my / 2 : my / 2 + (ny - 0.5) * my * S.range;
      } else if (S.axis === "x") cam.ty = my / 2;
      root.style.cursor = "";
    } else {
      const E = S.edgeW, MAXV = 16;
      let dir = "";
      if (cur.inside) {
        const dl = cur.x, dr = w - cur.x, dtp = cur.y, db = h - cur.y;
        edgeDist = Math.round(Math.min(dl, dr, S.axis === "x" ? Infinity : dtp, S.axis === "x" ? Infinity : db));
        if (dl < E) edgeV.x = -Math.pow(1 - dl / E, 2) * MAXV;
        else if (dr < E) edgeV.x = Math.pow(1 - dr / E, 2) * MAXV;
        if (S.axis !== "x") {
          if (dtp < E) edgeV.y = -Math.pow(1 - dtp / E, 2) * MAXV;
          else if (db < E) edgeV.y = Math.pow(1 - db / E, 2) * MAXV;
        }
        dir = (edgeV.y < 0 ? "n" : edgeV.y > 0 ? "s" : "") + (edgeV.x < 0 ? "w" : edgeV.x > 0 ? "e" : "");
      }
      if (S.axis === "x") cam.ty += (my / 2 - cam.ty) * 0.1;
      cam.tx = clamp(cam.tx + edgeV.x * step, 0, mx);
      cam.ty = clamp(cam.ty + edgeV.y * step, 0, my);
      root.style.cursor = dir ? `${dir}-resize` : "";
    }
    cam.tx = clamp(cam.tx, 0, mx); cam.ty = clamp(cam.ty, 0, my);
    const f = 1 - Math.pow(1 - S.smooth, step);
    const ox = cam.x, oy = cam.y;
    cam.x += (cam.tx - cam.x) * f; cam.y += (cam.ty - cam.y) * f;
    cam.spd = Math.hypot(cam.x - ox, cam.y - oy) / Math.max(step, 0.01);

    /* ---------- 보드 그리기 ---------- */
    g.clearRect(0, 0, w, h);
    const bx = -cam.x + (W < w ? (w - W) / 2 : 0), by = -cam.y + (H < h ? (h - H) / 2 : 0);
    g.save(); g.translate(bx, by);
    g.fillStyle = C.board; g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(0,0,0,.035)"; g.lineWidth = 1; g.beginPath();
    for (let x = Math.floor(cam.x / 100) * 100; x < cam.x + w + 100; x += 100) { g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); }
    for (let y = Math.floor(cam.y / 100) * 100; y < cam.y + h + 100; y += 100) { g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); }
    g.stroke();
    g.fillStyle = "rgba(0,0,0,.035)"; g.font = FONT;
    g.textAlign = "center"; g.textBaseline = "middle";
    for (let i = 0; i < 6; i++) g.fillText(LET[i], (i % 3) * 1000 + 500, Math.floor(i / 3) * 1000 + 520);
    // 카드: 카탈로그 사물 (사진 = photo-placeholder, 메모 = stage-card 폴라로이드, 점 = 톤 원). 사물은 (x, y) = 아래 가운데.
    // 카드 상자(c.w × c.h) 안에 들어가는 높이로 그린다. 색은 톤만 — 강조색은 시작점 하나뿐
    for (const c of cards) {
      if (c.x + c.w < cam.x - 40 || c.x > cam.x + w + 40 || c.y + c.h < cam.y - 40 || c.y > cam.y + h + 40) continue;
      if (c.kind === "dot") { g.fillStyle = c.tone; g.beginPath(); g.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, TAU); g.fill(); }
      else if (c.kind === "note") drawObject(g, "stage-card", c.x + c.w / 2, c.y + c.h, Math.min(c.h, c.w / 0.72), { color: TONE[3] });
      else drawObject(g, "photo-placeholder", c.x + c.w / 2, c.y + c.h, Math.min(c.h, c.w / 1.06), { color: TONE[3] });
    }
    g.fillStyle = C.accent; g.beginPath(); g.arc(W / 2, H / 2, 9, 0, TAU); g.fill();
    g.strokeStyle = "rgba(0,0,0,.2)"; g.lineWidth = 1; g.strokeRect(0.5, 0.5, W - 1, H - 1);
    g.restore();

    /* ---------- 가장자리 띠 (가장자리 스크롤) ---------- */
    if (eb > 0.01) {
      const E = S.edgeW;
      const band = (x, y, bw, bh, gx0, gy0, gx1, gy1, active) => {
        g.fillStyle = `rgba(255,90,54,${(active ? 0.16 : 0.06) * eb})`;
        g.fillRect(x, y, bw, bh);
      };
      band(0, 0, E, h, 0, 0, E, 0, edgeV.x < 0);
      band(w - E, 0, E, h, w, 0, w - E, 0, edgeV.x > 0);
      if (S.axis !== "x") {
        band(0, 0, w, E, 0, 0, 0, E, edgeV.y < 0);
        band(0, h - E, w, E, 0, h, 0, h - E, edgeV.y > 0);
      }
      g.save(); g.globalAlpha = eb * 0.55; g.strokeStyle = C.accent; g.setLineDash([4, 6]); g.lineWidth = 1.2;
      g.strokeRect(E + 0.5, (S.axis === "x" ? -2 : E) + 0.5, w - E * 2, S.axis === "x" ? h + 4 : h - E * 2);
      g.restore();
    }
    /* ---------- 위치 대응 표시: 화면 중심에서 커서까지 (가이드선 옵션) ---------- */
    guideA += ((S.guide ? 1 : 0) - guideA) * 0.15;
    if (guideA > 0.01 && eb < 0.99 && cur.inside) {
      g.save(); g.globalAlpha = (1 - eb) * 0.6 * guideA;
      g.strokeStyle = C.ink; g.lineWidth = 1.2; g.setLineDash([3, 5]);
      g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(cur.x, S.axis === "x" ? h / 2 : cur.y); g.stroke();
      g.setLineDash([]); g.beginPath(); g.arc(w / 2, h / 2, 5, 0, TAU); g.stroke();
      g.restore();
    }

    /* ---------- 미니맵 ---------- */
    const MW = w < 600 ? 120 : 180, MS = MW / W, MH = H * MS;
    const mx0 = w - MW - 22, my0 = h - MH - 22;
    g.save();
    g.fillStyle = C.board; g.fillRect(mx0, my0, MW, MH);
    g.strokeStyle = C.ink; g.lineWidth = 1; g.strokeRect(mx0 - 0.5, my0 - 0.5, MW + 1, MH + 1);
    g.fillStyle = C.ink3;
    for (const c of cards) g.fillRect(mx0 + c.x * MS, my0 + c.y * MS, Math.max(2, c.w * MS), Math.max(2, c.h * MS));
    // 위치 대응에서 닿을 수 있는 범위
    if (eb < 0.99) {
      const rw = mx * S.range + w, rh = (S.axis === "x" ? 0 : my * S.range) + h;
      g.globalAlpha = 1 - eb; g.strokeStyle = C.ink3; g.setLineDash([2, 3]); g.lineWidth = 1;
      g.strokeRect(mx0 + (W - rw) / 2 * MS, my0 + (H - rh) / 2 * MS, rw * MS, rh * MS);
      g.setLineDash([]); g.globalAlpha = 1;
    }
    g.strokeStyle = C.accent; g.lineWidth = 1.5; g.fillStyle = "rgba(255,90,54,.1)";
    g.fillRect(mx0 + cam.x * MS, my0 + cam.y * MS, Math.min(w, W) * MS, Math.min(h, H) * MS);
    g.strokeRect(mx0 + cam.x * MS, my0 + cam.y * MS, Math.min(w, W) * MS, Math.min(h, H) * MS);
    g.restore();

    /* ---------- 읽는 값 · 상태 ---------- */
    api.read("ratio", cur.inside ? `${(cur.x / w).toFixed(2)}, ${(cur.y / h).toFixed(2)}` : "화면 밖");
    api.read("cam", `${Math.round(cam.x)}, ${Math.round(cam.y)}`);
    api.read("speed", cam.spd.toFixed(1));
    api.read("edge", S.mode === "edge" && cur.inside ? edgeDist : "–");
    if (S.mode === "edge" && (edgeV.x || edgeV.y)) api.status("가장자리 스크롤 중 · 보드가 커서 쪽으로 이동 중", "active");
    else if (cam.spd > 0.3) api.status("시야가 커서 쪽으로 옮겨 가는 중", "active");
    else if (S.mode === "edge" && cur.inside) api.status("커서를 가장자리 띠에 대면 → 보드가 움직인다", "idle");
    else api.status(cur.inside ? "멈춤 · 커서 위치에 맞춰 보는 중" : "대기", "idle");
  });
}
