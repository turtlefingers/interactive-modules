/* ============================================================
   장면 · 구성 요소 — 집, 언덕, 산, 연못, 해, 풀, 울타리, 행성, 드럼, 카드, 당구대,
   노브, 조이스틱, 커서, 스티커 시트, 놀람 표시.
   규칙: 덩어리는 외곽선 없는 톤 면. 가는 잉크 선(LINE)은 구조에만. 색은 o.color 하나,
   o.accent는 상태(state>0)에서만. (x, y)는 아래 가운데, 크기는 h에 비례.
   ============================================================ */
import { registerObject } from "../objects.js";
import { ILLO, TONE, LINE, shape, circle, ellipse, roundRect, line, curve, dot } from "../draw.js";

const TAU = Math.PI * 2;
const G = "장면 · 구성 요소";
const st = o => Math.max(0, Math.min(1, o.state || 0));
const lit = (o, base) => (st(o) > 0.02 ? o.accent : base);

/* ---------- 집 ---------- */
registerObject("house", {
  label: "집", group: G, demos: [], height: 84, color: ILLO.orange,
  variants: {
    A: {
      label: "낮은 박공 · 마루가 한쪽으로 치우친 볼륨",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const w = h * 1.15, bh = h * 0.5, rh = h * 0.3;
        // 몸통
        shape(g, c => c.rect(-w / 2, -bh, w, bh), { fill: TONE[2] });
        // 지붕: 낮고 비대칭, 처마가 살짝 나온 판
        shape(g, c => { c.moveTo(-w / 2 - h * 0.06, -bh); c.lineTo(-w * 0.12, -bh - rh); c.lineTo(w / 2 + h * 0.06, -bh + h * 0.02); c.closePath(); }, { fill: TONE[4] });
        // 처마 아래 그늘 한 줄(구조선)
        line(g, [[-w / 2 - h * 0.06, -bh + 0.5], [w / 2 + h * 0.06, -bh + h * 0.02 + 0.5]]);
        // 굴뚝 (가는 선 두 개)
        line(g, [[w * 0.22, -bh - rh * 0.55], [w * 0.22, -bh - rh * 0.95]]);
        line(g, [[w * 0.3, -bh - rh * 0.45], [w * 0.3, -bh - rh * 0.95], [w * 0.22, -bh - rh * 0.95]]);
        // 창 하나
        shape(g, c => c.rect(w * 0.1, -bh * 0.72, h * 0.14, h * 0.16), { fill: lit(o, o.color) });
        // 문: 어두운 톤 슬롯
        shape(g, c => c.rect(-w * 0.32, -bh * 0.6, h * 0.13, bh * 0.6), { fill: TONE[4] });
        g.restore();
      }
    },
    B: {
      label: "평지붕 2단 · 위층이 한쪽으로 물러난 상자",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const w = h * 1.3;
        shape(g, c => c.rect(-w / 2, -h * 0.42, w, h * 0.42), { fill: TONE[2] });
        shape(g, c => c.rect(-w / 2 + h * 0.08, -h * 0.82, w * 0.55, h * 0.4), { fill: TONE[3] });
        // 옥상 난간, 위층 지붕 슬래브 (구조선)
        line(g, [[-w / 2 + h * 0.08 - h * 0.04, -h * 0.82], [-w / 2 + h * 0.08 + w * 0.55 + h * 0.04, -h * 0.82]], { lw: LINE + 0.5 });
        line(g, [[w * 0.12, -h * 0.42], [w / 2 + h * 0.03, -h * 0.42]], { lw: LINE + 0.5 });
        line(g, [[w * 0.2, -h * 0.42], [w * 0.2, -h * 0.5]]);
        line(g, [[w * 0.36, -h * 0.42], [w * 0.36, -h * 0.5]]);
        line(g, [[w * 0.14, -h * 0.5], [w * 0.44, -h * 0.5]]);
        // 창 하나 (아래층 오른쪽)
        shape(g, c => c.rect(w * 0.16, -h * 0.32, h * 0.2, h * 0.14), { fill: lit(o, o.color) });
        // 위층 작은 창은 어두운 톤
        shape(g, c => c.rect(-w * 0.3, -h * 0.7, h * 0.08, h * 0.12), { fill: TONE[5] });
        g.restore();
      }
    },
    C: {
      label: "외쪽지붕 헛간 · 길고 낮게, 문이 톤 슬롯",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const w = h * 1.6, hl = h * 0.36, hr = h * 0.62;
        shape(g, c => { c.moveTo(-w / 2, 0); c.lineTo(-w / 2, -hl); c.lineTo(w / 2, -hr); c.lineTo(w / 2, 0); c.closePath(); }, { fill: TONE[3] });
        // 지붕 판: 조금 더 어두운 띠, 양쪽으로 살짝 튀어나옴
        shape(g, c => { c.moveTo(-w / 2 - h * 0.05, -hl + h * 0.005); c.lineTo(w / 2 + h * 0.05, -hr - h * 0.02); c.lineTo(w / 2 + h * 0.05, -hr + h * 0.05); c.lineTo(-w / 2 - h * 0.05, -hl + h * 0.07); c.closePath(); }, { fill: TONE[5] });
        // 문 슬롯 + 창 하나
        shape(g, c => c.rect(-w * 0.12, -h * 0.28, h * 0.14, h * 0.28), { fill: TONE[5] });
        shape(g, c => c.rect(w * 0.2, -h * 0.4, h * 0.12, h * 0.1), { fill: lit(o, o.color) });
        // 벽 널 구조선 두 줄
        line(g, [[-w * 0.38, -h * 0.05], [-w * 0.38, -h * 0.3]]);
        line(g, [[w * 0.05, -h * 0.05], [w * 0.05, -h * 0.34]]);
        g.restore();
      }
    }
  }
});

/* ---------- 언덕 3층 ---------- */
registerObject("hill-set", {
  label: "언덕 세 겹", group: G, demos: ["before-after", "rub-window", "double-tap"], height: 60, color: ILLO.green,
  variants: {
    A: {
      label: "둥근 타원 세 개 · 중심이 어긋남",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const w = h * 3;
        ellipse(g, -w * 0.18, h * 0.15, w * 0.42, h * 1.1, { fill: TONE[1] });
        ellipse(g, w * 0.22, h * 0.25, w * 0.4, h * 0.9, { fill: TONE[2] });
        ellipse(g, -w * 0.05, h * 0.4, w * 0.5, h * 0.75, { fill: TONE[3] });
        g.fillStyle = TONE[3]; g.fillRect(-w / 2, 0, w, h * 0.02);
        g.restore();
      }
    },
    B: {
      label: "완만한 곡선 능선 · 뒤로 갈수록 밝게",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const w = h * 3;
        const plane = (pts, fill) => shape(g, c => { c.moveTo(-w / 2, 0); c.lineTo(-w / 2, pts[0][1]); for (let i = 0; i + 1 < pts.length; i += 1) c.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); c.lineTo(w / 2, pts[pts.length - 1][1]); c.lineTo(w / 2, 0); c.closePath(); }, { fill });
        plane([[-w * 0.4, -h * 0.5], [-w * 0.1, -h * 1.05], [w * 0.2, -h * 0.7], [w * 0.5, -h * 0.9]], TONE[1]);
        plane([[-w * 0.5, -h * 0.35], [-w * 0.25, -h * 0.75], [w * 0.05, -h * 0.4], [w * 0.4, -h * 0.65], [w * 0.5, -h * 0.5]], TONE[2]);
        plane([[-w * 0.5, -h * 0.2], [-w * 0.15, -h * 0.3], [w * 0.15, -h * 0.5], [w * 0.5, -h * 0.25]], TONE[3]);
        g.restore();
      }
    },
    C: {
      label: "봉우리 언덕 · 앞 언덕에 오솔길 선 하나",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const w = h * 3;
        shape(g, c => { c.moveTo(-w / 2, 0); c.lineTo(-w / 2, -h * 0.4); c.bezierCurveTo(-w * 0.35, -h * 1.15, -w * 0.1, -h * 1.15, w * 0.05, -h * 0.55); c.lineTo(w * 0.5, -h * 0.3); c.lineTo(w / 2, 0); c.closePath(); }, { fill: TONE[1] });
        shape(g, c => { c.moveTo(-w / 2, 0); c.lineTo(-w * 0.1, -h * 0.35); c.bezierCurveTo(w * 0.05, -h * 0.95, w * 0.35, -h * 0.9, w * 0.5, -h * 0.45); c.lineTo(w / 2, 0); c.closePath(); }, { fill: TONE[2] });
        shape(g, c => { c.moveTo(-w / 2, 0); c.lineTo(-w / 2, -h * 0.12); c.bezierCurveTo(-w * 0.3, -h * 0.62, -w * 0.05, -h * 0.55, w * 0.2, -h * 0.18); c.lineTo(w / 2, 0); c.closePath(); }, { fill: TONE[3] });
        curve(g, [-w * 0.05, 0, -w * 0.12, -h * 0.25, -w * 0.28, -h * 0.35], { lw: LINE, stroke: TONE[5] });
        g.restore();
      }
    }
  }
});

