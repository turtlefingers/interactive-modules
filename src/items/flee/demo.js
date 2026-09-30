import { rng, clamp, dist, localPoint, fitCanvas } from "../../lib/util.js";
import { TONE, ILLO } from "../../lib/draw.js";
import { drawPeep, preload, outfit } from "../../lib/figure.js";

/* ---------- 사람 생김새: 8가지를 돌려 쓴다 (서기 포즈 4종 · 걷기 포즈 2종) ---------- */
const CALM = outfit(ILLO.paper), SCARED = outfit(ILLO.orange);
const LOOKS = [
  { rest: "ShirtPantsBW", walk: "WalkingBW", hair: "ShortWavy", face: "Calm" },
  { rest: "CrossedArmsBW", walk: "WalkingFilled", hair: "Bun", face: "Smile" },
  { rest: "EasingBW", walk: "WalkingBW", hair: "Afro", face: "Cheeky" },
  { rest: "RestingBW", walk: "WalkingFilled", hair: "Long", face: "Calm" },
  { rest: "ShirtPantsBW", walk: "WalkingBW", hair: "Short", face: "Smile" },
  { rest: "CrossedArmsBW", walk: "WalkingFilled", hair: "MediumBangs", face: "Calm" },
  { rest: "EasingBW", walk: "WalkingBW", hair: "Turban", face: "Serious" },
  { rest: "RestingBW", walk: "WalkingFilled", hair: "ShortCurly", face: "Smile" }
].map(l => ({
  restCalm: { body: l.rest, face: l.face, hair: l.hair, colors: CALM },
  restScared: { body: l.rest, face: "Fear", hair: l.hair, colors: SCARED },
  walkCalm: { body: l.walk, face: l.face, hair: l.hair, colors: CALM },
  walkScared: { body: l.walk, face: "Fear", hair: l.hair, colors: SCARED }
}));
const ALL_FIGS = LOOKS.flatMap(l => [l.restCalm, l.restScared, l.walkCalm, l.walkScared]);

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .flee-root { position: absolute; inset: 0; cursor: crosshair; background: var(--board); }
  `);
  const root = document.createElement("div");
  root.className = "flee-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  preload(ALL_FIGS); // 뒤집힌 판까지 미리 만든다

  /* ---------- 사람들: 무대 크기에 따라 18~26명, 겹치지 않게 격자에 흩어 세운다 ---------- */
  let people = [];
  const build = () => {
    const { w, h } = size;
    const rand = rng(5);
    const N = clamp(Math.round((w * h) / 22000), 18, 26);
    const cols = Math.max(3, Math.round(Math.sqrt(N * w / h))), rows = Math.max(3, Math.ceil(N / cols));
    const cw = w / cols, ch = h / rows;
    const cells = [];
    for (let gy = 0; gy < rows; gy++) for (let gx = 0; gx < cols; gx++) cells.push([gx, gy]);
    for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    people = [];
    for (const [gx, gy] of cells) {
      if (people.length >= N) break;
      const ph = 70 + rand() * 20; // 키 70~90px
      const x = (gx + 0.3 + rand() * 0.4) * cw;
      const y = clamp((gy + 0.35 + rand() * 0.4) * ch + ph * 0.5, ph + 12, h - 10);
      if (x < 240 && y - ph < 64) continue; // 읽는 값 패널 아래는 비운다
      people.push({
        x, y, vx: 0, vy: 0, hx: x / w, hy: y / h, a: rand() < 0.5 ? 0 : Math.PI, fear: 0,
        h: ph, look: LOOKS[people.length % LOOKS.length], ph: rand() * 10, sway: rand() * 10, walking: false
      });
    }
  };
  build();
  const homeX = b => b.hx * size.w, homeY = b => b.hy * size.h;

  /* ---------- 포인터 ---------- */
  const p = { x: -999, y: -999, inside: false, down: false, lx: 0, ly: 0, lt: 0, speed: 0 };
  const threat = () => p.inside && (!S.pressOnly || p.down);
  const setPos = e => {
    const q = localPoint(el, e), now = performance.now();
    if (p.lt) p.speed = p.speed * 0.6 + Math.hypot(q.x - p.lx, q.y - p.ly) / Math.max(1, now - p.lt) * 16.67 * 0.4;
    p.lx = q.x; p.ly = q.y; p.lt = now; p.x = q.x; p.y = q.y;
  };
  let pulse = null;
  api.on(root, "pointerenter", e => { p.inside = true; setPos(e); });
  api.on(root, "pointermove", e => { p.inside = true; setPos(e); api.hideHint(); });
  api.on(root, "pointerleave", () => { if (!p.down) { p.inside = false; p.lt = 0; } });
  api.on(root, "pointerdown", e => {
    e.preventDefault(); root.setPointerCapture(e.pointerId);
    p.inside = true; p.down = true; setPos(e); api.hideHint();
    if (S.pressOnly) pulse = { x: p.x, y: p.y, t: 0 };
  });
  const up = e => { p.down = false; if (e.pointerType !== "mouse") p.inside = false; };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);

  let homeVis = S.returnHome ? 1 : 0;

  /* ---------- 사람 그리기: Open Peeps. 평소엔 파랑 옷으로 서 있고, 겁먹으면 주황 옷으로 걷는다 ----------
     원본은 오른쪽을 보므로 왼쪽으로 갈 때는 뒤집는다. 걸을 때는 진행 방향으로 살짝 기울고(±0.08) 위아래로 출렁인다 */
  const drawPerson = (b, t) => {
    const scared = b.fear > 0.12;
    const flip = Math.cos(b.a) < 0;
    let opts, y = b.y, rotate = 0, squash = 0;
    if (b.walking) {
      const sp = Math.hypot(b.vx, b.vy);
      const bob = Math.abs(Math.sin(b.ph)) * 2.5;
      y -= bob;
      rotate = (flip ? -1 : 1) * 0.08 * clamp(sp / S.speed, 0.4, 1);
      opts = scared ? b.look.walkScared : b.look.walkCalm;
    } else {
      // 서 있을 때는 숨 쉬듯 아주 조금 흔들린다
      rotate = Math.sin(t * 0.0012 + b.sway) * 0.012;
      squash = -Math.sin(t * 0.002 + b.sway) * 0.006;
      opts = scared ? b.look.restScared : b.look.restCalm;
    }
    if (flip) opts = { ...opts, flip: true };
    if (!drawPeep(g, opts, b.x, y, b.h, { rotate, squash })) {
      // 그림이 준비되기 전엔 발밑에 톤 점만
      g.fillStyle = TONE[3];
      g.beginPath(); g.arc(b.x, b.y, 3, 0, Math.PI * 2); g.fill();
    }
  };

  /* ---------- 루프 ---------- */
  const NB = 110; // 무리 이웃 거리
  const SEP = 30; // 서로 밀어내는 거리
  api.frame((dt, t) => {
    const { w, h } = size;
    const on = threat();
    const R = S.radius, MAX = S.speed;
    homeVis += ((S.returnHome ? 1 : 0) - homeVis) * 0.1;

    let near = Infinity, fleeing = 0, away = 0, returning = 0;
    for (const b of people) {
      const d = dist(b.x, b.y, p.x, p.y);
      if (p.inside) near = Math.min(near, d);
      // 1. 두려움: 반경 안이면 즉시 올라가고, 서서히 가라앉는다
      if (on && d < R) b.fear = Math.max(b.fear, 0.55 + 0.45 * (1 - d / R));
      else b.fear *= 0.975;
    }
    // 겁은 무리로 번진다
    if (S.flock > 0) for (const b of people) {
      if (b.fear < 0.5) continue;
      for (const o of people) if (o !== b && o.fear < b.fear * 0.6 && dist(b.x, b.y, o.x, o.y) < NB * 0.7) o.fear = Math.max(o.fear, b.fear * 0.6 * S.flock);
    }

    for (const b of people) {
      let ax = 0, ay = 0;
      const d = dist(b.x, b.y, p.x, p.y);
      const scared = b.fear > 0.12;
      // 2. 도망 (flee): 위협에서 멀어지는 방향이 원하는 속도
      if (on && d < R * 1.25) {
        const k = clamp(1 - d / (R * 1.25), 0, 1);
        const dx = (b.x - p.x) / (d || 1), dy = (b.y - p.y) / (d || 1);
        ax += (dx * MAX - b.vx) * 0.35 * (0.3 + k); ay += (dy * MAX - b.vy) * 0.35 * (0.3 + k);
      }
      // 3. 무리 짓기: 가까운 이웃과 모이고(응집) 방향을 맞춘다(정렬)
      let cx = 0, cy = 0, avx = 0, avy = 0, n = 0, sx = 0, sy = 0;
      for (const o of people) {
        if (o === b) continue;
        const dd = dist(b.x, b.y, o.x, o.y);
        if (dd < SEP && dd > 0) { sx += (b.x - o.x) / dd * (SEP - dd); sy += (b.y - o.y) / dd * (SEP - dd); }
        if (scared && o.fear > 0.12 && dd < NB) { cx += o.x; cy += o.y; avx += o.vx; avy += o.vy; n++; }
      }
      ax += sx * 0.05; ay += sy * 0.05;
      if (n && S.flock > 0) {
        ax += ((cx / n - b.x) * 0.004 + (avx / n - b.vx) * 0.06) * S.flock * 2;
        ay += ((cy / n - b.y) * 0.004 + (avy / n - b.vy) * 0.06) * S.flock * 2;
      }
      // 4. 진정되면 집으로 (도착 행동: 가까울수록 느려진다) 또는 그 자리에 멈춰 서기
      const hx = homeX(b), hy = homeY(b), hd = dist(b.x, b.y, hx, hy);
      if (!scared) {
        if (S.returnHome && hd > 1) {
          const want = Math.min(MAX * 0.55, hd * 0.05);
          ax += ((hx - b.x) / hd * want - b.vx) * 0.12;
          ay += ((hy - b.y) / hd * want - b.vy) * 0.12;
          if (hd > 6) returning++;
        } else { ax -= b.vx * 0.08; ay -= b.vy * 0.08; }
      } else if (!(on && d < R * 1.25)) {
        // 위협에서 벗어나면 조금씩 속도를 줄이며 이리저리 흔들린다
        ax -= b.vx * 0.025; ay -= b.vy * 0.025;
        ax += Math.sin(t * 0.004 + b.hx * 40) * 0.12; ay += Math.cos(t * 0.0037 + b.hy * 40) * 0.12;
      }
      // 5. 벽 (발 위치 기준. 위쪽은 머리가 잘리지 않게 키만큼 띄운다)
      const mx = 24, mt = b.h + 10, mb = 10;
      if (b.x < mx) ax += (mx - b.x) * 0.02; if (b.x > w - mx) ax -= (b.x - (w - mx)) * 0.02;
      if (b.y < mt) ay += (mt - b.y) * 0.02; if (b.y > h - mb) ay -= (b.y - (h - mb)) * 0.02;

      b.vx += ax; b.vy += ay;
      const sp = Math.hypot(b.vx, b.vy), lim = scared ? MAX : MAX * 0.6;
      if (sp > lim) { b.vx *= lim / sp; b.vy *= lim / sp; }
      b.x += b.vx; b.y += b.vy;
      b.x = clamp(b.x, 12, w - 12); b.y = clamp(b.y, b.h * 0.6, h - 2);

      const sp2 = Math.hypot(b.vx, b.vy);
      if (sp2 > 0.25) {
        const ta = Math.atan2(b.vy, b.vx);
        let da = ta - b.a; da = Math.atan2(Math.sin(da), Math.cos(da));
        b.a += da * 0.25;
      } else if (S.returnHome && hd < 3 && on && d < R * 2) {
        // 집에서 쉬는 중엔 위협 쪽을 흘끔 본다
        const ta = Math.atan2(p.y - b.y, p.x - b.x);
        let da = ta - b.a; da = Math.atan2(Math.sin(da), Math.cos(da));
        b.a += da * 0.05;
      }
      b.walking = sp2 > 0.9;
      b.ph += b.walking ? 0.22 + sp2 * 0.05 : 0;
      if (scared) fleeing++;
      if (hd > 12) away++;
    }

    /* 그리기 */
    g.clearRect(0, 0, w, h);
    if (homeVis > 0.01) {
      g.fillStyle = `rgba(0,0,0,${0.16 * homeVis})`;
      for (const b of people) { g.beginPath(); g.arc(homeX(b), homeY(b), 2.2, 0, Math.PI * 2); g.fill(); }
    }
    if (p.inside) {
      g.save();
      g.beginPath(); g.arc(p.x, p.y, R, 0, Math.PI * 2);
      g.setLineDash([4, 5]); g.strokeStyle = on ? "rgba(27,27,26,.45)" : "rgba(27,27,26,.18)"; g.lineWidth = 1; g.stroke();
      g.restore();
    }
    if (pulse) {
      pulse.t += dt;
      const k = pulse.t / 450;
      if (k >= 1) pulse = null;
      else { g.beginPath(); g.arc(pulse.x, pulse.y, R * (0.3 + k * 0.9), 0, Math.PI * 2); g.strokeStyle = `rgba(27,27,26,${0.4 * (1 - k)})`; g.lineWidth = 1; g.stroke(); }
    }
    // 발이 아래에 있는(가까운) 사람이 위에 오도록 y 순서로 그린다
    const order = people.slice().sort((a, b) => a.y - b.y);
    for (const b of order) drawPerson(b, t);

    /* 읽는 값과 상태 */
    api.read("near", near === Infinity ? "–" : Math.round(near) + "px");
    api.read("fleeing", `${fleeing}명`);
    api.read("away", `${away} / ${people.length}`);
    api.read("speed", p.inside ? p.speed.toFixed(1) : "0.0");
    if (p.speed > 0.01) p.speed *= 0.9;

    if (S.pressOnly && !p.down && p.inside && !fleeing) api.status("누르면 놀라서 흩어진다", "idle");
    else if (fleeing) api.status(`${fleeing}명 도망 중`, "active");
    else if (returning) api.status(`제자리로 돌아가는 중 · ${returning}명`, "alt");
    else if (away && !S.returnHome) api.status(`흩어진 채 서 있는 중 · ${away}명`, "idle");
    else api.status("대기", "idle");
  });
}
