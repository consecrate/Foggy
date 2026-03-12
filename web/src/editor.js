import { getStoredCode, storeCode } from "./storage.js";

export function initEditor(cardData, codeStorageKey) {
  var starterCode = getStoredCode(codeStorageKey) || cardData.starterCode || "";
  var editorView = createCodeMirror(document.getElementById("foggy-editor"), starterCode, {
    language: cardData.language,
    onChange: function (update) {
      if (update.docChanged) {
        storeCode(codeStorageKey, update.state.doc.toString());
      }
    },
  });

  editorView.focus();
  return editorView;
}

export function createCodeMirror(parent, doc, options) {
  var codeMirror = window.CodeMirror;
  var extensions = getBaseExtensions(codeMirror, options).concat([
    getLanguageExtension(codeMirror, options && options.language),
    codeMirror.oneDark,
    codeMirror.EditorView.theme({
      "&": { height: "100%" },
      ".cm-scroller": { overflow: "auto" },
    }),
  ]);

  if (options && options.readOnly) {
    extensions.push(codeMirror.EditorState.readOnly.of(true));
    extensions.push(codeMirror.EditorView.editable.of(false));
  } else {
    extensions.push(codeMirror.keymap.of([codeMirror.indentWithTab]));
  }

  if (options && typeof options.onChange === "function") {
    extensions.push(
      codeMirror.EditorView.updateListener.of(function (update) {
        options.onChange(update);
      })
    );
  }

  return new codeMirror.EditorView({
    state: codeMirror.EditorState.create({
      doc: doc || "",
      extensions: extensions,
    }),
    parent: parent,
  });
}

function getBaseExtensions(codeMirror, options) {
  if (!options || options.showGutters !== false || !Array.isArray(codeMirror.basicSetup)) {
    return [codeMirror.basicSetup];
  }

  return codeMirror.basicSetup.filter(function (_extension, index) {
    return index !== 0 && index !== 1 && index !== 4;
  });
}

function getLanguageExtension(codeMirror, language) {
  var normalizedLanguage = (language || "python").toLowerCase();

  switch (normalizedLanguage) {
    case "python":
    default:
      return codeMirror.python();
  }
}