/* ---------- 산 능선 ---------- */
registerObject("mountain-range", {
  label: "산 능선", group: G, demos: ["mouse-parallax", "before-after"], height: 60, color: ILLO.blue,
  variants: {
    A: {
      label: "두 겹 꺾인 능선 · 뒤 밝고 앞 어둡게",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const w = h * 3.2;
        const ridge = (pts, fill) => shape(g, c => { c.moveTo(-w / 2, 0); pts.forEach(p => c.lineTo(p[0] * w, -p[1] * h)); c.lineTo(w / 2, 0); c.closePath(); }, { fill });
        ridge([[-0.5, 0.3], [-0.3, 1.3], [-0.12, 0.75], [0.08, 1.05], [0.28, 0.6], [0.5, 0.85]], TONE[2]);
        ridge([[-0.5, 0.2], [-0.42, 0.45], [-0.22, 0.32], [0.02, 0.7], [0.2, 0.42], [0.4, 0.55], [0.5, 0.3]], TONE[4]);
        g.restore();
      }
    },
    B: {
      label: "큰 산 하나 + 옆에 작은 산 · 능선에 구조선",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const w = h * 3.2;
        shape(g, c => { c.moveTo(w * 0.05, 0); c.lineTo(w * 0.28, -h * 0.65); c.lineTo(w * 0.36, -h * 0.55); c.lineTo(w * 0.5, 0); c.closePath(); }, { fill: TONE[2] });
        shape(g, c => { c.moveTo(-w / 2, 0); c.lineTo(-w * 0.32, -h * 0.8); c.lineTo(-w * 0.15, -h * 1.35); c.lineTo(-w * 0.02, -h * 1.05); c.lineTo(w * 0.3, 0); c.closePath(); }, { fill: TONE[3] });
        // 능선 한 줄: 봉우리에서 아래로 흘러내리는 구조선
        line(g, [[-w * 0.15, -h * 1.35], [-w * 0.1, -h * 0.95], [-w * 0.04, -h * 0.55]], { lw: LINE, stroke: TONE[5] });
        g.restore();
      }
    },
    C: {
      label: "안개 세 겹 · 톤이 단계로 짙어짐",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const w = h * 3.2;
        const layer = (pts, fill) => shape(g, c => { c.moveTo(-w / 2, 0); c.lineTo(-w / 2, -pts[0] * h); for (let i = 1; i < pts.length; i++) { const x0 = -w / 2 + (w * (i - 1)) / (pts.length - 1), x1 = -w / 2 + (w * i) / (pts.length - 1); c.quadraticCurveTo((x0 + x1) / 2, -Math.max(pts[i - 1], pts[i]) * h * 1.02, x1, -pts[i] * h); } c.lineTo(w / 2, 0); c.closePath(); }, { fill });
        layer([0.7, 1.25, 0.8, 1.1, 0.95, 0.6], TONE[1]);
        layer([0.35, 0.55, 0.9, 0.5, 0.7, 0.45], TONE[2]);
        layer([0.15, 0.4, 0.25, 0.45, 0.3, 0.2], TONE[3]);
        g.restore();
      }
    }
  }
});

/* ---------- 연못 ---------- */
registerObject("pond", {
  label: "연못", group: G, demos: [], height: 84, color: ILLO.blue,
  variants: {
    A: {
      label: "타원 연못 · 파문 한 줄",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const rx = h * 0.7, ry = h * 0.2, s = st(o);
        ellipse(g, h * 0.04, -ry * 0.1, rx, ry, { fill: TONE[4] });
        const r = 0.35 + s * 0.5;
        shape(g, c => c.ellipse(-rx * 0.15, -ry * 0.15, rx * r, ry * r, 0, Math.PI * 1.1, Math.PI * 1.9), { fill: null, lw: LINE, stroke: TONE[1] });
        g.restore();
      }
    },
    B: {
      label: "불규칙 윤곽 · 물가에 돌 하나, 파문 두 줄",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const w = h * 1.5, d = h * 0.42, s = st(o);
        shape(g, c => { c.moveTo(-w * 0.45, -d * 0.35); c.bezierCurveTo(-w * 0.3, -d * 0.95, w * 0.1, -d * 1.0, w * 0.35, -d * 0.6); c.bezierCurveTo(w * 0.55, -d * 0.3, w * 0.3, d * 0.05, 0, 0); c.bezierCurveTo(-w * 0.3, -d * 0.02, -w * 0.55, -d * 0.1, -w * 0.45, -d * 0.35); c.closePath(); }, { fill: TONE[4] });
        ellipse(g, w * 0.3, -d * 0.55, h * 0.07, h * 0.04, { fill: TONE[5] });
        const cx = -w * 0.05, cy = -d * 0.5;
        [0.28, 0.5].forEach((k, i) => { const r = k + s * 0.35; shape(g, c => c.ellipse(cx, cy, w * 0.3 * r, d * 0.3 * r, 0, Math.PI * (1.15 + i * 0.1), Math.PI * (1.85 - i * 0.05)), { fill: null, lw: LINE, stroke: TONE[1] }); });
        g.restore();
      }
    },
    C: {
      label: "좁고 긴 물 · 갈대 잉크 선 세 가닥",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const rx = h * 0.85, ry = h * 0.12, s = st(o);
        ellipse(g, -h * 0.05, -ry * 0.2, rx, ry, { fill: TONE[4] });
        shape(g, c => c.ellipse(h * 0.15, -ry * 0.25, rx * (0.3 + s * 0.4), ry * (0.3 + s * 0.4), 0, Math.PI, TAU * 0.9), { fill: null, lw: LINE, stroke: TONE[1] });
        const sway = Math.sin((o.t || 0) * 1.4) * h * 0.02;
        line(g, [[-rx * 0.75, -ry * 0.3], [-rx * 0.72 + sway, -h * 0.5]]);
        line(g, [[-rx * 0.66, -ry * 0.1], [-rx * 0.6 + sway * 1.3, -h * 0.4]]);
        line(g, [[-rx * 0.85, -ry * 0.2], [-rx * 0.88 + sway * 0.8, -h * 0.33]]);
        ellipse(g, -rx * 0.72 + sway, -h * 0.5, h * 0.018, h * 0.06, { fill: ILLO.ink });
        g.restore();
      }
    }
  }
});

