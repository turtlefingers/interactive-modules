import { clamp, lerp, fitCanvas } from "../../lib/util.js";
import { ILLO, shape, tube, circle, ellipse, leaf as kitLeaf, star, line as inkLine } from "../../lib/draw.js";

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

  /* ---------- 그리기 (그림 키트 스타일: 3px 외곽선 + 평면 단색) ---------- */
  const LW = 3;
  const line = (x0, y0, x1, y1) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  const k01 = (v, a, b) => clamp((v - a) / (b - a), 0, 1);

  // 잎: (x, y)가 잎자루, ang 방향으로 len만큼. k는 0~1 크기
  function leaf(x, y, len, ang, k) {
    if (k <= 0.02) return;
    g.save(); g.translate(x, y); g.rotate(ang);
    kitLeaf(g, len * k / 2, 0, { size: len * k, color: ILLO.green, lw: LW });
    g.restore();
  }
  // 꽃: 별 모양 꽃잎 + 가운데 점
  function flower(x, y, r, k) {
    if (k <= 0.02) return;
    star(g, x, y, { r: r * 2.2 * k, color: ILLO.yellow, lw: LW });
    circle(g, x, y, Math.max(2, r * 0.6 * k), { fill: ILLO.orange, lw: LW });
  }

  function drawPlant(gv, t, R, cx, top) {
    const sway = Math.sin(t / 1400) * R * .04;
    // 씨앗
    if (gv < 1) ellipse(g, cx, top - 6, 6 * (1 - k01(gv, .4, 1)) + 4, 5, { fill: ILLO.orange, lw: LW });
    // 줄기
    const H = R * 2.9 * (k01(gv, .4, 1) * .12 + k01(gv, 1, 6) * .88);
    const tipX = cx + sway, tipY = top - H;
    const at = f => ({ x: lerp(cx, tipX, f) - Math.sin(f * Math.PI) * R * .06, y: top - H * f });
    if (gv > .4) {
      const pts = [];
      for (let i = 0; i <= 8; i++) { const p = at(i / 8); pts.push([p.x, p.y]); }
      tube(g, pts, { color: ILLO.green, w: clamp(R * 0.08, 3, 7), lw: LW });
    }
    // 떡잎 → 잎
    if (gv > .6) { const p = at(1); if (gv < 2.2) { const k = k01(gv, .6, 1.2) * (1 - k01(gv, 1.8, 2.2)); leaf(p.x, p.y, R * .28, -2.5, k); leaf(p.x, p.y, R * .28, -.6, k); } }
    const p1 = at(.32), p2 = at(.58);
    leaf(p1.x, p1.y, R * .62, -.35, k01(gv, 1.5, 2.6));
    leaf(p2.x, p2.y, R * .55, Math.PI + .35, k01(gv, 2.8, 3.9));
    // 곁가지 꽃
    const side = (f, dir, k) => {
      if (k <= 0.02) return;
      const p = at(f), ex = p.x + dir * R * .75 * k, ey = p.y - R * .45 * k;
      tube(g, [[p.x, p.y], [p.x + dir * R * .4 * k, p.y - R * .1 * k], [ex, ey]], { color: ILLO.green, w: clamp(R * 0.05, 2, 4), lw: LW });
      flower(ex, ey, R * .11, k);
    };
    side(.45, 1, k01(gv, 6, 7.5));
    side(.72, -1, k01(gv, 7.5, 9));
    // 봉오리 → 꽃
    const bud = k01(gv, 4, 5), bloom = k01(gv, 5, 6);
    if (bud > 0.05 && bloom < 1) ellipse(g, tipX, tipY - 5 * bud, 5 * bud * (1 - bloom) + 1, 8 * bud * (1 - bloom) + 1, { fill: ILLO.green, lw: LW });
    flower(tipX, tipY, R * .16, bloom);
  }

  function drawPot(R, cx, top) {
    const tw = R * .8, bw = R * .58, h = R * .95, rim = R * .18;
    shape(g, c => { c.moveTo(cx - tw + 4, top + rim); c.lineTo(cx + tw - 4, top + rim); c.lineTo(cx + bw, top + h); c.lineTo(cx - bw, top + h); c.closePath(); }, { fill: ILLO.orange, lw: LW });
    shape(g, c => c.roundRect(cx - tw - 4, top, tw * 2 + 8, rim, 3), { fill: ILLO.orange, lw: LW });
    // 흙
    inkLine(g, [[cx - tw + 6, top + 1.5], [cx + tw - 6, top + 1.5]], { lw: LW });
    return top + h;
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
    const cx = w / 2, top = h * .62;
    drawPlant(gShow, t, R, cx, top);
    const bottom = drawPot(R, cx, top);
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
        const H = R * 2.9 * (k01(gShow, .4, 1) * .12 + k01(gShow, 1, 6) * .88);
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
