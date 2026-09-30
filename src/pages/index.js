/* 메인(목록) 페이지 (/)
   - 기본: 4부 → 중분류 → 카드의 두 층 목차
   - 필터(효과 · 입력 방식 · 시간 구조)나 검색을 켜면 한 줄 결과 목록으로 접힌다
   - 필터 상태는 주소에 둔다: ?effect=view,reveal&input=click&timing=instant&q=… */
import "../styles/style.css";
import { PARTS, FACETS, TAXONOMY, FILTERS, order, placeOf, tagsOf, partAnchor, groupAnchor } from "../catalog.js";
import { items, itemHref } from "../lib/items.js";
import { itemIcon } from "../icons.js";

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const TAGS = Object.fromEntries(order.map(id => [id, tagsOf(id)]));
const groupCount = PARTS.reduce((n, p) => n + p.groups.filter(g => g.name).length, 0);
$("#count").textContent = `항목 ${order.length}개 · ${PARTS.length}부 · 부 안의 묶음 ${groupCount}개`;

/* 검색용 글: 이름, 다른 이름, 정의, 입력 → 효과, 한국어 태그, 자리 이름 */
const HAY = Object.fromEntries(order.map(id => {
  const it = items[id] || {}, row = TAXONOMY[id] || {}, pl = placeOf(id);
  return [id, [id, it.name, it.nameEn, it.definition, it.input, it.effect, ...(it.aliases || []),
    ...Object.values(row).flat(), pl?.group.name, pl?.part.name].filter(Boolean).join(" ").toLowerCase()];
}));

/* ---------- 카드 ---------- */
function badgeOf(id) {
  const pl = placeOf(id);
  if (pl?.part.id === "IV") return id === "idle" ? "idle" : "window";
  return TAGS[id].inputs[0];
}
function placeLabel(id) {
  const { part, group } = placeOf(id);
  return group.name ? `${group.id} ${group.name}` : `${part.no} ${part.name}`;
}
function card(id, { withPlace = false } = {}) {
  const it = items[id];
  if (!it) return `<div class="card-item soon" data-id="${id}">${itemIcon(id, badgeOf(id))}<div class="nm">${esc(id)}</div><div class="df">준비 중</div></div>`;
  return `<a class="card-item" data-id="${id}" href="${itemHref(id)}">
    ${withPlace ? `<div class="pl">${esc(placeLabel(id))}</div>` : ""}
    ${itemIcon(id, badgeOf(id))}
    <div class="nm">${esc(it.name)}<span>${esc(it.nameEn)}</span></div>
    <div class="fx">${esc(it.input)} → <em>${esc(it.effect)}</em></div>
    <div class="df">${esc(it.definition)}</div>
    <div class="tg">${(TAXONOMY[id]?.effects || []).map(esc).join(", ")}</div>
  </a>`;
}

/* ---------- 두 층 목차 (한 번만 그린다) ---------- */
const countOf = p => p.groups.reduce((n, g) => n + g.items.length, 0);
const tocHTML = PARTS.map(p => `
  <section class="part" id="${partAnchor(p)}">
    <header class="part-head">
      <div class="part-no">${esc(p.no)}<span class="n">${countOf(p)}개</span></div>
      <h2>${esc(p.name)}<span class="sub">${esc(p.sub)}</span></h2>
      <p class="part-desc">${esc(p.desc)}</p>
    </header>
    ${p.groups.map(g => `
      <section class="group${g.name ? "" : " plain"}" id="${groupAnchor(g)}">
        ${g.name ? `<div class="group-head">
          <span class="gid">${esc(g.id)}</span>
          <h3>${esc(g.name)}${g.sub ? `<span class="sub">${esc(g.sub)}</span>` : ""}</h3>
          <span class="n">${g.items.length}개</span>
        </div>
        <p class="group-desc">${esc(g.desc)}</p>` : ""}
        <div class="grid">${g.items.map(id => card(id)).join("")}</div>
      </section>`).join("")}
  </section>`).join("");

$("#jump").innerHTML = PARTS.map(p => `<span class="jump-part">
    <a class="jp" href="#${partAnchor(p)}"><b>${esc(p.no)}</b> ${esc(p.short || p.name)}</a>
    ${p.groups.filter(g => g.name).map(g => `<a class="jg" href="#${groupAnchor(g)}" title="${esc(g.name)}">${esc(g.id)}</a>`).join("")}
  </span>`).join("");