/* ---------- 해 ---------- */
registerObject("sun-disc", {
  label: "해", group: G, demos: ["before-after", "mouse-parallax"], height: 84, color: ILLO.yellow,
  variants: {
    A: {
      label: "민무늬 원판 · 지평선 위에 떠 있음",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const r = h * 0.2, s = st(o);
        circle(g, h * 0.08, -h * (0.55 + s * 0.3), r, { fill: o.color });
        g.restore();
      }
    },
    B: {
      label: "원판 + 지평 글로우 한 줄",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const r = h * 0.18, s = st(o), cy = -h * (0.5 + s * 0.3);
        circle(g, -h * 0.05, cy, r, { fill: o.color });
        g.save(); g.globalAlpha = 0.55;
        line(g, [[-h * 0.7, -h * 0.02], [h * 0.55, -h * 0.02]], { lw: LINE, stroke: o.color });
        g.restore();
        g.restore();
      }
    },
    C: {
      label: "낮은 해 반원 · 지평선에 잘림",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const r = h * 0.26, s = st(o), cy = -h * 0.02 - s * h * 0.5;
        // 지평선 아래는 땅이 가린다는 전제로 반원만 그린다
        shape(g, c => { c.arc(h * 0.06, cy, r, Math.PI, TAU); c.closePath(); }, { fill: o.color });
        g.fillStyle = TONE[2]; g.fillRect(h * 0.06 - r - 1, 0, r * 2 + 2, h * 0.02);
        g.restore();
      }
    }
  }
});

/* ---------- 풀잎 ---------- */
registerObject("grass-blades", {
  label: "풀잎", group: G, demos: ["mouse-parallax"], height: 84, color: ILLO.green,
  variants: {
    A: {
      label: "가는 잉크 선 다섯 가닥 · 바람에 흔들림",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const t = o.t || 0;
        [[-0.28, 0.42, -0.3], [-0.14, 0.3, 0.1], [0.02, 0.5, 0.25], [0.15, 0.26, -0.15], [0.3, 0.38, 0.35]].forEach(([px, len, bend], i) => {
          const sw = Math.sin(t * 1.6 + i) * 0.06 + bend * 0.5;
          curve(g, [px * h, 0, px * h + sw * h * 0.5, -len * h * 0.55, px * h + sw * h, -len * h], { lw: LINE });
        });
        g.restore();
      }
    },
    B: {
      label: "색 실루엣 잎 · 끝이 뾰족한 면",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const t = o.t || 0;
        [[-0.26, 0.36, -0.12], [-0.1, 0.5, 0.05], [0.05, 0.3, 0.18], [0.2, 0.44, -0.06], [0.33, 0.24, 0.14]].forEach(([px, len, bend], i) => {
          const sw = Math.sin(t * 1.4 + i * 1.3) * 0.04 + bend;
          const bx = px * h, w = h * 0.05;
          shape(g, c => { c.moveTo(bx - w, 0); c.quadraticCurveTo(bx + sw * h * 0.6, -len * h * 0.6, bx + sw * h, -len * h); c.quadraticCurveTo(bx + sw * h * 0.4 + w, -len * h * 0.5, bx + w, 0); c.closePath(); }, { fill: o.color });
        });
        g.restore();
      }
    },
    C: {
      label: "잉크 선 + 잎 두 장 · 씨앗 머리 하나",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const t = o.t || 0, sw = Math.sin(t * 1.5) * h * 0.03;
        curve(g, [-h * 0.22, 0, -h * 0.2, -h * 0.3, -h * 0.12 + sw, -h * 0.55], { lw: LINE });
        curve(g, [h * 0.1, 0, h * 0.14, -h * 0.25, h * 0.26 + sw, -h * 0.4], { lw: LINE });
        curve(g, [h * 0.28, 0, h * 0.24, -h * 0.15, h * 0.3 + sw * 0.5, -h * 0.28], { lw: LINE });
        ellipse(g, -h * 0.12 + sw, -h * 0.58, h * 0.02, h * 0.06, { fill: ILLO.ink }, 0.15);
        ellipse(g, -h * 0.02, -h * 0.16, h * 0.13, h * 0.045, { fill: o.color }, -0.75);
        ellipse(g, h * 0.18, -h * 0.13, h * 0.11, h * 0.04, { fill: o.color }, 0.6);
        g.restore();
      }
    }
  }
});

/* ---------- 울타리 ---------- */
registerObject("fence", {
  label: "울타리", group: G, demos: [], height: 84, color: ILLO.orange,
  variants: {
    A: {
      label: "가는 선 기둥 넷 + 가로 두 줄 · 간격이 고르지 않음",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const xs = [-0.6, -0.22, 0.12, 0.55].map(k => k * h);
        xs.forEach((px, i) => line(g, [[px, 0], [px, -h * (0.34 + (i % 2) * 0.03)]], { lw: LINE + 0.5 }));
        line(g, [[xs[0] - h * 0.05, -h * 0.28], [xs[3] + h * 0.06, -h * 0.26]]);
        line(g, [[xs[0] - h * 0.05, -h * 0.14], [xs[3] + h * 0.06, -h * 0.15]]);
        g.restore();
      }
    },
    B: {
      label: "말뚝 톤 면 + 잉크 가로대 한 줄",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const posts = [-0.58, -0.4, -0.2, -0.02, 0.18, 0.36, 0.56];
        posts.forEach((k, i) => { const ph = h * (0.3 + ((i * 7) % 3) * 0.02), pw = h * 0.055; shape(g, c => c.rect(k * h - pw / 2, -ph, pw, ph), { fill: TONE[4] }); });
        line(g, [[-h * 0.64, -h * 0.2], [h * 0.62, -h * 0.22]]);
        g.restore();
      }
    },
    C: {
      label: "밧줄 울타리 · 기둥 셋, 늘어진 곡선",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const xs = [-0.62, -0.05, 0.6].map(k => k * h);
        xs.forEach((px, i) => shape(g, c => c.rect(px - h * 0.03, -h * (0.36 - i * 0.015), h * 0.06, h * (0.36 - i * 0.015)), { fill: TONE[4] }));
        for (let i = 0; i + 1 < xs.length; i++) {
          const a = xs[i], b = xs[i + 1], top = -h * (0.3 - i * 0.015);
          curve(g, [a, top, (a + b) / 2, top + h * 0.09, b, top - h * 0.01]);
          curve(g, [a, top + h * 0.12, (a + b) / 2, top + h * 0.2, b, top + h * 0.11]);
        }
        g.restore();
      }
    }
  }
});

/* ---------- 행성 ---------- */
const PLANET_TONES = [TONE[1], TONE[3], TONE[4], TONE[5]];
const planetTone = o => PLANET_TONES[Math.min(3, Math.round(st(o) * 3))];
registerObject("planet", {
  label: "행성 (state로 4종 톤 선택)", group: G, demos: ["tabs-accordion"], height: 84, color: ILLO.lilac,
  variants: {
    A: {
      label: "민무늬 원판 · 한쪽에 그늘 없이 톤만",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        circle(g, h * 0.03, -h * 0.55, h * 0.3, { fill: planetTone(o) });
        g.restore();
      }
    },
    B: {
      label: "고리 행성 · 기운 얇은 고리",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const cx = 0, cy = -h * 0.55, r = h * 0.26, tone = planetTone(o), rot = -0.35;
        // 고리 뒤쪽 절반
        shape(g, c => c.ellipse(cx, cy, r * 1.9, r * 0.5, rot, Math.PI, TAU), { fill: null, lw: LINE + 1.5, stroke: TONE[2] });
        circle(g, cx, cy, r, { fill: tone });
        shape(g, c => c.ellipse(cx, cy, r * 1.9, r * 0.5, rot, 0, Math.PI), { fill: null, lw: LINE + 1.5, stroke: TONE[2] });
        shape(g, c => c.ellipse(cx, cy, r * 1.9, r * 0.5, rot, 0, Math.PI), { fill: null, lw: LINE * 0.6, stroke: ILLO.ink });
        g.restore();
      }
    },
    C: {
      label: "분화구 행성 · 어두운 톤 점 셋",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const cx = -h * 0.02, cy = -h * 0.55, r = h * 0.3, tone = planetTone(o);
        circle(g, cx, cy, r, { fill: tone });
        const dark = tone === TONE[5] ? TONE[3] : TONE[5];
        g.save(); g.globalAlpha = 0.55;
        ellipse(g, cx - r * 0.35, cy - r * 0.25, r * 0.2, r * 0.16, { fill: dark });
        ellipse(g, cx + r * 0.3, cy + r * 0.1, r * 0.12, r * 0.1, { fill: dark });
        ellipse(g, cx - r * 0.05, cy + r * 0.5, r * 0.09, r * 0.07, { fill: dark });
        g.restore();
        g.restore();
      }
    }
  }
});

