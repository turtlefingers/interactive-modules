import { clamp, localPoint, fitCanvas } from "../../lib/util.js";
import { ILLO, TONE, flag, shape, circle, dot } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;
  api.css(`
    .click-to-target-root { position: absolute; inset: 0; cursor: crosshair; background: var(--board);
      background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 100px 100px; }
  `);
  const root = document.createElement("div");
  root.className = "click-to-target-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const FONT = getComputedStyle(root).fontFamily;
  const C = { ink: api.color("--ink"), ink3: api.color("--ink-3"), acc: api.color("--accent"), line: api.color("--line") };

  const SWARM = 40, ARRIVE_R = 120;
  let flags = [];      // { x, y, born, fade }  — 앞의 것이 지금 목표
  const ghosts = [];   // 사라지는 깃발
  let agents = [];

  const makeAgents = () => {
    const n = S.agents === "swarm" ? SWARM : 1;
    const old = agents;
    agents = Array.from({ length: n }, (_, i) => {
      const o = old[i];
      if (o) return o;
      const a = Math.random() * Math.PI * 2;
      const src = old[0];
      return { x: src ? src.x + (Math.random() - 0.5) * 40 : size.w * (0.3 + Math.random() * 0.4), y: src ? src.y + (Math.random() - 0.5) * 40 : size.h * (0.3 + Math.random() * 0.4),
        vx: Math.cos(a), vy: Math.sin(a), wa: a };
    });
  };
  makeAgents();
  api.onParam(k => {
    if (k === "agents") makeAgents();
    if (k === "persist" && S.persist !== "queue" && flags.length > 1) { flags.slice(0, -1).forEach(f => ghosts.push({ ...f, fade: 1 })); flags = flags.slice(-1); }
  });

  api.on(root, "pointerdown", e => {
    e.preventDefault();
    const p = localPoint(root, e);
    const f = { x: p.x, y: p.y, born: performance.now() };
    if (S.persist === "queue") flags.push(f);
    else { flags.forEach(o => ghosts.push({ ...o, fade: 1 })); flags = [f]; }
    api.hideHint();
  });

  const retire = () => {
    const f = flags.shift();
    if (f) ghosts.push({ ...f, fade: 1 });
    api.flash(flags.length ? `도착 · 다음 목표로 (${flags.length}개 남음)` : "도착 · 깃발을 거둔다", "ok", 1000);
  };

  const drawFlag = (f, alpha, label) => {
    const age = (performance.now() - f.born) / 1000;
    g.globalAlpha = alpha;
    if (age < 0.6) {
      g.strokeStyle = C.acc; g.lineWidth = 1.5; g.globalAlpha = alpha * (1 - age / 0.6);
      g.beginPath(); g.arc(f.x, f.y, 8 + age * 70, 0, Math.PI * 2); g.stroke();
      g.globalAlpha = alpha;
    }
    // 깃발(키트): 강조색 실루엣 + 가는 깃대. 꽂히는 순간 솟아오르고, 잠깐 펄럭인다
    const rise = Math.min(1, age / 0.18);
    flag(g, f.x, f.y, { h: Math.max(2, 40 * rise), color: C.acc || ILLO.orange, wave: Math.sin(age * 8) * Math.max(0, 1 - age / 2) });
    if (label) { g.fillStyle = C.ink; g.font = `700 13px ${FONT}`; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(label, f.x + 8, f.y + 8); }
    g.globalAlpha = 1;
  };

  api.frame((dt, t) => {
    const k = Math.min(2, dt / 16.67);
    const maxV = S.speed, maxF = 0.08 + S.speed * 0.03;
    const tgt = flags[0];
    const swarm = agents.length > 1;
    let arrived = 0, sumD = 0, sumV = 0;

    for (const a of agents) {
      let fx = 0, fy = 0;
      if (tgt) {
        const dx = tgt.x - a.x, dy = tgt.y - a.y, d = Math.hypot(dx, dy) || 1;
        let want = maxV;
        if (S.arrive && d < ARRIVE_R) want = maxV * (swarm ? Math.max(0, d - 18) : d) / ARRIVE_R; // 가까워질수록 느려진다
        fx = dx / d * want - a.vx; fy = dy / d * want - a.vy;
        sumD += d;
        const sp = Math.hypot(a.vx, a.vy);
        if (d < (swarm ? 80 : 12) && (!S.arrive || sp < maxV * 0.35)) arrived++;
      } else {
        // 목표가 없으면 천천히 돌아다닌다
        a.wa += (Math.random() - 0.5) * 0.3;
        const want = maxV * 0.3;
        fx = Math.cos(a.wa) * want - a.vx; fy = Math.sin(a.wa) * want - a.vy;
      }
      const fl = Math.hypot(fx, fy);
      if (fl > maxF) { fx *= maxF / fl; fy *= maxF / fl; }
      // 무리: 서로 너무 가까우면 밀어낸다
      if (swarm) {
        let sx = 0, sy = 0;
        for (const b of agents) {
          if (a === b) continue;
          const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < 22 * 22 && d2 > 0.01) { const d = Math.sqrt(d2); sx += dx / d * (22 - d) / 22; sy += dy / d * (22 - d) / 22; }
        }
        fx += sx * 0.25; fy += sy * 0.25;
      }
      // 가장자리에서 되돌아온다
      const m = 30;
      if (a.x < m) fx += 0.2; if (a.x > size.w - m) fx -= 0.2;
      if (a.y < m) fy += 0.2; if (a.y > size.h - m) fy -= 0.2;
      if (!tgt && (a.x < m || a.x > size.w - m || a.y < m || a.y > size.h - m)) a.wa = Math.atan2(size.h / 2 - a.y, size.w / 2 - a.x);

      a.vx += fx * k; a.vy += fy * k;
      const sp = Math.hypot(a.vx, a.vy);
      if (sp > maxV) { a.vx *= maxV / sp; a.vy *= maxV / sp; }
      a.x += a.vx * k; a.y += a.vy * k;
      sumV += Math.min(sp, maxV);
    }

    if (tgt && S.persist !== "keep") {
      const need = swarm ? Math.ceil(agents.length * 0.7) : 1;
      if (arrived >= need) retire();
    }

    /* ---------- 그리기 ---------- */
    g.clearRect(0, 0, size.w, size.h);
    if (flags.length > 1 || (tgt && !swarm)) {
      g.setLineDash([3, 6]); g.strokeStyle = C.ink3; g.lineWidth = 1;
      g.beginPath();
      if (!swarm) g.moveTo(agents[0].x, agents[0].y); else g.moveTo(flags[0].x, flags[0].y);
      flags.forEach(f => g.lineTo(f.x, f.y));
      g.stroke(); g.setLineDash([]);
    }
    if (tgt && S.arrive) {
      g.strokeStyle = C.line; g.lineWidth = 1;
      g.beginPath(); g.arc(tgt.x, tgt.y, ARRIVE_R, 0, Math.PI * 2); g.stroke();
    }
    for (let i = ghosts.length - 1; i >= 0; i--) {
      const f = ghosts[i]; f.fade -= dt / 350;
      if (f.fade <= 0) { ghosts.splice(i, 1); continue; }
      drawFlag(f, f.fade * 0.6);
    }
    flags.forEach((f, i) => drawFlag(f, i === 0 ? 1 : 0.55, S.persist === "queue" ? String(i + 1) : ""));

    // 개체: 외곽선 없는 톤 실루엣. 무리면 작은 삼각형들, 하나면 원 + 진행 방향을 알리는 작은 강조색 점
    for (const a of agents) {
      const ang = Math.atan2(a.vy, a.vx);
      if (swarm) {
        g.save(); g.translate(a.x, a.y); g.rotate(ang);
        shape(g, c => { c.moveTo(8, 0); c.lineTo(-6, 5.5); c.lineTo(-6, -5.5); c.closePath(); }, { fill: TONE[4] });
        g.restore();
      } else {
        circle(g, a.x, a.y, 11, { fill: TONE[5] });
        dot(g, a.x + Math.cos(ang) * 6.5, a.y + Math.sin(ang) * 6.5, 2.6, C.acc || ILLO.orange);
      }
    }

    const n = agents.length;
    api.read("target", tgt ? `${Math.round(tgt.x)}, ${Math.round(tgt.y)}` : "–");
    api.read("dist", tgt ? Math.round(sumD / n) + "px" : "–");
    api.read("speed", (sumV / n).toFixed(1));
    api.read("arrived", tgt ? `${arrived} / ${n}` : "–");
    if (!tgt) api.status("대기 · 목표 없음, 돌아다니는 중", "idle");
    else if (arrived >= (swarm ? Math.ceil(n * 0.7) : 1)) api.status(swarm ? "도착 · 깃발 주위에 모였다" : "도착", "ok");
    else if (S.arrive && sumD / n < ARRIVE_R) api.status("도착 반경 안 · 속도를 줄이는 중", "alt");
    else api.status(`목표로 이동 중 · ${Math.round(sumD / n)}px 남음`, "active");
  });
}
