import { getRoot } from "./root.js";
import { formatSerializedResult, hasDisplayValue } from "./format.js";
import { REVIEW_RATINGS, ensureRatingRow, removeRatingRow } from "./rating-row.js";
import {
  createDetailField,
  createDetailSection,
  renderHint,
  renderInputSection,
  renderValueSection,
  setHidden,
} from "./ui.js";
import { parseTestCases } from "./testcases.js";

export function renderResults(result, cardData) {
  var container = getRoot().getElementById("foggy-results-content");
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
    if (result.revealedWithoutPass) {
      shell.appendChild(buildSolutionRevealHeader(result, cardData));
      container.appendChild(shell);
      return;
    }

    renderHint(container, "Press Run to execute your code");
    return;
  }

  var testCases = parseTestCases(cardData);
  var selectedIndex = resultCases.findIndex(function (item) {
    return item.status !== "pass";
  });

  if (selectedIndex === -1) {
    selectedIndex = 0;
  }

  shell.appendChild(buildResultHeader(result, selectedIndex));

  var showCaseTabs = resultCases.length > 1;
  var caseTabs = showCaseTabs ? createResultRail() : null;
  var caseContents = [];

  resultCases.forEach(function (resultCase, index) {
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
    pill.addEventListener("click", function () {
      caseTabs.querySelectorAll(".foggy-case-pill").forEach(function (tab) {
        tab.setAttribute("aria-selected", "false");
      });
      pill.setAttribute("aria-selected", "true");
      caseContents.forEach(function (panel, panelIndex) {
        setHidden(panel, panelIndex !== index);
      });
    });

    caseTabs.appendChild(pill);
  });

  if (caseTabs) {
    shell.appendChild(caseTabs);
  }

  caseContents.forEach(function (content) {
    shell.appendChild(content);
  });

  container.appendChild(shell);
}

export function setRatingButtonsVisible(visible) {
  if (!visible) {
    removeRatingRow("foggy-rating-row");
    return;
  }

  ensureRatingRow({
    id: "foggy-rating-row",
    ratings: REVIEW_RATINGS,
    hidden: false,
  });
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
  count.textContent =
    result.passed +
    " / " +
    result.total +
    " " +
    (result.total === 1 ? "testcase" : "testcases") +
    " passed";

  header.appendChild(meta);
  header.appendChild(count);
  return header;
}

function buildSolutionRevealHeader(result, cardData) {
  var header = document.createElement("section");
  var total = result.total || parseTestCases(cardData).length;

  header.className = "foggy-result-header foggy-result-header--reveal";

  var meta = document.createElement("div");
  meta.className = "foggy-result-meta";

  var detailEl = document.createElement("div");
  detailEl.className = "foggy-result-detail";
  detailEl.textContent = "Reference solution opened before any full-pass submission.";

  meta.appendChild(detailEl);

  var count = document.createElement("div");
  count.className = "foggy-result-count";
  count.textContent =
    "0 / " +
    total +
    " " +
    (total === 1 ? "testcase" : "testcases") +
    " passed";

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
    return "✓";
  }
  if (status === "error") {
    return "!";
  }
  return "×";
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
    expectedText = hasDisplayValue(resultCase.expected)
      ? formatSerializedResult(resultCase.expected)
      : testcase
        ? testcase.expected
        : "";
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