/* ---------- 드럼 (스텝 시퀀서 무대) ---------- */
/* 킥 드럼 부품. 통(셸) TONE[4], 후프(림) TONE[5], 헤드 TONE[1], 벤트홀은 종이색.
   러그(텐션 로드)는 후프 바깥의 잉크 틱, 스퍼(다리)·페달·비터는 가는 잉크 선. 울리면(state) 헤드에 강조 링 + 살짝 커진다. */
const PI = Math.PI;
/** 후프 + 헤드를 (cx, cy)에 그린다. 앞에서 본 타원(rx, ry). tilt는 기울기 */
function kickHead(g, cx, cy, rx, ry, o, { vent = true, lugs = 8, tilt = 0, ventAt = [0.5, 0.3] } = {}) {
  const s = st(o), k = 1 + s * 0.03;
  g.save(); g.translate(cx, cy); g.rotate(tilt);
  shape(g, c => c.ellipse(0, 0, rx, ry, 0, 0, TAU), { fill: TONE[5] });
  shape(g, c => c.ellipse(0, 0, rx * 0.87 * k, ry * 0.87 * k, 0, 0, TAU), { fill: TONE[1] });
  if (vent) shape(g, c => c.ellipse(rx * ventAt[0], ry * ventAt[1], rx * 0.085, ry * 0.085, 0, 0, TAU), { fill: ILLO.paper });
  for (let i = 0; i < lugs; i++) {
    const a = -PI / 2 + ((i + 0.5) / lugs) * TAU, ca = Math.cos(a), sa = Math.sin(a);
    line(g, [[ca * rx * 0.99, sa * ry * 0.99], [ca * rx * 1.1, sa * ry * 1.1]], { lw: LINE });
  }
  if (s > 0.02) {
    g.save(); g.globalAlpha = 0.95 - s * 0.6;
    shape(g, c => c.ellipse(0, 0, rx * (0.42 + s * 0.42), ry * (0.42 + s * 0.42), 0, 0, TAU), { fill: null, lw: LINE * (1 + s * 0.6), stroke: o.accent });
    g.restore();
  }
  g.restore();
}
/** 러그 케이싱: 셸 위의 작은 어두운 톤 덩어리 (가로 = 통 축 방향) */
const lug = (g, x, y, len, thick) => shape(g, c => c.roundRect(x - len / 2, y - thick / 2, len, thick, thick * 0.4), { fill: TONE[5] });
/** 3/4 로 본 통: 뒤 후프(왼쪽)와 앞 후프(오른쪽) 사이의 셸 면. 후프마다 러그 케이싱 세 개 + 실루엣 밖으로 나온 틱 */
function kickShell34(g, cx, cy, rx, ry, depth) {
  shape(g, c => c.ellipse(cx - depth, cy, rx, ry, 0, 0, TAU), { fill: TONE[5] });
  shape(g, c => { c.moveTo(cx - depth, cy - ry); c.lineTo(cx, cy - ry); c.ellipse(cx, cy, rx, ry, 0, -PI / 2, PI / 2); c.lineTo(cx - depth, cy + ry); c.ellipse(cx - depth, cy, rx, ry, 0, PI / 2, PI * 1.5); c.closePath(); }, { fill: TONE[4] });
  const len = depth * 0.16, thick = ry * 0.09;
  for (const dx of [depth * 0.14, depth * 0.86]) {
    const x0 = cx - dx;
    for (const a of [PI * 0.74, PI, PI * 1.26]) lug(g, x0 + Math.cos(a) * rx * 0.96, cy + Math.sin(a) * ry * 0.96, len, thick);
    line(g, [[x0, cy - ry], [x0, cy - ry - ry * 0.08]], { lw: LINE }); line(g, [[x0, cy + ry], [x0, cy + ry + ry * 0.08]], { lw: LINE });
  }
}
/** 스퍼(다리): 가는 선 + 발끝 틱 */
const spur = (g, x0, y0, x1, y1) => { line(g, [[x0, y0], [x1, y1]], { lw: LINE + 0.3 }); line(g, [[x1 - 3, y1], [x1 + 3, y1]], { lw: LINE }); };
/** 페달 + 비터 (옆에서). 헤드 면은 x = hx, 통 중심 높이 cy, 반지름 r. beat 0~1 이면 비터가 헤드에 닿는다. dir 은 헤드에서 연주자 쪽으로 가는 방향 */
function pedal(g, hx, cy, r, h, beat, dir = -1) {
  const bl = r * 0.8, ang = 0.1 + beat * 0.42, br = h * 0.05;
  const postX = hx + dir * (Math.sin(0.52) * bl + br * 0.9), pivotY = cy + r * 0.55;
  const heelX = postX + dir * h * 0.36;
  line(g, [[heelX, 0], [postX + dir * h * 0.03, -h * 0.075]], { lw: LINE + 0.5 });                // 발판
  line(g, [[heelX - dir * h * 0.05, 0], [heelX - dir * h * 0.05, -h * 0.05]], { lw: LINE });      // 발판 힌지
  line(g, [[postX, 0], [postX, pivotY]], { lw: LINE + 0.5 });                                       // 기둥
  line(g, [[postX - h * 0.06, 0], [postX + h * 0.06, 0]], { lw: LINE });                            // 받침
  const bx = postX - dir * Math.sin(ang) * bl, by = pivotY - Math.cos(ang) * bl;
  line(g, [[postX, pivotY], [bx, by]], { lw: LINE });                                               // 비터 로드
  circle(g, bx, by, br, { fill: TONE[3] });                                                          // 비터 헤드(펠트)
}

