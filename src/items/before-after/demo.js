import { rng, clamp, localPoint, fitCanvas } from "../../lib/util.js";
import { ILLO, TONE, LINE, shape, circle, line } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .before-after-root { position: absolute; inset: 0; background: var(--board); cursor: col-resize; }
    .before-after-root.axis-y { cursor: row-resize; }
    .before-after-label { position: absolute; z-index: 10; pointer-events: none; font-size: 13px; font-weight: 600;
      padding: 5px 10px; border-radius: var(--r-pill); background: var(--chip-bg); color: var(--ink);
      white-space: nowrap; transition: opacity .2s; }
  `);
  const root = document.createElement("div");
  root.className = "before-after-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });
  const labA = document.createElement("div"), labB = document.createElement("div");
  labA.className = labB.className = "before-after-label";
  labA.textContent = "원본";
  root.append(labA, labB);
  const FILTER_NAMES = { gray: "흑백", sepia: "빈티지", invert: "반전", pixel: "픽셀" };

  /* ---------- 그림: 외곽선 없는 톤 면으로 만든 풍경. 강조색은 해 하나 (필터 차이가 여기서 읽힌다) ---------- */
  const before = document.createElement("canvas"), after = document.createElement("canvas"), tmp = document.createElement("canvas");
  const drawScene = (c, w, h) => {
    c.fillStyle = ILLO.cream; c.fillRect(0, 0, w, h);
    const m = Math.min(w, h), rand = rng(3);
    // 해: 강조색 원판
    circle(c, w * 0.7, h * 0.3, m * 0.075, { fill: ILLO.orange });
    // 능선: 뒤에서 앞으로 점점 어두운 톤
    const ridge = (base, amp, seed, color, stepPx = 6) => {
      const r = rng(seed), ph = [r() * 6, r() * 6, r() * 6];
      shape(c, p => {
        p.moveTo(-10, h + 10);
        for (let x = -10; x <= w + stepPx + 10; x += stepPx) {
          const t = x / w;
          const y = base - amp * (0.55 * Math.sin(t * 5.1 + ph[0]) + 0.3 * Math.sin(t * 11.3 + ph[1]) + 0.15 * Math.sin(t * 23 + ph[2]));
          p.lineTo(x, y);
        }
        p.lineTo(w + 10, h + 10); p.closePath();
      }, { fill: color });
    };
    ridge(h * 0.5, h * 0.1, 7, TONE[1]);
    ridge(h * 0.57, h * 0.08, 9, TONE[2]);
    ridge(h * 0.64, h * 0.06, 12, TONE[3]);
    // 호수: 밝은 톤 띠 + 가는 물결선 몇 개
    const ly = h * 0.7;
    shape(c, p => p.rect(-10, ly, w + 20, h * 0.1 + 10), { fill: TONE[1] });
    for (let i = 0; i < 3; i++) {
      const y = ly + h * 0.025 + i * h * 0.022, len = m * (0.05 + rand() * 0.08), x = w * 0.7 - len / 2 + (rand() - 0.5) * m * 0.08;
      line(c, [[x, y], [x + len, y]], { lw: LINE, stroke: TONE[3] });
    }
    // 앞 들판
    shape(c, p => p.rect(-10, h * 0.8, w + 20, h * 0.2 + 10), { fill: TONE[3] });
    // 나무: 가늘고 긴 어두운 톤 실루엣 (mouse-parallax와 같은 모양)
    const tree = (x, s) => {
      const y = h * 0.82 + s * 0.15, th = s * 1.6, tw = th * 0.28;
      shape(c, p => { p.moveTo(x - tw, y); p.quadraticCurveTo(x - tw * 0.9, y - th * 0.55, x, y - th); p.quadraticCurveTo(x + tw * 0.9, y - th * 0.55, x + tw, y); p.closePath(); }, { fill: TONE[5] });
    };
    const u = m * 0.09;
    [[0.08, 1.1], [0.14, 0.8], [0.3, 0.95], [0.52, 1.2], [0.6, 0.7], [0.78, 1.15], [0.85, 0.85], [0.95, 1]].forEach(([x, s]) => tree(w * x, u * s));
  };
  const applyFilter = (src, dst, type, dpr) => {
    const W = src.width, H = src.height;
    dst.width = W; dst.height = H;
    const sc = src.getContext("2d"), dc = dst.getContext("2d");
    const img = sc.getImageData(0, 0, W, H), d = img.data;
    if (type === "pixel") {
      const B = Math.max(4, Math.round(12 * dpr));
      for (let by = 0; by < H; by += B) for (let bx = 0; bx < W; bx += B) {
        const cx = Math.min(W - 1, bx + (B >> 1)), cy = Math.min(H - 1, by + (B >> 1)), ci = (cy * W + cx) * 4;
        const r = d[ci], gg = d[ci + 1], b = d[ci + 2];
        for (let y = by; y < Math.min(H, by + B); y++) for (let x = bx; x < Math.min(W, bx + B); x++) {
          const i = (y * W + x) * 4; d[i] = r; d[i + 1] = gg; d[i + 2] = b;
        }
      }
    } else {
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], gg = d[i + 1], b = d[i + 2];
        if (type === "gray") { const l = 0.299 * r + 0.587 * gg + 0.114 * b; d[i] = d[i + 1] = d[i + 2] = l; }
        else if (type === "sepia") {
          const sr = 0.393 * r + 0.769 * gg + 0.189 * b, sg = 0.349 * r + 0.686 * gg + 0.168 * b, sb = 0.272 * r + 0.534 * gg + 0.131 * b;
          d[i] = Math.min(255, sr * 0.85 + 30); d[i + 1] = Math.min(255, sg * 0.85 + 22); d[i + 2] = Math.min(255, sb * 0.85 + 14);
        } else { d[i] = 255 - r; d[i + 1] = 255 - gg; d[i + 2] = 255 - b; }
      }
    }
    dc.putImageData(img, 0, 0);
  };
  let builtFor = "";
  const rebuild = () => {
    const { w, h, dpr } = size;
    if (!w || !h) return;
    before.width = tmp.width = Math.round(w * dpr); before.height = tmp.height = Math.round(h * dpr);
    const c = before.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawScene(c, w, h);
    applyFilter(before, after, S.filter, dpr);
    builtFor = `${w}x${h}@${dpr}`;
  };
  rebuild();
  let resizeT = 0;
  api.onResize(() => { clearTimeout(resizeT); resizeT = api.timeout(() => { resizeT = 0; rebuild(); }, 120); });

  /* ---------- 입력 ---------- */
  const st = { pos: 0.5, target: 0.5, inside: false, down: false, px: 0, py: 0 };
  const along = q => S.axis === "x" ? q.x / size.w : q.y / size.h;
  const applyAxis = () => root.classList.toggle("axis-y", S.axis === "y");
  applyAxis();
  api.onParam((k) => {
    if (k === "filter") applyFilter(before, after, S.filter, size.dpr);
    if (k === "axis") applyAxis();
  });
  api.on(root, "pointermove", e => {
    const q = localPoint(el, e); st.px = q.x; st.py = q.y; st.inside = true;
    if (S.follow === "hover" || st.down) { st.target = clamp(along(q), 0, 1); api.hideHint(); }
  });
  api.on(root, "pointerleave", () => { st.inside = false; });
  api.on(root, "pointerdown", e => {
    e.preventDefault();
    const q = localPoint(el, e); st.px = q.x; st.py = q.y; st.inside = true;
    if (S.follow === "drag") { root.setPointerCapture(e.pointerId); st.down = true; }
    st.target = clamp(along(q), 0, 1);
    api.hideHint();
  });
  const up = () => { st.down = false; };
  api.on(root, "pointerup", up);
  api.on(root, "pointercancel", up);

  /* ---------- 그리기 ---------- */
  const labelPlace = (lab, show, x, y, alignRight) => {
    lab.style.opacity = show ? 1 : 0;
    lab.style.left = x + "px"; lab.style.top = y + "px";
    lab.style.transform = alignRight ? "translate(-100%, 0)" : "none";
  };
  api.frame(() => {
    const { w, h, dpr } = size;
    if (`${w}x${h}@${dpr}` !== builtFor && !resizeT) rebuild();
    const k = S.follow === "hover" ? 0.3 : 0.6;
    st.pos += (st.target - st.pos) * k;
    if (Math.abs(st.target - st.pos) < 0.0005) st.pos = st.target;
    const X = S.axis === "x";
    const split = X ? st.pos * w : st.pos * h;

    g.clearRect(0, 0, w, h);
    g.drawImage(before, 0, 0, w, h);
    if (S.style === "soft") {
      // 경계를 부드럽게: 필터 이미지를 경계 둘레에서 점점 투명하게 가린다
      const t = tmp.getContext("2d"), F = 70 * dpr, s = split * dpr;
      t.setTransform(1, 0, 0, 1, 0, 0);
      t.globalCompositeOperation = "source-over";
      t.clearRect(0, 0, tmp.width, tmp.height);
      t.drawImage(after, 0, 0);
      t.globalCompositeOperation = "destination-in";
      const gr = X ? t.createLinearGradient(s - F, 0, s + F, 0) : t.createLinearGradient(0, s - F, 0, s + F);
      gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
      t.fillStyle = gr; t.fillRect(0, 0, tmp.width, tmp.height);
      t.globalCompositeOperation = "source-over";
      g.drawImage(tmp, 0, 0, w, h);
    } else {
      g.save(); g.beginPath();
      if (X) g.rect(split, 0, w - split, h); else g.rect(0, split, w, h - split);
      g.clip(); g.drawImage(after, 0, 0, w, h); g.restore();
    }

    // 분할선
    if (S.style !== "soft") {
      g.fillStyle = "#fffdf6";
      if (X) g.fillRect(split - 1, 0, 2, h); else g.fillRect(0, split - 1, w, 2);
    }
    if (S.style === "handle" || (S.style === "soft" && S.follow === "drag")) {
      const hx = X ? split : w / 2, hy = X ? h / 2 : split;
      g.fillStyle = "#fffdf6"; g.strokeStyle = "rgba(27,27,26,.25)"; g.lineWidth = 1;
      g.beginPath(); g.arc(hx, hy, 18, 0, Math.PI * 2); g.fill(); g.stroke();
      g.strokeStyle = "#1b1b1a"; g.lineWidth = 1.5; g.lineJoin = "round"; g.beginPath();
      if (X) { g.moveTo(hx - 4, hy - 5); g.lineTo(hx - 9, hy); g.lineTo(hx - 4, hy + 5); g.moveTo(hx + 4, hy - 5); g.lineTo(hx + 9, hy); g.lineTo(hx + 4, hy + 5); }
      else { g.moveTo(hx - 5, hy - 4); g.lineTo(hx, hy - 9); g.lineTo(hx + 5, hy - 4); g.moveTo(hx - 5, hy + 4); g.lineTo(hx, hy + 9); g.lineTo(hx + 5, hy + 4); }
      g.stroke();
    }

    // 이름표
    labB.textContent = `필터 · ${FILTER_NAMES[S.filter] || ""}`;
    if (X) {
      labelPlace(labA, split > 110, split - 12, 64, true);
      labelPlace(labB, w - split > 150, split + 12, 64, false);
    } else {
      labelPlace(labA, split > 110, w / 2 + 30, split - 40, false);
      labelPlace(labB, h - split > 110, w / 2 + 30, split + 12, false);
    }

    const cur = X ? st.px : st.py;
    const pct = Math.round(st.pos * 100);
    api.read("pointer", st.inside ? `${X ? "x" : "y"} = ${Math.round(cur)}px` : "–");
    api.read("ratio", `${pct} : ${100 - pct}`);
    api.read("split", `${Math.round(split)}px`);
    api.read("side", st.inside ? (cur < split ? "원본" : "필터") : "–");

    if (st.down) api.status("분할선을 끄는 중", "active");
    else if (S.follow === "hover" && st.inside) api.status(`분할선이 커서를 따라가는 중 · 원본 ${pct}%`, "active");
    else if (S.follow === "drag" && st.inside) api.status("누른 채 끌어야 움직인다", "idle");
    else api.status("대기", "idle");
  });
}
