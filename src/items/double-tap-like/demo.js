import { clamp, dist } from "../../lib/util.js";
import { ILLO, TONE } from "../../lib/draw.js";
import { peepSVG, outfit } from "../../lib/figure.js";

const HEART = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
// 하트는 외곽선 없는 실루엣. 깨진 하트는 같은 실루엣에 종이색 가는 금 하나
const heartSVG = fill => `<svg viewBox="0 0 24 24"><path d="${HEART}" fill="${fill}"/></svg>`;
const brokenSVG = `<svg viewBox="0 0 24 24"><path d="${HEART}" fill="${ILLO.red}"/><path d="M12 4.6 10.2 8.6l2.8 2.4-2.2 3.6 1.6 3.2" fill="none" stroke="${ILLO.paper}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
// 사진: 톤 면으로만 만든 언덕 세 겹과 그 앞에 선 사람 하나 (강조색은 사람의 옷 하나).
// 사람은 경계 상자에 맞춘 peepSVG를 안쪽 <svg>로 넣는다: 세로가 길어 높이에 맞고, 상자 바닥(y 96)이 앞 언덕에 닿는다
const photoSVG = () => `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
  <rect x="-5" y="-5" width="110" height="110" fill="${ILLO.paper}"/>
  <path d="M-5 62 Q20 44 45 58 T105 52 V105 H-5 Z" fill="${TONE[1]}"/>
  <path d="M-5 78 Q30 62 58 76 T105 70 V105 H-5 Z" fill="${TONE[2]}"/>
  <path d="M-5 92 Q35 84 70 92 T105 88 V105 H-5 Z" fill="${TONE[3]}"/>
  ${peepSVG({ body: "WalkingBW", face: "Smile", hair: "ShortCurly", colors: outfit(ILLO.orange), flip: true })
    .replace("<svg ", '<svg x="46" y="36" width="40" height="60" ')}
