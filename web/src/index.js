import { registerResultHandler, navigateHome, sendRunRequest } from "./bridge.js";
import { renderDescription } from "./description.js";
import { initEditor } from "./editor.js";
import { initHeader, initSolutionTab } from "./header.js";
import { initIcons } from "./icons.js";
import { initSplitGrid } from "./layout.js";
import { renderResults, unlockShowAnswer } from "./results.js";
import { initTabs, setActiveTab } from "./tabs.js";
import { populateTestcases } from "./testcases.js";
import { setHidden } from "./ui.js";

function init() {
  var dataEl = document.getElementById("foggy-data");
  if (!dataEl) {
    return;
  }

  var cardData = JSON.parse(dataEl.textContent);
  var state = {
    activeTab: "testcase",
    cardData: cardData,
    codeStorageKey: cardData.cardId ? "foggy:code:" + cardData.cardId : null,
    editorView: null,
  };

  initIcons();
  initHeader(cardData);
  document.getElementById("foggy-title").textContent = cardData.title;
  renderDescription(cardData.description);

  state.editorView = initEditor(cardData, state.codeStorageKey);

  initActionButtons(function () {
    runCode(state);
  });
  initTabs(function (target) {
    setActiveTab(target, state);
  });
  initSplitGrid();
  initSolutionTab(cardData, setHidden);
  setActiveTab(cardData.isAnswer && cardData.solution ? "solution" : state.activeTab, state);
  populateTestcases(cardData);
  registerResultHandler(function (result) {
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
    language: state.cardData.language || "Python",
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

  var textNode = Array.prototype.find.call(checkButton.childNodes, function (node) {
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