registerObject("drum-kick", {
  label: "킥 드럼 (state = 울림)", group: G, demos: ["step-sequencer"], height: 84, color: ILLO.red,
  variants: {
    A: {
      label: "정면 · 후프 링 + 밝은 헤드, 벤트홀, 러그 틱 8개, 스퍼 두 줄",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const r = h * 0.36, cy = -r - h * 0.07;
        shape(g, c => c.ellipse(-r * 0.08, cy + r * 0.02, r, r, 0, 0, TAU), { fill: TONE[4] });     // 뒤로 살짝 보이는 셸
        spur(g, -r * 0.62, cy + r * 0.72, -r * 0.92, 0); spur(g, r * 0.66, cy + r * 0.7, r * 0.98, 0);
        kickHead(g, 0, cy, r, r, o, { lugs: 8, ventAt: [0.52, 0.34] });
        g.restore();
      }
    },
    B: {
      label: "3/4 · 뒤 후프와 셸 옆면이 보임, 셸 위 러그 틱, 앞 헤드",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const rx = h * 0.29, ry = h * 0.34, depth = h * 0.3, cy = -ry - h * 0.07, cx = h * 0.12;
        kickShell34(g, cx, cy, rx, ry, depth);
        spur(g, cx - depth * 0.45, cy + ry * 0.9, cx - depth * 0.45 - rx * 0.45, 0);
        spur(g, cx + rx * 0.6, cy + ry * 0.78, cx + rx * 0.9, 0);
        kickHead(g, cx, cy, rx, ry, o, { lugs: 8, ventAt: [0.45, 0.35] });
        g.restore();
      }
    },
    C: {
      label: "옆면 · 두 후프 사이 셸, 러그 케이싱, 뒤쪽 페달·비터가 헤드를 때림",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const s = st(o), w = h * 0.56, r = h * 0.31, cy = -r - h * 0.07, hw = r * 0.12, cx = h * 0.14;
        shape(g, c => c.rect(cx - w / 2, cy - r, w, r * 2), { fill: TONE[4] });                                  // 셸
        for (const sx of [cx - w / 2 + hw * 3, cx + w / 2 - hw * 3]) for (const t of [-0.6, 0, 0.6]) lug(g, sx, cy + r * t, hw * 2.2, r * 0.1);
        shape(g, c => c.roundRect(cx - w / 2 - hw, cy - r * (1 + s * 0.03), hw * 2, r * 2 * (1 + s * 0.03), hw * 0.6), { fill: TONE[5] });   // 뒤(배터) 후프
        shape(g, c => c.roundRect(cx + w / 2 - hw, cy - r, hw * 2, r * 2, hw * 0.6), { fill: TONE[5] });                                        // 앞 후프
        spur(g, cx + w / 2 - hw, cy + r * 0.8, cx + w / 2 + r * 0.45, 0);
        pedal(g, cx - w / 2 - hw, cy, r, h, s);
        if (s > 0.02) { g.save(); g.globalAlpha = 0.95 - s * 0.6; line(g, [[cx - w / 2 - hw * 2 - s * 3, cy - r * 0.5], [cx - w / 2 - hw * 2 - s * 3, cy + r * 0.5]], { lw: LINE * (1 + s * 0.6), stroke: o.accent }); g.restore(); }
        g.restore();
      }
    },
    D: {
      label: "탐 얹은 킥 · 정면 킥 위에 홀더 선과 기울어진 작은 탐",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const r = h * 0.29, cy = -r - h * 0.06, tr = h * 0.16, tx = r * 0.28, ty = cy - r - tr * 0.85;
        shape(g, c => c.ellipse(-r * 0.08, cy + r * 0.02, r, r, 0, 0, TAU), { fill: TONE[4] });
        spur(g, -r * 0.62, cy + r * 0.72, -r * 0.94, 0); spur(g, r * 0.66, cy + r * 0.7, r * 1.0, 0);
        line(g, [[tx * 0.4, cy - r * 0.95], [tx * 0.4, ty + tr * 0.5], [tx, ty + tr * 0.5]], { lw: LINE + 0.3 });   // 탐 홀더
        kickHead(g, 0, cy, r, r, o, { lugs: 8, ventAt: [0.5, 0.36] });
        // 탐: 얕은 셸 + 기울어진 헤드
        shape(g, c => c.ellipse(tx - tr * 0.28, ty + tr * 0.12, tr, tr * 0.86, -0.25, 0, TAU), { fill: TONE[4] });
        kickHead(g, tx, ty, tr, tr * 0.86, o, { vent: false, lugs: 6, tilt: -0.25 });
        g.restore();
      }
    },
    E: {
      label: "작은 재즈 킥 · 얕은 통, 벤트홀 없는 헤드, 긴 스퍼로 높이 띄움",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const rx = h * 0.23, ry = h * 0.27, depth = h * 0.17, cy = -ry - h * 0.2, cx = h * 0.1;
        kickShell34(g, cx, cy, rx, ry, depth);
        spur(g, cx - depth * 0.5, cy + ry * 0.85, cx - depth * 0.5 - rx * 0.5, 0);
        spur(g, cx + rx * 0.55, cy + ry * 0.75, cx + rx * 0.95, 0);
        kickHead(g, cx, cy, rx, ry, o, { vent: false, lugs: 6 });
        g.restore();
      }
    },
    F: {
      label: "큰 록 킥 · 깊은 통, 큰 벤트홀, 러그 10개, 스퍼 두 줄",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const rx = h * 0.34, ry = h * 0.4, depth = h * 0.36, cy = -ry - h * 0.05, cx = h * 0.16;
        kickShell34(g, cx, cy, rx, ry, depth);
        spur(g, cx - depth * 0.35, cy + ry * 0.9, cx - depth * 0.35 - rx * 0.5, 0);
        spur(g, cx + rx * 0.62, cy + ry * 0.78, cx + rx * 0.98, 0);
        kickHead(g, cx, cy, rx, ry, o, { lugs: 10, vent: false });
        shape(g, c => c.ellipse(cx + rx * 0.36, cy + ry * 0.3, rx * 0.16, ry * 0.16, 0, 0, TAU), { fill: ILLO.paper });   // 큰 벤트홀
        g.restore();
      }
    }
  }
});

registerObject("drum-snare", {
  label: "스네어 (state = 울림)", group: G, demos: ["step-sequencer"], height: 84, color: ILLO.red,
  variants: {
    A: {
      label: "정면 얇은 통 + 스탠드 다리 셋",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const s = st(o), w = h * 0.52, d = h * 0.2, top = -h * 0.58 - s * h * 0.02;
        line(g, [[0, 0], [0, top + d]], { lw: LINE + 0.5 });
        line(g, [[-h * 0.2, 0], [0, -h * 0.16], [h * 0.22, 0]]);
        shape(g, c => c.rect(-w / 2, top, w, d), { fill: TONE[3] });
        ellipse(g, 0, top, w / 2, d * 0.28, { fill: lit(o, TONE[1]) });
        line(g, [[-w / 2, top + d * 0.55], [w / 2, top + d * 0.55]], { lw: LINE * 0.8 });
        g.restore();
      }
    },
    B: {
      label: "위에서 본 원 · 헤드 톤 + 림 띠",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const s = st(o), r = h * 0.3 * (1 + s * 0.05), cy = -h * 0.38;
        circle(g, 0, cy, r, { fill: TONE[4] });
        circle(g, h * 0.01, cy - h * 0.005, r * 0.84, { fill: lit(o, TONE[1]) });
        for (let i = 0; i < 6; i++) { const a = -0.4 + (i * TAU) / 6; dot(g, Math.cos(a) * r * 0.93, cy + Math.sin(a) * r * 0.93, h * 0.012); }
        g.restore();
      }
    },
    C: {
      label: "옆면 낮은 통 · 스네어 줄 잉크 선",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const s = st(o), w = h * 0.6, d = h * 0.16, top = -h * 0.5;
        line(g, [[-h * 0.06, 0], [h * 0.08, top + d]], { lw: LINE + 0.5 });
        line(g, [[-h * 0.24, 0], [h * 0.02, -h * 0.13], [h * 0.26, 0]]);
        shape(g, c => c.rect(-w / 2, top, w, d), { fill: TONE[3] });
        shape(g, c => c.rect(-w / 2, top - h * 0.03, w, h * 0.03), { fill: lit(o, TONE[1]) });
        [0.25, 0.5, 0.75].forEach(k => line(g, [[-w / 2 + h * 0.02, top + d * k], [w / 2 - h * 0.02, top + d * k + h * 0.004]], { lw: LINE * 0.7 }));
        if (s > 0.02) { g.save(); g.globalAlpha = s; line(g, [[-w / 2, top - h * 0.08], [w / 2, top - h * 0.08]], { stroke: o.accent }); g.restore(); }
        g.restore();
      }
    }
  }
});

