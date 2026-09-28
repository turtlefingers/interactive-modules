/* vendor/open-peeps/peeps 의 React 부품을 SVG 조각 문자열로 바꿔 src/illo/peeps-parts.js 를 만든다.
   색은 {{ink}} / {{fill}} / {{paper}} 토큰으로 치환해 런타임에 팔레트를 입힌다.
   실행: node scripts/build-peeps.cjs */
const fs = require("fs"), path = require("path"), Module = require("module");
const ROOT = path.resolve(__dirname, ".."), SRC = path.join(ROOT, "vendor/open-peeps/peeps"), OUT = path.join(ROOT, "src/illo/peeps-parts.js");

// 부품 파일이 require("react") 하므로 가짜 React를 끼워 넣는다
const React = { createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat().filter(c => c != null && c !== false) }), useMemo: f => f() };
const origLoad = Module._load;
Module._load = function (req, ...rest) { return req === "react" ? { __esModule: true, default: React, ...React } : origLoad.call(this, req, ...rest); };

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const attr = k => k.replace(/([A-Z])/g, m => "-" + m.toLowerCase());
const FIXED = { "#FFFFFF": "{{paper}}", "#8FA7DF": "{{fill}}", "#9FD8E5": "{{paper}}", "#4F66AF": "{{ink}}" };
const unknown = new Set();
const color = v => { if (v.startsWith("{{")) return v; const u = v.toUpperCase(); if (FIXED[u]) return FIXED[u]; if (v === "none") return v; unknown.add(v); return v; };
function ser(node) {
  if (node == null || node === false) return "";
  if (typeof node !== "object") return esc(node);
  if (Array.isArray(node)) return node.map(ser).join("");
  let { type, props, children } = node;
  if (typeof type === "function") return ser(type({ ...props, children }));
  const a = { ...props }; delete a.children; delete a.id; delete a.style;
  if (a.fill) a.fill = color(a.fill);
  if (a.stroke) a.stroke = color(a.stroke);
  const attrs = Object.entries(a).filter(([, v]) => v != null && typeof v !== "object" && typeof v !== "function").map(([k, v]) => ` ${attr(k)}="${esc(v)}"`).join("");
  return `<${type}${attrs}>${ser(children)}</${type}>`;
}
const groups = {};
const dirs = { standing: "pose/standing", sitting: "pose/sitting", bust: "pose/bust", face: "face", hair: "hair", accessories: "accessories", facialHair: "facialHair" };
for (const [g, dir] of Object.entries(dirs)) {
  groups[g] = {};
  const full = path.join(SRC, dir);
  for (const f of fs.readdirSync(full).filter(f => f.endsWith(".js") && !/index|z_options/.test(f)).sort()) {
    const mod = require(path.join(full, f));
    const name = f.replace(".js", "");
    const Comp = mod[name] || mod.default || Object.values(mod)[0];
    groups[g][name] = ser(Comp({ strokeColor: "{{ink}}", backgroundColor: "{{fill}}" }));
  }
}
let out = `/* 자동 생성: node scripts/build-peeps.cjs — 직접 고치지 않는다.
   Open Peeps by Pablo Stanley (CC0) https://www.openpeeps.com */\n`;
for (const [k, v] of Object.entries(groups)) out += `export const ${k.toUpperCase()} = ${JSON.stringify(v)};\n`;
out += `export const NAMES = ${JSON.stringify(Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, Object.keys(v)])))};\n`;
fs.writeFileSync(OUT, out);
console.log("wrote", OUT, Object.entries(groups).map(([k, v]) => `${k}:${Object.keys(v).length}`).join(" "), "unknown colors:", [...unknown].join(",") || "none");
