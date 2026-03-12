import { getStoredCode, storeCode } from "./storage.js";

export function initEditor(cardData, codeStorageKey) {
  var codeMirror = window.CodeMirror;
  var starterCode = getStoredCode(codeStorageKey) || cardData.starterCode || "";

  var editorView = new codeMirror.EditorView({
    state: codeMirror.EditorState.create({
      doc: starterCode,
      extensions: [
        codeMirror.basicSetup,
        codeMirror.python(),
        codeMirror.oneDark,
        codeMirror.keymap.of([codeMirror.indentWithTab]),
        codeMirror.EditorView.updateListener.of(function (update) {
          if (update.docChanged) {
            storeCode(codeStorageKey, update.state.doc.toString());
          }
        }),
        codeMirror.EditorView.theme({
          "&": { height: "100%" },
          ".cm-scroller": { overflow: "auto" },
        }),
      ],
    }),
    parent: document.getElementById("foggy-editor"),
  });

  editorView.focus();
  return editorView;
}
