/* vendor/phylopic/*.svg (potrace 출력) 을 src/illo/animals-parts.js 로 만든다.
   각 항목: { w, h, tx, ty, sx, sy, paths: [d…] } — 그릴 때 translate(tx,ty) scale(sx,sy) 후 채운다.
   실행: node scripts/build-phylopic.cjs */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, ".."), SRC = path.join(ROOT, "vendor/phylopic"), OUT = path.join(ROOT, "src/illo/animals-parts.js");
const out = {};
for (const f of fs.readdirSync(SRC).filter(f => f.endsWith(".svg")).sort()) {
  const s = fs.readFileSync(path.join(SRC, f), "utf-8");
  const vb = s.match(/viewBox="([\d.\s-]+)"/)[1].split(/\s+/).map(Number);
  const tr = s.match(/transform="translate\(([\d.-]+),([\d.-]+)\)\s*scale\(([\d.-]+),([\d.-]+)\)"/);
  const paths = [...s.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map(m => m[1].replace(/\s+/g, " ").trim());
  out[f.replace(".svg", "")] = { w: vb[2], h: vb[3], tx: +tr[1], ty: +tr[2], sx: +tr[3], sy: +tr[4], paths };
}
fs.writeFileSync(OUT, `/* 자동 생성: node scripts/build-phylopic.cjs — 직접 고치지 않는다. PhyloPic (CC0) — 출처는 vendor/phylopic/LICENSE.md */\nexport const ANIMALS = ${JSON.stringify(out)};\n`);
console.log("wrote", OUT, Object.entries(out).map(([k, v]) => `${k}(${v.paths.length})`).join(" "));