</svg>`;

export default function demo(api) {
  const { el, S } = api;

  api.css(`
    .dtl-demo { position: absolute; inset: 0; display: grid; place-items: center; background: var(--board); }
    .dtl-card { background: var(--note); border: 1px solid var(--ink-3); border-radius: 8px; overflow: hidden; }
    .dtl-head { display: flex; align-items: center; gap: 10px; padding: 10px 14px; font-size: 13px; font-weight: 600; color: var(--ink); }
    .dtl-ava { width: 26px; height: 26px; border-radius: 50%; background: ${TONE[2]}; }
    .dtl-head .more { margin-left: auto; color: var(--ink-3); letter-spacing: 2px; }
    .dtl-photo { position: relative; overflow: hidden; cursor: default; background: ${ILLO.paper}; border-top: 1px solid var(--ink-3); border-bottom: 1px solid var(--ink-3); }
    .dtl-photo > svg { display: block; width: 100%; height: 100%; }
    .dtl-big, .dtl-bit { position: absolute; left: 0; top: 0; pointer-events: none; }
    .dtl-big svg, .dtl-bit svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .dtl-tap { position: absolute; width: 28px; height: 28px; margin: -14px 0 0 -14px; border-radius: 50%; border: 1.5px solid var(--ink-2);
      pointer-events: none; animation: dtl-tap .35s ease-out forwards; }
    @keyframes dtl-tap { from { transform: scale(.4); opacity: 1; } to { transform: scale(1.2); opacity: 0; } }
    .dtl-actions { display: flex; align-items: center; gap: 4px; padding: 6px 8px 0; }
    .dtl-btn { width: 40px; height: 40px; border: 0; background: none; padding: 9px; cursor: pointer; color: var(--ink); border-radius: 50%; }
    .dtl-btn svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .dtl-like path { fill: none; stroke: currentColor; stroke-width: 1.6; transition: fill .15s, stroke .15s; }
    .dtl-like.on path { fill: var(--accent); stroke: var(--accent); }
    .dtl-ico path { fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linejoin: round; stroke-linecap: round; }
    .dtl-likes { padding: 2px 16px 0; font-size: 13px; color: var(--ink); }
    .dtl-likes b { display: inline-block; font-weight: 600; font-variant-numeric: tabular-nums; }
    .dtl-cap { padding: 4px 16px 14px; font-size: 13px; color: var(--ink-2); line-height: 1.5; }
    .dtl-cap b { color: var(--ink); font-weight: 600; margin-right: 6px; }
  `);

  const root = document.createElement("div");
  root.className = "dtl-demo";
  el.appendChild(root);
  const card = document.createElement("div");
  card.className = "dtl-card";
  card.innerHTML = `
    <div class="dtl-head"><div class="dtl-ava"></div><span>paper.studio</span><span class="more">···</span></div>
    <div class="dtl-photo">${photoSVG()}</div>
    <div class="dtl-actions">
      <button class="dtl-btn dtl-like" title="좋아요"><svg viewBox="0 0 24 24"><path d="${HEART}"/></svg></button>
      <button class="dtl-btn dtl-ico" title="댓글"><svg viewBox="0 0 24 24"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-4.7A8.5 8.5 0 1 1 20.5 11.5z"/></svg></button>
      <button class="dtl-btn dtl-ico" title="공유"><svg viewBox="0 0 24 24"><path d="M21.5 3 10 13M21.5 3l-7 18-4.5-8-8-4.5z"/></svg></button>
    </div>
    <div class="dtl-likes">좋아요 <b>128</b>개</div>
    <div class="dtl-cap"><b>paper.studio</b>오늘의 노을. 마음에 들면 사진을 두 번 누른다.</div>`;
  root.appendChild(card);
  const photo = card.querySelector(".dtl-photo");
  const likeBtn = card.querySelector(".dtl-like");
  const countEl = card.querySelector(".dtl-likes b");

  let P = 360;
  const layout = () => {
    const { w, h } = api.size();
    P = Math.round(clamp(Math.min(w - 48, h - 200, 440), 180, 440));
    card.style.width = P + "px";
    photo.style.height = P + "px";
  };
  layout();
  api.onResize(layout);

  /* ---------- 상태 ---------- */
  let likes = 128, liked = false;
  const render = () => {
    likeBtn.classList.toggle("on", liked);
    countEl.textContent = likes.toLocaleString("ko-KR");
    api.read("likes", likes);
    api.read("liked", liked ? "켜짐" : "꺼짐");
  };
  render();
  const bounce = node => node.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(.9)" }, { transform: "scale(1)" }],
    { duration: 420, easing: "ease-out" });
  const setLiked = on => {
    if (on === liked) return false;
    liked = on; likes += on ? 1 : -1;
    render();
    bounce(likeBtn.querySelector("svg"));
    bounce(countEl);
    return true;
  };

  /* ---------- 하트 연출 ---------- */
  function burst(x, y, broken) {
    const size = P * S.size / 100;
    const big = document.createElement("div");
    big.className = "dtl-big";
    big.style.cssText = `width:${size}px;height:${size}px;left:${x - size / 2}px;top:${y - size / 2}px`;
    big.innerHTML = broken ? brokenSVG : heartSVG(ILLO.red);
    photo.appendChild(big);
    const a = broken
      ? big.animate([
          { transform: "scale(1)", opacity: 0 }, { transform: "scale(1.05)", opacity: 1, offset: .2 },
          { transform: "scale(1) rotate(0)", opacity: 1, offset: .5 }, { transform: "translateY(30%) scale(.5) rotate(-12deg)", opacity: 0 }],
          { duration: 800, easing: "ease-in", fill: "forwards" })
      : big.animate([
          { transform: "scale(0)", opacity: .9 }, { transform: "scale(1.2)", opacity: 1, offset: .15 },
          { transform: "scale(.94)", offset: .25 }, { transform: "scale(1)", offset: .34 },
          { transform: "scale(1)", opacity: 1, offset: .72 }, { transform: "translateY(-45%) scale(.7)", opacity: 0 }],
          { duration: 1050, easing: "ease-out", fill: "forwards" });
    a.onfinish = () => big.remove();
    api.cleanup(() => a.cancel());

    if (broken) return;
    const n = S.particles;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const d = size * (0.55 + Math.random() * 0.45);
      const s = size * (0.12 + Math.random() * 0.12);
      const bit = document.createElement("div");
      bit.className = "dtl-bit";
      bit.style.cssText = `width:${s}px;height:${s}px;left:${x - s / 2}px;top:${y - s / 2}px`;
      bit.innerHTML = heartSVG(ILLO.red);
      photo.appendChild(bit);
      const dx = Math.cos(ang) * d, dy = Math.sin(ang) * d;
      const rot = (Math.random() - .5) * 90;
      const b = bit.animate([
        { transform: "translate(0,0) scale(.2)", opacity: 0 },
        { transform: `translate(${dx * .6}px,${dy * .6}px) scale(1) rotate(${rot * .5}deg)`, opacity: 1, offset: .35 },
        { transform: `translate(${dx}px,${dy + size * .15}px) scale(.6) rotate(${rot}deg)`, opacity: 0 }
      ], { duration: 700 + Math.random() * 300, delay: 60, easing: "cubic-bezier(.2,.7,.3,1)", fill: "both" });
      b.onfinish = () => bit.remove();
      api.cleanup(() => b.cancel());
    }
  }

  /* ---------- 더블클릭 판정 ---------- */
  const GAP = 320;
  let last = null, lastBurst = null;
  api.on(photo, "pointerdown", e => {
    if (e.button !== 0) return;
    e.preventDefault();
    const r = photo.getBoundingClientRect();
    const p = { x: e.clientX - r.left, y: e.clientY - r.top };
    const now = performance.now();
    const tap = document.createElement("div");
    tap.className = "dtl-tap"; tap.style.left = p.x + "px"; tap.style.top = p.y + "px";
    photo.appendChild(tap);
    api.timeout(() => tap.remove(), 380);

    if (last && now - last.t <= GAP && dist(p.x, p.y, last.x, last.y) < 30) {
      clearTimeout(last.timer);
      api.hideHint();
      api.read("gap", Math.round(now - last.t));
      last = null;
      const at = S.at === "center" ? { x: P / 2, y: P / 2 } : p;
      api.read("pos", `${Math.round(at.x / P * 100)}, ${Math.round(at.y / P * 100)}`);
      lastBurst = now;
      if (liked && S.unlike) {
        setLiked(false);
        burst(at.x, at.y, true);
        api.flash("두 번 눌러 좋아요 취소", "alt");
      } else {
        const changed = setLiked(true);
        burst(at.x, at.y, false);
        api.flash(changed ? "더블클릭 → 좋아요" : "이미 좋아요 · 연출만 다시 보여준다", "ok");
      }
      return;
    }
    const me = { t: now, x: p.x, y: p.y, timer: 0 };
    me.timer = api.timeout(() => { if (last === me) { last = null; api.flash("한 번 클릭 · 사진은 반응하지 않는다", "idle", 1200); } }, GAP);
    last = me;
  });
  api.on(photo, "dblclick", e => e.preventDefault());

  api.on(likeBtn, "click", () => {
    api.hideHint();
    setLiked(!liked);
    api.flash(liked ? "버튼 → 좋아요" : "버튼 → 좋아요 취소", liked ? "ok" : "alt");
  });
  card.querySelectorAll(".dtl-ico").forEach(b => api.on(b, "click", () => api.flash("이 데모에서는 좋아요만 다룬다", "idle", 1200)));

  api.frame(() => {
    if (last) api.status(`한 번 눌림 · 두 번째를 기다리는 중`, "alt");
    else if (lastBurst && performance.now() - lastBurst < 900) api.status("하트 연출 중", "active");
    else api.status(liked ? "좋아요한 상태" : "대기", "idle");
  });
}
