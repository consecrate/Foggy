import { createCodeMirror } from "./editor.js";
import { setHidden } from "./ui.js";

export function initLeftTabs(cardData, onSolutionAccess) {
  var tabs = document.querySelectorAll("[data-left-tab]");
  var problemPanel = document.getElementById("foggy-problem");
  var solutionPanel = document.getElementById("foggy-solution");
  var solutionView = null;

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-left-tab");

      if (target === "solution" && cardData.solution && !solutionView) {
        solutionView = renderSolution(cardData.solution, cardData.language);
      }

      if (target === "solution" && typeof onSolutionAccess === "function") {
        onSolutionAccess();
      }

      tabs.forEach(function (t) {
        t.classList.toggle("active", t === tab);
      });

      setHidden(problemPanel, target !== "description");
      setHidden(solutionPanel, target !== "solution");
    });
  });
}

function renderSolution(code, lang) {
  var container = document.getElementById("foggy-solution-code");
  container.replaceChildren();
  return createCodeMirror(container, code, {
    language: lang,
    readOnly: true,
    showGutters: false,
  });
}
