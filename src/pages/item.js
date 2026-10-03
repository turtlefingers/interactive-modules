/* 상세 페이지 (/<id>/) */
import "../styles/style.css";
import { order, placeOf, TAXONOMY, FILTERS, facetValue, partAnchor, groupAnchor } from "../catalog.js";
import { items, loadDemo, itemHref, homeHref } from "../lib/items.js";
import { createRuntime } from "../lib/runtime.js";

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// 주소 /pan/ 에서 id를 읽는다 (개발 중 item.html?id=pan 도 허용)
const segs = location.pathname.split("/").filter(Boolean);
const id = new URLSearchParams(location.search).get("id") || (segs.at(-1) === "item.html" ? "pan" : segs.at(-1)) || "pan";
const meta = items[id];
const place = placeOf(id);

$(".logo").href = homeHref();
const idx = order.indexOf(id);
const setNav = (el, target) => { if (target) el.href = itemHref(target); else el.setAttribute("aria-disabled", "true"); };
setNav($("#prevBtn"), order[idx - 1]); setNav($("#nextBtn"), order[idx + 1]);
// 경로: 제N부 이름 / 중분류 이름 / 항목 (제3·4부는 중분류가 없다)
$("#crumb").innerHTML = place
  ? `<a class="hide-sm" href="${homeHref("#" + partAnchor(place.part))}">${esc(place.part.no)} ${esc(place.part.name)}</a><span class="hide-sm sep">/</span>`
    + (place.group.name ? `<a class="hide-sm" href="${homeHref("#" + groupAnchor(place.group))}">${esc(place.group.name)}</a><span class="hide-sm sep">/</span>` : "")
    + `<b>${esc(meta ? meta.name : id)}</b>`
  : `<b>${esc(id)}</b>`;

/* 태그 캡슐: 바뀌는 것 · 조작 · 반응 시점 세 줄. 누르면 그 필터를 건 메인 페이지로 간다 */
function facetTagsHTML() {
  const row = TAXONOMY[id] || {};
  return FILTERS.map(f => {
    const caps = (row[f.key] || []).map(ko => facetValue(f.key, ko)).filter(Boolean)
      .map(v => `<a class="tag" href="${homeHref("", `?${f.param}=${v.id}`)}" title="${esc(v.desc ? v.desc + " " : "")}「${esc(v.ko)}」 항목 모두 보기">${esc(v.ko)}</a>`);
    return caps.length ? `<div class="tag-row"><b>${esc(f.short)}</b><div class="tags">${caps.join("")}</div></div>` : "";
  }).join("");
}

if (!meta) {
  document.title = "준비 중 · 인터랙티브 모듈들";
  $("#sidebar").innerHTML = `<div class="missing">이 항목은 아직 준비 중이다.</div>`;
} else {
  document.title = `${meta.name} ${meta.nameEn} · 인터랙티브 모듈들`;
  const S = {};
  (meta.variations || []).forEach(v => { if (v.control) S[v.control.key] = v.control.default; });
  renderSidebar(meta, S);
  bindExpert();
  const demo = await loadDemo(id);
  const runtime = createRuntime({ meta, demo, S, stage: $("#stage"), hintEl: $("#hint"), statusEl: $("#status"), statusText: $("#statusText") });
  bindSidebar(meta, S, runtime);
  runtime.mount();
  $("#reset").addEventListener("click", () => runtime.remount());
}

/* ---------- 사이드바 ---------- */
function controlHTML(c, S) {
  if (!c) return "";
  if (c.type === "toggle") return `<label class="toggle"><input type="checkbox" data-key="${c.key}" ${S[c.key] ? "checked" : ""}><span></span></label>`;
  if (c.type === "seg") return `<div class="seg" data-key="${c.key}">${c.options.map(([v, l]) => `<button data-v="${esc(v)}" class="${S[c.key] === v ? "on" : ""}">${esc(l)}</button>`).join("")}</div>`;
  return "";
}
function rangeHTML(c, S) {
  if (!c || c.type !== "range") return "";
  return `<div class="range"><input type="range" data-key="${c.key}" min="${c.min}" max="${c.max}" step="${c.step}" value="${S[c.key]}">
    <div class="ends"><span>${esc(c.ends[0])}</span><span class="val" data-val="${c.key}">${fmt(c, S[c.key])}</span><span>${esc(c.ends[1])}</span></div></div>`;
}
function fmt(c, v) {
  if (c.unit) return `${v}${c.unit}`;
  const d = c.step >= 1 ? 0 : c.step >= 0.1 ? 1 : c.step >= 0.01 ? 2 : 3;
  return (+v).toFixed(d);
}
function relLink(x) {
  if (typeof x === "string") return `<span class="plain-rel">${esc(x)}</span>`;
  return x.id && items[x.id] ? `<a href="${itemHref(x.id)}">${esc(x.text)}</a>` : `<span class="plain-rel">${esc(x.text)}</span>`;
}

