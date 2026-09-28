import { clamp, dist, rng, localPoint, fitCanvas } from "../../lib/util.js";
import { ILLO, ILLO_CYCLE, dot, ellipse, line as inkLine, circle as inkCircle } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .merge-root { position: absolute; inset: 0; background: var(--board); }
    .merge-root.is-over { cursor: grab; }
    .merge-root.is-holding { cursor: grabbing; }
  `);
  const root = document.createElement("div");
  root.className = "merge-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const C = {
    ink: ILLO.ink,
    ink3: api.color("--ink-3") || "#9a9790",
    accent: api.color("--accent") || "#ff5a36",
    body: ILLO.green,      // 생명체 몸
    pellet: ILLO.orange,   // 먹이
    held: ILLO.yellow      // 집은 것
  };
  const LW = 3;   // 그림 선 굵기 (화면 px 기준)
  const font = getComputedStyle(el).fontFamily;
  const rand = rng(5);

  /* ---------- 좌표 ---------- */
  const V = { cx: 0, cy: 0, sc: 1 };
  const fit = () => { V.cx = size.w / 2; V.cy = size.h * 0.52; V.sc = clamp(Math.min(size.w / 600, size.h / 600), 0.5, 1.5); };
  fit();
  api.onResize(fit);
  const toDesign = p => ({ x: (p.x - V.cx) / V.sc, y: (p.y - V.cy) / V.sc });

  /* 스프링: 튕김이 켜져 있으면 목표를 살짝 지나쳤다 돌아온다 */
  const spring = (o, key, vKey, target) => {
    if (S.bounce) { o[vKey] = (o[vKey] + (target - o[key]) * 0.16) * 0.74; o[key] += o[vKey]; }
    else { o[vKey] = 0; o[key] += (target - o[key]) * 0.12; }
  };

  let mode = "", held = null, merges = 0, top = 1;

  /* ---------- 먹이기 모드 ---------- */
  const BASE_R = 58, MAX_R = 150;
  const blob = { R: BASE_R, v: 0, tR: BASE_R, x: 0, y: -50, mouth: 0, lookX: 0, lookY: 0, bumps: [], resetting: false };
  const PR = [10, 14, 19, 24, 30];
  let pellets = [], eating = [];
  const eqR = () => Math.sqrt(blob.tR * blob.tR + blob.bumps.reduce((a, b) => a + (b.gone ? 0 : b.r * b.r), 0));
  const makePellet = i => ({ i, r: PR[i], hx: (i - 2) * 92, hy: 190, x: (i - 2) * 92, y: 190, tx: (i - 2) * 92, ty: 190, vx: 0, vy: 0, s: 0, sv: 0 });

  /* ---------- 합치기(머지) 모드 ---------- */
  const COLS = 5, ROWS = 4, CS = 86;
  const cellPos = (c, r) => ({ x: (c - (COLS - 1) / 2) * CS, y: (r - (ROWS - 1) / 2) * CS });
  let tokens = [];
  const tokR = lv => 12 + lv * 4.2;
  const freeCells = () => {
    const out = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!tokens.some(t => t.c === c && t.r === r)) out.push([c, r]);
    return out;
  };
  const spawnToken = lv => {
    const fc = freeCells();
    if (!fc.length) return;
    const [c, r] = fc[Math.floor(rand() * fc.length)];
    const p = cellPos(c, r);
    tokens.push({ c, r, level: lv, x: p.x, y: p.y, tx: p.x, ty: p.y, vx: 0, vy: 0, s: 0, sv: 0 });
  };

  const build = () => {
    mode = S.mode; held = null; merges = 0; top = 1;
    root.classList.remove("is-holding");
    if (mode === "feed") {
      Object.assign(blob, { R: BASE_R, v: 0, tR: BASE_R, mouth: 0, bumps: [], resetting: false });
      pellets = PR.map((_, i) => makePellet(i)); eating = [];
    } else {
      tokens = [];
      [1, 1, 1, 1, 2, 2, 1].forEach(lv => spawnToken(lv));
    }
  };
  build();
  api.interval(() => {
    if (mode === "merge2" && tokens.length < 9 && !(held && tokens.length >= 8)) spawnToken(rand() < 0.8 ? 1 : 2);
  }, 1500);

  /* ---------- 포인터 ---------- */
  const pick = d => {
    const list = mode === "feed" ? pellets : tokens;
    for (let i = list.length - 1; i >= 0; i--) {
      const o = list[i], r = mode === "feed" ? o.r : tokR(o.level);
      if (o.s > 0.5 && dist(d.x, d.y, o.x, o.y) < r + 8) return o;
    }
    return null;
  };
  api.on(root, "pointerdown", e => {
    e.preventDefault();
    const d = toDesign(localPoint(root, e));
    const o = pick(d);
    if (!o) return;
    root.setPointerCapture(e.pointerId);
    held = { o, ox: o.x - d.x, oy: o.y - d.y };
    const list = mode === "feed" ? pellets : tokens;
    list.splice(list.indexOf(o), 1); list.push(o);
    root.classList.add("is-holding");
    api.hideHint();
  });
  api.on(root, "pointermove", e => {
    const d = toDesign(localPoint(root, e));
    if (!held) { root.classList.toggle("is-over", !!pick(d)); return; }
    held.o.tx = d.x + held.ox; held.o.ty = d.y + held.oy;
    held.o.x = held.o.tx; held.o.y = held.o.ty;
  });

  const bumpAngle = (x, y) => Math.atan2(y - blob.y, x - blob.x);
  const dropFeed = o => {
    const d = dist(o.x, o.y, blob.x, blob.y);
    if (d > eqR() + o.r * 0.3 || blob.resetting) { o.tx = o.hx; o.ty = o.hy; if (d < eqR() + 80) api.flash("몸에 겹쳐서 놓아야 합쳐진다", "idle"); return; }
    pellets.splice(pellets.indexOf(o), 1);
    merges++;
    if (S.attach === "edge") {
      // 닿은 자리에 그대로 붙어 몸을 넓힌다
      blob.bumps.push({ a: bumpAngle(o.x, o.y), r: o.r, s: 0.6, sv: 0, gone: false });
      api.flash(`가장자리에 붙였다 · ${merges}번째`, "ok");
    } else {
      eating.push({ x: o.x, y: o.y, r: o.r, t: 0 });
    }
    api.timeout(() => { if (mode === "feed") pellets.push(makePellet(o.i)); }, 700);
  };
  const dropMerge = o => {
    const cx = Math.round(o.x / CS + (COLS - 1) / 2), cy = Math.round(o.y / CS + (ROWS - 1) / 2);
    const back = msg => { const p = cellPos(o.c, o.r); o.tx = p.x; o.ty = p.y; if (msg) api.flash(msg, "idle"); };
    if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return back();
    const other = tokens.find(t => t !== o && t.c === cx && t.r === cy);
    if (!other) { o.c = cx; o.r = cy; const p = cellPos(cx, cy); o.tx = p.x; o.ty = p.y; return; }
    if (other.level !== o.level) return back("같은 단계끼리만 합쳐진다");
    tokens.splice(tokens.indexOf(o), 1);
    other.level++; other.s = 0.45; other.sv = 0;
    merges++; top = Math.max(top, other.level);
    api.flash(`합쳤다 · ${other.level}단계`, "ok");
  };
  const up = () => {
    if (!held) return;
    const o = held.o;
    held = null;
    root.classList.remove("is-holding");
    if (mode === "feed") dropFeed(o); else dropMerge(o);
  };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);
  api.onParam(k => { if (k === "mode") { build(); api.hint(S.mode === "feed" ? "먹이를 끌어다 먹이기" : "같은 숫자끼리 겹쳐 놓기"); } });

  /* ---------- 그리기 ---------- */
  const circle = (x, y, r) => { g.beginPath(); g.arc(x, y, Math.max(0, r), 0, Math.PI * 2); };
  const lw = w => w / V.sc;

  const drawBlob = () => {
    const R = blob.R;
    // 몸과 붙은 조각의 바깥선을 하나로: 굵은 선을 먼저 모두 그리고, 면을 그 위에 덮는다
    const shapes = [[blob.x, blob.y, R]];
    blob.bumps.forEach(b => {
      const d = blob.tR + b.r * 0.35;
      shapes.push([blob.x + Math.cos(b.a) * d, blob.y + Math.sin(b.a) * d, b.r * b.s]);
    });
    g.strokeStyle = C.ink; g.lineWidth = lw(LW * 2);
    shapes.forEach(([x, y, r]) => { circle(x, y, r); g.stroke(); });
    g.fillStyle = C.body;
    shapes.forEach(([x, y, r]) => { circle(x, y, r); g.fill(); });
    // 얼굴(키트 규칙: 점 두 개와 선 하나): 먹이가 가까우면 쳐다보고 입을 벌린다
    const ex = R * 0.34, ey = -R * 0.14, er = Math.max(3, R * 0.09);
    [-1, 1].forEach(k => dot(g, blob.x + k * ex + blob.lookX, blob.y + ey + blob.lookY, er));
    const mx = blob.x + blob.lookX * 0.5, my = blob.y + R * 0.3, mw = R * 0.2;
    if (blob.mouth < 0.08) inkLine(g, [[mx - mw, my], [mx + mw, my]], { lw: lw(LW) });
    else ellipse(g, mx, my, mw * 0.9, blob.mouth * (6 + R * 0.14), { fill: C.ink, lw: lw(LW) });
  };

  api.frame(dt => {
    const { w, h } = size;
    g.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    g.translate(V.cx, V.cy); g.scale(V.sc, V.sc);
    g.textAlign = "center"; g.textBaseline = "middle";

    let near = null, willMerge = false;
    if (mode === "feed") {
      // 삼키는 중인 먹이: 가운데로 빨려 들어가며 작아진다
      for (let i = eating.length - 1; i >= 0; i--) {
        const e = eating[i];
        e.t = Math.min(1, e.t + dt / 260);
        if (e.t >= 1) {
          eating.splice(i, 1);
          blob.tR = Math.sqrt(blob.tR * blob.tR + e.r * e.r);
          api.flash(`삼켰다 · 크기 ${Math.round(blob.tR)}`, "ok");
        }
      }
      if (!blob.resetting && eqR() > MAX_R && !eating.length) {
        blob.resetting = true;
        api.flash("가득 찼다 · 처음 크기로 돌아간다", "alt", 1400);
        api.timeout(() => { blob.tR = BASE_R; blob.bumps.forEach(b => { b.gone = true; }); }, 700);
        api.timeout(() => { blob.bumps = []; blob.resetting = false; }, 1500);
      }
      spring(blob, "R", "v", blob.tR);
      blob.bumps.forEach(b => spring(b, "s", "sv", b.gone ? 0 : 1));

      // 가까이 온 먹이에 반응
      let look = { x: 0, y: 0 }, open = 0;
      if (held) {
        const o = held.o, d = dist(o.x, o.y, blob.x, blob.y), edge = d - blob.R;
        near = Math.max(0, edge - o.r);
        willMerge = d < eqR() + o.r * 0.3 && !blob.resetting;
        open = clamp(1 - edge / 160, 0, 1);
        look = { x: (o.x - blob.x) / Math.max(1, d) * 6, y: (o.y - blob.y) / Math.max(1, d) * 6 };
      }
      if (eating.length) open = 1;
      blob.mouth += (open - blob.mouth) * 0.2;
      blob.lookX += (look.x - blob.lookX) * 0.2; blob.lookY += (look.y - blob.lookY) * 0.2;

      drawBlob();
      eating.forEach(e => {
        const k = e.t * e.t;
        inkCircle(g, e.x + (blob.x - e.x) * k, e.y + (blob.y + blob.R * 0.3 - e.y) * k, e.r * (1 - e.t), { fill: C.pellet, lw: lw(LW) });
      });
      // 먹이 자리
      PR.forEach((r, i) => { circle((i - 2) * 92, 190, r + 6); g.setLineDash([lw(3), lw(4)]); g.strokeStyle = C.ink3; g.lineWidth = lw(1); g.stroke(); g.setLineDash([]); });
      pellets.forEach(o => {
        spring(o, "s", "sv", 1);
        if (!held || held.o !== o) { o.vx = (o.vx + (o.tx - o.x) * 0.2) * 0.68; o.vy = (o.vy + (o.ty - o.y) * 0.2) * 0.68; o.x += o.vx; o.y += o.vy; }
        inkCircle(g, o.x, o.y, Math.max(0, o.r * o.s), { fill: held && held.o === o ? C.held : C.pellet, lw: lw(LW) });
      });
      api.read("size", Math.round(eqR()));
      api.read("top", "–");
    } else {
      // 격자
      g.strokeStyle = "rgba(0,0,0,.12)"; g.lineWidth = lw(1);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const p = cellPos(c, r); g.strokeRect(p.x - CS / 2 + 4, p.y - CS / 2 + 4, CS - 8, CS - 8); }
      let target = null;
      if (held) {
        const o = held.o;
        const cx = Math.round(o.x / CS + (COLS - 1) / 2), cy = Math.round(o.y / CS + (ROWS - 1) / 2);
        target = tokens.find(t => t !== o && t.c === cx && t.r === cy) || null;
        willMerge = !!target && target.level === o.level;
        const same = tokens.filter(t => t !== o && t.level === o.level);
        if (same.length) near = Math.min(...same.map(t => Math.max(0, dist(o.x, o.y, t.x, t.y) - tokR(t.level) - tokR(o.level))));
      }
      tokens.forEach(t => {
        spring(t, "s", "sv", 1);
        if (!held || held.o !== t) { t.vx = (t.vx + (t.tx - t.x) * 0.22) * 0.66; t.vy = (t.vy + (t.ty - t.y) * 0.22) * 0.66; t.x += t.vx; t.y += t.vy; }
        const isHeld = held && held.o === t;
        const r = tokR(t.level) * Math.max(0, t.s);
        // 단계마다 다른 평면 단색, 집으면 크림색으로 들린다
        inkCircle(g, t.x, t.y, r, { fill: isHeld ? ILLO.paper : ILLO_CYCLE[(t.level - 1) % ILLO_CYCLE.length], lw: lw(LW) });
        if (target === t) {   // 놓을 곳 미리보기: 같은 단계면 실선, 다르면 점선
          circle(t.x, t.y, r + 7);
          if (t.level !== held.o.level) g.setLineDash([lw(4), lw(4)]);
          g.strokeStyle = t.level === held.o.level ? C.accent : C.ink3; g.lineWidth = lw(2); g.stroke(); g.setLineDash([]);
        }
        g.fillStyle = C.ink;
        g.font = `600 ${Math.round(10 + t.level * 2)}px ${font}`;
        g.fillText(t.level, t.x, t.y + 1);
      });
      api.read("size", held ? `${held.o.level}단계` : "–");
      api.read("top", `${top}단계`);
    }

    api.read("near", near == null ? "–" : Math.round(near * V.sc));
    api.read("count", merges);
    if (held) api.status(willMerge ? "지금 놓으면 합쳐진다" : "옮기는 중", "active");
    else if (mode === "feed" && (eating.length || Math.abs(blob.v) > 0.3)) api.status("커지는 중", "alt");
    else api.status("대기", "idle");
  });
}
