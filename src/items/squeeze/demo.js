import { clamp, lerp, localPoint, fitCanvas } from "../../lib/util.js";
import { TONE, LINE, ILLO } from "../../lib/draw.js";
import "../../lib/objects/index.js";
import { drawObject } from "../../lib/objects.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .squeeze-root { position: absolute; inset: 0; background: var(--board); cursor: none; }
  `);
  const root = document.createElement("div");
  root.className = "squeeze-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });

  const INK = "#1b1b1a", ACC = ILLO.blue;
  const LIQ = {
    water: { grav: 1500, drag: 0, r: 3.2, flow: 0.42, repose: 0, vol: 1, splash: true },
    honey: { grav: 520, drag: 1.6, r: 5.2, flow: 0.035, repose: 0, vol: 1.8, splash: false },
    sand: { grav: 1300, drag: 0, r: 1.6, flow: 0.5, repose: 1.6, vol: 0.45, splash: false }
  };

  /* ---------- 바닥 ---------- */
  const BIN = 4;
  let groundY = 0, nb = 0, level = new Float32Array(0);
  const sprouts = [];
  function layout() {
    groundY = Math.round(size.h - Math.max(72, size.h * 0.15));
    const old = level, onb = nb;
    nb = Math.ceil(size.w / BIN) + 1;
    level = new Float32Array(nb);
    for (let i = 0; i < nb; i++) level[i] = onb ? old[Math.min(onb - 1, Math.floor(i / nb * onb))] : 0;
    const want = Math.floor(size.w / 34);
    while (sprouts.length < want) sprouts.push({ x: 0, g: 0, lean: (Math.random() - 0.5) * 0.3 });
    sprouts.length = want;
    sprouts.forEach((s, i) => { s.x = (i + 0.5) * size.w / want; });
  }
  layout();
  api.onResize(layout);

  /* ---------- 구름 ---------- */
  const cloud = { x: size.w / 2, y: size.h * 0.3, tx: size.w / 2, ty: size.h * 0.3, vx: 0, sq: 0, water: 1, wob: 0 };
  const ptr = { down: false, in: false, t0: 0, hold: 0 };
  let drops = [], splashes = [], total = 0, emitAcc = 0;

  const setTarget = p => {
    cloud.tx = clamp(p.x, 40, size.w - 40);
    cloud.ty = clamp(p.y, 70, groundY - 110);
  };
  api.on(root, "pointerenter", () => { ptr.in = true; });
  api.on(root, "pointerleave", () => { ptr.in = false; });
  api.on(root, "pointerdown", e => {
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    ptr.down = true; ptr.in = true; ptr.t0 = performance.now();
    setTarget(localPoint(root, e));
    api.hideHint();
  });
  api.on(root, "pointermove", e => setTarget(localPoint(root, e)));
  const up = () => { ptr.down = false; };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);

  // 구름: 카탈로그 cloud (state = 눌림). 물이 빠지면 작아진다
  const R = 62;
  const cloudScale = () => {
    const k = 0.62 + cloud.water * 0.38;
    return { sx: k * (1 - cloud.sq * 0.28), sy: k * (1 - cloud.sq * 0.14) };
  };
  function drawCloud() {
    const { sx, sy } = cloudScale();
    const wob = Math.sin(cloud.wob) * cloud.sq * 2;
    const k = 0.62 + cloud.water * 0.38;
    drawObject(g, "cloud", cloud.x + wob, cloud.y + R * 0.8 * k, R * 1.5 * k, { state: cloud.sq, t: cloud.wob / 30 });
    // 짜는 중이면 눌린 자국 선
    if (cloud.sq > 0.05) {
      g.strokeStyle = `rgba(27,27,26,${cloud.sq * 0.6})`; g.lineWidth = 1.5; g.lineCap = "round";
      for (let i = -1; i <= 1; i++) {
        const x = cloud.x + i * R * 0.34 * sx;
        g.beginPath(); g.moveTo(x - 4, cloud.y - R * 0.18 * sy); g.quadraticCurveTo(x + 4, cloud.y, x - 4, cloud.y + R * 0.18 * sy); g.stroke();
      }
    }
  }

  const binAt = x => clamp(Math.round(x / BIN), 0, nb - 1);
  const surface = x => groundY - level[binAt(x)];

  function deposit(x, vol) {
    if (!S.accumulate) return;
    const b = binAt(x), spread = S.liquid === "honey" ? 3 : 2;
    for (let i = -spread; i <= spread; i++) {
      const j = b + i; if (j < 0 || j >= nb) continue;
      level[j] += vol * (1 - Math.abs(i) / (spread + 1)) * 0.9;
    }
  }

  /* ---------- 루프 ---------- */
  api.frame((dt, t) => {
    const s = dt / 1000, L = LIQ[S.liquid];
    // 구름 이동
    const px = cloud.x;
    cloud.x = lerp(cloud.x, cloud.tx, 0.22); cloud.y = lerp(cloud.y, cloud.ty, 0.22);
    cloud.vx = lerp(cloud.vx, (cloud.x - px) / Math.max(0.001, s), 0.3);
    // 짜는 세기: 누른 시간에 따라 차오른다 (또는 바로 최대)
    ptr.hold = ptr.down ? (performance.now() - ptr.t0) / 1000 : 0;
    const want = ptr.down ? (S.ramp ? clamp(ptr.hold / 1.4, 0.12, 1) : 1) : 0;
    cloud.sq = lerp(cloud.sq, want, ptr.down ? 0.25 : 0.12);
    cloud.wob += s * 30;
    if (!ptr.down) cloud.water = Math.min(1, cloud.water + s * 0.12);

    g.clearRect(0, 0, size.w, size.h);
    // 땅: 톤 면 (외곽선 없음)
    g.fillStyle = TONE[2]; g.fillRect(0, groundY, size.w, size.h - groundY);

    // 새싹 (고인 곳에서 자란다)
    g.strokeStyle = INK; g.lineWidth = 1.5; g.lineCap = "round";
    sprouts.forEach(sp => {
      let wet = 0; for (let i = -3; i <= 3; i++) wet += level[binAt(sp.x + i * BIN)];
      wet /= 7;
      const grow = S.sprout && S.accumulate && S.liquid !== "sand" && wet > 2.5;
      sp.g = grow ? Math.min(1, sp.g + s * 0.25 * Math.min(1, wet / 8)) : Math.max(0, sp.g - s * 0.6);
      if (sp.g < 0.02) return;
      drawObject(g, "sprout", sp.x, groundY, 52 * sp.g, { state: sp.g, angle: sp.lean * sp.g, t: t / 1000 + sp.x });
    });

    // 고인 액체: 높이 차이만큼 옆으로 퍼진다 (끈적할수록 느리게)
    if (S.accumulate) {
      for (let it = 0; it < 3; it++) for (let i = 0; i < nb - 1; i++) {
        const d = level[i] - level[i + 1];
        const ad = Math.abs(d) - L.repose;
        if (ad <= 0) continue;
        const f = Math.sign(d) * ad * L.flow * 0.5;
        level[i] -= f; level[i + 1] += f;
      }
      const cap = groundY * 0.45;
      for (let i = 0; i < nb; i++) if (level[i] > cap) level[i] = cap;
    } else for (let i = 0; i < nb; i++) level[i] *= 0.94;

    g.fillStyle = ACC;
    g.beginPath(); g.moveTo(0, groundY);
    for (let i = 0; i < nb; i++) g.lineTo(i * BIN, groundY - level[i]);
    g.lineTo(size.w, groundY); g.closePath(); g.fill();
    // 바닥 선: 가는 잉크 선
    g.strokeStyle = INK; g.lineWidth = LINE; g.beginPath(); g.moveTo(0, groundY); g.lineTo(size.w, groundY); g.stroke();

    // 방울 만들기
    const sc = cloudScale(), cb = { bottom: cloud.y + R * 0.55 * sc.sy, half: R * 0.62 * sc.sx };
    if (ptr.down && cloud.water > 0.001) {
      emitAcc += S.rate * cloud.sq * s;
      while (emitAcc >= 1) {
        emitAcc -= 1;
        const x = cloud.x + (Math.random() - 0.5) * cb.half * 1.6 * (1 - cloud.sq * 0.3);
        const r = L.r * (0.8 + Math.random() * 0.4) * (0.8 + cloud.sq * 0.4);
        drops.push({ x, y: cb.bottom - 4, vx: cloud.vx * 0.35 + (Math.random() - 0.5) * 20, vy: 40 + Math.random() * 40, r, age: 0 });
        cloud.water = Math.max(0, cloud.water - 0.0045 * L.vol);
        total++;
      }
    } else emitAcc = 0;

    // 방울 떨어뜨리기
    g.fillStyle = ACC;
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.age += s;
      d.vy += L.grav * s; d.vy -= d.vy * L.drag * s; d.vx -= d.vx * 1.2 * s;
      d.x += d.vx * s; d.y += d.vy * s;
      if (d.x < -10 || d.x > size.w + 10) { drops.splice(i, 1); continue; }
      if (d.y + d.r >= surface(d.x)) {
        deposit(d.x, d.r * d.r * 0.28 * (S.liquid === "sand" ? 3 : 1));
        if (L.splash && S.liquid === "water") for (let k = 0; k < 2; k++) splashes.push({ x: d.x, y: surface(d.x) - 1, vx: (Math.random() - 0.5) * 140, vy: -90 - Math.random() * 90, life: 0 });
        drops.splice(i, 1); continue;
      }
      if (S.liquid === "sand") { g.fillRect(d.x - d.r, d.y - d.r, d.r * 2, d.r * 2); continue; }
      // 물방울: 빨리 떨어질수록 길쭉해진다
      const st = 1 + Math.min(1.6, d.vy / (S.liquid === "honey" ? 260 : 700));
      g.beginPath(); g.ellipse(d.x, d.y, d.r / Math.sqrt(st), d.r * st, 0, 0, 7); g.fill();
    }
    for (let i = splashes.length - 1; i >= 0; i--) {
      const p = splashes[i];
      p.life += s; p.vy += 1500 * s; p.x += p.vx * s; p.y += p.vy * s;
      if (p.life > 0.6 || p.y > surface(p.x) + 2) { splashes.splice(i, 1); continue; }
      g.beginPath(); g.arc(p.x, p.y, 1.6, 0, 7); g.fill();
    }
    // 꿀은 구름에서 실처럼 늘어진다
    if (S.liquid === "honey" && ptr.down && cloud.sq > 0.2) {
      g.strokeStyle = ACC; g.lineWidth = 2;
      drops.filter(d => d.age < 0.25).forEach(d => { g.beginPath(); g.moveTo(d.x, cb.bottom - 4); g.lineTo(d.x, d.y); g.stroke(); });
    }

    drawCloud();

    // 읽는 값
    api.read("hold", ptr.hold.toFixed(1) + "초");
    api.read("sq", Math.round(cloud.sq * 100) + "%");
    api.read("drops", total);
    api.read("water", Math.round(cloud.water * 100) + "%");

    if (ptr.down && cloud.water <= 0.001) api.status("구름이 말랐다 · 놓으면 다시 찬다", "alt");
    else if (ptr.down) api.status(`짜는 중 · 세기 ${Math.round(cloud.sq * 100)}% · ${ptr.hold.toFixed(1)}초`, "active");
    else if (drops.length) api.status("떨어지는 중", "alt");
    else if (cloud.water < 0.999) api.status(`구름에 물이 다시 차는 중 · ${Math.round(cloud.water * 100)}%`, "idle");
    else api.status("대기", "idle");
  });
}
