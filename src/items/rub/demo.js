import { rng, clamp, lerp, localPoint, fitCanvas } from "../../lib/util.js";
import { ILLO, TONE, LINE, face, heart as drawHeart, circle, ellipse, shape, tube, roundRect, dot, line as inkLine } from "../../lib/draw.js";
import { drawAnimal, animalRatio } from "../../lib/animals.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .rub-root { position: absolute; inset: 0; background: var(--board); cursor: default;
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
    .rub-root.over { cursor: grab; }
    .rub-root.rubbing { cursor: grabbing; }
    .rub-gauge { position: absolute; transform: translateX(-50%); display: flex; align-items: center; gap: 10px;
      font-size: 13px; color: var(--ink-2); pointer-events: none; white-space: nowrap; }
    .rub-gauge .rub-bar { width: 160px; height: 8px; border-radius: 99px; background: rgba(0,0,0,.08); overflow: hidden; }
    .rub-gauge .rub-fill { height: 100%; width: 0%; border-radius: 99px; background: var(--accent); }
    .rub-gauge b { font-weight: 600; color: var(--ink); min-width: 36px; text-align: right; font-variant-numeric: tabular-nums; }
  `);

  const root = document.createElement("div");
  root.className = "rub-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const gauge = document.createElement("div");
  gauge.className = "rub-gauge";
  gauge.innerHTML = `<span class="rub-label"></span><div class="rub-bar"><div class="rub-fill"></div></div><b>0%</b>`;
  root.appendChild(gauge);
  const gLabel = gauge.querySelector(".rub-label"), gFill = gauge.querySelector(".rub-fill"), gNum = gauge.querySelector("b");

  /* ---------- 배치 ---------- */
  const L = { cx: 0, cy: 0, T: 300 };
  const win = { x: 0, y: 0, w: 0, h: 0, cell: 10, gw: 0, gh: 0, dirt: null, scene: null, fog: null, fogCtx: null, img: null };

  function buildWindow() {
    const oldDirt = win.dirt, ogw = win.gw, ogh = win.gh;
    win.w = Math.round(Math.min(size.w - 48, L.T * 1.15)); win.h = Math.round(L.T * 0.8);
    win.x = Math.round(L.cx - win.w / 2); win.y = Math.round(L.cy - win.h / 2);
    win.gw = Math.ceil(win.w / win.cell); win.gh = Math.ceil(win.h / win.cell);
    const r = rng(3);
    win.dirt = new Float32Array(win.gw * win.gh);
    win.base = new Float32Array(win.gw * win.gh);
    for (let j = 0; j < win.gh; j++) for (let i = 0; i < win.gw; i++) {
      const k = j * win.gw + i, b = 0.82 + r() * 0.18;
      win.base[k] = b;
      if (oldDirt) { const oi = Math.min(ogw - 1, Math.floor(i / win.gw * ogw)), oj = Math.min(ogh - 1, Math.floor(j / win.gh * ogh)); win.dirt[k] = Math.min(b, oldDirt[oj * ogw + oi]); }
      else win.dirt[k] = b;
    }
    win.fog = document.createElement("canvas"); win.fog.width = win.gw; win.fog.height = win.gh;
    win.fogCtx = win.fog.getContext("2d"); win.img = win.fogCtx.createImageData(win.gw, win.gh);
    // 창밖 풍경: 종이색 하늘 위에 겹치는 톤 언덕 셋 (외곽선 없음, 도상 없음)
    const d = size.dpr, sc = document.createElement("canvas");
    sc.width = Math.round(win.w * d); sc.height = Math.round(win.h * d);
    const s = sc.getContext("2d"); s.scale(d, d);
    s.fillStyle = ILLO.paper; s.fillRect(0, 0, win.w, win.h);
    const hill = (y, amp, ph, color) => shape(s, c => {
      c.moveTo(-4, win.h + 4); c.lineTo(-4, y);
      for (let x = 0; x <= win.w + 6; x += 6) c.lineTo(x, y + Math.sin(x / win.w * 5 + ph) * amp);
      c.lineTo(win.w + 4, win.h + 4); c.closePath();
    }, { fill: color });
    hill(win.h * 0.5, win.h * 0.07, 1, TONE[1]);
    hill(win.h * 0.66, win.h * 0.05, 3.2, TONE[2]);
    hill(win.h * 0.82, win.h * 0.04, 5.1, TONE[3]);
    win.scene = sc;
  }

  function layout() {
    L.cx = size.w / 2; L.cy = size.h / 2 - 16;
    L.T = Math.max(200, Math.min(size.w - 60, size.h - 190, 440));
    buildWindow();
    gauge.style.left = L.cx + "px";
    gauge.style.top = (L.cy + L.T / 2 + 30) + "px";
  }
  layout();
  api.onResize(layout);

  // 고양이(앉은 실루엣) 크기: 발은 cy + T·0.36, 키는 T·0.7
  const CAT = "cat-sit";
  const catBox = T => { const h = T * 0.7, w = h * animalRatio(CAT), feet = L.cy + T * 0.06 + T * 0.36; return { h, w, feet, cy: feet - h / 2 }; };

  /* ---------- 상태 ---------- */
  const st = { creature: 0, lamp: 0 };
  let genie = 0, fade = 1, lastRub = -9999, reversals = 0, rubDist = 0, speed = 0;
  const parts = [];
  const ptr = { down: false, x: -999, y: -999, over: false, dirx: 0, diry: 0, sinceRev: 0, vx: 0, vy: 0, lt: 0 };

  const amount = t => {
    if (t === "dirt") { let s = 0, b = 0; for (let k = 0; k < win.dirt.length; k++) { s += win.dirt[k]; b += win.base[k]; } return clamp(1 - s / b, 0, 1); }
    return st[t];
  };
  const hit = (x, y) => {
    const t = S.target, T = L.T;
    if (t === "dirt") return x > win.x && x < win.x + win.w && y > win.y && y < win.y + win.h;
    if (t === "creature") {
      // 고양이 실루엣을 덮는 타원 (조금 여유 있게)
      const c = catBox(T);
      return ((x - L.cx) / (c.w / 2 + 12)) ** 2 + ((y - c.cy) / (c.h / 2 + 12)) ** 2 < 1;
    }
    return Math.abs(x - L.cx) < T * 0.42 && Math.abs(y - (L.cy + T * 0.1)) < T * 0.2;
  };

  /* ---------- 문지르기 ---------- */
  function rubSeg(x0, y0, x1, y1) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 0.5) return;
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
    // 방향 전환(왕복) 감지: 부드럽게 쌓은 진행 방향과 반대로 꺾이면 1회
    const dot = ux * ptr.dirx + uy * ptr.diry;
    if (dot < -0.35 && ptr.sinceRev > 14) { reversals++; ptr.sinceRev = 0; onReversal(x1, y1); ptr.dirx = ux; ptr.diry = uy; }
    else { ptr.dirx = lerp(ptr.dirx, ux, 0.35); ptr.diry = lerp(ptr.diry, uy, 0.35); const m = Math.hypot(ptr.dirx, ptr.diry) || 1; ptr.dirx /= m; ptr.diry /= m; }
    ptr.sinceRev += len;
    rubDist += len; lastRub = performance.now();
    const k = S.sens;
    if (S.target === "dirt") {
      const R = Math.max(22, L.T * 0.085), steps = Math.ceil(len / 4);
      for (let s = 1; s <= steps; s++) {
        const px = x0 + (x1 - x0) * s / steps - win.x, py = y0 + (y1 - y0) * s / steps - win.y;
        const i0 = Math.max(0, Math.floor((px - R) / win.cell)), i1 = Math.min(win.gw - 1, Math.floor((px + R) / win.cell));
        const j0 = Math.max(0, Math.floor((py - R) / win.cell)), j1 = Math.min(win.gh - 1, Math.floor((py + R) / win.cell));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
          const dd = Math.hypot((i + 0.5) * win.cell - px, (j + 0.5) * win.cell - py);
          if (dd > R) continue;
          const q = j * win.gw + i;
          win.dirt[q] = Math.max(0, win.dirt[q] - (len / steps) * 0.0075 * k * (1 - dd / R * 0.6));
        }
      }
    } else if (S.target === "creature") {
      const before = st.creature;
      st.creature = clamp(st.creature + len / (L.T * 7) * k, 0, 1);
      if (Math.floor(st.creature * 4) > Math.floor(before * 4)) for (let i = 0; i < 3; i++) heart();
      if (st.creature > 0.75 && Math.random() < len / 400) heart();
    } else {
      st.lamp = clamp(st.lamp + len / (L.T * 7) * k, 0, 1);
    }
  }
  function onReversal(x, y) {
    const k = S.sens;
    if (S.target === "creature") st.creature = clamp(st.creature + 0.018 * k, 0, 1);
    if (S.target === "lamp") st.lamp = clamp(st.lamp + 0.02 * k, 0, 1);
    parts.push({ kind: "ring", x, y, vx: 0, vy: 0, life: 0, max: 0.5 });
  }
  const heart = () => { const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6; parts.push({ kind: "heart", x: L.cx + Math.cos(a) * L.T * 0.3, y: L.cy + Math.sin(a) * L.T * 0.3, vx: Math.cos(a) * 30, vy: -60 - Math.random() * 40, life: 0, max: 1.4, s: 0.7 + Math.random() * 0.6, c: ILLO.red }); };

  api.on(root, "pointerdown", e => {
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    const p = localPoint(root, e);
    Object.assign(ptr, { down: true, x: p.x, y: p.y, dirx: 0, diry: 0, sinceRev: 0, lt: performance.now() });
    api.hideHint();
  });
  api.on(root, "pointermove", e => {
    const p = localPoint(root, e), now = performance.now();
    const dt = Math.max(8, now - ptr.lt) / 1000;
    ptr.vx = lerp(ptr.vx, (p.x - ptr.x) / dt, 0.4); ptr.vy = lerp(ptr.vy, (p.y - ptr.y) / dt, 0.4);
    if (ptr.down && hit(p.x, p.y) && hit(ptr.x, ptr.y)) rubSeg(ptr.x, ptr.y, p.x, p.y);
    ptr.x = p.x; ptr.y = p.y; ptr.lt = now;
    ptr.over = hit(p.x, p.y);
  });
  const up = () => { ptr.down = false; };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);
  api.on(root, "pointerleave", () => { ptr.over = false; });

  api.onParam(k => { if (k === "target") { fade = 0; } });

  /* ---------- 그리기 ---------- */
  const INK = ILLO.ink, PAPER = ILLO.paper;
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const COLD = hex(TONE[3]), HOT = hex(ILLO.orange);
  // 램프 색: 톤(회갈색)에서 강조색(주황)으로 달아오른다 — 장면의 색은 이것 하나
  const mix = t => `rgb(${COLD.map((v, i) => Math.round(v + (HOT[i] - v) * t)).join(",")})`;
  const DARK = hex(TONE[5]);
  const mixCat = t => `rgb(${DARK.map((v, i) => Math.round(v + (HOT[i] - v) * t)).join(",")})`;

  function drawWindow() {
    const d = win.img.data;
    for (let k = 0; k < win.dirt.length; k++) { d[k * 4] = 150; d[k * 4 + 1] = 145; d[k * 4 + 2] = 136; d[k * 4 + 3] = Math.round(win.dirt[k] * 235); }
    win.fogCtx.putImageData(win.img, 0, 0);
    g.save();
    g.beginPath(); g.rect(win.x, win.y, win.w, win.h); g.clip();
    g.drawImage(win.scene, win.x, win.y, win.w, win.h);
    g.imageSmoothingEnabled = true;
    g.drawImage(win.fog, win.x, win.y, win.w, win.h);
    g.restore();
    // 창틀: 가는 잉크 선
    inkLine(g, [[win.x, win.y], [win.x + win.w, win.y], [win.x + win.w, win.y + win.h], [win.x, win.y + win.h], [win.x, win.y]], { lw: LINE });
    inkLine(g, [[win.x + win.w / 2, win.y], [win.x + win.w / 2, win.y + win.h]], { lw: LINE });
    inkLine(g, [[win.x, win.y + win.h / 2], [win.x + win.w, win.y + win.h / 2]], { lw: LINE });
  }

  function drawCreature(t) {
    const a = st.creature, T = L.T;
    const rubbing = ptr.down && performance.now() - lastRub < 120 && S.target === "creature";
    const purr = a > 0.6 && performance.now() - lastRub < 600;
    const jx = purr ? Math.sin(t * 0.09) * 1.2 : 0;
    const cx = L.cx + jx, cy = L.cy + T * 0.06;
    const press = rubbing ? 1 : 0;
    const lean = clamp(ptr.vx * 0.012, -8, 8) * press;
    // 고양이: 앉은 실루엣 하나. 기분이 좋아질수록 톤에서 강조색으로, 문지르면 살짝 눌리고 그쪽으로 기운다
    const c = catBox(T);
    const warm = clamp((a - 0.45) / 0.35, 0, 1);
    g.save();
    g.translate(cx + lean, c.feet);
    g.scale(1 + press * 0.03, 1 - press * 0.03 + Math.sin(t * 0.003) * 0.01);
    drawAnimal(g, CAT, 0, 0, c.h, { color: mixCat(warm), angle: lean * 0.006 + (purr ? Math.sin(t * 0.02) * 0.01 : 0) });
    g.restore();
    if (purr && Math.random() < 0.03) parts.push({ kind: "text", text: "그르릉", x: cx + T * (0.2 + Math.random() * 0.1), y: cy - T * 0.16, vx: 12, vy: -30, life: 0, max: 1.3, c: "#9a9790" });
  }

  function drawLamp(t) {
    const a = st.lamp, T = L.T;
    const shake = a > 0.55 ? (a - 0.55) * 5 : 0;
    const cx = L.cx + Math.sin(t * 0.07) * shake, cy = L.cy + T * 0.16;
    const R = T * 0.26;
    // 요정: 주둥이에서 올라오는 라일락 연기 실루엣 끝의 둥근 얼굴 (점 둘, 선 하나)
    if (genie > 0.01) {
      const sx = cx + R * 1.1, sy = cy - R * 0.44;
      const gy = sy - genie * T * 0.34, gx = sx + R * 0.1;
      g.save(); g.globalAlpha *= genie;
      const N = 14;
      for (let i = 0; i <= N; i++) {
        const k = i / N, u = 1 - k;
        const px = u * u * sx + 2 * u * k * (sx - R * 0.35) + k * k * gx;
        const py = u * u * sy + 2 * u * k * (sy - R * 0.5) + k * k * (gy + 22);
        circle(g, px + Math.sin(k * 9 + t * 0.002) * 4 * k, py, 4 + 16 * k, { fill: ILLO.lilac });
      }
      circle(g, gx, gy, 26, { fill: ILLO.lilac });
      face(g, gx, gy, 26, { mood: "happy", lw: LINE });
      if (genie > 0.85) {
        g.globalAlpha = (genie - 0.85) / 0.15;
        g.font = "500 15px Pretendard Variable, Pretendard, system-ui, sans-serif";
        const msg = "소원을 말해봐", tw = g.measureText(msg).width;
        const bx = Math.min(gx + 36, size.w - tw - 30), by = gy - 40;
        roundRect(g, bx, by, tw + 22, 32, 16, { fill: PAPER, lw: LINE });
        g.fillStyle = INK; g.textBaseline = "middle"; g.textAlign = "left"; g.fillText(msg, bx + 11, by + 16);
      }
      g.restore();
    }
    // 램프: 외곽선 없는 톤 실루엣. 문지를수록 톤에서 주황으로 달아오른다
    const fill = mix(a);
    ellipse(g, cx, cy + R * 0.34, R * 0.4, R * 0.09, { fill });                                   // 받침
    tube(g, [[cx, cy + R * 0.1], [cx, cy + R * 0.3]], { color: fill, w: R * 0.26 });               // 굽
    shape(g, c => c.ellipse(cx - R * 0.8, cy - R * 0.12, R * 0.24, R * 0.18, 0, Math.PI * 0.5, Math.PI * 1.55), { fill: null, lw: 6, stroke: fill });   // 손잡이
    shape(g, c => {                                                                                  // 주둥이
      c.moveTo(cx + R * 0.5, cy - R * 0.02);
      c.quadraticCurveTo(cx + R * 0.9, cy - R * 0.05, cx + R * 1.12, cy - R * 0.44);
      c.quadraticCurveTo(cx + R * 0.8, cy - R * 0.28, cx + R * 0.45, cy - R * 0.28); c.closePath();
    }, { fill });
    ellipse(g, cx, cy - R * 0.1, R * 0.7, R * 0.28, { fill });                                     // 몸통
    shape(g, c => { c.ellipse(cx, cy - R * 0.38, R * 0.22, R * 0.14, 0, Math.PI, 0); c.closePath(); }, { fill });   // 뚜껑
    // 가는 잉크 디테일 하나: 뚜껑 윤곽과 꼭지
    shape(g, c => c.ellipse(cx, cy - R * 0.38, R * 0.22, R * 0.14, 0, Math.PI, 0), { fill: null, lw: LINE });
    dot(g, cx, cy - R * 0.54, 2.5);
  }

  /* ---------- 루프 ---------- */
  api.frame((dt, t) => {
    const s = dt / 1000, now = performance.now();
    const idle = now - lastRub > 400;
    if (S.decay && idle) {
      const r = S.decayRate * s;
      st.creature = Math.max(0, st.creature - r);
      st.lamp = Math.max(0, st.lamp - r);
      for (let k = 0; k < win.dirt.length; k++) if (win.dirt[k] < win.base[k]) win.dirt[k] = Math.min(win.base[k], win.dirt[k] + r * 0.6);
    }
    genie = lerp(genie, st.lamp >= 0.999 || (genie > 0.5 && st.lamp > 0.6) ? 1 : 0, 0.05);
    if (st.lamp >= 0.999 && genie < 0.05) api.flash("램프에서 무언가 나온다", "ok");
    fade = Math.min(1, fade + s * 3);
    const sp = ptr.down && now - lastRub < 120 ? Math.hypot(ptr.vx, ptr.vy) : 0;
    speed = lerp(speed, sp, 0.2);

    g.clearRect(0, 0, size.w, size.h);
    g.globalAlpha = fade;
    if (S.target === "dirt") drawWindow();
    else if (S.target === "creature") drawCreature(t);
    else drawLamp(t);
    g.globalAlpha = 1;

    // 문지르는 손 표시
    if (ptr.over || ptr.down) {
      const on = ptr.down && hit(ptr.x, ptr.y);
      g.beginPath(); g.arc(ptr.x, ptr.y, S.target === "dirt" ? Math.max(22, L.T * 0.085) : 18, 0, 7);
      g.fillStyle = on ? "rgba(255,90,54,.14)" : "rgba(27,27,26,.05)"; g.fill();
      g.strokeStyle = on ? "rgba(255,90,54,.8)" : "rgba(27,27,26,.3)"; g.lineWidth = 1.5; g.stroke();
    }

    // 입자
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += s; if (p.life > p.max) { parts.splice(i, 1); continue; }
      p.x += p.vx * s; p.y += p.vy * s; p.vy -= 10 * s;
      const al = 1 - p.life / p.max;
      g.globalAlpha = al;
      if (p.kind === "heart") drawHeart(g, p.x, p.y, { r: 9 * p.s * (1 + p.life * 0.4), color: p.c });   // 작은 빨강 실루엣
      else if (p.kind === "text") { g.fillStyle = p.c; g.font = "500 13px Pretendard Variable, Pretendard, system-ui, sans-serif"; g.fillText(p.text, p.x, p.y); }
      else { g.strokeStyle = "#1b1b1a"; g.lineWidth = 1.2; g.beginPath(); g.arc(p.x, p.y, 6 + p.life * 50, 0, 7); g.stroke(); }
    }
    g.globalAlpha = 1;

    const amt = amount(S.target);
    const label = { dirt: "깨끗함", creature: "기분", lamp: "램프의 열기" }[S.target];
    if (gLabel.textContent !== label) gLabel.textContent = label;
    gFill.style.width = (amt * 100).toFixed(1) + "%";
    gNum.textContent = Math.round(amt * 100) + "%";
    root.classList.toggle("over", ptr.over && !ptr.down);
    root.classList.toggle("rubbing", ptr.down);

    api.read("amount", Math.round(amt * 100) + "%");
    api.read("rev", reversals);
    api.read("dist", Math.round(rubDist) + "px");
    api.read("speed", Math.round(speed) + "px/s");

    const verb = { dirt: "닦는 중", creature: "쓰다듬는 중", lamp: "램프를 문지르는 중" }[S.target];
    if (ptr.down && now - lastRub < 150) api.status(`${verb} · 왕복 ${reversals}회 · ${Math.round(amt * 100)}%`, "active");
    else if (ptr.down && !hit(ptr.x, ptr.y)) api.status("대상 위에서 문질러야 쌓인다", "idle");
    else if (S.decay && idle && amt > 0.005 && !(S.target === "dirt" && amt < 0.01)) api.status("멈춰서 서서히 되돌아가는 중", "alt");
    else if (amt > 0.99) api.status(S.target === "lamp" ? "소환 완료" : "가득 찼다", "ok");
    else api.status("대기", "idle");
  });
}
