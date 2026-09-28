import { clamp, fitCanvas, localPoint } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;
  const { cv, g, size } = fitCanvas(api);
  cv.style.cursor = "pointer";
  const C = { board: api.color("--board") || "#efe9dd", ink: api.color("--ink") || "#1b1b1a", ink2: api.color("--ink-2") || "#5d5b57", ink3: api.color("--ink-3") || "#9a9790", accent: api.color("--accent") || "#ff5a36" };
  const FONT = getComputedStyle(el).fontFamily || "sans-serif";

  /* ---------- 건반 배치: 키보드 모양 그대로 ---------- */
  const ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  const OFFS = [0, 0.3, 0.8];
  const BASE = [72, 60, 48];              // 줄마다 시작 음 (MIDI): 위 C5, 가운데 C4, 아래 C3
  const ROW_COL = [C.accent, C.ink, C.ink2];
  const SCALES = { penta: [0, 2, 4, 7, 9], major: [0, 2, 4, 5, 7, 9, 11] };
  const NAMES = ["도", "도#", "레", "레#", "미", "파", "파#", "솔", "솔#", "라", "라#", "시"];
  const keys = {};
  ROWS.forEach((r, ri) => [...r].forEach((ch, ci) => { keys[ch] = { ch, ri, ci, flash: 0 }; }));
  const midiOf = k => { const sc = SCALES[S.scale]; return BASE[k.ri] + 12 * Math.floor(k.ci / sc.length) + sc[k.ci % sc.length]; };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const noteName = m => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;

  let U = 60, KX = 0, KY = 0;
  const layout = () => {
    const { w, h } = size;
    U = Math.min((w - 40) / 10.9, (h - 150) / 3.3, 86);
    KX = (w - 10.8 * U) / 2; KY = (h - 3.2 * U) / 2 + 10;
  };
  layout(); api.onResize(layout);
  const cellOf = k => ({ x: KX + (k.ci + OFFS[k.ri]) * U, y: KY + k.ri * 1.08 * U, s: U * 0.9 });

  /* ---------- 소리 ---------- */
  let ac = null, master = null;
  const ensureAudio = () => {
    if (ac) { if (ac.state === "suspended") ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.18; master.connect(ac.destination);
  };
  api.cleanup(() => { if (ac) ac.close(); });
  const play = (f, ri) => {
    if (!S.sound || !ac) return;
    const t = ac.currentTime;
    const o = ac.createOscillator(), e = ac.createGain();
    o.type = ri === 0 ? "square" : ri === 1 ? "triangle" : "sine";
    o.frequency.value = f;
    const peak = ri === 0 ? 0.22 : 0.6, len = [0.35, 0.6, 0.9][ri];
    e.gain.setValueAtTime(0, t);
    e.gain.linearRampToValueAtTime(peak, t + 0.008);
    e.gain.exponentialRampToValueAtTime(0.001, t + len);
    o.connect(e); e.connect(master);
    o.start(t); o.stop(t + len + 0.05);
  };

  /* ---------- 그래픽 ---------- */
  const fx = [];
  let count = 0, last = null;
  const spawn = k => {
    const c = cellOf(k), m = midiOf(k), f = hz(m);
    const x = c.x + c.s / 2, y = c.y + c.s / 2;
    fx.push({ k, x, y, t: 0, dur: [0.7, 0.9, 1.2][k.ri], type: k.ci % 6, col: ROW_COL[k.ri], f, rot: Math.random() * Math.PI, style: S.style });
    if (fx.length > 80) fx.shift();
  };
  const trigger = ch => {
    const k = keys[ch]; if (!k) return;
    ensureAudio();
    api.hideHint();
    k.flash = 1; count++;
    const m = midiOf(k);
    last = { ch, m, f: hz(m) };
    play(hz(m), k.ri);
    spawn(k);
  };

  // 사이드바의 글자 입력칸, 슬라이더에 포커스가 있으면 반응하지 않는다 (체크박스는 예외: Space가 토글을 다시 뒤집지 않도록)
  const fromField = e => { const f = e.target && e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"); return !!f && !(f.type === "checkbox" || f.type === "radio"); };
  api.on(window, "keydown", e => {
    if (fromField(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === "Space") { e.preventDefault(); fx.length = 0; return; }
    const m = /^Key([A-Z])$/.exec(e.code);
    if (!m) return;
    e.preventDefault();
    if (e.repeat) return;
    trigger(m[1]);
  });
  api.on(cv, "pointerdown", e => {
    e.preventDefault();
    const p = localPoint(el, e);
    for (const ch in keys) {
      const c = cellOf(keys[ch]);
      if (p.x >= c.x && p.x <= c.x + c.s && p.y >= c.y && p.y <= c.y + c.s) { trigger(ch); return; }
    }
  });

  const ease = t => 1 - Math.pow(1 - t, 3);
  const drawFx = (o, s) => {
    const p = clamp(o.t / o.dur, 0, 1), e = ease(p), a = 1 - p;
    const { w, h } = size;
    g.save();
    g.globalAlpha = a; g.strokeStyle = o.col; g.fillStyle = o.col; g.lineWidth = 2;
    if (o.style === "letter") {
      g.font = `700 ${Math.round(U * (0.6 + e * 2.4))}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(o.k.ch, o.x, o.y - e * 30);
    } else if (o.style === "wave") {
      // 음이 높을수록 촘촘한 물결: 소리의 주파수를 눈으로 본다
      const amp = U * 0.6 * a, k = o.f / 2200 * 0.25;
      g.lineWidth = 1.5; g.beginPath();
      for (let x = 0; x <= w; x += 3) { const y = o.y + Math.sin((x - o.x) * k - o.t * 18) * amp * Math.exp(-Math.abs(x - o.x) / (w * 0.35)); x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    } else {
      const R = U * (0.3 + e * 1.6);
      g.translate(o.x, o.y);
      switch (o.type) {
        case 0: g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.stroke(); break;
        case 1: g.rotate(o.rot + e * 1.6); g.strokeRect(-R * 0.7, -R * 0.7, R * 1.4, R * 1.4); break;
        case 2: { const r = U * (0.35 + e * 0.9); g.rotate(o.rot * 0.3); g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.87, r * 0.5); g.lineTo(-r * 0.87, r * 0.5); g.closePath(); g.globalAlpha = a * 0.9; g.fill(); break; }
        case 3: g.fillRect(-w * e, -1, w * e * 2, 2); break;
        case 4: g.rotate(o.rot); g.beginPath(); for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; g.moveTo(Math.cos(an) * R * 0.4, Math.sin(an) * R * 0.4); g.lineTo(Math.cos(an) * R, Math.sin(an) * R); } g.stroke(); break;
        case 5: for (let i = 0; i < 3; i++) { const q = clamp(p * 1.4 - i * 0.2, 0, 1); if (q <= 0) continue; g.globalAlpha = (1 - q) * 0.9; g.beginPath(); g.arc(0, 0, U * (0.2 + ease(q) * 1.3), 0, Math.PI * 2); g.stroke(); } break;
      }
    }
    g.restore();
    o.t += s;
  };

  api.onParam(k => { if (k === "style") fx.forEach(o => { o.style = S.style; }); });

  api.frame(dt => {
    const s = dt / 1000;
    const { w, h } = size;
    g.clearRect(0, 0, w, h);
    g.fillStyle = C.board; g.fillRect(0, 0, w, h);

    // 건반 (키 이름)
    for (const ch in keys) {
      const k = keys[ch], c = cellOf(k);
      k.flash = Math.max(0, k.flash - s * 4);
      if (!S.labels && k.flash <= 0) continue;
      const lab = S.labels ? 1 : k.flash;
      g.globalAlpha = lab;
      if (k.flash > 0) { g.fillStyle = ROW_COL[k.ri]; g.globalAlpha = k.flash * 0.9; g.fillRect(c.x, c.y, c.s, c.s); g.globalAlpha = lab; }
      g.strokeStyle = "rgba(0,0,0,.14)"; g.lineWidth = 1;
      g.strokeRect(c.x + .5, c.y + .5, c.s - 1, c.s - 1);
      g.fillStyle = k.flash > 0.5 ? "#fff" : C.ink3;
      g.font = `600 13px ${FONT}`; g.textAlign = "left"; g.textBaseline = "top";
      g.fillText(ch, c.x + 7, c.y + 6);
      g.globalAlpha = 1;
    }
    for (let i = fx.length - 1; i >= 0; i--) { if (fx[i].t >= fx[i].dur) fx.splice(i, 1); }
    fx.forEach(o => drawFx(o, s));

    api.read("key", last ? last.ch : "–");
    api.read("note", last ? noteName(last.m) : "–");
    api.read("freq", last ? `${Math.round(last.f)}Hz` : "–");
    api.read("count", count);
    if (fx.length) api.status(`연주 중 · ${last ? `${last.ch} = ${noteName(last.m)}` : ""}${S.sound ? "" : " · 소리 꺼짐"}`, "active");
    else api.status(ac || !S.sound ? "대기" : "대기 · 첫 키를 누르면 소리가 켜진다", "idle");
  });
}
