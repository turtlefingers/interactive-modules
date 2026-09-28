import { clamp, lerp, fitCanvas } from "../../lib/util.js";
import "../../lib/objects/index.js";
import { drawObject } from "../../lib/objects.js";

const MAX_G = 9;
const AWAY_TITLE = "돌아와요!";

export default function demo(api) {
  const { el, S } = api;
  const origTitle = document.title;
  api.cleanup(() => { document.title = origTitle; });

  api.css(`
    .pv-btn { position: absolute; right: 16px; bottom: 16px; z-index: 40; font: inherit; font-size: 13px; color: var(--ink);
      background: var(--panel); border: 1px solid var(--ink); border-radius: 4px; padding: 8px 14px; cursor: pointer; }
    .pv-btn:hover { background: var(--ink); color: var(--on-ink); }
    .pv-away { position: absolute; inset: 0; z-index: 41; background: var(--panel); display: none; flex-direction: column; }
    .pv-away.on { display: flex; }
    .pv-tabs { display: flex; gap: 0; padding: 10px 12px 0; border-bottom: 1px solid var(--ink-3); background: var(--board); }
    .pv-tab { font: inherit; font-size: 13px; max-width: 200px; flex: 1; text-align: left; padding: 8px 12px; border: 1px solid transparent; border-bottom: 0;
      border-radius: 6px 6px 0 0; background: none; color: var(--ink-3); cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: -1px; }
    .pv-tab.cur { background: var(--panel); border-color: var(--ink-3); color: var(--ink); cursor: default; }
    .pv-tab.mine:hover { color: var(--ink); }
    .pv-tab.mine.called { color: var(--accent); }
    .pv-body { flex: 1; display: grid; place-content: center; justify-items: center; gap: 14px; text-align: center; font-size: 15px; color: var(--ink-2); padding: 20px; }
    .pv-body b { font-size: 18px; font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; }
    .pv-body button { font: inherit; font-size: 13px; margin-top: 6px; padding: 8px 14px; border-radius: 4px; border: 1px solid var(--ink); background: var(--ink); color: var(--on-ink); cursor: pointer; }
  `);

  const { g, size } = fitCanvas(api);
  const FF = getComputedStyle(el).fontFamily || "sans-serif";
  const C = { board: api.color("--board"), note: api.color("--note"), ink: api.color("--ink"), ink2: api.color("--ink-2"), ink3: api.color("--ink-3"), accent: api.color("--accent") };

  const btn = document.createElement("button");
  btn.className = "pv-btn";
  btn.textContent = "탭 나갔다 오기";
  el.appendChild(btn);
  const away = document.createElement("div");
  away.className = "pv-away";
  away.innerHTML = `<div class="pv-tabs"><button class="pv-tab mine"></button><button class="pv-tab cur">새 탭</button></div>
    <div class="pv-body"><span>다른 탭을 보는 중이다. 원래 탭은 화면에서 보이지 않는다.</span><b>0.0초</b><button>원래 탭으로 돌아오기</button></div>`;
  el.appendChild(away);
  const mineTab = away.querySelector(".pv-tab.mine");
  const awayTime = away.querySelector(".pv-body b");

  /* ---------- 상태 ---------- */
  let gTrue = 0.8, gShow = 0.8;       // 성장 단계 (실제 / 화면)
  let leftAt = 0, isAway = false, sim = false;
  let visits = 0, lastAway = 0;
  let lapse = null;                   // { g0, g1, secs, t0, dur }
  let msg = null;                     // { text, t0 }
  let counter = null;                 // { secs, t0 }
  let dial = 0;

  const leave = simulated => {
    if (isAway) return;
    isAway = true; sim = simulated; leftAt = performance.now();
    lapse = null;
    if (S.title) document.title = AWAY_TITLE;
    api.hideHint();
  };
  const come = () => {
    if (!isAway) return;
    isAway = false;
    const secs = (performance.now() - leftAt) / 1000;
    lastAway = secs; visits++;
    document.title = origTitle;
    away.classList.remove("on");
    const grows = S.change !== "message";
    const g0 = gTrue;
    if (grows) gTrue = Math.min(MAX_G, gTrue + secs / S.rate);
    if (S.lapse) {
      const dur = clamp(700 + secs * 90, 900, 2600);
      lapse = { g0, g1: gTrue, secs, t0: performance.now(), dur, d0: dial };
    } else { gShow = gTrue; dial += secs * 36; }
    counter = { secs, t0: performance.now() };
    if (S.change !== "growth") {
      const s = secs < 10 ? secs.toFixed(1) : Math.round(secs);
      const text = secs < 3 ? "금방 왔네?"
        : secs < 60 ? `돌아왔네! ${s}초 만이야.`
        : `어디 갔었어? ${Math.round(secs / 60)}분이나 지났어.`;
      msg = { text: gTrue >= MAX_G && grows ? text + " 다 자랐어." : text, t0: performance.now() + (S.lapse ? 400 : 0) };
    }
    api.flash(`돌아옴 · ${secs.toFixed(1)}초 동안 비움`, "ok", 2000);
  };

  api.on(document, "visibilitychange", () => { if (document.hidden) leave(false); else if (!sim) come(); });
  api.on(btn, "click", () => { leave(true); mineTab.textContent = document.title; away.classList.add("on"); });
  api.on(away, "click", e => { if (e.target.closest(".pv-body button, .pv-tab.mine")) { come(); sim = false; } });
  api.onParam(k => {
    if (k === "title" && isAway) document.title = S.title ? AWAY_TITLE : origTitle;
  });

  /* ---------- 그리기: 카탈로그 화분(state = 성장). 다 자라면 꽃이 강조색 하나로 핀다 ---------- */
  const line = (x0, y0, x1, y1) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  const k01 = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  // 성장 단계 0~9 → 화분 state 0~1 (단계 6까지), 그 뒤로는 화분 위에 꽃이 핀다 (단계 6~9)
  const plantH = R => R * 2.6;
  function drawPlant(gv, t, R, cx, bottom) {
    drawObject(g, "potted-plant", cx, bottom, plantH(R), { state: k01(gv, 0, 6), t: t / 1000 });
    const bloom = k01(gv, 6, 9);
    if (bloom > 0.02) drawObject(g, "flower", cx + R * 0.1, bottom - plantH(R) * 0.42, R * 1.4 * (0.6 + 0.4 * bloom), { state: bloom, color: C.accent, t: t / 1000 });
  }

  function drawDial(x, y, r, ang) {
    g.strokeStyle = C.ink3; g.lineWidth = 1;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = C.ink; g.lineWidth = 1.5;
    const a = ang * Math.PI / 180 - Math.PI / 2;
    line(x, y, x + Math.cos(a) * r * .78, y + Math.sin(a) * r * .78);
  }

  api.frame((dt, t) => {
    const { w, h } = size;
    const now = performance.now();
    if (lapse) {
      const k = clamp((now - lapse.t0) / lapse.dur, 0, 1), e = 1 - Math.pow(1 - k, 2);
      gShow = lerp(lapse.g0, lapse.g1, e);
      dial = lapse.d0 + lapse.secs * 36 * e;
      if (k >= 1) lapse = null;
    } else gShow = lerp(gShow, gTrue, .2);

    g.clearRect(0, 0, w, h);
    g.fillStyle = C.board; g.fillRect(0, 0, w, h);
    const R = clamp(Math.min(w * .9, h) * .13, 40, 88);
    const cx = w / 2, top = h * .62, bottom = top + R * .95;
    drawPlant(gShow, t, R, cx, bottom);
    g.fillStyle = C.ink3; g.font = `13px ${FF}`; g.textAlign = "center"; g.textBaseline = "top";
    g.fillText("보고 있는 동안에는 자라지 않는다", cx, bottom + 18);

    // 시계와 비운 시간
    const dx = cx - R * 1.9, dy = top + R * .45;
    drawDial(dx, dy, R * .22, dial);
    if (counter) {
      const shown = lapse ? lapse.secs * clamp((now - lapse.t0) / lapse.dur, 0, 1) : counter.secs;
      const a = 1 - clamp((now - counter.t0 - (lapse ? lapse.dur : 0) - 2500) / 600, 0, 1);
      if (a <= 0) counter = null;
      else {
        g.globalAlpha = a; g.fillStyle = C.ink; g.textAlign = "right"; g.textBaseline = "middle"; g.font = `13px ${FF}`;
        g.fillText(`+${shown.toFixed(1)}초`, dx - R * .32, dy);
        g.globalAlpha = 1;
      }
    }
    // 말
    if (msg) {
      const age = now - msg.t0;
      const a = age < 0 ? 0 : Math.min(1, age / 250) * (1 - clamp((age - 3500) / 500, 0, 1));
      if (age > 4000) msg = null;
      else if (a > 0) {
        const H = plantH(R) * (0.45 + 0.55 * k01(gShow, 0, 6)) - R * .95;
        g.globalAlpha = a; g.fillStyle = C.ink; g.font = `15px ${FF}`; g.textAlign = "center"; g.textBaseline = "bottom";
        g.fillText(msg.text, cx, Math.max(40, top - H - R * .5 - (1 - a) * 6));
        g.globalAlpha = 1;
      }
    }

    // 읽는 값 · 상태
    const cur = isAway ? (now - leftAt) / 1000 : lastAway;
    if (isAway && sim) awayTime.textContent = `${cur.toFixed(1)}초`;
    if (isAway && sim) { mineTab.textContent = document.title; mineTab.classList.toggle("called", S.title); }
    api.read("vis", isAway ? (sim ? "숨김 (흉내)" : "숨김") : "보임");
    api.read("away", `${cur.toFixed(1)}초`);
    api.read("visits", visits);
    api.read("title", document.title.length > 14 ? document.title.slice(0, 14) + "…" : document.title);
    if (isAway) api.status(`자리 비움 · ${cur.toFixed(1)}초`, "alt");
    else if (lapse) api.status("비운 시간을 빠르게 돌려 보여주는 중", "active");
    else api.status(gTrue >= MAX_G ? "다 자람 · 보고 있음" : "보고 있음 · 자라지 않음", "idle");
  });
}
