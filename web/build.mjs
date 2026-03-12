import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const jsEntry = "web/src/index.js";
const jsOutput = "web/dist/main.js";
const cssOutput = "web/dist/style.css";
const cssSources = [
  "web/styles/base.css",
  "web/styles/header.css",
  "web/styles/layout.css",
  "web/styles/panels.css",
  "web/styles/testcases.css",
  "web/styles/results.css",
  "web/styles/mcq.css",
  "web/styles/mobile.css",
];

await mkdir("web/dist", { recursive: true });

await build({
  bundle: true,
  entryPoints: [jsEntry],
  format: "iife",
  outfile: jsOutput,
  minify: false,
  target: ["es2020"],
});

const css = (await Promise.all(cssSources.map(function (path) {
  return readFile(path, "utf8");
}))).join("\n\n");

await writeFile(cssOutput, css);
