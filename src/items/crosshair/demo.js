import { rng, clamp, lerp, localPoint, fitCanvas } from "../../lib/util.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`.crosshair-root { position: absolute; inset: 0; background: var(--board); cursor: crosshair; }`);
  const root = document.createElement("div");
  root.className = "crosshair-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const INK = api.color("--ink") || "#1b1b1a";
  const INK2 = api.color("--ink-2") || "#5d5b57";
  const INK3 = api.color("--ink-3") || "#9a9790";
  const ACC = api.color("--accent") || "#ff5a36";
  const NOTE = api.color("--note") || "#fffdf6";
  const FONT = getComputedStyle(el).fontFamily || "sans-serif";

  /* ---------- 데이터: 하루 장중 5분 간격 지수 (09:00 ~ 15:30) ---------- */
  const rand = rng(42);
  const gauss = () => { let u = 0, v = 0; while (!u) u = rand(); while (!v) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const N = 79, data = [];
  let v = 2650;
  for (let i = 0; i < N; i++) {
    const drift = i < 20 ? 0.9 : i < 45 ? -0.7 : 0.5;
    v += drift + gauss() * 4.2;
    data.push(v);
  }
  const OPEN = 2650;
  const timeOf = i => { const m = 9 * 60 + i * 5; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
  const fmtV = x => x.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtC = x => { const c = (x - OPEN) / OPEN * 100; return `${c >= 0 ? "+" : ""}${c.toFixed(2)}%`; };

  /* ---------- 배치 ---------- */
  const L = { l: 24, r: 76, t: 110, b: 44 };
  let lo = Math.min(...data), hi = Math.max(...data);
  const pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
  const plot = () => ({ x0: L.l, x1: size.w - L.r, y0: L.t, y1: size.h - L.b });
  const X = i => { const p = plot(); return p.x0 + (p.x1 - p.x0) * i / (N - 1); };
  const Y = val => { const p = plot(); return p.y1 - (p.y1 - p.y0) * (val - lo) / (hi - lo); };
  const valAtY = y => { const p = plot(); return lo + (p.y1 - y) / (p.y1 - p.y0) * (hi - lo); };

  /* ---------- 바탕 차트 (정지된 부분은 한 번만 그린다) ---------- */
  const base = document.createElement("canvas");
  const renderBase = () => {
    const { w, h, dpr } = size;
    base.width = Math.round(w * dpr); base.height = Math.round(h * dpr);
    const c = base.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = api.color("--board") || "#efe9dd"; c.fillRect(0, 0, w, h);
    const p = plot();
    c.font = `13px ${FONT}`; c.textBaseline = "middle";
    // 가로 눈금
    const step = 20, first = Math.ceil(lo / step) * step;
    for (let t = first; t <= hi; t += step) {
      const y = Math.round(Y(t)) + 0.5;
      c.strokeStyle = "rgba(0,0,0,.07)"; c.lineWidth = 1;
      c.beginPath(); c.moveTo(p.x0, y); c.lineTo(p.x1, y); c.stroke();
      c.fillStyle = INK3; c.textAlign = "left"; c.fillText(fmtV(t).replace(/\.00$/, ""), p.x1 + 10, y);
    }
    // 시각 눈금
    c.textAlign = "center"; c.textBaseline = "top";
    for (let i = 0; i < N; i += 12) {
      const x = Math.round(X(i)) + 0.5;
      c.strokeStyle = "rgba(0,0,0,.05)"; c.beginPath(); c.moveTo(x, p.y0); c.lineTo(x, p.y1); c.stroke();
      c.fillStyle = INK3; c.fillText(timeOf(i), x, p.y1 + 12);
    }
    // 기준선 (시가)
    const oy = Math.round(Y(OPEN)) + 0.5;
    c.setLineDash([2, 4]); c.strokeStyle = "rgba(0,0,0,.25)";
    c.beginPath(); c.moveTo(p.x0, oy); c.lineTo(p.x1, oy); c.stroke(); c.setLineDash([]);
    // 축
    c.strokeStyle = "rgba(0,0,0,.2)";
    c.beginPath(); c.moveTo(p.x0, p.y1 + 0.5); c.lineTo(p.x1, p.y1 + 0.5); c.moveTo(p.x1 + 0.5, p.y0); c.lineTo(p.x1 + 0.5, p.y1); c.stroke();
    // 선
    c.strokeStyle = INK; c.lineWidth = 1.5; c.lineJoin = "round";
    c.beginPath(); data.forEach((d, i) => i ? c.lineTo(X(i), Y(d)) : c.moveTo(X(i), Y(d))); c.stroke();
  };
  renderBase();
  api.onResize(renderBase);

  /* ---------- 입력 ---------- */
  const m = { x: 0, y: 0, inside: false };
  api.on(root, "pointermove", e => { const q = localPoint(el, e); m.x = q.x; m.y = q.y; m.inside = true; api.hideHint(); });
  api.on(root, "pointerdown", e => { e.preventDefault(); const q = localPoint(el, e); m.x = q.x; m.y = q.y; m.inside = true; api.hideHint(); });
  api.on(root, "pointerleave", () => { m.inside = false; });
  api.on(root, "pointerup", e => { if (e.pointerType !== "mouse") m.inside = false; });

  /* ---------- 그리기 도우미 ---------- */
  const pill = (text, x, y, align) => {
    g.font = `600 13px ${FONT}`;
    const tw = g.measureText(text).width, pw = tw + 14, ph = 22;
    let bx = align === "left" ? x : x - pw / 2;
    bx = clamp(bx, 2, size.w - pw - 2);
    g.fillStyle = INK; g.beginPath(); g.roundRect(bx, y - ph / 2, pw, ph, 4); g.fill();
    g.fillStyle = NOTE; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(text, bx + 7, y + 0.5);
  };

  let vis = 0;
  let cur = null; // 마지막으로 가리킨 값 (사라지는 동안 유지)
  api.frame(() => {
    const { w, h, dpr } = size;
    const p = plot();
    const over = m.inside && m.x >= p.x0 && m.x <= p.x1 && m.y >= p.y0 - 10 && m.y <= p.y1 + 10;
    vis += ((over ? 1 : 0) - vis) * 0.25;
    if (vis < 0.01) vis = 0;

    g.clearRect(0, 0, w, h);
    g.drawImage(base, 0, 0, w, h);

    if (over) {
      const fi = clamp((m.x - p.x0) / (p.x1 - p.x0) * (N - 1), 0, N - 1);
      if (S.snap) {
        const i = Math.round(fi);
        cur = { i, t: timeOf(i), v: data[i], x: X(i), y: Y(data[i]), hy: Y(data[i]), hv: data[i], snapD: Math.abs(m.x - X(i)) };
      } else {
        const a = Math.floor(fi), b = Math.min(N - 1, a + 1), k = fi - a, val = lerp(data[a], data[b], k);
        const mins = 9 * 60 + fi * 5;
        const t = `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(Math.floor(mins % 60)).padStart(2, "0")}`;
        cur = { i: Math.round(fi), t, v: val, x: m.x, y: Y(val), hy: clamp(m.y, p.y0, p.y1), hv: valAtY(clamp(m.y, p.y0, p.y1)), snapD: 0 };
      }
    }

    // 머리글: 기본은 마지막 값, 「위쪽 고정」이면 가리킨 값
    const showFixed = S.tooltip === "fixed" && cur && vis > 0.5;
    const hv = showFixed ? cur.v : data[N - 1], ht = showFixed ? cur.t : "15:30 종가";
    g.textAlign = "left"; g.textBaseline = "alphabetic";
    g.fillStyle = INK2; g.font = `13px ${FONT}`; g.fillText(`모듈 지수 · ${ht}`, L.l, 72);
    g.fillStyle = INK; g.font = `700 18px ${FONT}`; g.fillText(fmtV(hv), L.l, 96);
    const vw = g.measureText(fmtV(hv)).width;
    g.font = `13px ${FONT}`; g.fillStyle = hv >= OPEN ? ACC : INK2; g.fillText(fmtC(hv), L.l + vw + 10, 96);

    if (cur && vis > 0) {
      g.save(); g.globalAlpha = vis;
      // 세로선과 가로선
      g.strokeStyle = "rgba(27,27,26,.55)"; g.lineWidth = 1; g.setLineDash([4, 4]);
      const vx = Math.round(cur.x) + 0.5, hy = Math.round(cur.hy) + 0.5;
      g.beginPath(); g.moveTo(vx, p.y0); g.lineTo(vx, p.y1); g.stroke();
      if (S.hLine) { g.beginPath(); g.moveTo(p.x0, hy); g.lineTo(p.x1, hy); g.stroke(); }
      g.setLineDash([]);
      // 점
      g.fillStyle = ACC; g.beginPath(); g.arc(cur.x, cur.y, 4, 0, Math.PI * 2); g.fill();
      // 축 이름표
      pill(cur.t, cur.x, p.y1 + 19, "center");
      if (S.hLine) pill(fmtV(cur.hv), p.x1 + 4, cur.hy, "left");

      // 돋보기
      if (S.magnifier) {
        const R = 58, Z = 3;
        const lx = clamp(cur.x, R + 4, w - R - 4), ly = clamp(cur.y - R - 18, R + 4, h - R - 4);
        g.save();
        g.beginPath(); g.arc(lx, ly, R, 0, Math.PI * 2); g.clip();
        const sw = (R * 2) / Z, sh = (R * 2) / Z;
        g.drawImage(base, (cur.x - sw / 2) * dpr, (cur.y - sh / 2) * dpr, sw * dpr, sh * dpr, lx - R, ly - R, R * 2, R * 2);
        g.strokeStyle = "rgba(27,27,26,.55)"; g.setLineDash([4, 4]);
        g.beginPath(); g.moveTo(lx, ly - R); g.lineTo(lx, ly + R); g.stroke();
        if (S.hLine) { const zy = ly + (cur.hy - cur.y) * Z; g.beginPath(); g.moveTo(lx - R, zy); g.lineTo(lx + R, zy); g.stroke(); }
        g.setLineDash([]);
        g.fillStyle = ACC; g.beginPath(); g.arc(lx, ly, 5, 0, Math.PI * 2); g.fill();
        g.restore();
        g.strokeStyle = INK; g.lineWidth = 1; g.beginPath(); g.arc(lx, ly, R, 0, Math.PI * 2); g.stroke();
      }

      // 커서 옆 말풍선
      if (S.tooltip === "follow") {
        const lines = [cur.t, fmtV(cur.v), fmtC(cur.v)];
        g.font = `600 13px ${FONT}`;
        const bw = Math.max(...lines.map(s => g.measureText(s).width)) + 20, bh = 64;
        let bx = cur.x + 14, by = cur.y + 14;
        if (S.magnifier) by = cur.y + 18;
        if (bx + bw > p.x1) bx = cur.x - 14 - bw;
        if (by + bh > p.y1) by = cur.y - 14 - bh;
        g.fillStyle = NOTE; g.strokeStyle = "rgba(27,27,26,.25)";
        g.beginPath(); g.roundRect(bx, by, bw, bh, 6); g.fill(); g.stroke();
        g.textAlign = "left"; g.textBaseline = "top";
        g.fillStyle = INK3; g.font = `13px ${FONT}`; g.fillText(lines[0], bx + 10, by + 8);
        g.fillStyle = INK; g.font = `600 13px ${FONT}`; g.fillText(lines[1], bx + 10, by + 26);
        g.fillStyle = cur.v >= OPEN ? ACC : INK2; g.font = `13px ${FONT}`; g.fillText(lines[2], bx + 10, by + 44);
      }
      g.restore();
    }

    api.read("cx", m.inside ? `${Math.round(m.x)}px` : "–");
    api.read("time", over && cur ? cur.t : "–");
    api.read("val", over && cur ? fmtV(cur.v) : "–");
    api.read("snapd", over && cur ? (S.snap ? `${cur.snapD.toFixed(1)}px` : "스냅 꺼짐") : "–");

    if (over && cur) api.status(`${cur.t} · ${fmtV(cur.v)}${S.snap ? "" : " (보간)"}`, "active");
    else if (m.inside) api.status("그래프 영역으로 커서 옮기기", "idle");
    else api.status("대기", "idle");
  });
}
