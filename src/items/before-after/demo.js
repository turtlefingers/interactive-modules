import { rng, clamp, localPoint, fitCanvas } from "../../lib/util.js";
import { ILLO, shape, tube, circle, cloud, line } from "../../lib/draw.js";

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

  /* ---------- 그림: 그림 키트 스타일(3px 잉크 외곽선 + 평면 단색)로 그린 풍경 ---------- */
  const before = document.createElement("canvas"), after = document.createElement("canvas"), tmp = document.createElement("canvas");
  const LW = 3;
  const drawScene = (c, w, h) => {
    c.fillStyle = ILLO.paper; c.fillRect(0, 0, w, h);
    const m = Math.min(w, h), rand = rng(3);
    // 해
    circle(c, w * 0.7, h * 0.28, m * 0.075, { fill: ILLO.yellow, lw: LW });
    // 구름
    [[0.18, 0.2, 1], [0.48, 0.14, 0.7], [0.86, 0.22, 0.85]].forEach(([x, y, s]) => cloud(c, w * x, h * y, { w: m * 0.2 * s, color: ILLO.paper, lw: LW }));
    // 능선
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
      }, { fill: color, lw: LW });
    };
    ridge(h * 0.46, h * 0.1, 7, ILLO.lilac);
    ridge(h * 0.53, h * 0.08, 9, ILLO.blue);
    ridge(h * 0.6, h * 0.06, 12, ILLO.green);
    // 호수
    const ly = h * 0.66;
    shape(c, p => p.rect(-10, ly, w + 20, h * 0.12 + 10), { fill: ILLO.blue, lw: LW });
    for (let i = 0; i < 4; i++) {
      const y = ly + 10 + i * h * 0.022, len = m * (0.05 + rand() * 0.08), x = w * 0.7 - len / 2 + (rand() - 0.5) * m * 0.08;
      line(c, [[x, y], [x + len, y]], { lw: LW });
    }
    // 앞 들판
    shape(c, p => p.rect(-10, h * 0.78, w + 20, h * 0.22 + 10), { fill: ILLO.green, lw: LW });
    // 집
    const house = (x, s, roof) => {
      const by = h * 0.86, hw = s, hh = s * 0.8;
      shape(c, p => p.rect(x - hw / 2, by - hh, hw, hh), { fill: ILLO.paper, lw: LW });
      shape(c, p => { p.moveTo(x - hw * 0.62, by - hh); p.lineTo(x, by - hh - s * 0.62); p.lineTo(x + hw * 0.62, by - hh); p.closePath(); }, { fill: roof, lw: LW });
      shape(c, p => p.rect(x - s * 0.1, by - s * 0.38, s * 0.2, s * 0.38), { fill: ILLO.orange, lw: LW });
      shape(c, p => p.rect(x - s * 0.36, by - hh + s * 0.16, s * 0.16, s * 0.16), { fill: ILLO.yellow, lw: LW });
      shape(c, p => p.rect(x + s * 0.2, by - hh + s * 0.16, s * 0.16, s * 0.16), { fill: ILLO.yellow, lw: LW });
    };
    // 나무: 줄기 + 둥근 수관
    const tree = (x, s) => {
      const by = h * 0.87;
      tube(c, [[x, by], [x, by - s * 0.7]], { color: ILLO.orange, w: Math.max(4, s * 0.14), lw: LW });
      circle(c, x, by - s * 0.85, s * 0.42, { fill: ILLO.green, lw: LW });
    };
    const u = m * 0.09;
    tree(w * 0.08, u * 1.1); tree(w * 0.14, u * 0.8);
    house(w * 0.26, u, ILLO.red);
    tree(w * 0.38, u * 0.95);
    house(w * 0.5, u * 1.2, ILLO.orange);
    house(w * 0.64, u * 0.85, ILLO.pink);
    tree(w * 0.76, u * 1.2); tree(w * 0.83, u * 0.85);
    house(w * 0.93, u * 0.9, ILLO.red);
    // 꽃
    for (let i = 0; i < 28; i++) {
      circle(c, rand() * w, h * 0.91 + rand() * h * 0.08, 4 + rand() * 2, { fill: [ILLO.yellow, ILLO.pink, ILLO.paper, ILLO.red][i % 4], lw: LW });
    }
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
