import { clamp, lerp, localPoint, fitCanvas } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .xy-pad-root { position: absolute; inset: 0; background: var(--board); }
    .xy-pad-root.over { cursor: pointer; }
    .xy-pad-root.dragging, .xy-pad-root.dragging * { cursor: grabbing; }
  `);
  const root = document.createElement("div");
  root.className = "xy-pad-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });

  const INK = "#1b1b1a", INK2 = "#5d5b57", INK3 = "#9a9790", ACC = "#ff5a36";
  const FONT = "Pretendard Variable, Pretendard, system-ui, sans-serif";
  const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  /* ---------- 배치 ---------- */
  const pad = { x: 0, y: 0, s: 300 }, res = { x: 0, y: 0, R: 80, ly: 0 };
  function layout() {
    const { w, h } = size;
    if (w > 640 && w > h * 1.05) {
      pad.s = Math.min(h - 170, w * 0.46, 440);
      const gap = Math.min(80, w * 0.06), total = pad.s + gap + pad.s * 0.8;
      pad.x = (w - total) / 2; pad.y = (h - pad.s) / 2;
      res.x = pad.x + pad.s + gap + pad.s * 0.4; res.y = h / 2; res.R = pad.s * 0.36; res.ly = res.y + res.R + 18;
    } else {
      pad.s = Math.min(w - 72, h * 0.5, 440);
      pad.x = (w - pad.s) / 2 + 8; pad.y = 72;
      const top = pad.y + pad.s + 34, bot = h - 64;
      res.R = Math.max(20, Math.min((bot - top - 30) / 2, w * 0.3));
      res.x = w / 2; res.y = top + res.R; res.ly = res.y + res.R + 8;
    }
  }
  layout();
  api.onResize(layout);

  /* ---------- 값 ---------- */
  const v = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, vx: 0, vy: 0 };
  let dragging = false, returning = false, over = false;
  const trail = [];
  const bpmOf = x => 60 + x * 180;
  const midiOf = y => 48 + y * 36;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const noteName = m => { const r = Math.round(m); return NAMES[((r % 12) + 12) % 12] + (Math.floor(r / 12) - 1); };
  const snapV = u => S.snap ? Math.round(u * S.grid) / S.grid : u;

  const toVal = p => ({ x: clamp((p.x - pad.x) / pad.s, 0, 1), y: clamp(1 - (p.y - pad.y) / pad.s, 0, 1) });
  const inPad = p => p.x > pad.x - 16 && p.x < pad.x + pad.s + 16 && p.y > pad.y - 16 && p.y < pad.y + pad.s + 16;

  /* ---------- 소리 ---------- */
  let ac = null;
  const ensureAudio = () => {
    if (ac || !S.sound) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ac = new AC();
  };
  api.cleanup(() => { if (ac) ac.close(); });
  function blip(freq) {
    if (!ac || !S.sound) return;
    if (ac.state === "suspended") ac.resume();
    const t = ac.currentTime, o = ac.createOscillator(), gn = ac.createGain();
    o.type = "triangle"; o.frequency.value = freq;
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(0.14, t + 0.01);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(gn).connect(ac.destination);
    o.start(t); o.stop(t + 0.3);
  }

  /* ---------- 포인터 ---------- */
  api.on(root, "pointerdown", e => {
    const p = localPoint(root, e);
    if (!inPad(p)) return;
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    dragging = true; returning = false;
    const q = toVal(p); v.tx = snapV(q.x); v.ty = snapV(q.y);
    ensureAudio();
    api.hideHint();
  });
  api.on(root, "pointermove", e => {
    const p = localPoint(root, e);
    over = inPad(p);
    if (!dragging) return;
    const q = toVal(p); v.tx = snapV(q.x); v.ty = snapV(q.y);
  });
  const up = () => {
    if (!dragging) return;
    dragging = false;
    if (S.spring) { returning = true; v.tx = 0.5; v.ty = 0.5; }
  };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);
  api.onParam(k => {
    if (k === "sound" && S.sound) ensureAudio();
    if ((k === "snap" || k === "grid") && S.snap) { v.tx = snapV(v.tx); v.ty = snapV(v.ty); }
    if (k === "spring" && S.spring && !dragging) { returning = true; v.tx = 0.5; v.ty = 0.5; }
  });

  /* ---------- 루프 ---------- */
  let phase = 0, beatAge = 9, rings = [];
  api.frame((dt) => {
    const s = dt / 1000;
    // 퍽 움직임: 누르는 동안은 바로, 돌아갈 때는 스프링으로 살짝 지나쳤다 멈춘다
    if (returning) {
      v.vx += (v.tx - v.x) * 0.12; v.vy += (v.ty - v.y) * 0.12;
      v.vx *= 0.78; v.vy *= 0.78; v.x += v.vx; v.y += v.vy;
      if (Math.hypot(v.tx - v.x, v.ty - v.y) < 0.001 && Math.hypot(v.vx, v.vy) < 0.001) { v.x = v.tx; v.y = v.ty; returning = false; }
    } else { v.x = lerp(v.x, v.tx, 0.45); v.y = lerp(v.y, v.ty, 0.45); v.vx = v.vy = 0; }

    const px = pad.x + v.x * pad.s, py = pad.y + (1 - v.y) * pad.s;
    const now = performance.now();
    if (dragging || returning) trail.push({ x: px, y: py, t: now });
    while (trail.length && now - trail[0].t > 900) trail.shift();

    // 박자
    const bpm = bpmOf(v.x), midi = midiOf(v.y);
    phase += s * bpm / 60; beatAge += s;
    if (phase >= 1) {
      phase -= Math.floor(phase); beatAge = 0;
      rings.push({ t: 0 });
      if (dragging) blip(hz(midi));
    }

    g.clearRect(0, 0, size.w, size.h);
    /* 패드 */
    g.fillStyle = "#fffdf6"; g.fillRect(pad.x, pad.y, pad.s, pad.s);
    const N = S.snap ? S.grid : 4;
    g.lineWidth = 1;
    for (let i = 1; i < N; i++) {
      const u = i / N;
      if (S.snap) {
        g.fillStyle = "rgba(27,27,26,.35)";
        for (let j = 0; j <= N; j++) { g.beginPath(); g.arc(pad.x + u * pad.s, pad.y + j / N * pad.s, 1.6, 0, 7); g.fill(); }
      }
      g.strokeStyle = S.snap ? "rgba(27,27,26,.07)" : "rgba(27,27,26,.06)";
      g.beginPath(); g.moveTo(pad.x + u * pad.s, pad.y); g.lineTo(pad.x + u * pad.s, pad.y + pad.s);
      g.moveTo(pad.x, pad.y + u * pad.s); g.lineTo(pad.x + pad.s, pad.y + u * pad.s); g.stroke();
    }
    g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(pad.x, pad.y, pad.s, pad.s);
    // 축 이름
    g.fillStyle = INK3; g.font = `500 13px ${FONT}`; g.textBaseline = "top"; g.textAlign = "left";
    g.fillText("느리게", pad.x, pad.y + pad.s + 10);
    g.textAlign = "right"; g.fillText("빠르게 →", pad.x + pad.s, pad.y + pad.s + 10);
    g.save(); g.translate(pad.x - 10, pad.y + pad.s); g.rotate(-Math.PI / 2);
    g.textBaseline = "bottom"; g.textAlign = "left"; g.fillText("낮게", 0, 0);
    g.textAlign = "right"; g.fillText("높게 →", pad.s, 0); g.restore();

    // 지나간 경로
    if (trail.length > 1) {
      g.lineWidth = 1.5; g.lineCap = "round";
      for (let i = 1; i < trail.length; i++) {
        g.strokeStyle = `rgba(27,27,26,${0.3 * (1 - (now - trail[i].t) / 900)})`;
        g.beginPath(); g.moveTo(trail[i - 1].x, trail[i - 1].y); g.lineTo(trail[i].x, trail[i].y); g.stroke();
      }
    }
    // 십자선과 퍽
    g.strokeStyle = "rgba(27,27,26,.3)"; g.lineWidth = 1; g.setLineDash([3, 4]);
    g.beginPath(); g.moveTo(px, pad.y); g.lineTo(px, pad.y + pad.s); g.moveTo(pad.x, py); g.lineTo(pad.x + pad.s, py); g.stroke();
    g.setLineDash([]);
    const pr = dragging ? 13 : 11;
    g.fillStyle = dragging ? ACC : "#fffdf6"; g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.arc(px, py, pr, 0, 7); g.fill(); g.stroke();
    if (S.values) {
      g.font = `600 13px ${FONT}`; g.fillStyle = INK2; g.textBaseline = "middle";
      const label = `${v.x.toFixed(2)}, ${v.y.toFixed(2)}`;
      const right = px + 20 + g.measureText(label).width < pad.x + pad.s;
      g.textAlign = right ? "left" : "right";
      g.fillText(label, px + (right ? 20 : -20), py - 18 < pad.y + 10 ? py + 20 : py - 18);
      g.font = `500 13px ${FONT}`; g.fillStyle = INK3;
      g.textAlign = "center"; g.textBaseline = "bottom"; g.fillText(v.x.toFixed(2), px, pad.y - 6);
      g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(v.y.toFixed(2), pad.x + pad.s + 8, py);
    }

    /* 결과: 박자마다 뛰는 원 — 가로는 빠르기, 세로는 음높이(높을수록 작다) */
    const r = res.R * (1 - v.y * 0.62);
    const pulse = 1 + 0.14 * Math.exp(-beatAge * 9);
    for (let i = rings.length - 1; i >= 0; i--) {
      const rg = rings[i]; rg.t += s;
      if (rg.t > 0.7) { rings.splice(i, 1); continue; }
      g.strokeStyle = `rgba(27,27,26,${0.35 * (1 - rg.t / 0.7)})`; g.lineWidth = 1.2;
      g.beginPath(); g.arc(res.x, res.y, r * (1 + rg.t * 1.1), 0, 7); g.stroke();
    }
    g.fillStyle = ACC; g.beginPath(); g.arc(res.x, res.y, r * pulse, 0, 7); g.fill();
    g.fillStyle = INK2; g.font = `600 15px ${FONT}`; g.textAlign = "center"; g.textBaseline = "top";
    g.fillText(`${Math.round(bpm)} BPM · ${noteName(midi)}`, res.x, res.ly);

    root.classList.toggle("over", over && !dragging);
    root.classList.toggle("dragging", dragging);

    api.read("x", v.x.toFixed(2));
    api.read("y", v.y.toFixed(2));
    api.read("bpm", Math.round(bpm));
    api.read("note", `${noteName(midi)} · ${Math.round(hz(midi))}Hz`);

    if (dragging) api.status(`조절 중 · 빠르기와 음높이가 동시에 바뀐다${S.sound ? " · 소리 켜짐" : ""}`, "active");
    else if (returning) api.status("가운데로 돌아가는 중", "alt");
    else api.status("대기", "idle");
  });
}
