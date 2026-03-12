/* Foggy — Main JS: Split Grid init, CodeMirror, run logic, tabs, result rendering */

(function () {
  "use strict";

  const ICON_SVGS = {
    close: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    description: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 8.5H12M7 12H15M7 18V20.3355C7 20.8684 7 21.1348 7.10923 21.2716C7.20422 21.3906 7.34827 21.4599 7.50054 21.4597C7.67563 21.4595 7.88367 21.2931 8.29976 20.9602L10.6852 19.0518C11.1725 18.662 11.4162 18.4671 11.6875 18.3285C11.9282 18.2055 12.1844 18.1156 12.4492 18.0613C12.7477 18 13.0597 18 13.6837 18H16.2C17.8802 18 18.7202 18 19.362 17.673C19.9265 17.3854 20.3854 16.9265 20.673 16.362C21 15.7202 21 14.8802 21 13.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V14C3 14.93 3 15.395 3.10222 15.7765C3.37962 16.8117 4.18827 17.6204 5.22354 17.8978C5.60504 18 6.07003 18 7 18Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.5708 20C19.8328 20 20.8568 18.977 20.8568 17.714V13.143L21.9998 12L20.8568 10.857V6.286C20.8568 5.023 19.8338 4 18.5708 4M5.429 4C4.166 4 3.143 5.023 3.143 6.286V10.857L2 12L3.143 13.143V17.714C3.143 18.977 4.166 20 5.429 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    testcase: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 10.5L11 12.5L15.5 8M7 18V20.3355C7 20.8684 7 21.1348 7.10923 21.2716C7.20422 21.3906 7.34827 21.4599 7.50054 21.4597C7.67563 21.4595 7.88367 21.2931 8.29976 20.9602L10.6852 19.0518C11.1725 18.662 11.4162 18.4671 11.6875 18.3285C11.9282 18.2055 12.1844 18.1156 12.4492 18.0613C12.7477 18 13.0597 18 13.6837 18H16.2C17.8802 18 18.7202 18 19.362 17.673C19.9265 17.3854 20.3854 16.9265 20.673 16.362C21 15.7202 21 14.8802 21 13.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V14C3 14.93 3 15.395 3.10222 15.7765C3.37962 16.8117 4.18827 17.6204 5.22354 17.8978C5.60504 18 6.07003 18 7 18Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "test-result": '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 9H2M6 17.5L8.5 15L6 12.5M11 17.5L15 17.5M2 7.8L2 16.2C2 17.8802 2 18.7202 2.32698 19.362C2.6146 19.9265 3.07354 20.3854 3.63803 20.673C4.27976 21 5.11984 21 6.8 21H17.2C18.8802 21 19.7202 21 20.362 20.673C20.9265 20.3854 21.3854 19.9265 21.673 19.362C22 18.7202 22 17.8802 22 16.2V7.8C22 6.11984 22 5.27977 21.673 4.63803C21.3854 4.07354 20.9265 3.6146 20.362 3.32698C19.7202 3 18.8802 3 17.2 3L6.8 3C5.11984 3 4.27976 3 3.63803 3.32698C3.07354 3.6146 2.6146 4.07354 2.32698 4.63803C2 5.27976 2 6.11984 2 7.8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    solution: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 7L5 12L9 17M15 7L19 12L15 17M13 5L11 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 4.875C1.5 3.01104 3.01104 1.5 4.875 1.5C6.20018 1.5 7.34838 2.26364 7.901 3.37829C8.1902 3.96162 8.79547 4.5 9.60112 4.5H12.25C13.4926 4.5 14.5 5.50736 14.5 6.75C14.5 7.42688 14.202 8.03329 13.7276 8.44689L13.1622 8.93972L14.1479 10.0704L14.7133 9.57758C15.5006 8.89123 16 7.8785 16 6.75C16 4.67893 14.3211 3 12.25 3H9.60112C9.51183 3 9.35322 2.93049 9.2449 2.71201C8.44888 1.1064 6.79184 0 4.875 0C2.18261 0 0 2.18261 0 4.875V6.40385C0 7.69502 0.598275 8.84699 1.52982 9.59656L2.11415 10.0667L3.0545 8.89808L2.47018 8.42791C1.87727 7.95083 1.5 7.22166 1.5 6.40385V4.875ZM7.29289 7.39645C7.68342 7.00592 8.31658 7.00592 8.70711 7.39645L11.7803 10.4697L12.3107 11L11.25 12.0607L10.7197 11.5303L8.75 9.56066V15.25V16H7.25V15.25V9.56066L5.28033 11.5303L4.75 12.0607L3.68934 11L4.21967 10.4697L7.29289 7.39645Z" fill="currentColor"/></svg>',
  };

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
  let codeStorageKey = null;

  // --- Init ---
  function init() {
    const dataEl = document.getElementById("foggy-data");
    if (!dataEl) return;
    cardData = JSON.parse(dataEl.textContent);
    codeStorageKey = cardData.cardId ? "foggy:code:" + cardData.cardId : null;

    initIcons();

    // Populate header and problem panel
    initHeader();
    document.getElementById("foggy-title").textContent = cardData.title;
    renderDescription(cardData.description);

    // Init CodeMirror
    initEditor();

    // Init actions
    initHomeButton();
    initRunButton();
    initCheckButton();

    // Init Split Grid
    initSplitGrid();

    // Init tabs
    initTabs();
    initSolutionTab();
    setActiveTab(cardData.isAnswer && cardData.solution ? "solution" : activeTab);

    // Populate testcase tab
    populateTestcases();
  }

  function initHeader() {
    var headerTitle = document.getElementById("foggy-header-title");
    var headerState = document.getElementById("foggy-header-state");
    var langBadge = document.getElementById("foggy-lang-badge");
    var diffBadge = document.getElementById("foggy-difficulty-badge");
    var diff = (cardData.difficulty || "").toLowerCase();

    headerTitle.textContent = cardData.title || "Foggy";
    headerState.textContent = cardData.isAnswer ? "Solution" : "Practice";
    langBadge.textContent = cardData.language || "Python";

    diffBadge.textContent = cardData.difficulty || "";
    diffBadge.classList.remove("easy", "medium", "hard");
    if (diff) {
      diffBadge.classList.add(diff);
    }
  }

  function initIcons() {
    document.querySelectorAll("[data-icon]").forEach(function (iconEl) {
      var iconName = iconEl.getAttribute("data-icon");
      var svg = ICON_SVGS[iconName];

      if (!svg) {
        console.warn("Unknown Foggy icon:", iconName);
        return;
      }

      iconEl.innerHTML = svg;
    });
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

    // Column gutter lives in #foggy-grid
    SplitGridFn({
      columnGutters: [{
        track: 1,
        element: document.getElementById("foggy-gutter-col"),
      }],
      columnMinSizes: { 0: 200, 2: 300 },
    });

    // Row gutter lives in #foggy-right (a separate grid)
    SplitGridFn({
      rowGutters: [{
        track: 1,
        element: document.getElementById("foggy-gutter-row"),
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

    const starterCode = getStoredCode() || cardData.starterCode || "";

    editorView = new EditorView({
      state: EditorState.create({
        doc: starterCode,
        extensions: [
          basicSetup,
          python(),
          oneDark,
          keymap.of([indentWithTab]),
          EditorView.updateListener.of(function (update) {
            if (update.docChanged) {
              storeCode(update.state.doc.toString());
            }
          }),
          EditorView.theme({
            "&": { height: "100%" },
            ".cm-scroller": { overflow: "auto" },
          }),
        ],
      }),
      parent: document.getElementById("foggy-editor"),
    });

    editorView.focus();
  }

  function initHomeButton() {
    var homeButton = document.getElementById("foggy-home-btn");
    if (homeButton) {
      homeButton.addEventListener("click", function () {
        pycmd("foggy:home");
      });
    }
  }

  function initRunButton() {
    var runButton = document.getElementById("foggy-run-btn");
    if (runButton) {
      runButton.addEventListener("click", runCode);
    }
  }

  function initCheckButton() {
    var checkButton = document.getElementById("foggy-check-btn");
    if (checkButton) {
      checkButton.addEventListener("click", runCode);
    }
  }

  function initSolutionTab() {
    var hasSolution = Boolean(cardData.isAnswer && cardData.solution);
    var solutionButton = document.getElementById("foggy-solution-tab-btn");
    var solutionDivider = document.getElementById("foggy-solution-divider");
    var solutionContent = document.getElementById("foggy-solution-content");

    setHidden(solutionButton, !hasSolution);
    setHidden(solutionDivider, !hasSolution);

    if (!hasSolution) {
      solutionContent.textContent = "Solution unavailable";
      return;
    }

    solutionContent.textContent = cardData.solution;
  }

  function renderDescription(html) {
    var container = document.getElementById("foggy-description");
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
    var tabs = document.querySelectorAll(".foggy-panel-tab[data-tab]");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        setActiveTab(tab.getAttribute("data-tab") || "testcase");
      });
    });
  }

  function setActiveTab(target) {
    activeTab = target;

    document.querySelectorAll(".foggy-panel-tab[data-tab]").forEach(function (tab) {
      var isActive = tab.getAttribute("data-tab") === target;
      tab.classList.toggle("active", isActive);
    });

    setHidden(document.getElementById("foggy-tab-testcase"), target !== "testcase");
    setHidden(document.getElementById("foggy-tab-result"), target !== "result");
    setHidden(document.getElementById("foggy-tab-solution"), target !== "solution");
  }

  function setHidden(element, hidden) {
    if (element) {
      element.classList.toggle("is-hidden", hidden);
    }
  }

  function renderHint(container, text) {
    var hint = document.createElement("span");
    hint.className = "foggy-hint";
    hint.textContent = text;
    container.replaceChildren(hint);
  }

  // --- Testcase display ---
  function populateTestcases() {
    var container = document.getElementById("foggy-testcase-content");
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

    var showCaseTabs = cases.length > 1;
    var caseTabs = null;
    if (showCaseTabs) {
      // Case pills (Case 1, Case 2, ...)
      caseTabs = document.createElement("div");
      caseTabs.className = "foggy-case-pill-rail";
      caseTabs.setAttribute("role", "tablist");
      caseTabs.setAttribute("aria-label", "Test cases");
    }

    var caseContents = [];
    cases.forEach(function (tc, i) {
      // Pill button
      var btn = document.createElement("button");
      var isSelected = i === 0;
      btn.className = "foggy-case-pill";
      btn.type = "button";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", isSelected ? "true" : "false");
      btn.textContent = "Case " + (i + 1);
      btn.addEventListener("click", function () {
        caseTabs.querySelectorAll(".foggy-case-pill").forEach(function (b) {
          b.setAttribute("aria-selected", "false");
        });
        btn.setAttribute("aria-selected", "true");
        caseContents.forEach(function (c, j) {
          setHidden(c, j !== i);
        });
      });
      if (showCaseTabs) {
        caseTabs.appendChild(btn);
      }

      // Content
      var content = document.createElement("div");
      content.className = "foggy-case-content";
      content.setAttribute("role", "tabpanel");
      setHidden(content, i !== 0);

      // Input args
      var inputArr = Array.isArray(tc.input) ? tc.input : [tc.input];
      inputArr.forEach(function (arg, argIdx) {
        var field = document.createElement("div");
        field.className = "foggy-case-field";

        var label = document.createElement("div");
        label.className = "foggy-case-label";
        label.textContent = "arg" + argIdx;

        var value = document.createElement("div");
        value.className = "foggy-case-value";
        value.textContent = JSON.stringify(arg);

        field.appendChild(label);
        field.appendChild(value);
        content.appendChild(field);
      });

      // Expected output
      var outField = document.createElement("div");
      outField.className = "foggy-case-field";

      var outLabel = document.createElement("div");
      outLabel.className = "foggy-case-label";
      outLabel.textContent = "Expected";

      var outValue = document.createElement("div");
      outValue.className = "foggy-case-value";
      outValue.textContent = JSON.stringify(tc.output);

      outField.appendChild(outLabel);
      outField.appendChild(outValue);
      content.appendChild(outField);

      caseContents.push(content);
    });

    if (showCaseTabs) {
      container.appendChild(caseTabs);
    }
    caseContents.forEach(function (c) {
      container.appendChild(c);
    });
  }

  // --- Run ---
  function runCode() {
    if (!editorView || !cardData) return;

    var btn = document.getElementById("foggy-run-btn");
    btn.textContent = "Running...";
    btn.classList.add("running");

    var checkBtn = document.getElementById("foggy-check-btn");
    if (checkBtn) {
      checkBtn.classList.add("running");
      var iconSpan = checkBtn.querySelector(".foggy-check-icon");
      if (iconSpan) iconSpan.style.display = "none";
      checkBtn.lastChild.textContent = " Checking...";
    }

    setActiveTab("result");

    var code = editorView.state.doc.toString();
    var request = {
      code: code,
      functionName: cardData.functionName,
      testCases: cardData.testCases,
      language: cardData.language || "Python",
    };

    pycmd("foggy:run:" + JSON.stringify(request));
  }

  // --- Receive results from Python ---
  window.foggyReceiveResults = function foggyReceiveResults(result) {
    var btn = document.getElementById("foggy-run-btn");
    btn.textContent = "Run";
    btn.classList.remove("running");

    var checkBtn = document.getElementById("foggy-check-btn");
    if (checkBtn) {
      checkBtn.classList.remove("running");
      var iconSpan = checkBtn.querySelector(".foggy-check-icon");
      if (iconSpan) iconSpan.style.display = "";
      checkBtn.lastChild.textContent = "Check";
    }

    renderResults(result);

    if (result.error === null && result.passed === result.total && result.total > 0) {
      unlockShowAnswer();
    }
  };

  // --- Render test results ---
  function renderResults(result) {
    var container = document.getElementById("foggy-results-content");
    container.replaceChildren();

    if (result.error) {
      var errDiv = document.createElement("div");
      errDiv.className = "foggy-error-msg";
      errDiv.textContent = result.error;
      container.appendChild(errDiv);
      return;
    }

    result.results.forEach(function (r, i) {
      var row = document.createElement("div");
      row.className = "foggy-test-row";

      if (r.status === "pass") {
        appendResultText(row, "foggy-test-pass", "✅ Test " + (i + 1) + ": PASS");
      } else if (r.status === "fail") {
        appendResultText(row, "foggy-test-fail", "❌ Test " + (i + 1) + ": FAIL");
        appendResultText(
          row,
          "foggy-test-detail",
          "Expected " + (r.expected || "") + ", got " + (r.got || "")
        );
      } else if (r.status === "error") {
        appendResultText(row, "foggy-test-error", "⚠️ Test " + (i + 1) + ": ERROR");
        appendResultText(row, "foggy-test-detail", r.message || "");
      }

      container.appendChild(row);
    });

    var summary = document.createElement("div");
    var allPass = result.passed === result.total;
    summary.className = "foggy-summary" + (allPass ? " all-pass" : "");
    summary.textContent =
      result.passed + "/" + result.total + " tests passed" +
      (allPass ? " ✓" : "");
    container.appendChild(summary);
  }

  function getStoredCode() {
    if (!codeStorageKey || !window.sessionStorage) {
      return null;
    }

    try {
      return window.sessionStorage.getItem(codeStorageKey);
    } catch (e) {
      return null;
    }
  }

  function storeCode(code) {
    if (!codeStorageKey || !window.sessionStorage) {
      return;
    }

    try {
      window.sessionStorage.setItem(codeStorageKey, code);
    } catch (e) {
      // Ignore storage failures in embedded webviews.
    }
  }

  function unlockShowAnswer() {
    var existing = document.getElementById("foggy-show-answer");
    if (existing) return;

    var btn = document.createElement("button");
    btn.id = "foggy-show-answer";
    btn.type = "button";
    btn.className = "foggy-show-answer-btn";
    btn.textContent = "Show Answer";
    btn.addEventListener("click", function () {
      pycmd("ans");
    });

    document.getElementById("foggy-bottom-panel").appendChild(btn);
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
