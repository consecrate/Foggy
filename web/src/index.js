import { registerResultHandler, navigateHome, sendRunRequest } from "./bridge.js";
import { renderDescription } from "./description.js";
import { initEditor } from "./editor.js";
import { initHeader } from "./header.js";
import { initIcons } from "./icons.js";
import { initSplitGrid } from "./layout.js";
import { initMcqCard } from "./mcq.js";
import { renderResults, setRatingButtonsVisible } from "./results.js";
import { setRoot, getRoot } from "./root.js";
import { initTabs, setActiveTab } from "./tabs.js";
import { populateTestcases } from "./testcases.js";
import { initLeftTabs } from "./left-tabs.js";

function init() {
  var dataEl = document.getElementById("foggy-data");
  if (!dataEl) {
    return;
  }

  var cardData = JSON.parse(dataEl.textContent);

  var host = document.getElementById("foggy-host");
  if (!host) {
    return;
  }

  prepareHost(host);

  var shadow = host.shadowRoot || host.attachShadow({ mode: "open" });

  var foggyStyle = document.getElementById("foggy-style");
  var foggyTemplate = document.getElementById("foggy-template");
  if (foggyStyle) {
    shadow.innerHTML = "<style>" + foggyStyle.textContent + "</style>" + foggyTemplate.innerHTML;
  }

  setRoot(shadow);

  var state = {
    activeTab: "testcase",
    cardData: cardData,
    codeStorageKey:
      cardData.cardId && cardData.serveId
        ? "foggy:code:" + cardData.cardId + ":" + cardData.serveId
        : null,
    editorView: null,
    hasPassedTests: false,
    lastResult: null,
    solutionRevealedBeforePass: false,
  };

  initIcons();
  initHeader(cardData);
  initHomeButton();

  if (cardData.kind === "mcq") {
    initMcqCard(cardData);
    return;
  }

  getRoot().getElementById("foggy-title").textContent = cardData.title;
  renderDescription(cardData.description);

  state.editorView = initEditor(cardData, state.codeStorageKey);

  initActionButtons(function () {
    runCode(state);
  });
  initTabs(function (target) {
    setActiveTab(target, state);
  });
  initSplitGrid();
  initLeftTabs(cardData, function () {
    handleSolutionAccess(state);
  });
  setActiveTab(state.activeTab, state);
  populateTestcases(cardData);
  registerResultHandler(function (result) {
    setRunningState(false);
    state.lastResult = result;
    renderResults(result, state.cardData);

    if (result.error === null && result.passed === result.total && result.total > 0) {
      state.hasPassedTests = true;
      state.solutionRevealedBeforePass = false;
    }

    setRatingButtonsVisible(state.hasPassedTests || state.solutionRevealedBeforePass);
  });
}

function prepareHost(host) {
  host.style.display = "block";
  host.style.position = "fixed";
  host.style.inset = "0";
  host.style.margin = "0";
  host.style.padding = "0";
  host.style.border = "0";
  host.style.overflow = "hidden";
}

function initHomeButton() {
  var homeButton = getRoot().getElementById("foggy-home-btn");

  if (homeButton) {
    homeButton.addEventListener("click", navigateHome);
  }
}

function initActionButtons(onRun) {
  var runButton = getRoot().getElementById("foggy-run-btn");
  var checkButton = getRoot().getElementById("foggy-check-btn");

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
    language: state.cardData.language || "Python",
  });
}

function handleSolutionAccess(state) {
  if (state.hasPassedTests) {
    return;
  }

  state.solutionRevealedBeforePass = true;
  setActiveTab("result", state);
  renderResults(buildSolutionRevealResult(state), state.cardData);
  setRatingButtonsVisible(true);
}

function buildSolutionRevealResult(state) {
  if (state.lastResult) {
    return Object.assign({}, state.lastResult, {
      revealedWithoutPass: true,
    });
  }

  return {
    results: [],
    passed: 0,
    total: 0,
    error: null,
    revealedWithoutPass: true,
  };
}

function setRunningState(running) {
  var runButton = getRoot().getElementById("foggy-run-btn");
  var checkButton = getRoot().getElementById("foggy-check-btn");

  if (runButton) {
    runButton.textContent = running ? "Running..." : "Run";
    runButton.classList.toggle("running", running);
  }

  if (!checkButton) {
    return;
  }

  checkButton.classList.toggle("running", running);
  checkButton.innerHTML = running
    ? "Running..."
    : 'Run <span class="foggy-btn-shortcut">⌘+↵</span>';
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
