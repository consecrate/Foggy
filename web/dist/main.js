(() => {
  // web/src/bridge.js
  function navigateHome() {
    pycmd("foggy:home");
  }
  function sendRunRequest(request) {
    pycmd("foggy:run:" + JSON.stringify(request));
  }
  function registerResultHandler(handler) {
    window.foggyReceiveResults = handler;
  }

  // web/src/description.js
  var DESCRIPTION_ALLOWED_TAGS = /* @__PURE__ */ new Set([
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
    "a"
  ]);
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
    sourceRoot.childNodes.forEach(function(node) {
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
      node.childNodes.forEach(function(child) {
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
    node.childNodes.forEach(function(child) {
      appendSanitizedNode(sanitizedNode, child);
    });
    parent.appendChild(sanitizedNode);
  }
  function isSafeHref(href) {
    try {
      var url = new URL(href, window.location.href);
      return ["http:", "https:", "mailto:"].indexOf(url.protocol) !== -1;
    } catch (error) {
      return false;
    }
  }

  // web/src/storage.js
  function getStoredCode(codeStorageKey) {
    if (!codeStorageKey || !window.sessionStorage) {
      return null;
    }
    try {
      return window.sessionStorage.getItem(codeStorageKey);
    } catch (error) {
      return null;
    }
  }
  function storeCode(codeStorageKey, code) {
    if (!codeStorageKey || !window.sessionStorage) {
      return;
    }
    try {
      window.sessionStorage.setItem(codeStorageKey, code);
    } catch (error) {
    }
  }

  // web/src/editor.js
  function initEditor(cardData, codeStorageKey) {
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
          codeMirror.EditorView.updateListener.of(function(update) {
            if (update.docChanged) {
              storeCode(codeStorageKey, update.state.doc.toString());
            }
          }),
          codeMirror.EditorView.theme({
            "&": { height: "100%" },
            ".cm-scroller": { overflow: "auto" }
          })
        ]
      }),
      parent: document.getElementById("foggy-editor")
    });
    editorView.focus();
    return editorView;
  }

  // web/src/header.js
  function initHeader(cardData) {
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
  function initSolutionTab(cardData, setHidden2) {
    var hasSolution = Boolean(cardData.isAnswer && cardData.solution);
    var solutionButton = document.getElementById("foggy-solution-tab-btn");
    var solutionDivider = document.getElementById("foggy-solution-divider");
    var solutionContent = document.getElementById("foggy-solution-content");
    setHidden2(solutionButton, !hasSolution);
    setHidden2(solutionDivider, !hasSolution);
    if (!hasSolution) {
      solutionContent.textContent = "Solution unavailable";
      return;
    }
    solutionContent.textContent = cardData.solution;
  }

  // web/src/icons.js
  var ICON_SVGS = {
    close: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    description: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 8.5H12M7 12H15M7 18V20.3355C7 20.8684 7 21.1348 7.10923 21.2716C7.20422 21.3906 7.34827 21.4599 7.50054 21.4597C7.67563 21.4595 7.88367 21.2931 8.29976 20.9602L10.6852 19.0518C11.1725 18.662 11.4162 18.4671 11.6875 18.3285C11.9282 18.2055 12.1844 18.1156 12.4492 18.0613C12.7477 18 13.0597 18 13.6837 18H16.2C17.8802 18 18.7202 18 19.362 17.673C19.9265 17.3854 20.3854 16.9265 20.673 16.362C21 15.7202 21 14.8802 21 13.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V14C3 14.93 3 15.395 3.10222 15.7765C3.37962 16.8117 4.18827 17.6204 5.22354 17.8978C5.60504 18 6.07003 18 7 18Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.5708 20C19.8328 20 20.8568 18.977 20.8568 17.714V13.143L21.9998 12L20.8568 10.857V6.286C20.8568 5.023 19.8338 4 18.5708 4M5.429 4C4.166 4 3.143 5.023 3.143 6.286V10.857L2 12L3.143 13.143V17.714C3.143 18.977 4.166 20 5.429 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    testcase: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 10.5L11 12.5L15.5 8M7 18V20.3355C7 20.8684 7 21.1348 7.10923 21.2716C7.20422 21.3906 7.34827 21.4599 7.50054 21.4597C7.67563 21.4595 7.88367 21.2931 8.29976 20.9602L10.6852 19.0518C11.1725 18.662 11.4162 18.4671 11.6875 18.3285C11.9282 18.2055 12.1844 18.1156 12.4492 18.0613C12.7477 18 13.0597 18 13.6837 18H16.2C17.8802 18 18.7202 18 19.362 17.673C19.9265 17.3854 20.3854 16.9265 20.673 16.362C21 15.7202 21 14.8802 21 13.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V14C3 14.93 3 15.395 3.10222 15.7765C3.37962 16.8117 4.18827 17.6204 5.22354 17.8978C5.60504 18 6.07003 18 7 18Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "test-result": '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 9H2M6 17.5L8.5 15L6 12.5M11 17.5L15 17.5M2 7.8L2 16.2C2 17.8802 2 18.7202 2.32698 19.362C2.6146 19.9265 3.07354 20.3854 3.63803 20.673C4.27976 21 5.11984 21 6.8 21H17.2C18.8802 21 19.7202 21 20.362 20.673C20.9265 20.3854 21.3854 19.9265 21.673 19.362C22 18.7202 22 17.8802 22 16.2V7.8C22 6.11984 22 5.27977 21.673 4.63803C21.3854 4.07354 20.9265 3.6146 20.362 3.32698C19.7202 3 18.8802 3 17.2 3L6.8 3C5.11984 3 4.27976 3 3.63803 3.32698C3.07354 3.6146 2.6146 4.07354 2.32698 4.63803C2 5.27976 2 6.11984 2 7.8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    solution: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 7L5 12L9 17M15 7L19 12L15 17M13 5L11 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 4.875C1.5 3.01104 3.01104 1.5 4.875 1.5C6.20018 1.5 7.34838 2.26364 7.901 3.37829C8.1902 3.96162 8.79547 4.5 9.60112 4.5H12.25C13.4926 4.5 14.5 5.50736 14.5 6.75C14.5 7.42688 14.202 8.03329 13.7276 8.44689L13.1622 8.93972L14.1479 10.0704L14.7133 9.57758C15.5006 8.89123 16 7.8785 16 6.75C16 4.67893 14.3211 3 12.25 3H9.60112C9.51183 3 9.35322 2.93049 9.2449 2.71201C8.44888 1.1064 6.79184 0 4.875 0C2.18261 0 0 2.18261 0 4.875V6.40385C0 7.69502 0.598275 8.84699 1.52982 9.59656L2.11415 10.0667L3.0545 8.89808L2.47018 8.42791C1.87727 7.95083 1.5 7.22166 1.5 6.40385V4.875ZM7.29289 7.39645C7.68342 7.00592 8.31658 7.00592 8.70711 7.39645L11.7803 10.4697L12.3107 11L11.25 12.0607L10.7197 11.5303L8.75 9.56066V15.25V16H7.25V15.25V9.56066L5.28033 11.5303L4.75 12.0607L3.68934 11L4.21967 10.4697L7.29289 7.39645Z" fill="currentColor"/></svg>'
  };
  function initIcons() {
    document.querySelectorAll("[data-icon]").forEach(function(iconEl) {
      var iconName = iconEl.getAttribute("data-icon");
      var svg = ICON_SVGS[iconName];
      if (!svg) {
        console.warn("Unknown Foggy icon:", iconName);
        return;
      }
      iconEl.innerHTML = svg;
    });
  }

  // web/src/layout.js
  function initSplitGrid() {
    var splitGrid = window.SplitGrid && window.SplitGrid.default ? window.SplitGrid.default : window.SplitGrid;
    if (!splitGrid) {
      console.warn("SplitGrid not loaded");
      return;
    }
    splitGrid({
      columnGutters: [
        {
          track: 1,
          element: document.getElementById("foggy-gutter-col")
        }
      ],
      columnMinSizes: { 0: 200, 2: 300 }
    });
    splitGrid({
      rowGutters: [
        {
          track: 1,
          element: document.getElementById("foggy-gutter-row")
        }
      ],
      rowMinSizes: { 0: 36, 2: 36 }
    });
  }

  // web/src/format.js
  function hasDisplayValue(value) {
    return value !== void 0 && !(typeof value === "string" && value.length === 0);
  }
  function formatJsonValue(value) {
    if (value === void 0) {
      return "undefined";
    }
    var serialized = JSON.stringify(value);
    return serialized === void 0 ? String(value) : serialized;
  }
  function formatSerializedResult(value) {
    if (!hasDisplayValue(value)) {
      return "";
    }
    if (typeof value !== "string") {
      return formatJsonValue(value);
    }
    try {
      return formatJsonValue(JSON.parse(value));
    } catch (error) {
      return value;
    }
  }

  // web/src/ui.js
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
  function createDetailSection(title) {
    var section = document.createElement("section");
    section.className = "foggy-detail-section";
    var heading = document.createElement("div");
    heading.className = "foggy-detail-heading";
    heading.textContent = title;
    section.appendChild(heading);
    return section;
  }
  function createDetailField(label, valueText, modifierClass) {
    var field = document.createElement("div");
    field.className = "foggy-case-field";
    if (label) {
      var labelEl = document.createElement("div");
      labelEl.className = "foggy-case-label";
      labelEl.textContent = label;
      field.appendChild(labelEl);
    } else {
      field.classList.add("foggy-case-field--plain");
    }
    var value = document.createElement("div");
    value.className = "foggy-case-value";
    if (modifierClass) {
      value.classList.add(modifierClass);
    }
    value.textContent = valueText;
    field.appendChild(value);
    return field;
  }
  function renderInputSection(parent, inputs) {
    if (!inputs.length) {
      return;
    }
    var section = createDetailSection("Input");
    var stack = document.createElement("div");
    stack.className = "foggy-detail-stack";
    inputs.forEach(function(input) {
      stack.appendChild(createDetailField(input.label, input.value));
    });
    section.appendChild(stack);
    parent.appendChild(section);
  }
  function renderValueSection(parent, title, valueText, modifierClass) {
    if (!hasDisplayValue(valueText)) {
      return;
    }
    var section = createDetailSection(title);
    section.appendChild(createDetailField("", valueText, modifierClass));
    parent.appendChild(section);
  }

  // web/src/testcases.js
  function parseTestCases(cardData) {
    var rawCases;
    var inputNames = parseInputNames(cardData.starterCode || "");
    try {
      rawCases = JSON.parse(cardData.testCases || "[]");
    } catch (error) {
      return [];
    }
    if (!Array.isArray(rawCases)) {
      return [];
    }
    return rawCases.map(function(testCase) {
      var rawInputs = Array.isArray(testCase.input) ? testCase.input : typeof testCase.input === "undefined" ? [] : [testCase.input];
      return {
        inputs: rawInputs.map(function(value, index) {
          return {
            label: (inputNames[index] || "arg" + index) + " =",
            value: formatJsonValue(value)
          };
        }),
        expected: formatJsonValue(testCase.output)
      };
    });
  }
  function populateTestcases(cardData) {
    var container = document.getElementById("foggy-testcase-content");
    var testCases = parseTestCases(cardData);
    container.replaceChildren();
    if (!testCases.length) {
      renderHint(container, "No test cases");
      return;
    }
    var showCaseTabs = testCases.length > 1;
    var caseTabs = showCaseTabs ? createCaseRail("Test cases") : null;
    var caseContents = [];
    testCases.forEach(function(testCase, index) {
      var content = document.createElement("div");
      content.className = "foggy-case-content";
      content.setAttribute("role", "tabpanel");
      setHidden(content, index !== 0);
      renderInputSection(content, testCase.inputs);
      renderValueSection(content, "Expected", testCase.expected);
      caseContents.push(content);
      if (!caseTabs) {
        return;
      }
      var button = document.createElement("button");
      var isSelected = index === 0;
      button.className = "foggy-case-pill";
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", isSelected ? "true" : "false");
      button.textContent = "Case " + (index + 1);
      button.addEventListener("click", function() {
        caseTabs.querySelectorAll(".foggy-case-pill").forEach(function(pill) {
          pill.setAttribute("aria-selected", "false");
        });
        button.setAttribute("aria-selected", "true");
        caseContents.forEach(function(panel, panelIndex) {
          setHidden(panel, panelIndex !== index);
        });
      });
      caseTabs.appendChild(button);
    });
    if (caseTabs) {
      container.appendChild(caseTabs);
    }
    caseContents.forEach(function(content) {
      container.appendChild(content);
    });
  }
  function parseInputNames(starterCode) {
    var signatureMatch = starterCode.match(/def\s+\w+\s*\(([^)]*)\)/m) || starterCode.match(/\w+\s*\(([^)]*)\)/m);
    if (!signatureMatch) {
      return [];
    }
    return signatureMatch[1].split(",").map(function(part) {
      var name = part.trim().replace(/^\*{1,2}/, "").replace(/^const\s+/, "").split("=")[0].trim().split(":")[0].trim().replace(/[&*\[\]]/g, "").trim().split(/\s+/).pop();
      if (!name || name === "self" || name === "cls" || name === "void") {
        return "";
      }
      return name;
    }).filter(Boolean);
  }
  function createCaseRail(label) {
    var rail = document.createElement("div");
    rail.className = "foggy-case-pill-rail";
    rail.setAttribute("role", "tablist");
    rail.setAttribute("aria-label", label);
    return rail;
  }

  // web/src/results.js
  function renderResults(result, cardData) {
    var container = document.getElementById("foggy-results-content");
    var shell = document.createElement("div");
    shell.className = "foggy-result-shell";
    container.replaceChildren();
    if (result.error) {
      shell.appendChild(buildResultHeader(result, 0));
      var errorSection = createDetailSection("Details");
      errorSection.appendChild(createDetailField("", result.error, "foggy-case-value--error"));
      shell.appendChild(errorSection);
      container.appendChild(shell);
      return;
    }
    var resultCases = Array.isArray(result.results) ? result.results : [];
    if (!resultCases.length) {
      renderHint(container, "Press Run to execute your code");
      return;
    }
    var testCases = parseTestCases(cardData);
    var selectedIndex = resultCases.findIndex(function(item) {
      return item.status !== "pass";
    });
    if (selectedIndex === -1) {
      selectedIndex = 0;
    }
    shell.appendChild(buildResultHeader(result, selectedIndex));
    var showCaseTabs = resultCases.length > 1;
    var caseTabs = showCaseTabs ? createResultRail() : null;
    var caseContents = [];
    resultCases.forEach(function(resultCase, index) {
      var testcase = testCases[index] || null;
      var content = createResultCaseContent(resultCase, testcase, showCaseTabs);
      content.setAttribute("role", "tabpanel");
      setHidden(content, index !== selectedIndex);
      caseContents.push(content);
      if (!caseTabs) {
        return;
      }
      var pill = document.createElement("button");
      var isSelected = index === selectedIndex;
      var statusClass = getCaseStatusClass(resultCase.status);
      pill.className = "foggy-case-pill foggy-case-pill--result";
      pill.type = "button";
      pill.setAttribute("role", "tab");
      pill.setAttribute("aria-selected", isSelected ? "true" : "false");
      var statusIcon = document.createElement("span");
      statusIcon.className = "foggy-case-pill-status foggy-case-pill-status--" + statusClass;
      statusIcon.textContent = getCaseStatusSymbol(resultCase.status);
      statusIcon.setAttribute("aria-hidden", "true");
      var label = document.createElement("span");
      label.textContent = "Case " + (index + 1);
      pill.appendChild(statusIcon);
      pill.appendChild(label);
      pill.addEventListener("click", function() {
        caseTabs.querySelectorAll(".foggy-case-pill").forEach(function(tab) {
          tab.setAttribute("aria-selected", "false");
        });
        pill.setAttribute("aria-selected", "true");
        caseContents.forEach(function(panel, panelIndex) {
          setHidden(panel, panelIndex !== index);
        });
      });
      caseTabs.appendChild(pill);
    });
    if (caseTabs) {
      shell.appendChild(caseTabs);
    }
    caseContents.forEach(function(content) {
      shell.appendChild(content);
    });
    container.appendChild(shell);
  }
  function unlockShowAnswer() {
    var existing = document.getElementById("foggy-show-answer");
    if (existing) {
      return;
    }
    var button = document.createElement("button");
    button.id = "foggy-show-answer";
    button.type = "button";
    button.className = "foggy-show-answer-btn";
    button.textContent = "Show Answer";
    button.addEventListener("click", function() {
      pycmd("ans");
    });
    document.getElementById("foggy-bottom-panel").appendChild(button);
  }
  function buildResultHeader(result, focusIndex) {
    var header = document.createElement("section");
    var tone = "fail";
    var detail = "Output did not match the expected result.";
    var results = Array.isArray(result.results) ? result.results : [];
    var focusResult = results[focusIndex] || null;
    if (result.error) {
      tone = "error";
      detail = result.error;
    } else if (result.passed === result.total && result.total > 0) {
      tone = "pass";
      detail = "All submitted testcases passed.";
    } else if (focusResult && focusResult.status === "error") {
      tone = "error";
      detail = "Case " + (focusIndex + 1) + " raised an exception.";
    } else if (focusResult) {
      detail = "Case " + (focusIndex + 1) + " produced a different output.";
    }
    header.className = "foggy-result-header foggy-result-header--" + tone;
    var meta = document.createElement("div");
    meta.className = "foggy-result-meta";
    var detailEl = document.createElement("div");
    detailEl.className = "foggy-result-detail";
    detailEl.textContent = detail;
    meta.appendChild(detailEl);
    var count = document.createElement("div");
    count.className = "foggy-result-count";
    count.textContent = result.passed + " / " + result.total + " " + (result.total === 1 ? "testcase" : "testcases") + " passed";
    header.appendChild(meta);
    header.appendChild(count);
    return header;
  }
  function getCaseStatusClass(status) {
    if (status === "pass") {
      return "pass";
    }
    if (status === "error") {
      return "error";
    }
    return "fail";
  }
  function getCaseStatusSymbol(status) {
    if (status === "pass") {
      return "\u2713";
    }
    if (status === "error") {
      return "!";
    }
    return "\xD7";
  }
  function createResultCaseContent(resultCase, testcase, showInput) {
    var content = document.createElement("div");
    content.className = "foggy-case-content foggy-case-content--result";
    if (showInput && testcase) {
      renderInputSection(content, testcase.inputs);
    }
    if (resultCase.status === "error") {
      renderValueSection(
        content,
        "Error",
        resultCase.message || "Runtime error",
        "foggy-case-value--error"
      );
      return content;
    }
    var outputText = "";
    var expectedText = "";
    if (resultCase.status === "pass") {
      outputText = testcase ? testcase.expected : "";
      expectedText = outputText;
    } else {
      outputText = formatSerializedResult(resultCase.got);
      expectedText = hasDisplayValue(resultCase.expected) ? formatSerializedResult(resultCase.expected) : testcase ? testcase.expected : "";
    }
    renderValueSection(
      content,
      "Output",
      outputText,
      resultCase.status === "fail" ? "foggy-case-value--danger" : "foggy-case-value--success"
    );
    renderValueSection(content, "Expected", expectedText);
    return content;
  }
  function createResultRail() {
    var rail = document.createElement("div");
    rail.className = "foggy-case-pill-rail foggy-case-pill-rail--results";
    rail.setAttribute("role", "tablist");
    rail.setAttribute("aria-label", "Test results");
    return rail;
  }

  // web/src/tabs.js
  function initTabs(onSelect) {
    document.querySelectorAll(".foggy-panel-tab[data-tab]").forEach(function(tab) {
      tab.addEventListener("click", function() {
        onSelect(tab.getAttribute("data-tab") || "testcase");
      });
    });
  }
  function setActiveTab(target, state) {
    state.activeTab = target;
    document.querySelectorAll(".foggy-panel-tab[data-tab]").forEach(function(tab) {
      var isActive = tab.getAttribute("data-tab") === target;
      tab.classList.toggle("active", isActive);
    });
    setHidden(document.getElementById("foggy-tab-testcase"), target !== "testcase");
    setHidden(document.getElementById("foggy-tab-result"), target !== "result");
    setHidden(document.getElementById("foggy-tab-solution"), target !== "solution");
  }

  // web/src/index.js
  function init() {
    var dataEl = document.getElementById("foggy-data");
    if (!dataEl) {
      return;
    }
    var cardData = JSON.parse(dataEl.textContent);
    var state = {
      activeTab: "testcase",
      cardData,
      codeStorageKey: cardData.cardId ? "foggy:code:" + cardData.cardId : null,
      editorView: null
    };
    initIcons();
    initHeader(cardData);
    document.getElementById("foggy-title").textContent = cardData.title;
    renderDescription(cardData.description);
    state.editorView = initEditor(cardData, state.codeStorageKey);
    initActionButtons(function() {
      runCode(state);
    });
    initTabs(function(target) {
      setActiveTab(target, state);
    });
    initSplitGrid();
    initSolutionTab(cardData, setHidden);
    setActiveTab(cardData.isAnswer && cardData.solution ? "solution" : state.activeTab, state);
    populateTestcases(cardData);
    registerResultHandler(function(result) {
      setRunningState(false);
      renderResults(result, state.cardData);
      if (result.error === null && result.passed === result.total && result.total > 0) {
        unlockShowAnswer();
      }
    });
  }
  function initActionButtons(onRun) {
    var homeButton = document.getElementById("foggy-home-btn");
    var runButton = document.getElementById("foggy-run-btn");
    var checkButton = document.getElementById("foggy-check-btn");
    if (homeButton) {
      homeButton.addEventListener("click", navigateHome);
    }
    if (runButton) {
      runButton.addEventListener("click", onRun);
    }
    if (checkButton) {
      checkButton.addEventListener("click", onRun);
    }
  }
  function runCode(state) {
    if (!state.editorView || !state.cardData) {
      return;
    }
    setRunningState(true);
    setActiveTab("result", state);
    sendRunRequest({
      code: state.editorView.state.doc.toString(),
      functionName: state.cardData.functionName,
      testCases: state.cardData.testCases,
      language: state.cardData.language || "Python"
    });
  }
  function setRunningState(running) {
    var runButton = document.getElementById("foggy-run-btn");
    var checkButton = document.getElementById("foggy-check-btn");
    if (runButton) {
      runButton.textContent = running ? "Running..." : "Run";
      runButton.classList.toggle("running", running);
    }
    if (!checkButton) {
      return;
    }
    checkButton.classList.toggle("running", running);
    var iconSpan = checkButton.querySelector(".foggy-check-icon");
    if (iconSpan) {
      iconSpan.style.display = running ? "none" : "";
    }
    var textNode = Array.prototype.find.call(checkButton.childNodes, function(node) {
      return node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0;
    });
    if (textNode) {
      textNode.textContent = running ? " Checking..." : "Check";
      return;
    }
    checkButton.appendChild(document.createTextNode(running ? " Checking..." : "Check"));
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