function renderSidebar(I, S) {
  const dp = (I.designPoints || []).map(d => typeof d === "string" ? d : d.text);
  $("#sidebar").innerHTML = `
    <h1>${esc(I.name)}<span class="en">${esc(I.nameEn)}</span></h1>
    <div class="formula concept">${esc(I.input)}<span class="arrow">→</span><em>${esc(I.effect)}</em></div>
    <p class="def concept">${esc(I.definition)}</p>

    <section class="concept"><h2>설명</h2>${I.description.map(p => `<p>${p}</p>`).join("")}</section>
    <section class="concept"><h2>쓰임</h2><ul class="plain">${I.uses.map(u => `<li>${u}</li>`).join("")}</ul></section>
    <section class="concept"><h2>디자인 포인트</h2><ul class="plain">${dp.map(d => `<li>${d}</li>`).join("")}</ul></section>

    <section class="concept"><h2>AI 프롬프트</h2>
      <p class="prompt-note">AI에게 ${esc(I.name)} 인터랙션을 만들어달라고 할 때 아래 프롬프트를 복사해 붙여넣는다. 「간단」 프롬프트는 개념만 담고, 「상세」 프롬프트는 동작 방식까지 정해준다.</p>
      <div class="prompt">
        <div class="prompt-head">
          <div class="seg" id="promptTabs"><button data-v="simple" class="on">간단</button><button data-v="detailed">상세</button></div>
          <button class="copy-btn" id="copyPrompt">복사</button>
        </div>
        <p id="promptText">${esc(I.prompts.simple)}</p>
      </div>
    </section>

    ${(I.related || []).length ? `<section class="concept"><h2>관련 항목</h2>
      <dl class="rel">${I.related.map(r => `<dt>${esc(r.label)}</dt><dd>${r.items.map(relLink).join('<span class="dot">·</span>')}</dd>`).join("")}</dl>
    </section>` : ""}

    ${(I.references || []).length ? `<section class="concept"><h2>레퍼런스</h2>
      <ul class="refs">${I.references.map(r => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}<span>↗</span></a><p>${r.note}</p></li>`).join("")}</ul>
    </section>` : ""}

    <div class="meta concept">
      ${facetTagsHTML()}
      ${(I.aliases || []).length ? `<div class="aka"><b>다른 이름</b>${I.aliases.map(esc).join(", ")}</div>` : ""}
    </div>

    <section class="pro"><h2>읽는 값</h2><p>${I.reads}</p>
      <div class="reads">${(I.readouts || []).map(r => `<div class="read"><small>${esc(r.label)}</small><b data-read="${r.key}">–</b></div>`).join("")}</div>
    </section>

    ${(I.variations || []).length ? `<section class="pro"><h2>변주</h2>
      ${I.variations.map(v => `<div class="var"><div class="var-head"><b>${esc(v.name)}</b>${controlHTML(v.control, S)}</div><p>${v.desc}</p>${rangeHTML(v.control, S)}</div>`).join("")}
    </section>` : ""}
  `;
}

function copyFallback(text) {
  const ta = document.createElement("textarea");
  ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) {}
  ta.remove();
  return ok;
}
function copyText(text) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text).catch(() => { if (!copyFallback(text)) throw new Error(); });
  return copyFallback(text) ? Promise.resolve() : Promise.reject();
}

function bindSidebar(I, S, runtime) {
  const sb = $("#sidebar");
  const controls = (I.variations || []).map(v => v.control).filter(Boolean);
  const set = (k, v) => { S[k] = v; runtime.param(k, v); };
  sb.addEventListener("change", e => {
    const k = e.target.dataset.key;
    if (k && e.target.type === "checkbox") set(k, e.target.checked);
  });
  sb.addEventListener("input", e => {
    const k = e.target.dataset.key;
    if (k && e.target.type === "range") {
      const c = controls.find(c => c.key === k);
      set(k, +e.target.value);
      sb.querySelector(`[data-val="${k}"]`).textContent = fmt(c, S[k]);
    }
  });
  let promptTab = "simple";
  sb.addEventListener("click", e => {
    const tab = e.target.closest("#promptTabs button");
    if (tab) {
      promptTab = tab.dataset.v;
      tab.parentElement.querySelectorAll("button").forEach(b => b.classList.toggle("on", b === tab));
      $("#promptText").textContent = I.prompts[promptTab];
      return;
    }
    const copy = e.target.closest("#copyPrompt");
    if (copy) {
      copyText(I.prompts[promptTab]).then(() => {
        copy.textContent = "복사됨"; copy.classList.add("done");
        setTimeout(() => { copy.textContent = "복사"; copy.classList.remove("done"); }, 1600);
      }, () => {
        const r = document.createRange(); r.selectNodeContents($("#promptText"));
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
        copy.textContent = "선택됨 · ⌘C로 복사";
        setTimeout(() => { copy.textContent = "복사"; }, 2400);
      });
      return;
    }
    const btn = e.target.closest(".seg[data-key] button");
    if (btn) {
      const seg = btn.parentElement;
      const c = controls.find(c => c.key === seg.dataset.key);
      const opt = c.options.find(o => String(o[0]) === btn.dataset.v);
      set(seg.dataset.key, opt ? opt[0] : btn.dataset.v);
      seg.querySelectorAll("button").forEach(b => b.classList.toggle("on", b === btn));
    }
  });
}

function bindExpert() {
  const btn = $("#proBtn");
  const setExpert = on => {
    document.body.classList.toggle("expert", on);
    btn.setAttribute("aria-pressed", on);
    try { localStorage.setItem("dict-expert", on ? "1" : "0"); } catch (e) {}
  };
  btn.addEventListener("click", () => setExpert(!document.body.classList.contains("expert")));
  let saved = false;
  try { saved = localStorage.getItem("dict-expert") === "1"; } catch (e) {}
  setExpert(saved);
}
