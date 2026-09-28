/* 메인(목록) 페이지 (/) */
import "../styles/style.css";
import { categories, TAGS, catOf } from "../catalog.js";
import { items, ready, itemHref } from "../lib/items.js";
import { itemIcon } from "../icons.js";

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

$("#count").textContent = `입력 방식 ${categories.length}가지 · 항목 ${ready.length}개`;
$("#catLinks").innerHTML = categories.map(c => `<a class="cat-link" href="#${c.id}">${esc(c.name)}</a>`).join("");

// 실제로 쓰인 태그만 보여준다
const used = new Set(Object.values(items).flatMap(i => i.tags || []));
const allTags = Object.values(TAGS).flat().filter(t => used.has(t));
$("#tagbar").innerHTML = `<span class="lbl">태그</span>` + allTags.map(t => `<button class="tag" data-tag="${esc(t)}">${esc(t)}</button>`).join("");

function card(id, c) {
  const it = items[id];
  if (!it) return `<div class="card-item soon" data-id="${id}">${itemIcon(id, c.id)}<div class="nm">${esc(id)}</div><div class="df">준비 중</div></div>`;
  const home = catOf(id);
  const shared = home && home.id !== c.id ? `<div class="shared">${esc(home.name)}와 같은 항목</div>` : "";
  return `<a class="card-item" data-id="${id}" href="${itemHref(id)}">
    ${itemIcon(id, c.id)}
    <div class="nm">${esc(it.name)}<span>${esc(it.nameEn)}</span></div>
    <div class="fx">${esc(it.input)} → <em>${esc(it.effect)}</em></div>
    <div class="df">${esc(it.definition)}</div>
    ${shared}
    <div class="tg">${it.tags.map(t => "#" + esc(t)).join(" ")}</div>
  </a>`;
}

$("#list").innerHTML = categories.map(c => `
  <section class="cat" id="${c.id}">
    <div class="cat-head"><h2>${esc(c.name)}</h2><span class="en">${esc(c.en)}</span><span class="n" data-n></span></div>
    <p class="cat-desc">${esc(c.desc)}</p>
    <div class="grid">${c.items.map(id => card(id, c)).join("")}</div>
  </section>`).join("");

let tag = new URLSearchParams(location.search).get("tag"), q = "";
function apply() {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let total = 0;
  document.querySelectorAll(".cat").forEach(sec => {
    let n = 0;
    sec.querySelectorAll(".card-item").forEach(el => {
      const it = items[el.dataset.id];
      const hay = it ? [it.name, it.nameEn, it.definition, it.input, it.effect, ...(it.aliases || []), ...(it.tags || [])].join(" ").toLowerCase() : "";
      const show = it ? (!tag || it.tags.includes(tag)) && words.every(w => hay.includes(w)) : (!tag && !words.length);
      el.style.display = show ? "" : "none";
      if (show) n++;
    });
    sec.style.display = n ? "" : "none";
    sec.querySelector("[data-n]").textContent = `${n}개`;
    total += n;
  });
  $("#empty").style.display = total ? "none" : "block";
  document.querySelectorAll("#tagbar .tag").forEach(b => b.classList.toggle("on", b.dataset.tag === tag));
  $("#activeFilter").classList.toggle("on", !!tag);
  if (tag) { $("#activeTag").textContent = tag; $("#tagbar").classList.add("open"); }
  const url = new URL(location.href);
  if (tag) url.searchParams.set("tag", tag); else url.searchParams.delete("tag");
  history.replaceState(null, "", url);
}
$("#tagbar").addEventListener("click", e => {
  const b = e.target.closest(".tag"); if (!b) return;
  tag = tag === b.dataset.tag ? null : b.dataset.tag; apply();
});
$("#clearTag").addEventListener("click", () => { tag = null; apply(); });
$("#tagToggle").addEventListener("click", () => $("#tagbar").classList.toggle("open"));
$("#search").addEventListener("input", e => { q = e.target.value; apply(); });
apply();
if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
