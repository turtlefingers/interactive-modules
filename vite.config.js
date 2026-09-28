import { defineConfig } from "vite";
import { resolve } from "node:path";
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";

const root = import.meta.dirname;
/* 목차의 항목 id를 매번 새로 읽는다 (개발 중 catalog.js가 바뀌어도 반영되게) */
const readOrder = () => {
  const src = readFileSync(resolve(root, "src/catalog.js"), "utf-8");
  const ids = [...src.matchAll(/items:\s*\[([^\]]*)\]/g)].flatMap(m => [...m[1].matchAll(/"([a-z0-9-]+)"/g)].map(x => x[1]));
  return [...new Set(ids)];
};

/* 항목 주소를 /pan/ 처럼 깔끔하게 만든다
   - 개발 서버: /pan/ 요청을 item.html로 넘긴다
   - 빌드: 항목마다 pan/index.html을 만들고 제목과 설명을 넣는다 */
function prettyItemUrls() {
  let outDir;
  return {
    name: "pretty-item-urls",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const m = req.url.match(/^\/([a-z0-9-]+)\/?(\?.*)?$/);
        if (m && readOrder().includes(m[1])) {
          if (!req.url.split("?")[0].endsWith("/")) { _res.writeHead(301, { Location: `/${m[1]}/${m[2] || ""}` }); return _res.end(); }
          req.url = "/item.html";
        }
        next();
      });
    },
    configResolved(c) { outDir = resolve(c.root, c.build.outDir); },
    async closeBundle() {
      const tplPath = resolve(outDir, "item.html");
      if (!existsSync(tplPath)) return;
      const html = readFileSync(tplPath, "utf-8").replace(/(src|href)="\.\/(?!\/)/g, '$1="../');
      for (const id of readOrder()) {
        const metaFile = resolve(root, `src/items/${id}/meta.js`);
        let title = "인터랙티브 모듈들", desc = "";
        if (existsSync(metaFile)) {
          const meta = (await import(pathToFileURL(metaFile).href)).default;
          title = `${meta.name} ${meta.nameEn} · 인터랙티브 모듈들`;
          desc = meta.definition;
        }
        const page = html.replace(/<title>.*?<\/title>/,
          `<title>${title}</title>\n<meta name="description" content="${desc}">\n<meta property="og:title" content="${title}">\n<meta property="og:description" content="${desc}">`);
        mkdirSync(resolve(outDir, id), { recursive: true });
        writeFileSync(resolve(outDir, id, "index.html"), page);
      }
      rmSync(tplPath);
    }
  };
}

export default defineConfig({
  // 상대 경로로 빌드해서 어느 하위 경로(GitHub Pages 등)에 올려도 동작하게 한다
  base: "./",
  plugins: [prettyItemUrls()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(root, "index.html"),
        item: resolve(root, "item.html")
      }
    }
  }
});
