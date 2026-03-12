import { build } from "esbuild";

build({
  entryPoints: ["web/vendor/codemirror/entry.js"],
  bundle: true,
  format: "iife",
  globalName: "CodeMirror",
  outfile: "web/vendor/codemirror/codemirror.bundle.js",
  minify: true,
  target: ["es2020"],
}).then(() => console.log("CodeMirror bundle built."));
