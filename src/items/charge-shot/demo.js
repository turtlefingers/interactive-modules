import { clamp, lerp, fitCanvas } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .charge-shot-key { position: absolute; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 40;
      width: 260px; height: 52px; border-radius: 10px; border: 1.5px solid var(--ink); background: var(--note); overflow: hidden;
      display: grid; place-items: center; cursor: pointer; touch-action: none; user-select: none; }
    .charge-shot-key .fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: var(--accent); }
    .charge-shot-key span { position: relative; font-size: 15px; font-weight: 600; color: var(--ink); }
    .charge-shot-key.hot { border-color: var(--accent); }
    @media (max-width: 600px) { .charge-shot-key { width: 200px; bottom: 70px; } }
  `);

  const { g, size } = fitCanvas(api);
  const C = { board: api.color("--board") || "#efe9dd", ink: api.color("--ink") || "#1b1b1a", accent: api.color("--accent") || "#ff5a36", note: api.color("--note") || "#fffdf6" };
  const FONT = "13px " + (getComputedStyle(el).fontFamily || "sans-serif");

  const key = document.createElement("div");
  key.className = "charge-shot-key";
  key.innerHTML = `<div class="fill"></div><span>Space · 누르고 있다가 떼기</span>`;
  el.appendChild(key);
  const keyFill = key.querySelector(".fill");

  /* ---------- 상태 ---------- */
  const st = { holding: false, holdT: 0, overT: 0, cool: 0, recoil: 0, lastShot: "–", fizz: 0 };
  const shots = [], debris = [], pops = [];
  const PANES = 6;
  let panes = [];
  const resetPanes = () => { panes = Array.from({ length: PANES }, (_, i) => ({ i, alive: true, drop: 0 })); };
  resetPanes();
  let refillAt = 0;

  const charge = () => clamp(st.holdT / (S.time * 1000), 0, 1);
  const levelOf = c => (c >= 1 ? 3 : c >= 0.5 ? 2 : 1);
  const shotOf = c => {
    if (S.mode === "tier") {
      const L = levelOf(c);
      return { r: [0, 6, 12, 22][L], power: [0, 1, 3, PANES][L], speed: [0, 700, 950, 1250][L], level: L };
    }
    return { r: 5 + 17 * c, power: Math.max(1, Math.round(c * PANES)), speed: 650 + 600 * c, level: levelOf(c) };
  };

  const geo = () => {
    const { w, h } = size;
    const gx = Math.max(70, w * 0.14), gy = h * 0.46;
    const px0 = w * 0.5, px1 = w - Math.max(50, w * 0.08);
    return { gx, gy, px0, gap: (px1 - px0) / (PANES - 1), paneH: Math.min(170, h * 0.3) };
  };

  const start = () => {
    if (st.holding || st.cool > 0) return;
    st.holding = true; st.holdT = 0; st.overT = 0;
    api.hideHint();
  };
  const fire = () => {
    if (!st.holding) return;
    st.holding = false;
    const c = charge();
    const sh = shotOf(c);
    const { gx, gy } = geo();
    shots.push({ x: gx + 40, y: gy, ...sh, left: sh.power });
    st.recoil = 6 + sh.r * 0.6;
    st.lastShot = `${Math.round(c * 100)}% · ${sh.power}장 관통`;
    st.holdT = 0; st.overT = 0;
    api.flash(`발사 · ${S.mode === "tier" ? `${sh.level}단 ` : ""}${sh.power}장을 뚫는 세기`, "ok");
  };
  const fizzle = () => {
    st.holding = false; st.holdT = 0; st.overT = 0; st.cool = 900; st.fizz = 1;
    st.lastShot = "과열 · 실패";
    api.flash("너무 오래 모았다 · 과열로 실패", "alt", 1800);
  };

  // 사이드바의 글자 입력칸, 슬라이더에 포커스가 있으면 반응하지 않는다 (체크박스는 예외: Space가 토글을 다시 뒤집지 않도록)
  const fromField = e => { const f = e.target && e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"); return !!f && !(f.type === "checkbox" || f.type === "radio"); };
  api.on(window, "keydown", e => {
    if (e.code !== "Space" || fromField(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault();
    if (!e.repeat) start();
  });
  api.on(window, "keyup", e => {
    if (e.code !== "Space") return;
    if (!fromField(e)) e.preventDefault();
    fire();
  });
  api.on(window, "blur", () => { st.holding = false; st.holdT = 0; });
  api.on(key, "pointerdown", e => { e.preventDefault(); e.stopPropagation(); key.setPointerCapture(e.pointerId); start(); });
  api.on(key, "pointerup", fire);
  api.on(key, "pointercancel", fire);

  api.frame(dt => {
    const s = dt / 1000;
    const { w, h } = size;
    const G = geo();
    const now = performance.now();

    if (st.cool > 0) st.cool -= dt;
    if (st.holding) {
      st.holdT += dt;
      const c = charge();
      if (c >= 1) {
        if (S.auto) fire();
        else if (S.over) { st.overT += dt; if (st.overT > 1600) fizzle(); }
      }
    }
    st.recoil *= Math.pow(0.001, s);
    st.fizz = Math.max(0, st.fizz - s * 1.5);

    // 발사체
    for (let i = shots.length - 1; i >= 0; i--) {
      const p = shots[i];
      p.x += p.speed * s;
      for (const pane of panes) {
        const x = G.px0 + pane.i * G.gap;
        if (!pane.alive || pane.hitBy === p || p.x + p.r < x) continue;
        pane.hitBy = p;
        if (p.left > 0) {
          pane.alive = false; p.left--;
          debris.push({ x, y: G.gy, vx: 120 + p.speed * 0.25 + Math.random() * 60, vy: -160 - Math.random() * 160, a: 0, va: (Math.random() - 0.3) * 8, t: 1 });
          refillAt = now + 1600;
        }
        if (p.left <= 0) { p.dead = true; pops.push({ x: x - 4, y: p.y, r: p.r, t: 1 }); break; }
      }
      if (p.dead || p.x > w + 40) shots.splice(i, 1);
    }
    if (refillAt && now > refillAt && !shots.length) { refillAt = 0; panes.forEach(p => { if (!p.alive) { p.alive = true; p.drop = 1; } p.hitBy = null; }); }
    panes.forEach(p => { p.drop = Math.max(0, p.drop - s * 3); });

    /* ---- 그리기 ---- */
    g.clearRect(0, 0, w, h);
    g.fillStyle = C.board; g.fillRect(0, 0, w, h);
    g.font = FONT; g.textAlign = "center"; g.textBaseline = "alphabetic";

    // 과녁 판
    panes.forEach(p => {
      const x = G.px0 + p.i * G.gap;
      g.strokeStyle = "rgba(0,0,0,.15)"; g.lineWidth = 1; g.setLineDash([3, 4]);
      g.beginPath(); g.moveTo(x, G.gy - G.paneH / 2); g.lineTo(x, G.gy + G.paneH / 2); g.stroke(); g.setLineDash([]);
      if (!p.alive) return;
      const yOff = -p.drop * p.drop * 80;
      g.fillStyle = C.note; g.strokeStyle = C.ink; g.lineWidth = 1.5;
      g.beginPath(); g.rect(x - 5, G.gy - G.paneH / 2 + yOff, 10, G.paneH); g.fill(); g.stroke();
      g.fillStyle = "rgba(0,0,0,.45)"; g.fillText(String(p.i + 1), x, G.gy + G.paneH / 2 + 20);
    });
    // 부서진 판
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.t -= s * 0.9; if (d.t <= 0 || d.y > h + 200) { debris.splice(i, 1); continue; }
      d.x += d.vx * s; d.y += d.vy * s; d.vy += 1300 * s; d.a += d.va * s;
      g.save(); g.translate(d.x, d.y); g.rotate(d.a); g.globalAlpha = Math.min(1, d.t * 2);
      g.strokeStyle = C.ink; g.lineWidth = 1.5; g.strokeRect(-5, -G.paneH / 2, 10, G.paneH);
      g.restore();
    }
    g.globalAlpha = 1;

    // 발사대
    const c = st.holding ? charge() : 0;
    const L = st.holding ? levelOf(c) : 0;
    const over = st.holding && c >= 1 && S.over && !S.auto;
    const shake = over ? (Math.random() - 0.5) * Math.min(6, st.overT / 200) : 0;
    const gx = G.gx - st.recoil + shake, gy = G.gy + shake * 0.5;
    g.fillStyle = C.ink;
    g.fillRect(gx - 34, gy - 16, 52, 32);
    g.fillRect(gx + 18, gy - 8, 22, 16);

    // 모이는 구체
    if (st.holding) {
      const sh = shotOf(c);
      const r = S.mode === "tier" ? sh.r : 5 + 17 * c;
      const ox = gx + 40 + 24;
      g.fillStyle = over && Math.floor(now / 90) % 2 ? C.ink : C.accent;
      g.beginPath(); g.arc(ox, gy, r, 0, Math.PI * 2); g.fill();
      if (S.mode === "tier") {
        g.strokeStyle = C.accent; g.lineWidth = 1;
        for (let k = 1; k < L; k++) { g.beginPath(); g.arc(ox, gy, r + 7 * k, 0, Math.PI * 2); g.stroke(); }
      }
    }
    // 과열 실패 표시
    if (st.fizz > 0) {
      g.strokeStyle = `rgba(27,27,26,${st.fizz})`; g.lineWidth = 1.5;
      const ox = G.gx + 64;
      for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(ox + k * 8 - 8, gy - 18 - (1 - st.fizz) * 30 - k * 6, 5 + k * 2, 0, Math.PI * 2); g.stroke(); }
    }
    // 발사체
    shots.forEach(p => {
      g.fillStyle = C.accent;
      g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "rgba(255,90,54,.4)"; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(p.x - p.r - 4, p.y); g.lineTo(p.x - p.r - 30 - p.r * 2, p.y); g.stroke();
    });
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.t -= s * 3; if (p.t <= 0) { pops.splice(i, 1); continue; }
      g.strokeStyle = `rgba(255,90,54,${p.t})`; g.lineWidth = 1.5;
      g.beginPath(); g.arc(p.x, p.y, p.r + (1 - p.t) * 20, 0, Math.PI * 2); g.stroke();
    }

    // 차지 게이지 (발사대 위)
    const mw = Math.min(220, w * 0.34), mx = G.gx - 34, my = G.gy - 70;
    g.strokeStyle = C.ink; g.lineWidth = 1.5; g.strokeRect(mx, my, mw, 12);
    g.fillStyle = over && Math.floor(now / 90) % 2 ? C.ink : C.accent;
    g.fillRect(mx + 2, my + 2, (mw - 4) * c, 8);
    g.fillStyle = C.ink;
    [0.5, 1].forEach(t => g.fillRect(mx + mw * t - 1, my - 4, 1.5, 20));
    g.textAlign = "left"; g.fillStyle = "rgba(0,0,0,.55)";
    if (S.mode === "tier") {
      g.fillText("1단", mx, my - 8);
      g.fillText("2단", mx + mw * 0.5 + 4, my - 8);
      g.textAlign = "right"; g.fillText("최대", mx + mw, my - 8);
    } else {
      g.fillText("약", mx, my - 8); g.textAlign = "right"; g.fillText("강", mx + mw, my - 8);
    }
    if (over) { g.textAlign = "left"; g.fillStyle = C.ink; g.fillText(`과열 ${((1600 - st.overT) / 1000).toFixed(1)}초 안에 놓기`, mx, my + 32); }

    /* ---- 키, 읽는 값, 상태 ---- */
    keyFill.style.width = `${c * 100}%`;
    key.classList.toggle("on", st.holding);
    key.classList.toggle("hot", over);
    api.read("hold", st.holding ? `${(st.holdT / 1000).toFixed(2)}초` : "–");
    api.read("charge", `${Math.round(c * 100)}%`);
    api.read("level", st.holding ? (S.mode === "tier" ? `${L}단` : `${Math.max(1, Math.round(c * PANES))}장`) : "–");
    api.read("last", st.lastShot);

    if (st.cool > 0) api.status(`과열 · ${(st.cool / 1000).toFixed(1)}초 뒤 다시 모을 수 있다`, "alt");
    else if (over) api.status("과열 중 · 곧 실패한다", "alt");
    else if (st.holding) api.status(`모으는 중 · ${Math.round(c * 100)}%${c >= 1 ? " · 가득 참" : ""}`, "active");
    else if (shots.length) api.status("날아가는 중", "ok");
    else api.status("대기", "idle");
  });
}
