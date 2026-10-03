import { clamp, lerp, localPoint, fitCanvas } from "../../lib/util.js";

const CH = "im-multi-window";
const TTL = 1500;
const BAR = 24;
const NAMES = "ABCDEFGH";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .mw-btn { position: absolute; right: 16px; bottom: 16px; z-index: 40; font: inherit; font-size: 13px; color: var(--ink);
      background: var(--panel); border: 1px solid var(--ink); border-radius: 4px; padding: 8px 14px; cursor: pointer; }
    .mw-btn:hover { background: var(--ink); color: var(--on-ink); }
    .mw-btn[disabled] { opacity: .4; pointer-events: none; }
  `);
  const { g, size } = fitCanvas(api);
  const FF = getComputedStyle(el).fontFamily || "sans-serif";
  const C = { board: api.color("--board"), note: api.color("--note"), ink: api.color("--ink"), ink2: api.color("--ink-2"), ink3: api.color("--ink-3"),
    accent: api.color("--accent"), grid: api.color("--grid") };
  const btn = document.createElement("button");
  btn.className = "mw-btn";
  el.appendChild(btn);

  // 팝업으로 열린 창이면 실제 창 방식으로 맞춘다
  if (location.hash === "#mw-real" && S.mode !== "real") {
    api.timeout(() => {
      const b = document.querySelector('.seg[data-key="mode"] button[data-v="real"]');
      if (b) b.click(); else S.mode = "real";
    }, 0);
  }

  /* ============ 공통: 연결 그리기 ============ */
  const line = (x0, y0, x1, y1) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  function link(a, b, t, ghost) {
    g.save();
    g.strokeStyle = ghost ? C.ink3 : C.ink;
    g.lineWidth = ghost ? 1 : 1.5;
    if (ghost) g.setLineDash([4, 6]);
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    if (S.link === "string") {
      const sag = Math.min(160, d * .22) + Math.sin(t / 700) * 5;
      g.beginPath(); g.moveTo(a.x, a.y); g.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 + sag * 2, b.x, b.y); g.stroke();
    } else if (S.link === "flow" && !ghost) {
      g.setLineDash([1, 11]); g.lineCap = "round"; g.lineWidth = 3.5;
      g.lineDashOffset = -t / 30;
      line(a.x, a.y, b.x, b.y);
    } else line(a.x, a.y, b.x, b.y);
    g.restore();
  }
  function orb(p, r, main, label) {
    g.lineWidth = 1.5; g.strokeStyle = C.ink;
    g.fillStyle = main ? C.accent : C.note;
    g.beginPath(); g.arc(p.x, p.y, r, 0, Math.PI * 2); g.fill();
    if (!main) g.stroke();
    if (label) {
      g.fillStyle = C.ink2; g.font = `13px ${FF}`; g.textAlign = "center"; g.textBaseline = "top";
      g.fillText(label, p.x, p.y + r + 8);
    }
  }
  const pullOffset = (p, others, maxR) => {
    if (!S.pull || !others.length) return { x: 0, y: 0 };
    let best = null, bd = Infinity;
    others.forEach(o => { const d = Math.hypot(o.x - p.x, o.y - p.y); if (d < bd) { bd = d; best = o; } });
    if (!best || bd < 1) return { x: 0, y: 0 };
    const k = clamp(1 - bd / 1200, .15, 1) * maxR;
    return { x: (best.x - p.x) / bd * k, y: (best.y - p.y) / bd * k };
  };
  const nearest = (p, others) => {
    let best = null, bd = Infinity;
    others.forEach(o => { const d = Math.hypot(o.x - p.x, o.y - p.y); if (d < bd) { bd = d; best = o; } });
    return best ? { d: bd, ang: Math.atan2(best.y - p.y, best.x - p.x) * 180 / Math.PI } : null;
  };

  /* ============ 흉내 모드 ============ */
  const wins = [];
  let nid = 0;
  const addWin = (x, y, w, h) => {
    const W = { id: nid, name: NAMES[nid % NAMES.length], x, y, w, h, off: { x: 0, y: 0 } };
    nid++;
    wins.push(W);
    return W;
  };
  {
    const { w, h } = size;
    const ww = clamp(w * .34, 150, 300), wh = clamp(h * .34, 130, 240);
    addWin(w * .12, h * .2, ww, wh);
    addWin(w * .88 - ww, h * .72 - wh, ww, wh);
  }
  const content = W => ({ x: W.x, y: W.y + BAR, w: W.w, h: W.h - BAR });
  const center = W => { const c = content(W); return { x: c.x + c.w / 2, y: c.y + c.h / 2 }; };
  let drag = null;

  function hitWin(p) {
    for (let i = wins.length - 1; i >= 0; i--) {
      const W = wins[i];
      if (p.x >= W.x && p.x <= W.x + W.w && p.y >= W.y && p.y <= W.y + W.h) return W;
    }
    return null;
  }
  api.on(el, "pointerdown", e => {
    if (S.mode !== "sim" || e.button !== 0 || e.target === btn) return;
    const p = localPoint(el, e);
    const W = hitWin(p);
    if (!W) return;
    e.preventDefault();
    wins.splice(wins.indexOf(W), 1); wins.push(W);
    // 닫기 (제목 줄 오른쪽 끝)
    if (p.y < W.y + BAR && p.x > W.x + W.w - 24 && wins.length > 2) {
      wins.pop(); api.flash(`창 ${W.name} 닫힘`, "alt"); return;
    }
    el.setPointerCapture(e.pointerId);
    drag = { W, dx: p.x - W.x, dy: p.y - W.y };
    api.hideHint();
  });
  api.on(el, "pointermove", e => {
    if (S.mode === "sim" && !drag) {
      const p = localPoint(el, e), W = hitWin(p);
      el.style.cursor = W ? (p.y < W.y + BAR && p.x > W.x + W.w - 24 && wins.length > 2 ? "pointer" : "grab") : "default";
    }
    if (!drag) return;
    const p = localPoint(el, e), W = drag.W;
    W.x = clamp(p.x - drag.dx, -W.w + 60, size.w - 60);
    W.y = clamp(p.y - drag.dy, 0, size.h - BAR);
    el.style.cursor = "grabbing";
  });
  const endDrag = () => { if (drag) { drag = null; el.style.cursor = "grab"; } };
  api.on(el, "pointerup", endDrag);
  api.on(el, "pointercancel", endDrag);

  function drawSim(t) {
    const { w, h } = size;
    g.fillStyle = C.board; g.fillRect(0, 0, w, h);
    g.strokeStyle = C.grid; g.lineWidth = 1;
    for (let x = 100; x < w; x += 100) line(x, 0, x, h);
    for (let y = 100; y < h; y += 100) line(0, y, w, y);

    // 구슬 위치 (끌리기 적용)
    const R = clamp(Math.min(w, h) * .03, 12, 22);
    const base = wins.map(center);
    const pts = wins.map((W, i) => {
      const c = content(W);
      const o = pullOffset(base[i], base.filter((_, j) => j !== i), Math.min(c.w, c.h) * .32);
      W.off.x = lerp(W.off.x, o.x, .12); W.off.y = lerp(W.off.y, o.y, .12);
      return { x: base[i].x + W.off.x, y: base[i].y + W.off.y };
    });
    const pairs = [];
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) pairs.push([pts[i], pts[j]]);

    // 창 밖 (실제로는 보이지 않는 연결)
    if (S.outside) {
      pairs.forEach(([a, b]) => link(a, b, t, true));
      pts.forEach(p => { g.strokeStyle = C.ink3; g.lineWidth = 1; g.setLineDash([3, 4]); g.beginPath(); g.arc(p.x, p.y, R, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); });
    }
    // 창마다 자기 영역만 그린다
    const front = wins[wins.length - 1];
    wins.forEach((W, i) => {
      const c = content(W);
      g.fillStyle = C.note; g.fillRect(W.x, W.y, W.w, W.h);
      g.save();
      g.beginPath(); g.rect(c.x, c.y, c.w, c.h); g.clip();
      pairs.forEach(([a, b]) => link(a, b, t, false));
      pts.forEach((p, k) => orb(p, R, k === wins.length - 1, null));
      g.restore();
      // 테두리와 제목 줄
      g.strokeStyle = C.ink; g.lineWidth = W === front ? 1.5 : 1;
      g.strokeRect(W.x, W.y, W.w, W.h);
      line(W.x, W.y + BAR, W.x + W.w, W.y + BAR);
      g.fillStyle = W === front ? C.ink : C.ink3; g.font = `13px ${FF}`; g.textAlign = "left"; g.textBaseline = "middle";
      g.fillText(`창 ${W.name} · ${Math.round(W.x)}, ${Math.round(W.y)}`, W.x + 10, W.y + BAR / 2 + 1);
      if (wins.length > 2) { g.strokeStyle = C.ink3; const cx = W.x + W.w - 13, cy = W.y + BAR / 2; line(cx - 4, cy - 4, cx + 4, cy + 4); line(cx - 4, cy + 4, cx + 4, cy - 4); }
    });

    const me = pts[pts.length - 1];
    const n = nearest(me, pts.slice(0, -1));
    api.read("count", wins.length - 1);
    api.read("pos", `${Math.round(front.x)}, ${Math.round(front.y)}`);
    api.read("dist", n ? Math.round(n.d) : "–");
    api.read("angle", n ? Math.round(n.ang) : "–");
    api.status(drag ? `창 ${drag.W.name} 옮기는 중 · 다른 창의 선이 따라 돈다` : `흉내 모드 · 창 ${wins.length}개`, drag ? "active" : "idle");
  }

  /* ============ 실제 창 모드 ============ */
  const myId = Math.random().toString(36).slice(2, 8);
  const peers = new Map(); // id → { x, y, sx, sy, t }
  const bc = "BroadcastChannel" in window ? new BroadcastChannel(CH) : null;
  const readLS = () => { try { return JSON.parse(localStorage.getItem(CH) || "{}"); } catch (e) { return {}; } };
  const writeLS = fn => { try { const m = readLS(); fn(m); localStorage.setItem(CH, JSON.stringify(m)); } catch (e) { /* 저장소를 못 쓰면 채널만 쓴다 */ } };
  const receive = d => {
    if (!d || d.id === myId) return;
    if (d.bye) { peers.delete(d.id); return; }
    peers.set(d.id, { ...d, seen: performance.now() });
  };
  if (bc) api.on(bc, "message", e => receive(e.data));
  api.on(window, "storage", e => {
    if (e.key !== CH) return;
    const m = readLS();
    Object.values(m).forEach(d => { if (Date.now() - d.t < TTL) receive(d); });
  });
  const bye = () => {
    if (bc) bc.postMessage({ id: myId, bye: true });
    writeLS(m => { delete m[myId]; });
  };
  api.on(window, "pagehide", bye);
  api.cleanup(() => { bye(); if (bc) bc.close(); });

  let lastSend = 0, myOff = { x: 0, y: 0 };
  const origin = () => {
    // 이 스테이지의 왼쪽 위가 모니터에서 어디인지 (주소창 높이 보정)
    const er = el.getBoundingClientRect();
    const chromeX = Math.max(0, (window.outerWidth - window.innerWidth) / 2);
    const chromeY = Math.max(0, window.outerHeight - window.innerHeight);
    return { x: window.screenX + chromeX + er.left, y: window.screenY + chromeY + er.top };
  };

  function drawReal(t) {
    const { w, h } = size;
    const now = performance.now();
    for (const [id, p] of peers) if (now - p.seen > TTL) peers.delete(id);
    const o = origin();
    const others = [...peers.values()].sort((a, b) => a.id < b.id ? -1 : 1).map((p, i) => ({ x: p.x - o.x, y: p.y - o.y, name: NAMES[(i + 1) % NAMES.length] }));
    const c = { x: w / 2, y: h * .5 };
    const po = pullOffset(c, others, Math.min(w, h) * .3);
    myOff.x = lerp(myOff.x, po.x, .12); myOff.y = lerp(myOff.y, po.y, .12);
    const me = { x: c.x + myOff.x, y: c.y + myOff.y };

    // 위치 알리기
    if (now - lastSend > 100) {
      lastSend = now;
      const d = { id: myId, x: o.x + me.x, y: o.y + me.y, sx: window.screenX, sy: window.screenY, t: Date.now() };
      if (bc) bc.postMessage(d);
      writeLS(m => { m[myId] = d; Object.keys(m).forEach(k => { if (Date.now() - m[k].t > 5000) delete m[k]; }); });
    }

    g.fillStyle = C.board; g.fillRect(0, 0, w, h);
    g.strokeStyle = C.grid; g.lineWidth = 1;
    // 격자를 모니터 기준으로 고정해 창을 옮기면 격자가 흘러간다
    for (let x = 100 - ((o.x % 100) + 100) % 100; x < w; x += 100) line(x, 0, x, h);
    for (let y = 100 - ((o.y % 100) + 100) % 100; y < h; y += 100) line(0, y, w, y);

    const R = clamp(Math.min(w, h) * .035, 14, 26);
    others.forEach(p => link(me, p, t, false));
    others.forEach(p => {
      const inside = p.x > -R && p.x < w + R && p.y > -R && p.y < h + R;
      if (inside) orb(p, R, false, `창 ${p.name}`);
      else {
        // 창 밖이면 가장자리에 거리 표시
        const dx = p.x - me.x, dy = p.y - me.y;
        const kx = dx === 0 ? Infinity : (dx > 0 ? w - 16 - me.x : 16 - me.x) / dx;
        const ky = dy === 0 ? Infinity : (dy > 0 ? h - 16 - me.y : 16 - me.y) / dy;
        const k = Math.min(kx, ky);
        const ex = me.x + dx * k, ey = me.y + dy * k;
        g.fillStyle = C.ink; g.font = `13px ${FF}`;
        g.textAlign = ex > w / 2 ? "right" : "left"; g.textBaseline = ey > h / 2 ? "bottom" : "top";
        g.fillText(`창 ${p.name} · ${Math.round(Math.hypot(dx, dy))}px`, clamp(ex, 12, w - 12), clamp(ey, 60, h - 60));
      }
    });
    orb(me, R, true, "이 창");

    if (!others.length) {
      g.fillStyle = C.ink2; g.font = `15px ${FF}`; g.textAlign = "center"; g.textBaseline = "top";
      g.fillText("다른 창이 없다. ‘새 창 열기’로 창을 하나 더 열어 옆에 두면 두 창의 구슬이 선으로 이어진다.", w / 2, me.y + R + 40, w - 40);
      g.fillStyle = C.ink3; g.font = `13px ${FF}`;
      g.fillText(bc ? "같은 브라우저의 창끼리만 이어진다" : "이 브라우저는 창끼리 메시지를 주고받지 못해 저장소로만 잇는다", w / 2, me.y + R + 66, w - 40);
    }

    const n = nearest(me, others);
    api.read("count", others.length);
    api.read("pos", `${window.screenX}, ${window.screenY}`);
    api.read("dist", n ? Math.round(n.d) : "–");
    api.read("angle", n ? Math.round(n.ang) : "–");
    api.status(others.length ? `실제 창 · ${others.length}개와 연결됨` : "실제 창 · 다른 창을 기다리는 중", others.length ? "active" : "idle");
  }

  /* ============ 버튼과 모드 ============ */
  const syncButton = () => {
    const txt = S.mode === "real" ? "새 창 열기" : "+ 창 추가", dis = S.mode === "sim" && wins.length >= 5;
    if (btn.textContent !== txt) btn.textContent = txt;
    if (btn.disabled !== dis) btn.disabled = dis;
  };
  syncButton();
  api.on(btn, "click", () => {
    api.hideHint();
    if (S.mode === "sim") {
      const { w, h } = size;
      const ww = clamp(w * .28, 140, 260), wh = clamp(h * .28, 120, 200);
      const W = addWin(clamp(w / 2 - ww / 2 + (Math.random() - .5) * w * .4, 0, w - ww), clamp(h / 2 - wh / 2 + (Math.random() - .5) * h * .3, 60, h - wh - 60), ww, wh);
      api.flash(`창 ${W.name} 추가`, "ok");
    } else {
      const pw = 520, ph = 560;
      const url = location.href.split("#")[0] + "#mw-real";
      const win = window.open(url, "mw-" + Date.now(), `popup,width=${pw},height=${ph},left=${Math.round(window.screenX + window.outerWidth - pw * .6)},top=${Math.round(window.screenY + 80)}`);
      if (!win) api.flash("팝업이 막혔다 · 브라우저에서 팝업을 허용해야 한다", "alt", 2600);
      else api.flash("새 창을 열었다 · 창을 옮기면 → 선이 따라 돈다", "ok", 2200);
    }
  });
  api.onParam(k => {
    if (k === "mode") { syncButton(); peers.clear(); if (S.mode === "sim") bye(); el.style.cursor = "default"; }
  });

  api.frame((dt, t) => {
    syncButton();
    g.clearRect(0, 0, size.w, size.h);
    if (S.mode === "real") drawReal(t); else drawSim(t);
  });
}
