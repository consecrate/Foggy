/* Beep — Main JS: Split Grid init, CodeMirror, run logic, tabs, result rendering */

(function () {
  "use strict";

  const DESCRIPTION_ALLOWED_TAGS = new Set([
    "p",
    "br",
    "pre",
    "code",
    "strong",
    "em",
    "ul",
    "ol",
    "li",
    "blockquote",
    "a",
  ]);

  // --- State ---
  let editorView = null;
  let cardData = null;
  let activeTab = "testcase";

  // --- Init ---
  function init() {
    const dataEl = document.getElementById("beep-data");
    if (!dataEl) return;
    cardData = JSON.parse(dataEl.textContent);

    // Populate problem panel
    document.getElementById("beep-title").textContent = cardData.title;
    renderDescription(cardData.description);

    // Language badge
    const langBadge = document.getElementById("beep-lang-badge");
    langBadge.textContent = cardData.language || "Python";

    // Difficulty badge
    const diffBadge = document.getElementById("beep-difficulty-badge");
    const diff = (cardData.difficulty || "").toLowerCase();
    diffBadge.textContent = cardData.difficulty || "";
    if (diff) diffBadge.classList.add(diff);

    // Init CodeMirror
    initEditor();

    // Init actions
    initRunButton();

    // Init Split Grid
    initSplitGrid();

    // Init tabs
    initTabs();
    setActiveTab(activeTab);

    // Populate testcase tab
    populateTestcases();
  }

  // --- Split Grid ---
  function initSplitGrid() {
    var SplitGridFn = window.SplitGrid && window.SplitGrid.default
      ? window.SplitGrid.default
      : window.SplitGrid;

    if (!SplitGridFn) {
      console.warn("SplitGrid not loaded");
      return;
    }

    // Column gutter lives in #beep-grid
    SplitGridFn({
      columnGutters: [{
        track: 1,
        element: document.getElementById("beep-gutter-col"),
      }],
      columnMinSizes: { 0: 200, 2: 300 },
    });

    // Row gutter lives in #beep-right (a separate grid)
    SplitGridFn({
      rowGutters: [{
        track: 1,
        element: document.getElementById("beep-gutter-row"),
      }],
      rowMinSizes: { 0: 36, 2: 36 },
    });
  }

  // --- CodeMirror ---
  function initEditor() {
    const {
      EditorView,
      EditorState,
      basicSetup,
      python,
      oneDark,
      keymap,
      indentWithTab,
    } = window.CodeMirror;

    const starterCode = cardData.starterCode || "";

    editorView = new EditorView({
      state: EditorState.create({
        doc: starterCode + "\n    ",
        extensions: [
          basicSetup,
          python(),
          oneDark,
          keymap.of([indentWithTab]),
          EditorView.theme({
            "&": { height: "100%" },
            ".cm-scroller": { overflow: "auto" },
          }),
        ],
      }),
      parent: document.getElementById("beep-editor"),
    });

    editorView.focus();
  }

  function initRunButton() {
    var runButton = document.getElementById("beep-run-btn");
    if (runButton) {
      runButton.addEventListener("click", runCode);
    }
  }

  function renderDescription(html) {
    var container = document.getElementById("beep-description");
    container.textContent = "";

    if (!html) {
      return;
    }

    var parser = new DOMParser();
    var doc = parser.parseFromString("<div>" + html + "</div>", "text/html");
    var sourceRoot = doc.body.firstElementChild || doc.body;
    var sanitized = document.createDocumentFragment();

    sourceRoot.childNodes.forEach(function (node) {
      appendSanitizedNode(sanitized, node);
    });

    container.appendChild(sanitized);
  }

  function appendSanitizedNode(parent, node) {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.appendChild(document.createTextNode(node.textContent || ""));
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    var tagName = node.tagName.toLowerCase();
    if (!DESCRIPTION_ALLOWED_TAGS.has(tagName)) {
      node.childNodes.forEach(function (child) {
        appendSanitizedNode(parent, child);
      });
      return;
    }

    var sanitizedNode = document.createElement(tagName);
    if (tagName === "a") {
      var href = node.getAttribute("href") || "";
      if (isSafeHref(href)) {
        sanitizedNode.setAttribute("href", href);
        sanitizedNode.setAttribute("rel", "noreferrer noopener");
      }
    }

    node.childNodes.forEach(function (child) {
      appendSanitizedNode(sanitizedNode, child);
    });

    parent.appendChild(sanitizedNode);
  }

  function isSafeHref(href) {
    try {
      var url = new URL(href, window.location.href);
      return ["http:", "https:", "mailto:"].indexOf(url.protocol) !== -1;
    } catch (e) {
      return false;
    }
  }

  // --- Tabs ---
  function initTabs() {
    var tabs = document.querySelectorAll(".beep-tab");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        setActiveTab(tab.getAttribute("data-tab") || "testcase");
      });
    });
  }

  function setActiveTab(target) {
    activeTab = target;

    document.querySelectorAll(".beep-tab").forEach(function (tab) {
      var isActive = tab.getAttribute("data-tab") === target;
      tab.classList.toggle("active", isActive);
    });

    setHidden(document.getElementById("beep-tab-testcase"), target !== "testcase");
    setHidden(document.getElementById("beep-tab-result"), target !== "result");
  }

  function setHidden(element, hidden) {
    if (element) {
      element.classList.toggle("is-hidden", hidden);
    }
  }

  function renderHint(container, text) {
    var hint = document.createElement("span");
    hint.className = "beep-hint";
    hint.textContent = text;
    container.replaceChildren(hint);
  }

  // --- Testcase display ---
  function populateTestcases() {
    var container = document.getElementById("beep-testcase-content");
    container.replaceChildren();

    var cases;
    try {
      cases = JSON.parse(cardData.testCases || "[]");
    } catch (e) {
      renderHint(container, "No test cases");
      return;
    }

    if (!cases.length) {
      renderHint(container, "No test cases");
      return;
    }

    // Case tabs (Case 1, Case 2, …)
    var caseTabs = document.createElement("div");
    caseTabs.className = "beep-case-tabs";

    var caseContents = [];
    cases.forEach(function (tc, i) {
      // Tab button
      var btn = document.createElement("button");
      btn.className = "beep-case-tab" + (i === 0 ? " active" : "");
      btn.type = "button";
      btn.textContent = "Case " + (i + 1);
      btn.addEventListener("click", function () {
        caseTabs.querySelectorAll(".beep-case-tab").forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        caseContents.forEach(function (c, j) {
          setHidden(c, j !== i);
        });
      });
      caseTabs.appendChild(btn);

      // Content
      var content = document.createElement("div");
      content.className = "beep-case-content";
      setHidden(content, i !== 0);

      // Input args
      var inputArr = Array.isArray(tc.input) ? tc.input : [tc.input];
      inputArr.forEach(function (arg, argIdx) {
        var field = document.createElement("div");
        field.className = "beep-case-field";

        var label = document.createElement("div");
        label.className = "beep-case-label";
        label.textContent = "arg" + argIdx;

        var value = document.createElement("div");
        value.className = "beep-case-value";
        value.textContent = JSON.stringify(arg);

        field.appendChild(label);
        field.appendChild(value);
        content.appendChild(field);
      });

      // Expected output
      var outField = document.createElement("div");
      outField.className = "beep-case-field";

      var outLabel = document.createElement("div");
      outLabel.className = "beep-case-label";
      outLabel.textContent = "Expected";

      var outValue = document.createElement("div");
      outValue.className = "beep-case-value";
      outValue.textContent = JSON.stringify(tc.output);

      outField.appendChild(outLabel);
      outField.appendChild(outValue);
      content.appendChild(outField);

      caseContents.push(content);
    });

    container.appendChild(caseTabs);
    caseContents.forEach(function (c) {
      container.appendChild(c);
    });
  }

  // --- Run ---
  function runCode() {
    if (!editorView || !cardData) return;

    var btn = document.getElementById("beep-run-btn");
    btn.textContent = "⏳ Running...";
    btn.classList.add("running");

    setActiveTab("result");

    var code = editorView.state.doc.toString();
    var request = {
      code: code,
      functionName: cardData.functionName,
      testCases: cardData.testCases,
      language: cardData.language || "Python",
    };

    pycmd("beep:run:" + JSON.stringify(request));
  }

  // --- Receive results from Python ---
  window.beepReceiveResults = function beepReceiveResults(result) {
    var btn = document.getElementById("beep-run-btn");
    btn.textContent = "▶ Run";
    btn.classList.remove("running");

    renderResults(result);

    if (result.error === null && result.passed === result.total && result.total > 0) {
      unlockShowAnswer();
    }
  };

  // --- Render test results ---
  function renderResults(result) {
    var container = document.getElementById("beep-results-content");
    container.replaceChildren();

    if (result.error) {
      var errDiv = document.createElement("div");
      errDiv.className = "beep-error-msg";
      errDiv.textContent = result.error;
      container.appendChild(errDiv);
      return;
    }

    result.results.forEach(function (r, i) {
      var row = document.createElement("div");
      row.className = "beep-test-row";

      if (r.status === "pass") {
        appendResultText(row, "beep-test-pass", "✅ Test " + (i + 1) + ": PASS");
      } else if (r.status === "fail") {
        appendResultText(row, "beep-test-fail", "❌ Test " + (i + 1) + ": FAIL");
        appendResultText(
          row,
          "beep-test-detail",
          "Expected " + (r.expected || "") + ", got " + (r.got || "")
        );
      } else if (r.status === "error") {
        appendResultText(row, "beep-test-error", "⚠️ Test " + (i + 1) + ": ERROR");
        appendResultText(row, "beep-test-detail", r.message || "");
      }

      container.appendChild(row);
    });

    var summary = document.createElement("div");
    var allPass = result.passed === result.total;
    summary.className = "beep-summary" + (allPass ? " all-pass" : "");
    summary.textContent =
      result.passed + "/" + result.total + " tests passed" +
      (allPass ? " ✓" : "");
    container.appendChild(summary);
  }

  function unlockShowAnswer() {
    var existing = document.getElementById("beep-show-answer");
    if (existing) return;

    var btn = document.createElement("button");
    btn.id = "beep-show-answer";
    btn.type = "button";
    btn.className = "beep-show-answer-btn";
    btn.textContent = "Show Answer";
    btn.addEventListener("click", function () {
      pycmd("ans");
    });

    document.getElementById("beep-bottom-panel").appendChild(btn);
  }

  function appendResultText(parent, className, text) {
    var span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    parent.appendChild(span);
  }

  // Run init when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
