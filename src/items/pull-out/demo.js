import { clamp, lerp, localPoint, fitCanvas } from "../../lib/util.js";
import { ILLO, shape, tube, ellipse, leaf, line } from "../../lib/draw.js";

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .pull-out-root { position: absolute; inset: 0; background: var(--board); }
    .pull-out-root.over { cursor: grab; }
    .pull-out-root.grabbing, .pull-out-root.grabbing * { cursor: grabbing; }
  `);
  const root = document.createElement("div");
  root.className = "pull-out-root";
  el.appendChild(root);
  const { g, size } = fitCanvas(api, { parent: root });

  const INK = ILLO.ink, ACC = "#ff5a36", SOIL = "#e3dccd", LW = 3;
  const KINDS = {
    weed: { root: 46, resist: 0.6, name: "잡초", obj: "잡초를", half: 8 },
    carrot: { root: 78, resist: 1, name: "당근", obj: "당근을", half: 14 },
    radish: { root: 70, resist: 1.45, name: "무", obj: "무를", half: 27 }
  };
  const GRIP = 40;   // 잡는 지점(잎 끝)에서 뿌리 머리까지 거리

  let groundY = 0;
  const objs = ["weed", "carrot", "radish"].map((kind, i) => ({
    kind, i, hx: 0, state: "planted",
    ox: 0, ext: 0, rot: 0, vox: 0, vext: 0, vrot: 0,   // 심겨 있을 때
    x: 0, y: 0, vx: 0, vy: 0, t: 0, rx: 0, ry: 0        // 뽑힌 뒤
  }));
  const layout = () => {
    groundY = Math.round(size.h * 0.64);
    objs.forEach((o, i) => {
      const nx = size.w * (0.26 + i * 0.24);
      if (o.state === "free") { o.x += nx - o.hx; o.y = Math.min(o.y, groundY - KINDS[o.kind].half); }
      o.hx = nx;
    });
  };
  layout();
  api.onResize(layout);

  const need = o => S.threshold * (S.perObject ? KINDS[o.kind].resist : 1);

  /* ---------- 그리기 (그림 키트 스타일: 3px 외곽선 + 평면 단색) ---------- */
  function drawPlant(o, x, y, rot, jit = 0) {
    const k = KINDS[o.kind], L = k.root;
    g.save(); g.translate(x, y); g.rotate(rot + jit);
    // 잎
    if (o.kind === "weed") {
      [-0.55, -0.1, 0.4].forEach((a, j) => {
        const ex = Math.sin(a) * 22, ey = -30 + j * 3;
        tube(g, [[0, 0], [Math.sin(a) * 8, -16], [ex, ey]], { color: ILLO.green, w: 4, lw: LW });
        leaf(g, ex + Math.sin(a) * 6, ey - 6, { size: 18, angle: a - Math.PI / 2, lw: LW });
      });
    } else if (o.kind === "carrot") {
      [-0.45, 0, 0.45].forEach(a => {
        const ex = Math.sin(a) * 26, ey = -Math.cos(a) * 38;
        tube(g, [[0, 0], [ex, ey]], { color: ILLO.green, w: 4, lw: LW });
        leaf(g, ex + Math.sin(a) * 8, ey - Math.cos(a) * 8, { size: 20, angle: a - Math.PI / 2, lw: LW });
      });
    } else {
      [-0.5, 0, 0.5].forEach(a => {
        const ex = Math.sin(a) * 14, ey = -Math.cos(a) * 12;
        leaf(g, ex + Math.sin(a) * 18, ey - Math.cos(a) * 18, { size: 44, angle: a - Math.PI / 2, lw: LW });
      });
    }
    // 뿌리
    if (o.kind === "weed") {
      const pts = [];
      for (let s = 0; s <= L; s += 6) pts.push([Math.sin(s * 0.25) * 3, s]);
      tube(g, pts, { color: ILLO.yellow, w: 4, lw: LW });
      [[10, -1], [22, 1], [32, -1]].forEach(([yy, d]) => tube(g, [[0, yy], [d * 8, yy + 6], [d * 12, yy + 12]], { color: ILLO.yellow, w: 3, lw: LW }));
    } else if (o.kind === "carrot") {
      shape(g, c => { c.moveTo(-13, 0); c.quadraticCurveTo(-12, L * 0.5, 0, L); c.quadraticCurveTo(12, L * 0.5, 13, 0); c.closePath(); }, { fill: ILLO.orange, lw: LW });
      [0.3, 0.55].forEach((s, j) => line(g, [[j % 2 ? 6 : -8, L * s], [j % 2 ? 1 : -3, L * s + 3]], { lw: LW * 0.7 }));
    } else {
      shape(g, c => { c.moveTo(-10, 0); c.bezierCurveTo(-30, 8, -28, L * 0.75, 0, L * 0.85); c.bezierCurveTo(28, L * 0.75, 30, 8, 10, 0); c.closePath(); }, { fill: ILLO.pink, lw: LW });
      tube(g, [[0, L * 0.85], [1, L * 0.98], [-2, L * 1.1]], { color: ILLO.pink, w: 3, lw: LW });
    }
    g.restore();
  }

  /* ---------- 포인터 ---------- */
  const ptr = { x: -999, y: -999, vx: 0, vy: 0, lt: 0, down: false, ax: 0, ay: 0, obj: null, t0: 0 };
  let count = 0;
  const crumbs = [];

  const crownOf = o => o.state === "planted" || o.state === "tug" ? { x: o.hx + o.ox, y: groundY - o.ext } : { x: o.x, y: o.y };
  const pick = p => {
    for (const o of objs) {
      if (o.state === "return") continue;
      const c = crownOf(o);
      if (o.state === "free") {
        const h = KINDS[o.kind].root / 2, mx = c.x - Math.sin(o.rot) * h, my = c.y + Math.cos(o.rot) * h;
        if (Math.hypot(p.x - mx, p.y - my) < 48 || Math.hypot(p.x - c.x, p.y - c.y) < 40) return o;
      }
      else if (Math.abs(p.x - c.x) < 34 && p.y > c.y - 56 && p.y < groundY + 14) return o;
    }
    return null;
  };

  api.on(root, "pointerdown", e => {
    const p = localPoint(root, e);
    const o = pick(p);
    if (!o) return;
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    Object.assign(ptr, { down: true, ax: p.x, ay: p.y, obj: o, t0: performance.now(), x: p.x, y: p.y, vx: 0, vy: 0, lt: performance.now() });
    if (o.state === "free") { o.state = "held"; }
    else o.state = "tug";
    api.hideHint();
  });
  api.on(root, "pointermove", e => {
    const p = localPoint(root, e), now = performance.now();
    const dt = Math.max(8, now - ptr.lt) / 1000;
    ptr.vx = lerp(ptr.vx, (p.x - ptr.x) / dt, 0.4); ptr.vy = lerp(ptr.vy, (p.y - ptr.y) / dt, 0.4);
    ptr.x = p.x; ptr.y = p.y; ptr.lt = now;
    if (!ptr.down) root.classList.toggle("over", !!pick(p));
  });
  const release = () => {
    if (!ptr.down) return;
    ptr.down = false;
    const o = ptr.obj; ptr.obj = null;
    if (!o) return;
    if (o.state === "tug") { o.state = "planted"; api.flash("거리가 모자라 다시 박힌다", "idle"); return; }
    if (o.state === "held") {
      if (S.release === "return") { o.state = "return"; o.t = 0; o.rx = o.x; o.ry = o.y; }
      else {
        o.state = "free";
        const k = S.release === "throw" ? 1 : 0.15;
        o.vx = clamp(ptr.vx * k, -2400, 2400); o.vy = clamp(ptr.vy * k, -2400, 2400);
      }
    }
  };
  api.on(root, "pointerup", release);
  api.on(root, "pointercancel", release);

  /* ---------- 루프 ---------- */
  api.frame((dt) => {
    const s = Math.min(dt, 34) / 1000;
    g.clearRect(0, 0, size.w, size.h);
    let tension = 0, dist = 0;

    // 심겨 있는 것들 (흙보다 먼저 그린다 → 흙이 뿌리를 가린다)
    for (const o of objs) {
      if (o.state === "tug") {
        const dx = ptr.x - ptr.ax, dy = ptr.y - ptr.ay;
        dist = Math.hypot(dx, dy);
        const r = S.resist, tau = clamp(dist / need(o), 0, 1);
        tension = tau;
        const L = KINDS[o.kind].root;
        // 버티는 힘이 셀수록 처음엔 거의 안 움직이다가 끝에서 급하게 따라온다
        const e = L * 0.55 * (1 - r * 0.75) * Math.pow(tau, 1 + r * 2.5) + 2 * tau;
        const tOx = clamp(dx * 0.18 * (1 - r * 0.7), -22, 22), tRot = clamp(dx / 260, -0.35, 0.35) * (1 - r * 0.5);
        o.ext = lerp(o.ext, e, 0.4); o.ox = lerp(o.ox, tOx, 0.4); o.rot = lerp(o.rot, tRot, 0.4);
        o.vext = o.vox = o.vrot = 0;
        if (dist >= need(o)) {
          // 뽑혔다
          o.state = "held"; count++;
          const c = crownOf(o);
          o.x = c.x; o.y = c.y; o.vx = 0; o.vy = -300;
          for (let i = 0; i < 8; i++) crumbs.push({ x: o.hx + (Math.random() - 0.5) * 30, y: groundY - 2, vx: (Math.random() - 0.5) * 220, vy: -120 - Math.random() * 200, life: 0 });
          api.flash(`뽑혔다 · ${KINDS[o.kind].name} ${Math.round(need(o))}px`, "ok");
        }
      } else if (o.state === "planted") {
        // 놓으면 스프링처럼 제자리로 돌아가며 흔들린다
        o.vext += -o.ext * 0.3; o.vext *= 0.7; o.ext += o.vext;
        o.vox += -o.ox * 0.25; o.vox *= 0.78; o.ox += o.vox;
        o.vrot += -o.rot * 0.25; o.vrot *= 0.8; o.rot += o.vrot;
        if (o.ext < 0) { o.ext = 0; o.vext = 0; }
      }
      if (o.state === "planted" || o.state === "tug") {
        const tau = o.state === "tug" ? tension : 0;
        const amp = o.state === "tug" ? S.tremble * (0.6 + 5 * tau) : 0;
        const jx = (Math.random() - 0.5) * amp, jr = (Math.random() - 0.5) * amp * 0.012;
        drawPlant(o, o.hx + o.ox + jx, groundY - o.ext, o.rot, jr);
      }
    }

    // 흙
    g.fillStyle = SOIL; g.fillRect(0, groundY, size.w, size.h - groundY);
    g.strokeStyle = INK; g.lineWidth = LW; g.beginPath(); g.moveTo(0, groundY); g.lineTo(size.w, groundY); g.stroke();
    // 뽑힌 자리 구멍
    for (const o of objs) {
      if (o.state === "planted" || o.state === "tug") continue;
      ellipse(g, o.hx, groundY + 2, 16, 5, { fill: ILLO.grey, lw: LW });
    }

    // 뽑힌 것들
    for (const o of objs) {
      if (o.state === "held") {
        const tx = ptr.x, ty = ptr.y + GRIP;
        const px = o.x;
        o.x = lerp(o.x, tx, 0.35); o.y = lerp(o.y, ty, 0.35);
        const vx = (o.x - px) / Math.max(0.001, s);
        o.rot = lerp(o.rot, clamp(-vx * 0.0009, -0.8, 0.8), 0.15);
        drawPlant(o, o.x, o.y, o.rot);
      } else if (o.state === "return") {
        o.t = Math.min(1, o.t + s * 1.8);
        const e = 1 - Math.pow(1 - o.t, 3);
        o.x = lerp(o.rx, o.hx, e); o.y = lerp(o.ry, groundY, e) - Math.sin(e * Math.PI) * 60; o.rot = lerp(o.rot, 0, 0.2);
        if (o.t >= 1) { o.state = "planted"; o.ext = 0; o.ox = 0; o.vext = 3; o.vrot = 0.08; }
        else drawPlant(o, o.x, o.y, o.rot);
      } else if (o.state === "free") {
        const floor = groundY - KINDS[o.kind].half;
        o.vy += 1800 * s; o.x += o.vx * s; o.y += o.vy * s;
        if (o.x < 20) { o.x = 20; o.vx = Math.abs(o.vx) * 0.5; }
        if (o.x > size.w - 20) { o.x = size.w - 20; o.vx = -Math.abs(o.vx) * 0.5; }
        if (o.y < 20) { o.y = 20; o.vy = Math.abs(o.vy) * 0.4; }
        if (o.y >= floor) {
          o.y = floor;
          if (o.vy > 240) o.vy *= -0.35; else o.vy = 0;
          o.vx *= 0.8;
          // 바닥에 닿으면 옆으로 눕는다
          const side = o.rot >= 0 ? 1 : -1;
          o.rot = lerp(o.rot, side * Math.PI / 2, 0.2);
        } else o.rot += o.vx * 0.0006 * s * 60;
        drawPlant(o, o.x, o.y, o.rot);
      }
    }

    // 흙 부스러기
    g.fillStyle = INK;
    for (let i = crumbs.length - 1; i >= 0; i--) {
      const c = crumbs[i];
      c.life += s; c.vy += 1400 * s; c.x += c.vx * s; c.y += c.vy * s;
      if (c.y > groundY + 4 || c.life > 1.5) { crumbs.splice(i, 1); continue; }
      g.fillRect(c.x - 1.5, c.y - 1.5, 3, 3);
    }

    // 당기는 힘 표시: 뽑히는 경계 원 + 고무줄
    const o = ptr.obj;
    if (o && o.state === "tug") {
      const R = need(o);
      g.setLineDash([4, 6]); g.strokeStyle = "rgba(27,27,26,.35)"; g.lineWidth = 1.2;
      g.beginPath(); g.arc(ptr.ax, ptr.ay, R, 0, 7); g.stroke(); g.setLineDash([]);
      const c = crownOf(o);
      g.strokeStyle = tension > 0.75 ? ACC : INK; g.lineWidth = 1 + tension * 1.5;
      g.beginPath(); g.moveTo(c.x, c.y - GRIP * 0.8); g.lineTo(ptr.x, ptr.y); g.stroke();
      g.strokeStyle = ACC; g.lineWidth = 2.5; g.lineCap = "round";
      g.beginPath(); g.arc(ptr.x, ptr.y, 14, -Math.PI / 2, -Math.PI / 2 + tension * Math.PI * 2); g.stroke();
      g.strokeStyle = "rgba(27,27,26,.15)"; g.lineWidth = 2.5;
      g.beginPath(); g.arc(ptr.x, ptr.y, 14, -Math.PI / 2 + tension * Math.PI * 2, Math.PI * 1.5); g.stroke();
    }

    root.classList.toggle("grabbing", ptr.down);
    if (ptr.down) root.classList.remove("over");

    const heldObj = objs.find(q => q.state === "held");
    api.read("dist", Math.round(o && o.state === "tug" ? dist : 0) + "px");
    api.read("tension", Math.round(tension * 100) + "%");
    api.read("need", o ? Math.round(need(o)) + "px" : "–");
    api.read("count", count);

    if (o && o.state === "tug") api.status(`버티는 중 · ${Math.round(dist)} / ${Math.round(need(o))}px`, "active");
    else if (heldObj) api.status(`${KINDS[heldObj.kind].obj} 쥐고 있음 · 놓으면 ${{ drop: "떨어짐", return: "제자리로", throw: "던져짐" }[S.release]}`, "ok");
    else if (objs.some(q => q.state === "free" && Math.abs(q.vy) > 1) || objs.some(q => q.state === "return")) api.status("움직이는 중", "alt");
    else api.status("대기", "idle");
  });
}