registerObject("hat-cymbal", {
  label: "하이햇 · 심벌 (state = 울림)", group: G, demos: ["step-sequencer"], height: 84, color: ILLO.yellow,
  variants: {
    A: {
      label: "닫힌 하이햇 · 얇은 타원 두 장 맞닿음",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const s = st(o), r = h * 0.28, cy = -h * 0.72, gap = h * 0.01 + s * h * 0.06;
        line(g, [[0, 0], [0, cy - h * 0.08]], { lw: LINE + 0.5 });
        line(g, [[-h * 0.16, 0], [0, -h * 0.13], [h * 0.18, 0]]);
        ellipse(g, h * 0.01, cy + gap, r, r * 0.16, { fill: TONE[4] });
        ellipse(g, -h * 0.01, cy - gap, r, r * 0.16, { fill: lit(o, TONE[2]) });
        g.restore();
      }
    },
    B: {
      label: "열린 하이햇 · 위 접시가 떠 있음, 울리면 닫힘",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const s = st(o), r = h * 0.26, cy = -h * 0.68, gap = h * 0.1 * (1 - s) + h * 0.015;
        line(g, [[0, 0], [0, cy - gap - h * 0.06]], { lw: LINE + 0.5 });
        line(g, [[-h * 0.18, 0], [0, -h * 0.14], [h * 0.16, 0]]);
        ellipse(g, 0, cy, r, r * 0.15, { fill: TONE[4] });
        ellipse(g, 0, cy - gap, r * 0.98, r * 0.15, { fill: lit(o, TONE[2]) }, -0.06 * (1 - s));
        g.restore();
      }
    },
    C: {
      label: "라이드 심벌 · 큰 접시 하나가 기울어 있음",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const s = st(o), r = h * 0.36, cy = -h * 0.66, tilt = -0.28 + Math.sin((o.t || 0) * 9) * s * 0.03;
        line(g, [[h * 0.06, 0], [h * 0.06, -h * 0.4], [-h * 0.02, cy]], { lw: LINE + 0.5 });
        line(g, [[-h * 0.12, 0], [h * 0.06, -h * 0.12], [h * 0.24, 0]]);
        ellipse(g, 0, cy, r, r * 0.16, { fill: lit(o, TONE[3]) }, tilt);
        circle(g, 0, cy, h * 0.02, { fill: TONE[5] });
        g.restore();
      }
    }
  }
});

registerObject("tone-bell", {
  label: "종 (state = 울림)", group: G, demos: ["step-sequencer"], height: 84, color: ILLO.yellow,
  variants: {
    A: {
      label: "종 실루엣 · 추는 가는 선, 울리면 기울어짐",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const s = st(o), rot = Math.sin((o.t || 0) * 12) * s * 0.18;
        const top = -h * 0.72;
        line(g, [[0, top - h * 0.1], [0, top]], { lw: LINE + 0.5 });
        g.translate(0, top); g.rotate(rot);
        shape(g, c => { c.moveTo(-h * 0.05, 0); c.bezierCurveTo(-h * 0.06, h * 0.2, -h * 0.2, h * 0.3, -h * 0.24, h * 0.42); c.lineTo(h * 0.25, h * 0.42); c.bezierCurveTo(h * 0.2, h * 0.3, h * 0.06, h * 0.2, h * 0.05, 0); c.closePath(); }, { fill: lit(o, TONE[3]) });
        line(g, [[0, h * 0.18], [h * 0.01, h * 0.46]]);
        dot(g, h * 0.01, h * 0.47, h * 0.025);
        g.restore();
      }
    },
    B: {
      label: "튜브 벨 · 매달린 긴 막대",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const s = st(o), sw = Math.sin((o.t || 0) * 10) * s * h * 0.03;
        line(g, [[-h * 0.2, -h * 0.9], [h * 0.2, -h * 0.9]], { lw: LINE + 0.5 });
        line(g, [[h * 0.02, -h * 0.9], [h * 0.02 + sw * 0.3, -h * 0.8]]);
        shape(g, c => c.roundRect(h * 0.02 + sw * 0.3 - h * 0.035, -h * 0.8, h * 0.07, h * 0.62, h * 0.02), { fill: lit(o, TONE[4]) });
        g.restore();
      }
    },
    C: {
      label: "카우벨 · 사다리꼴 면, 위에 고리 선",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const s = st(o), top = -h * 0.55, bot = -h * 0.12, shake = Math.sin((o.t || 0) * 14) * s * h * 0.015;
        curve(g, [-h * 0.03 + shake, top, 0 + shake, top - h * 0.12, h * 0.05 + shake, top]);
        shape(g, c => { c.moveTo(-h * 0.13 + shake, top); c.lineTo(h * 0.15 + shake, top); c.lineTo(h * 0.22, bot); c.lineTo(-h * 0.2, bot); c.closePath(); }, { fill: lit(o, TONE[4]) });
        line(g, [[-h * 0.2, bot], [h * 0.22, bot]], { lw: LINE * 0.8 });
        g.restore();
      }
    }
  }
});

/* ---------- 무대 카드 ---------- */
registerObject("stage-card", {
  label: "카드 (마우스 룩 · 커서 모핑)", group: G, demos: ["mouse-look", "cursor-morph"], height: 84, color: ILLO.blue,
  variants: {
    A: {
      label: "세로 카드 · 위쪽에 색 면 하나",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const w = h * 0.62, ch = h * 0.84, top = -ch - h * 0.02;
        roundRect(g, -w / 2, top, w, ch, h * 0.03, { fill: TONE[1] });
        shape(g, c => c.rect(-w / 2 + h * 0.05, top + h * 0.05, w - h * 0.1, ch * 0.5), { fill: lit(o, o.color) });
        line(g, [[-w / 2 + h * 0.05, top + ch * 0.68], [w / 2 - h * 0.12, top + ch * 0.68]], { lw: LINE * 0.8 });
        line(g, [[-w / 2 + h * 0.05, top + ch * 0.78], [w / 2 - h * 0.22, top + ch * 0.78]], { lw: LINE * 0.8 });
        g.restore();
      }
    },
    B: {
      label: "가로 카드 · 톤 면 두 단, 가는 캡션 선",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const w = h * 1.1, ch = h * 0.62, top = -ch - h * 0.02;
        roundRect(g, -w / 2, top, w, ch, h * 0.03, { fill: TONE[1] });
        shape(g, c => c.rect(-w / 2, top, w * 0.42, ch), { fill: TONE[3] });
        line(g, [[-w / 2 + w * 0.48, top + ch * 0.32], [w / 2 - h * 0.08, top + ch * 0.32]], { lw: LINE * 0.8 });
        line(g, [[-w / 2 + w * 0.48, top + ch * 0.46], [w / 2 - h * 0.2, top + ch * 0.46]], { lw: LINE * 0.8 });
        dot(g, w / 2 - h * 0.1, top + ch * 0.8, h * 0.03, lit(o, o.color));
        g.restore();
      }
    },
    C: {
      label: "폴라로이드 · 종이색 틀에 톤 사진, 살짝 기울어짐",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y); g.rotate(-0.06);
        const w = h * 0.68, ch = h * 0.82, top = -ch;
        shape(g, c => c.rect(-w / 2, top, w, ch), { fill: ILLO.paper });
        shape(g, c => c.rect(-w / 2 + h * 0.05, top + h * 0.05, w - h * 0.1, ch * 0.7), { fill: TONE[2] });
        // 사진 안: 지평선과 작은 색 원판 하나
        g.fillStyle = TONE[3]; g.fillRect(-w / 2 + h * 0.05, top + h * 0.05 + ch * 0.48, w - h * 0.1, ch * 0.22);
        circle(g, w * 0.15, top + h * 0.05 + ch * 0.28, h * 0.06, { fill: lit(o, o.color) });
        g.restore();
      }
    }
  }
});

