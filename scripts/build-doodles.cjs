/* vendor/openmoji/*.svg (OpenMoji black) 을 src/illo/doodles-parts.js 로 만든다.
   선 색 #000 → {{ink}}, 선 굵기 2 → {{lw}} 토큰으로 바꿔 런타임에 바꿀 수 있게 한다.
   실행: node scripts/build-doodles.cjs */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, ".."), SRC = path.join(ROOT, "vendor/openmoji"), OUT = path.join(ROOT, "src/illo/doodles-parts.js");
const out = {};
for (const f of fs.readdirSync(SRC).filter(f => f.endsWith(".svg")).sort()) {
  let s = fs.readFileSync(path.join(SRC, f), "utf-8");
  const vb = (s.match(/viewBox="([^"]+)"/) || [, "0 0 72 72"])[1];
  let inner = s.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  inner = inner.replace(/<g id="color">[\s\S]*?<\/g>/g, "")            // 색 버전 조각이 섞여 있으면 뺀다
    .replace(/\s(id|class)="[^"]*"/g, "")
    .replace(/(stroke|fill)="(#000|#000000|black)"/g, '$1="{{ink}}"')
    .replace(/stroke-width="2"/g, 'stroke-width="{{lw}}"')
    .replace(/\s+/g, " ").trim();
  out[f.replace(".svg", "")] = { vb, inner };
}
fs.writeFileSync(OUT, `/* 자동 생성: node scripts/build-doodles.cjs — 직접 고치지 않는다. OpenMoji (CC BY-SA 4.0) — vendor/openmoji/LICENSE.md */\nexport const DOODLES = ${JSON.stringify(out)};\n`);
console.log("wrote", OUT, Object.keys(out).length, "icons");
