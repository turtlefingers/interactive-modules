/* vendor/humaaans/body-parts 의 React 컴포넌트를 SVG 조각 문자열로 바꿔 src/illo/humaaans-parts.js 를 만든다.
   색은 역할 토큰({{skin}} 등)으로 치환해서 런타임에 팔레트를 입힌다.
   실행: node scripts/build-humaaans.cjs */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, ".."), SRC = path.join(ROOT, "vendor/humaaans/body-parts"), OUT = path.join(ROOT, "src/illo/humaaans-parts.js");

const React = { createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat().filter(c => c != null && c !== false) }) };
const ROLE = {
  "#B28B67": "skin", "#997659": "skin2",
  "#191847": "hair", "#000000": "hair", "#2C2C2C": "hair", "#323337": "hair",
  "#89C5CC": "cloth", "#C1DEE2": "cloth", "#1F28CF": "cloth", "#2B44FF": "cloth", "#8991DC": "cloth",
  "#69A1AC": "cloth2", "#2026A2": "cloth2", "#5C63AB": "cloth2",
  "#DDE3E9": "light", "#F2F2F2": "light", "#C5CFD6": "light2", "#E4E4E4": "light2", "#AFB9C5": "light3", "#FFFFFF": "paper", "WHITE": "paper",
  "#2F3676": "dark",
  "#FF4133": "acc", "#FF9B21": "acc", "#DB2721": "acc2", "#E87613": "acc2"
};
const unknown = new Set();
const color = c => { const k = c.toUpperCase(); if (ROLE[k]) return `{{${ROLE[k]}}}`; unknown.add(k); return c; };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const attr = k => k.replace(/([A-Z])/g, m => "-" + m.toLowerCase());
function ser(node) {
  if (node == null) return "";
  if (typeof node !== "object") return esc(node);
  if (Array.isArray(node)) return node.map(ser).join("");
  const { type, props, children } = node;
  const a = { ...props };
  delete a.id; delete a.children;
  if (a.fill && a.fill !== "none") a.fill = color(a.fill);
  if (a.stroke && a.stroke !== "none") a.stroke = color(a.stroke);
  const attrs = Object.entries(a).filter(([, v]) => v != null && typeof v !== "object").map(([k, v]) => ` ${attr(k)}="${esc(v)}"`).join("");
  return `<${type}${attrs}>${ser(children)}</${type}>`;
}
function load(file) {
  const src = fs.readFileSync(file, "utf-8").replace(/^import React from "react";/m, "").replace(/export default (\w+);/, "module.exports = $1;");
  const m = { exports: {} };
  new Function("React", "module", "exports", src)(React, m, m.exports);
  return m.exports;
}
const groups = {};
for (const dir of ["head", "torso", "standing", "sitting"]) {
  groups[dir] = {};
  for (const f of fs.readdirSync(path.join(SRC, dir)).filter(f => f.endsWith(".js")).sort()) {
    const Comp = load(path.join(SRC, dir, f));
    groups[dir][f.replace(".js", "")] = ser(Comp({}));
  }
}
let out = `/* 자동 생성: node scripts/build-humaaans.cjs — 직접 고치지 않는다.
   Humaaans by Pablo Stanley (CC BY 4.0) https://www.humaaans.com */\n`;
for (const [k, v] of Object.entries(groups)) out += `export const ${k.toUpperCase()} = ${JSON.stringify(v)};\n`;
out += `export const NAMES = ${JSON.stringify(Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, Object.keys(v)])))};\n`;
fs.writeFileSync(OUT, out);
console.log("wrote", OUT, Object.entries(groups).map(([k, v]) => `${k}:${Object.keys(v).length}`).join(" "), "unknown colors:", [...unknown].join(",") || "none");
