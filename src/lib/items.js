/* 항목 데이터 모음 — meta.js는 한꺼번에, demo.js는 필요할 때만 불러온다 */
import { order } from "../catalog.js";

const metaModules = import.meta.glob("../items/*/meta.js", { eager: true, import: "default" });
const demoLoaders = import.meta.glob("../items/*/demo.js", { import: "default" });

const idOf = path => path.split("/").at(-2);

export const items = {};
for (const [path, meta] of Object.entries(metaModules)) items[idOf(path)] = { ...meta, id: idOf(path) };

export const ready = order.filter(id => items[id]);

export async function loadDemo(id) {
  const loader = demoLoaders[`../items/${id}/demo.js`];
  return loader ? loader() : null;
}

/* 페이지 위치에 따른 루트 경로: 메인은 ./, 항목 페이지(/pan/)는 ../ */
export const ROOT = document.body.classList.contains("detail") ? "../" : "./";
export const itemHref = id => `${ROOT}${id}/`;
export const homeHref = (hash = "", query = "") => `${ROOT}${query}${hash}`;
