import { createCodeMirror } from "./editor.js";
import { injectIcons } from "./icons.js";

var LANG_EXT_MAP = {
  "python": "py",
  "javascript": "js",
  "html": "html",
  "css": "css",
  "java": "java",
  "cpp": "cpp",
  "c": "c",
  "csharp": "cs",
  "ruby": "rb",
  "php": "php",
  "swift": "swift",
  "go": "go",
  "rust": "rs",
  "sql": "sql",
  "typescript": "ts",
};

/**
 * Render a read-only code block with a file-name topbar and syntax highlighting.
 * Returns the CodeMirror EditorView instance.
 *
 * @param {HTMLElement} parentEl  Container to render into (will be emptied).
 * @param {string}      code      Source code to display.
 * @param {string}      language  Language identifier (e.g. "python").
 */
export function renderCodeBlock(parentEl, code, language) {
  var normalizedLang = (language || "python").toLowerCase();
  var ext = LANG_EXT_MAP[normalizedLang] || "txt";

  parentEl.replaceChildren();

  var block = document.createElement("div");
  block.className = "foggy-code-block";

  var topbar = document.createElement("div");
  topbar.className = "foggy-code-topbar";

  var tab = document.createElement("div");
  tab.className = "foggy-code-tab";

  var icon = document.createElement("span");
  icon.className = "foggy-panel-icon";
  icon.setAttribute("data-icon", "code");
  icon.setAttribute("aria-hidden", "true");

  var fileName = document.createElement("span");
  fileName.textContent = "solution." + ext;

  tab.appendChild(icon);
  tab.appendChild(fileName);
  topbar.appendChild(tab);
  block.appendChild(topbar);

  var codeContainer = document.createElement("div");
  codeContainer.className = "foggy-code-block-code";
  block.appendChild(codeContainer);

  parentEl.appendChild(block);

  injectIcons(block);

  return createCodeMirror(codeContainer, code, {
    language: normalizedLang,
    readOnly: true,
    showGutters: false,
  });
}
