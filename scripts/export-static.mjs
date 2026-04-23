import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

function normalizeBasePath(input) {
  if (!input || input === "/") return "/";
  return `/${input.replace(/^\/+|\/+$/g, "")}`;
}

function withBasePath(html, basePath) {
  if (basePath === "/") return html;
  const baseNoSlash = basePath.replace(/^\/+/, "");
  const escapedBaseNoSlash = baseNoSlash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = ["href", "src", "action"];

  return patterns.reduce((output, attr) => {
    const re = new RegExp(`${attr}="/(?!${escapedBaseNoSlash}(?:/|$))`, "g");
    return output.replace(re, `${attr}="${basePath}/`);
  }, html);
}

const root = process.cwd();
const outDir = path.join(root, "dist/pages");
const clientDir = path.join(root, "dist/client");
const serverEntry = path.join(root, "dist/server/index.js");
const basePath = normalizeBasePath(process.env.STATIC_BASE_PATH || "/");
const requestUrl = `https://example.com${basePath === "/" ? "/" : `${basePath}/`}`;

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await cp(clientDir, outDir, { recursive: true });

const moduleUrl = pathToFileURL(serverEntry).href;
const mod = await import(moduleUrl);
const worker = mod.default;

if (!worker || typeof worker.fetch !== "function") {
  throw new Error("Could not load worker fetch handler from dist/server/index.js");
}

const res = await worker.fetch(new Request(requestUrl));
if (!res.ok) {
  throw new Error(`Failed to render HTML shell. Status: ${res.status}`);
}

let html = await res.text();
html = withBasePath(html, basePath);

await writeFile(path.join(outDir, "index.html"), html, "utf8");
await writeFile(path.join(outDir, "404.html"), html, "utf8");

console.log(`Static frontend exported to dist/pages (base path: ${basePath})`);