/* ---------- 당구대 (위에서 본 모습) ---------- */
registerObject("pool-table", {
  label: "당구대 (위에서)", group: G, demos: ["slingshot"], height: 60, color: ILLO.green,
  variants: {
    A: {
      label: "톤 펠트 + 어두운 쿠션 띠 + 포켓 여섯",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const w = h * 2, th = h * 1.1, top = -th, band = h * 0.09;
        roundRect(g, -w / 2, top, w, th, h * 0.06, { fill: TONE[4] });
        shape(g, c => c.rect(-w / 2 + band, top + band, w - band * 2, th - band * 2), { fill: TONE[2] });
        [[-w / 2 + band, top + band], [0, top + band * 0.7], [w / 2 - band, top + band], [-w / 2 + band, -band], [0, -band * 0.7], [w / 2 - band, -band]].forEach(([px, py]) => circle(g, px, py, h * 0.055, { fill: TONE[5] }));
        g.restore();
      }
    },
    B: {
      label: "색 펠트 · 쿠션은 톤, 헤드 라인 한 줄",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const w = h * 2, th = h * 1.1, top = -th, band = h * 0.08;
        shape(g, c => c.rect(-w / 2, top, w, th), { fill: TONE[5] });
        shape(g, c => c.rect(-w / 2 + band, top + band, w - band * 2, th - band * 2), { fill: o.color });
        g.save(); g.globalAlpha = 0.5;
        line(g, [[-w * 0.25, top + band], [-w * 0.25, -band]], { lw: LINE * 0.8, stroke: ILLO.paper });
        g.restore();
        [[-w / 2 + band * 0.6, top + band * 0.6], [0, top + band * 0.4], [w / 2 - band * 0.6, top + band * 0.6], [-w / 2 + band * 0.6, -band * 0.6], [0, -band * 0.4], [w / 2 - band * 0.6, -band * 0.6]].forEach(([px, py]) => circle(g, px, py, h * 0.05, { fill: ILLO.ink }));
        g.restore();
      }
    },
    C: {
      label: "둥근 모서리 · 포켓이 홈으로 파임, 가는 테두리 구조선",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const w = h * 2, th = h * 1.05, top = -th, band = h * 0.1, pr = h * 0.06;
        roundRect(g, -w / 2, top, w, th, h * 0.12, { fill: TONE[3] });
        shape(g, c => { c.roundRect(-w / 2 + band, top + band, w - band * 2, th - band * 2, h * 0.04); }, { fill: TONE[1] });
        // 포켓: 프레임 위에 파인 홈
        [[-w / 2 + band * 0.9, top + band * 0.9], [0, top + band * 0.5], [w / 2 - band * 0.9, top + band * 0.9], [-w / 2 + band * 0.9, -band * 0.9], [0, -band * 0.5], [w / 2 - band * 0.9, -band * 0.9]].forEach(([px, py]) => circle(g, px, py, pr, { fill: TONE[5] }));
        shape(g, c => c.roundRect(-w / 2 + band, top + band, w - band * 2, th - band * 2, h * 0.04), { fill: null, lw: LINE * 0.7, stroke: TONE[5] });
        g.restore();
      }
    }
  }
});

/* ---------- 로터리 노브 (위에서) ---------- */
const knobAngle = o => -Math.PI * 0.75 + st(o) * Math.PI * 1.5;
registerObject("knob", {
  label: "로터리 노브 (state = 회전 0..1)", group: G, demos: ["rotary-knob"], height: 84, color: ILLO.orange,
  variants: {
    A: {
      label: "원판 + 중심에서 가장자리로 가는 지시선",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const r = h * 0.3, cy = -h * 0.42, a = knobAngle(o);
        circle(g, 0, cy, r, { fill: TONE[3] });
        line(g, [[Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2], [Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9]], { lw: LINE + 0.5, stroke: lit(o, ILLO.ink) });
        g.restore();
      }
    },
    B: {
      label: "원판 + 가장자리 점 표시 · 바깥에 눈금 몇 개",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const r = h * 0.26, cy = -h * 0.42, a = knobAngle(o);
        for (let i = 0; i < 7; i++) { const t = -Math.PI * 0.75 + (i * Math.PI * 1.5) / 6, r0 = r * 1.18, r1 = r * (i % 3 ? 1.26 : 1.34); line(g, [[Math.cos(t) * r0, cy + Math.sin(t) * r0], [Math.cos(t) * r1, cy + Math.sin(t) * r1]], { lw: LINE * 0.8 }); }
        circle(g, 0, cy, r, { fill: TONE[4] });
        dot(g, Math.cos(a) * r * 0.75, cy + Math.sin(a) * r * 0.75, h * 0.03, lit(o, ILLO.paper));
        g.restore();
      }
    },
    C: {
      label: "두 겹 링 · 바깥 밝은 링, 안쪽 어두운 원, 홈 지시",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const r = h * 0.32, cy = -h * 0.42, a = knobAngle(o);
        circle(g, 0, cy, r, { fill: TONE[1] });
        circle(g, h * 0.005, cy - h * 0.005, r * 0.62, { fill: TONE[5] });
        line(g, [[Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62], [Math.cos(a) * r * 1.0, cy + Math.sin(a) * r * 1.0]], { lw: LINE + 1, stroke: lit(o, ILLO.ink) });
        g.restore();
      }
    }
  }
});

/* ---------- 가상 조이스틱 ---------- */
const stickOffset = o => { const s = st(o); return { dx: Math.cos(1.1) * s, dy: Math.sin(1.1) * s }; };
registerObject("joystick-base", {
  label: "조이스틱 베이스 + 노브 (state = 밀린 정도)", group: G, demos: ["virtual-joystick"], height: 84, color: ILLO.blue,
  variants: {
    A: {
      label: "큰 연한 원 + 작은 짙은 노브",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const R = h * 0.36, r = h * 0.14, cy = -h * 0.42, { dx, dy } = stickOffset(o);
        circle(g, 0, cy, R, { fill: TONE[1] });
        circle(g, dx * R * 0.6, cy + dy * R * 0.6, r, { fill: lit(o, TONE[5]) });
        g.restore();
      }
    },
    B: {
      label: "둥근 사각 베이스 + 원 노브, 중심 십자 선",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const R = h * 0.36, r = h * 0.13, cy = -h * 0.42, { dx, dy } = stickOffset(o);
        roundRect(g, -R, cy - R, R * 2, R * 2, R * 0.35, { fill: TONE[2] });
        line(g, [[-R * 0.25, cy], [R * 0.25, cy]], { lw: LINE * 0.8, stroke: TONE[4] });
        line(g, [[0, cy - R * 0.25], [0, cy + R * 0.25]], { lw: LINE * 0.8, stroke: TONE[4] });
        circle(g, dx * R * 0.55, cy + dy * R * 0.55, r, { fill: lit(o, o.color) });
        g.restore();
      }
    },
    C: {
      label: "고리 베이스 + 노브, 중심에서 노브까지 잉크 선",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const R = h * 0.34, r = h * 0.12, cy = -h * 0.42, { dx, dy } = stickOffset(o);
        shape(g, c => c.arc(0, cy, R, 0, TAU), { fill: null, lw: h * 0.05, stroke: TONE[2] });
        const kx = dx * R * 0.65, ky = cy + dy * R * 0.65;
        line(g, [[0, cy], [kx, ky]], { lw: LINE });
        dot(g, 0, cy, h * 0.02);
        circle(g, kx, ky, r, { fill: lit(o, TONE[4]) });
        g.restore();
      }
    }
  }
});

/* ---------- 커서 ---------- */
registerObject("cursor-arrow", {
  label: "커서 (커서 모핑용)", group: G, demos: ["cursor-morph"], height: 84, color: ILLO.orange,
  variants: {
    A: {
      label: "화살표 실루엣 · 잉크 단색, 비대칭 꼬리",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const s = h * 0.55, top = -h * 0.66;
        shape(g, c => { c.moveTo(0, top); c.lineTo(0, top + s * 0.78); c.lineTo(s * 0.2, top + s * 0.62); c.lineTo(s * 0.34, top + s * 0.9); c.lineTo(s * 0.45, top + s * 0.84); c.lineTo(s * 0.31, top + s * 0.57); c.lineTo(s * 0.55, top + s * 0.55); c.closePath(); }, { fill: lit(o, ILLO.ink) });
        g.restore();
      }
    },
    B: {
      label: "십자 커서 · 가운데가 빈 가는 선 넷",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const cy = -h * 0.42, L = h * 0.2, gap = h * 0.05, col = lit(o, ILLO.ink);
        line(g, [[-L, cy], [-gap, cy]], { stroke: col }); line(g, [[gap, cy], [L, cy]], { stroke: col });
        line(g, [[0, cy - L], [0, cy - gap]], { stroke: col }); line(g, [[0, cy + gap], [0, cy + L]], { stroke: col });
        g.restore();
      }
    },
    C: {
      label: "점 커서 · 잉크 점 + 얇은 고리, 고리는 state로 커짐",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const cy = -h * 0.42, r = h * 0.12 * (1 + st(o) * 0.6);
        dot(g, 0, cy, h * 0.035, ILLO.ink);
        shape(g, c => c.arc(0, cy, r, 0, TAU), { fill: null, lw: LINE, stroke: lit(o, ILLO.ink) });
        g.restore();
      }
    }
  }
});

