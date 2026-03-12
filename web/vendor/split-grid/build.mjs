// Build script for Split Grid bundle
// Run: node web/vendor/split-grid/build.mjs
import { build } from "esbuild";

build({
  entryPoints: ["web/vendor/split-grid/entry.js"],
  bundle: true,
  format: "iife",
  globalName: "SplitGrid",
  outfile: "web/vendor/split-grid/split-grid.bundle.js",
  minify: true,
  target: ["es2020"],
}).then(() => console.log("Split Grid bundle built."));
