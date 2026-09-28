import { clamp, localPoint, fitCanvas } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;
  const MAX = 16;

  api.css(`
    .cursor-follow-demo { position: absolute; inset: 0; cursor: crosshair; touch-action: none;
      background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
  `);
  const root = document.createElement("div");
  root.className = "cursor-follow-demo";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });

  const C = { accent: api.color("--accent"), ink: api.color("--ink"), ink3: api.color("--ink-3"), board: api.color("--board") };
  const cur = { x: size.w / 2, y: size.h / 2, inside: false, moved: false };
  const segs = [];
  for (let i = 0; i < MAX; i++) {
    segs.push({ x: size.w / 2 - i * 4, y: size.h / 2, vx: 0, vy: 0, ang: 0, sc: i < S.count ? 1 : 0, tip: S.rotate ? 1 : 0, spd: 0 });
  }
  const radius = i => 28 * (1 - i * 0.042);
  let guideA = S.guide ? 1 : 0; // 가이드선 표시 정도 (토글 시 부드럽게)

  const move = e => {
    const p = localPoint(el, e);
    cur.x = p.x; cur.y = p.y; cur.inside = true;
    if (!cur.moved) { cur.moved = true; api.hideHint(); }
  };
  api.on(root, "pointermove", move);
  api.on(root, "pointerdown", move);
  api.on(root, "pointerleave", () => { cur.inside = false; });

  const angLerp = (a, b, t) => { let d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; return a + d * t; };

  api.frame(dt => {
    const step = dt / 16.67;
    const f = 1 - Math.pow(1 - S.strength, step);
    for (let i = 0; i < MAX; i++) {
      const s = segs[i];
      // 목표점: 머리는 커서, 몸통은 바로 앞 개체 (간격 유지)
      let tx, ty;
      if (i === 0) {
        tx = cur.x; ty = cur.y;
        const d = Math.hypot(tx - s.x, ty - s.y);
        if (S.gap > 0) {
          if (d > S.gap) { tx -= (tx - s.x) / d * S.gap; ty -= (ty - s.y) / d * S.gap; }
          else { tx = s.x; ty = s.y; }
        }
      } else {
        const p = segs[i - 1];
        const d = Math.hypot(p.x - s.x, p.y - s.y) || 1;
        const sp = (radius(i - 1) + radius(i)) * 0.62;
        if (d > sp) { tx = p.x - (p.x - s.x) / d * sp; ty = p.y - (p.y - s.y) / d * sp; }
        else { tx = s.x; ty = s.y; }
      }
      const ox = s.x, oy = s.y;
      if (S.motion === "spring") {
        const k = S.strength * 0.32;
        s.vx = s.vx * Math.pow(0.83, step) + (tx - s.x) * k * step;
        s.vy = s.vy * Math.pow(0.83, step) + (ty - s.y) * k * step;
        s.x += s.vx * step; s.y += s.vy * step;
      } else {
        s.x += (tx - s.x) * f; s.y += (ty - s.y) * f;
        s.vx = (s.x - ox) / Math.max(step, 0.01); s.vy = (s.y - oy) / Math.max(step, 0.01);
      }
      s.spd = Math.hypot(s.x - ox, s.y - oy) / Math.max(step, 0.01);
      if (s.spd > 0.4) s.ang = Math.atan2(Math.sin(s.ang = angLerp(s.ang, Math.atan2(s.y - oy, s.x - ox), 1 - Math.pow(0.75, step))), Math.cos(s.ang));
      // 개수와 회전은 부드럽게 전환
      const scT = i < S.count ? 1 : 0;
      s.sc += (scT - s.sc) * (1 - Math.pow(0.82, step));
      if (Math.abs(scT - s.sc) < 0.002) s.sc = scT;
      const tipT = S.rotate ? 1 : 0;
      s.tip += (tipT - s.tip) * (1 - Math.pow(0.85, step));
      // 사라진 꼬리는 앞 개체 위치에 붙어 대기 (다시 나타날 때 자연스럽게)
      if (s.sc === 0 && i > 0) { s.x = segs[i - 1].x; s.y = segs[i - 1].y; s.vx = s.vy = 0; }
    }

    /* ---------- 그리기 ---------- */
    g.clearRect(0, 0, size.w, size.h);
    guideA += ((S.guide ? 1 : 0) - guideA) * (1 - Math.pow(0.85, step));
    const head = segs[0];
    const lag = Math.hypot(cur.x - head.x, cur.y - head.y);
    // 커서와 머리 사이의 지연선
    if (guideA > 0.01 && lag > 3) {
      g.save();
      g.setLineDash([4, 6]); g.lineWidth = 1.5; g.strokeStyle = C.ink3; g.globalAlpha = clamp(lag / 60, 0, 0.8) * guideA;
      g.beginPath(); g.moveTo(head.x, head.y); g.lineTo(cur.x, cur.y); g.stroke();
      g.restore();
    }
    // 거리 두기 원
    if (guideA > 0.01 && S.gap > 0) {
      g.save(); g.setLineDash([2, 5]); g.strokeStyle = C.accent; g.globalAlpha = 0.35 * guideA; g.lineWidth = 1.2;
      g.beginPath(); g.arc(cur.x, cur.y, S.gap, 0, Math.PI * 2); g.stroke(); g.restore();
    }
    // 꼬리부터 머리 순으로
    for (let i = MAX - 1; i >= 0; i--) {
      const s = segs[i];
      if (s.sc < 0.01) continue;
      const r = radius(i) * s.sc;
      const L = r * (1 + 0.85 * s.tip);
      const b = Math.acos(clamp(r / L, -1, 1));
      g.beginPath();
      g.arc(s.x, s.y, r, s.ang + b, s.ang - b + Math.PI * 2);
      g.lineTo(s.x + Math.cos(s.ang) * L, s.y + Math.sin(s.ang) * L);
      g.closePath();
      if (i === 0) { g.fillStyle = C.accent; g.fill(); }
      else { g.fillStyle = C.board; g.fill(); g.lineWidth = 1.5; g.strokeStyle = C.ink; g.stroke(); }
    }
    // 커서 목표 표시
    if (guideA > 0.01) {
      g.strokeStyle = C.ink; g.lineWidth = 1.5; g.globalAlpha = (cur.inside ? 0.9 : 0.3) * guideA;
      g.beginPath(); g.arc(cur.x, cur.y, 7, 0, Math.PI * 2); g.stroke();
      g.globalAlpha = 1;
    }

    /* ---------- 읽는 값 · 상태 ---------- */
    api.read("cursor", `${Math.round(cur.x)}, ${Math.round(cur.y)}`);
    api.read("lag", Math.round(lag));
    api.read("speed", head.spd.toFixed(1));
    api.read("angle", Math.round(((head.ang * 180 / Math.PI) + 360) % 360));
    const toward = (cur.x - head.x) * head.vx + (cur.y - head.y) * head.vy;
    if (S.motion === "spring" && head.spd > 0.6 && toward < 0) api.status("목표를 지나쳤다가 되돌아오는 중", "alt");
    else if (head.spd > 0.3) api.status(`따라가는 중 · ${Math.round(lag)}px 뒤`, "active");
    else api.status(cur.moved ? "도착 · 커서를 기다리는 중" : "대기", "idle");
  });
}