/* ---------- 스티커 시트 ---------- */
const STICKERS = [
  (g, s, f) => circle(g, 0, 0, s * 0.42, { fill: f }),
  (g, s, f) => shape(g, c => { c.moveTo(-s * 0.4, s * 0.1); c.bezierCurveTo(-s * 0.45, -s * 0.4, s * 0.3, -s * 0.5, s * 0.42, -s * 0.05); c.bezierCurveTo(s * 0.45, s * 0.35, -s * 0.2, s * 0.5, -s * 0.4, s * 0.1); }, { fill: f }),
  (g, s, f) => shape(g, c => { c.moveTo(-s * 0.42, s * 0.1); c.quadraticCurveTo(0, -s * 0.5, s * 0.42, -s * 0.1); c.quadraticCurveTo(0, s * 0.5, -s * 0.42, s * 0.1); }, { fill: f }),
  (g, s, f) => shape(g, c => { c.arc(0, 0, s * 0.4, Math.PI * 0.6, Math.PI * 1.6); c.closePath(); }, { fill: f }),
  (g, s, f) => roundRect(g, -s * 0.36, -s * 0.36, s * 0.72, s * 0.72, s * 0.14, { fill: f }),
  (g, s, f) => shape(g, c => { c.moveTo(0, s * 0.42); c.quadraticCurveTo(s * 0.38, 0, 0, -s * 0.42); c.quadraticCurveTo(-s * 0.38, 0, 0, s * 0.42); }, { fill: f }),
  (g, s, f) => roundRect(g, -s * 0.44, -s * 0.18, s * 0.88, s * 0.36, s * 0.18, { fill: f }),
  (g, s, f) => ellipse(g, 0, 0, s * 0.42, s * 0.26, { fill: f }, 0.5)
];
registerObject("sticker-sheet", {
  label: "스티커 시트", group: G, demos: ["break-apart"], height: 84, color: ILLO.pink,
  variants: {
    A: {
      label: "종이 시트에 격자 여덟 개 · 톤 실루엣, 하나만 색",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y); g.rotate(0.03);
        const w = h * 0.86, sh = h * 0.92, top = -sh;
        roundRect(g, -w / 2, top, w, sh, h * 0.02, { fill: ILLO.paper });
        const cell = w / 4, s = cell * 0.9;
        STICKERS.forEach((fn, i) => { const cx = -w / 2 + cell * (0.5 + (i % 4)), cy = top + sh * (0.28 + Math.floor(i / 4) * 0.42); g.save(); g.translate(cx, cy); g.rotate(((i * 5) % 7 - 3) * 0.06); fn(g, s, i === 5 ? o.color : [TONE[2], TONE[3], TONE[4]][i % 3]); g.restore(); });
        g.restore();
      }
    },
    B: {
      label: "흩어진 배치 여섯 개 · 크기와 각도가 제각각",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y); g.rotate(-0.04);
        const w = h * 1.0, sh = h * 0.78, top = -sh - h * 0.02;
        roundRect(g, -w / 2, top, w, sh, h * 0.02, { fill: ILLO.paper });
        [[0.16, 0.25, 0.28, 0], [0.42, 0.22, 0.2, 1], [0.7, 0.3, 0.32, 3], [0.22, 0.68, 0.22, 5], [0.5, 0.62, 0.3, 2], [0.8, 0.72, 0.24, 7]].forEach(([px, py, sz, k], i) => {
          g.save(); g.translate(-w / 2 + w * px, top + sh * py); g.rotate((i - 2.5) * 0.18);
          STICKERS[k](g, h * sz, i === 2 ? o.color : [TONE[2], TONE[3], TONE[4]][i % 3]);
          g.restore();
        });
        g.restore();
      }
    },
    C: {
      label: "세로 띠 시트 · 절취선 점선, 여섯 칸",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y); g.rotate(0.05);
        const w = h * 0.36, sh = h * 0.96, top = -sh;
        roundRect(g, -w / 2, top, w, sh, h * 0.015, { fill: ILLO.paper });
        const n = 6, cell = sh / n, s = w * 0.7;
        for (let i = 0; i < n; i++) {
          const cy = top + cell * (i + 0.5);
          if (i) line(g, [[-w / 2 + h * 0.02, top + cell * i], [w / 2 - h * 0.02, top + cell * i]], { lw: LINE * 0.6, stroke: TONE[3], dash: [2, 3] });
          g.save(); g.translate((i % 2 ? 1 : -1) * w * 0.04, cy); g.rotate((i - 2) * 0.1);
          STICKERS[[0, 2, 5, 6, 3, 4][i]](g, s, i === 3 ? o.color : [TONE[3], TONE[2], TONE[4]][i % 3]);
          g.restore();
        }
        g.restore();
      }
    }
  }
});

/* ---------- 놀람 표시 ---------- */
registerObject("exclamation", {
  label: "놀람 표시 !", group: G, demos: ["idle"], height: 84, color: ILLO.red,
  variants: {
    A: {
      label: "가는 잉크 · 위가 조금 굵은 획 + 점",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const bob = Math.sin((o.t || 0) * 3) * h * 0.02, top = -h * 0.8 + bob, bot = -h * 0.36 + bob;
        shape(g, c => { c.moveTo(-h * 0.025, top); c.lineTo(h * 0.03, top + h * 0.01); c.lineTo(h * 0.008, bot); c.lineTo(-h * 0.008, bot); c.closePath(); }, { fill: lit(o, ILLO.ink) });
        dot(g, 0.5, bot + h * 0.08, h * 0.022, lit(o, ILLO.ink));
        g.restore();
      }
    },
    B: {
      label: "기울어진 색 실루엣 · 뭉툭한 획, 아래 점은 타원",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y); g.rotate(0.12 + Math.sin((o.t || 0) * 2.2) * 0.03);
        const top = -h * 0.82, bot = -h * 0.4;
        shape(g, c => { c.moveTo(-h * 0.06, top); c.lineTo(h * 0.07, top); c.lineTo(h * 0.03, bot); c.lineTo(-h * 0.02, bot); c.closePath(); }, { fill: st(o) > 0.02 ? o.accent : o.color });
        ellipse(g, h * 0.005, bot + h * 0.1, h * 0.045, h * 0.04, { fill: st(o) > 0.02 ? o.accent : o.color });
        g.restore();
      }
    },
    C: {
      label: "작은 겹 표시 !! · 크기가 다른 둘",
      draw(g, x, y, h, o) {
        g.save(); g.translate(x, y);
        const bob = Math.sin((o.t || 0) * 3.4) * h * 0.015, col = lit(o, ILLO.ink);
        const mark = (px, top, bot, w, r) => { shape(g, c => { c.moveTo(px - w, top); c.lineTo(px + w, top); c.lineTo(px + w * 0.3, bot); c.lineTo(px - w * 0.3, bot); c.closePath(); }, { fill: col }); dot(g, px, bot + r * 3, r, col); };
        mark(-h * 0.08, -h * 0.68 + bob, -h * 0.4 + bob, h * 0.02, h * 0.016);
        mark(h * 0.08, -h * 0.82 - bob, -h * 0.44 - bob, h * 0.028, h * 0.02);
        g.restore();
      }
    }
  }
});
