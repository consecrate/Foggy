import { formatJsonValue } from "./format.js";
import { getRoot } from "./root.js";
import { renderHint, renderInputSection, renderValueSection, setHidden } from "./ui.js";

export function parseTestCases(cardData) {
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

  return rawCases.map(function (testCase) {
    var rawInputs = Array.isArray(testCase.input)
      ? testCase.input
      : typeof testCase.input === "undefined"
        ? []
        : [testCase.input];

    return {
      inputs: rawInputs.map(function (value, index) {
        return {
          label: (inputNames[index] || "arg" + index) + " =",
          value: formatJsonValue(value),
        };
      }),
      expected: formatJsonValue(testCase.output),
    };
  });
}

export function populateTestcases(cardData) {
  var container = getRoot().getElementById("foggy-testcase-content");
  var testCases = parseTestCases(cardData);

  container.replaceChildren();

  if (!testCases.length) {
    renderHint(container, "No test cases");
    return;
  }

  var showCaseTabs = testCases.length > 1;
  var caseTabs = showCaseTabs ? createCaseRail("Test cases") : null;
  var caseContents = [];

  testCases.forEach(function (testCase, index) {
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
    button.addEventListener("click", function () {
      caseTabs.querySelectorAll(".foggy-case-pill").forEach(function (pill) {
        pill.setAttribute("aria-selected", "false");
      });
      button.setAttribute("aria-selected", "true");
      caseContents.forEach(function (panel, panelIndex) {
        setHidden(panel, panelIndex !== index);
      });
    });
    caseTabs.appendChild(button);
  });

  if (caseTabs) {
    container.appendChild(caseTabs);
  }

  caseContents.forEach(function (content) {
    container.appendChild(content);
  });
}

function parseInputNames(starterCode) {
  var signatureMatch =
    starterCode.match(/def\s+\w+\s*\(([^)]*)\)/m) ||
    starterCode.match(/\w+\s*\(([^)]*)\)/m);

  if (!signatureMatch) {
    return [];
  }

  return signatureMatch[1]
    .split(",")
    .map(function (part) {
      var name = part
        .trim()
        .replace(/^\*{1,2}/, "")
        .replace(/^const\s+/, "")
        .split("=")[0]
        .trim()
        .split(":")[0]
        .trim()
        .replace(/[&*\[\]]/g, "")
        .trim()
        .split(/\s+/)
        .pop();

      if (!name || name === "self" || name === "cls" || name === "void") {
        return "";
      }

      return name;
    })
    .filter(Boolean);
}

function createCaseRail(label) {
  var rail = document.createElement("div");
  rail.className = "foggy-case-pill-rail";
  rail.setAttribute("role", "tablist");
  rail.setAttribute("aria-label", label);
  return rail;
}