/* ---------- 필터 줄 ---------- */
$("#facets").innerHTML = FILTERS.map(f => `
  <div class="facet" data-key="${f.key}">
    <span class="lbl">${esc(f.label)}</span>
    <div class="chips">${FACETS[f.key].map(v => `<button class="chip" data-key="${f.key}" data-v="${v.id}" aria-pressed="false"${v.desc ? ` title="${esc(v.desc)}"` : ""}>${esc(v.ko)}<span class="c"></span></button>`).join("")}</div>
  </div>`).join("");

/* ---------- 상태 ---------- */
let state = readURL();
function readURL() {
  const sp = new URLSearchParams(location.search);
  const s = { q: sp.get("q") || "" };
  for (const f of FILTERS) {
    const ok = new Set(FACETS[f.key].map(v => v.id));
    s[f.key] = new Set((sp.get(f.param) || "").split(",").filter(x => ok.has(x)));
  }
  return s;
}
function writeURL(push) {
  const url = new URL(location.href);
  for (const f of FILTERS) {
    const vals = FACETS[f.key].map(v => v.id).filter(x => state[f.key].has(x));
    if (vals.length) url.searchParams.set(f.param, vals.join(",")); else url.searchParams.delete(f.param);
  }
  if (state.q.trim()) url.searchParams.set("q", state.q); else url.searchParams.delete("q");
  const next = url.pathname + url.search.replace(/%2C/gi, ",") + url.hash;
  if (next === location.pathname + location.search + location.hash) return;
  history[push ? "pushState" : "replaceState"](null, "", next);
}
const words = () => state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
/** 검색과 필터를 통과하는가. skip에 적은 필터 줄은 보지 않는다(칩 개수 셀 때) */
function passes(id, skip) {
  if (!words().every(w => HAY[id].includes(w))) return false;
  return FILTERS.every(f => f.key === skip || !state[f.key].size || TAGS[id][f.key].some(x => state[f.key].has(x)));
}
const filterCount = () => FILTERS.reduce((n, f) => n + state[f.key].size, 0);
const isActive = () => filterCount() > 0 || words().length > 0;

/* ---------- 그리기 ---------- */
let mode = null;
function render() {
  const active = isActive();
  document.body.classList.toggle("filtering", active);

  // 칩: 켜짐 상태와 개수. 이 칩을 더했을 때 남을 항목 수를 보여주고, 0이면 끈다
  document.querySelectorAll(".chip").forEach(b => {
    const { key, v } = b.dataset, on = state[key].has(v);
    const n = order.filter(id => passes(id, key) && TAGS[id][key].includes(v)).length;
    b.setAttribute("aria-pressed", on);
    b.disabled = !on && n === 0;
    b.querySelector(".c").textContent = n;
  });
  const fc = filterCount();
  $("#filterBadge").textContent = fc ? `· ${fc}` : "";

  if (!active) {
    if (mode !== "toc") { $("#list").innerHTML = tocHTML; mode = "toc"; }
    $("#empty").style.display = "none";
    return;
  }
  const hits = order.filter(id => passes(id));
  $("#list").innerHTML = hits.length ? `<div class="results"><div class="grid">${hits.map(id => card(id, { withPlace: true })).join("")}</div></div>` : "";
  mode = "flat";
  $("#empty").style.display = hits.length ? "none" : "block";
  $("#resultCount").innerHTML = `<b>${hits.length}</b>개 항목`;
  const parts = FILTERS.filter(f => state[f.key].size).map(f =>
    `${esc(f.short)}: ${FACETS[f.key].filter(v => state[f.key].has(v.id)).map(v => esc(v.ko)).join(", ")}`);
  if (words().length) parts.push(`검색 “${esc(state.q.trim())}”`);
  $("#activeSum").innerHTML = parts.join('<span class="sep">/</span>');
}

/* ---------- 이벤트 ---------- */
$("#facets").addEventListener("click", e => {
  const b = e.target.closest(".chip"); if (!b || b.disabled) return;
  const set = state[b.dataset.key];
  set.has(b.dataset.v) ? set.delete(b.dataset.v) : set.add(b.dataset.v);
  writeURL(true); render();
});
$("#clearFilters").addEventListener("click", () => {
  for (const f of FILTERS) state[f.key].clear();
  state.q = ""; $("#search").value = "";
  writeURL(true); render();
});
$("#search").value = state.q;
$("#search").addEventListener("input", e => { state.q = e.target.value; writeURL(false); render(); });
$("#filterToggle").addEventListener("click", () => {
  const open = !$("#filters").classList.contains("open");
  $("#filters").classList.toggle("open", open);
  $("#filterToggle").setAttribute("aria-expanded", open);
});
addEventListener("popstate", () => { state = readURL(); $("#search").value = state.q; render(); });

render();
if (filterCount() && matchMedia("(max-width: 900px)").matches) $("#filterToggle").click();
if (location.hash && !isActive()) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
