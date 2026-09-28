import { rng, clamp, lerp, localPoint, fitCanvas } from "../../lib/util.js";
import { ILLO, shape, tube, circle } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;
  const TAU = Math.PI * 2;
  // 뒤(먼 층)에서 앞(가까운 층) 순서
  const DEPTH = [0.04, 0.2, 0.45, 0.75, 1.1, 1.6];
  const NAME = ["해", "먼 산", "가까운 산", "언덕", "땅", "풀잎"];

  api.css(`
    .mouse-parallax-demo { position: absolute; inset: 0; cursor: crosshair; touch-action: none; background: var(--board); overflow: hidden; }
    .mouse-parallax-scene { position: absolute; inset: 0; transform-origin: 50% 50%; will-change: transform; }
    .mouse-parallax-guide { position: absolute; right: 16px; bottom: 16px; z-index: 40; pointer-events: none;
      background: var(--board); border: 1px solid var(--ink); border-radius: var(--r-box); padding: 8px 10px; transition: opacity .3s; }
    .mouse-parallax-guide canvas { display: block; }
  `);
  const root = document.createElement("div");
  root.className = "mouse-parallax-demo";
  el.appendChild(root);
  const scene = document.createElement("div");
  scene.className = "mouse-parallax-scene";
  root.appendChild(scene);
  const { g, size } = fitCanvas(api, { parent: scene });
  const C = { ink: api.color("--ink"), ink3: api.color("--ink-3"), accent: api.color("--accent"), board: api.color("--board") };
  // 층 색 (그림 키트 팔레트): 해, 먼 산, 가까운 산, 언덕, 땅, 풀잎
  const TONE = [ILLO.yellow, ILLO.grey, ILLO.lilac, ILLO.green, ILLO.orange, ILLO.green];
  const LW = 3;

  /* ---------- 층 모양 (정규화 좌표로 한 번만 만든다) ---------- */
  const rand = rng(3);
  const peaks = (n, lo, hi) => Array.from({ length: n + 1 }, (_, i) => ({ x: -0.25 + i * 1.5 / n + (rand() - 0.5) * 0.06, h: lo + rand() * (hi - lo) }));
  const far = peaks(10, 0.14, 0.3), mid = peaks(7, 0.1, 0.24);
  const hillPh = [rand() * TAU, rand() * TAU];
  const trees = Array.from({ length: 14 }, () => ({ x: -0.15 + rand() * 1.3, s: 0.6 + rand() * 0.6 }));
  const blades = Array.from({ length: 18 }, (_, i) => {
    const left = i < 9;
    return { x: left ? -0.06 + rand() * 0.16 : 0.9 + rand() * 0.16, h: 0.12 + rand() * 0.2, lean: (rand() - 0.5) * 0.08 };
  });
  const hillY = (x, w, h) => h * 0.8 - (Math.sin(x / w * 5.2 + hillPh[0]) * 0.035 + Math.sin(x / w * 11 + hillPh[1]) * 0.015 + 0.03) * h;

  // 모든 층은 평면 단색 + 3px 잉크 외곽선으로 그린다 (그림 키트 규칙)
  const drawLayer = (i, w, h, ox, oy) => {
    g.save(); g.translate(ox, oy);
    const fill = TONE[i];
    const X0 = -w * 0.5, X1 = w * 1.5, BOT = h + 200;
    if (i === 0) {
      circle(g, w * 0.7, h * 0.27, Math.min(w, h) * 0.06, { fill, lw: LW });
    } else if (i === 1 || i === 2) {
      const pk = i === 1 ? far : mid, base = i === 1 ? 0.64 : 0.74;
      shape(g, c => {
        c.moveTo(X0, BOT);
        pk.forEach((p, k) => {
          c.lineTo(p.x * w, h * (base - p.h));
          if (k < pk.length - 1) c.lineTo((p.x + pk[k + 1].x) / 2 * w, h * (base - 0.02));
        });
        c.lineTo(X1, h * base); c.lineTo(X1, BOT); c.closePath();
      }, { fill, lw: LW });
    } else if (i === 3) {
      shape(g, c => {
        c.moveTo(X0, BOT);
        for (let x = X0; x <= X1; x += 10) c.lineTo(x, hillY(x, w, h));
        c.lineTo(X1, BOT); c.closePath();
      }, { fill, lw: LW });
      // 나무: 줄기 + 둥근 수관
      for (const t of trees) {
        const x = t.x * w, y = hillY(x, w, h) + 4, th = h * 0.09 * t.s, r = th * 0.42;
        tube(g, [[x, y], [x, y - th + r]], { color: ILLO.orange, w: Math.max(4, th * 0.16), lw: LW });
        circle(g, x, y - th + r * 0.6, r, { fill: ILLO.green, lw: LW });
      }
    } else if (i === 4) {
      shape(g, c => {
        c.moveTo(X0, BOT); c.lineTo(X0, h * 0.9);
        c.quadraticCurveTo(w * 0.5, h * 0.86, X1, h * 0.91); c.lineTo(X1, BOT); c.closePath();
      }, { fill, lw: LW });
    } else {
      for (const b of blades) {
        const x = b.x * w, bh = h * b.h, bw = Math.max(6, w * 0.014);
        shape(g, c => { c.moveTo(x - bw, h + 60); c.quadraticCurveTo(x - bw * 0.3, h - bh * 0.5, x + b.lean * w, h - bh); c.quadraticCurveTo(x + bw * 0.3, h - bh * 0.5, x + bw, h + 60); c.closePath(); }, { fill, lw: LW });
      }
    }
    g.restore();
  };

  /* ---------- 가이드: 층마다 이동량 ---------- */
  const guide = document.createElement("div");
  guide.className = "mouse-parallax-guide";
  const gc = document.createElement("canvas");
  guide.appendChild(gc); root.appendChild(guide);
  const GW = 170, GH = 128, dpr = window.devicePixelRatio || 1;
  gc.width = GW * dpr; gc.height = GH * dpr; gc.style.width = GW + "px"; gc.style.height = GH + "px";
  const gg = gc.getContext("2d"); gg.scale(dpr, dpr);
  const font = getComputedStyle(el).fontFamily;

  /* ---------- 상태 ---------- */
  const cur = { tx: 0, ty: 0, x: 0, y: 0, inside: false };
  let moved = false;
  const de = DEPTH.slice();
  let ds = S.dir === "with" ? 1 : -1, tl = S.tilt ? 1 : 0, guideA = S.guide ? 1 : 0;
  const offs = DEPTH.map(() => ({ x: 0, y: 0 }));

  const move = e => {
    const p = localPoint(el, e);
    cur.tx = clamp(p.x / size.w * 2 - 1, -1, 1); cur.ty = clamp(p.y / size.h * 2 - 1, -1, 1); cur.inside = true;
    if (!moved) { moved = true; api.hideHint(); }
  };
  api.on(root, "pointermove", move);
  api.on(root, "pointerdown", move);
  api.on(root, "pointerleave", () => { cur.inside = false; cur.tx = cur.ty = 0; });
  api.on(root, "pointerup", e => { if (e.pointerType !== "mouse") { cur.inside = false; cur.tx = cur.ty = 0; } });

  // 깊이 단계: n단계로 줄이면 비슷한 깊이끼리 같은 값이 된다 (1단계 = 모두 같이 움직임)
  const levelDepth = i => {
    const n = S.levels;
    if (n <= 1) return 0.7;
    const lv = Math.round(i * (n - 1) / (DEPTH.length - 1));
    return lerp(DEPTH[0], DEPTH[DEPTH.length - 1], lv / (n - 1));
  };

  api.frame(dt => {
    const step = dt / 16.67;
    const w = size.w, h = size.h;
    const e = 1 - Math.pow(0.88, step);
    const f = 1 - Math.pow(1 - S.smooth, step);
    cur.x += (cur.tx - cur.x) * f; cur.y += (cur.ty - cur.y) * f;
    ds += ((S.dir === "with" ? 1 : -1) - ds) * e;
    tl += ((S.tilt ? 1 : 0) - tl) * e;
    guideA += ((S.guide ? 1 : 0) - guideA) * e;
    const MAXPX = clamp(w * 0.18, 70, 220) * S.strength;

    g.clearRect(0, 0, w, h);
    for (let i = 0; i < DEPTH.length; i++) {
      de[i] += (levelDepth(i) - de[i]) * e;
      offs[i].x = ds * cur.x * MAXPX * de[i];
      offs[i].y = ds * cur.y * MAXPX * 0.5 * de[i];
      drawLayer(i, w, h, offs[i].x, offs[i].y);
    }
    scene.style.transform = tl > 0.001
      ? `perspective(900px) rotateY(${cur.x * 7 * tl}deg) rotateX(${-cur.y * 5 * tl}deg) scale(${1 + 0.07 * tl})`
      : "";

    /* 가이드 */
    guide.style.opacity = guideA.toFixed(3);
    guide.style.visibility = guideA < 0.01 ? "hidden" : "visible";
    if (guideA > 0.01) {
      gg.clearRect(0, 0, GW, GH);
      const cx = GW / 2 + 18, rowH = (GH - 8) / DEPTH.length;
      gg.strokeStyle = C.ink3; gg.lineWidth = 1;
      gg.beginPath(); gg.moveTo(cx + 0.5, 0); gg.lineTo(cx + 0.5, GH); gg.stroke();
      gg.font = `13px ${font}`; gg.textBaseline = "middle"; gg.fillStyle = C.ink;
      for (let i = 0; i < DEPTH.length; i++) {
        const y = 4 + rowH * (i + 0.5);
        gg.fillText(NAME[i], 0, y);
        gg.strokeStyle = "rgba(0,0,0,.12)"; gg.beginPath(); gg.moveTo(cx - 50, y); gg.lineTo(cx + 50, y); gg.stroke();
        const x = cx + clamp(offs[i].x * 0.55, -50, 50);
        gg.fillStyle = i === 0 ? C.accent : C.ink;
        gg.beginPath(); gg.arc(x, y, 3.5, 0, TAU); gg.fill();
        gg.fillStyle = C.ink;
      }
    }

    const farX = offs[0].x, nearX = offs[DEPTH.length - 1].x;
    api.read("ratio", `${cur.tx.toFixed(2)}, ${cur.ty.toFixed(2)}`);
    api.read("far", farX.toFixed(1));
    api.read("near", nearX.toFixed(1));
    api.read("ratio2", Math.abs(farX) > 0.3 ? `${(nearX / farX).toFixed(1)}배` : "–");
    const moving = Math.abs(cur.tx - cur.x) + Math.abs(cur.ty - cur.y) > 0.01;
    if (!cur.inside && moving) api.status("제자리로 돌아오는 중", "alt");
    else if (moving) api.status(S.levels <= 1 ? "모든 층이 같이 움직이는 중 · 깊이감 없음" : "층마다 다른 양만큼 움직이는 중", "active");
    else api.status(cur.inside ? "멈춤 · 커서를 움직여보기" : "대기", "idle");
  });
}
