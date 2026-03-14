import { renderCodeBlock } from "./code-block.js";
import { getRoot } from "./root.js";
import { setHidden } from "./ui.js";

export function initLeftTabs(cardData, onSolutionAccess) {
  var tabs = getRoot().querySelectorAll("[data-left-tab]");
  var problemPanel = getRoot().getElementById("foggy-problem");
  var solutionPanel = getRoot().getElementById("foggy-solution");
  var solutionRendered = false;

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-left-tab");

      if (target === "solution" && cardData.solution && !solutionRendered) {
        var container = getRoot().getElementById("foggy-solution-content");
        renderCodeBlock(container, cardData.solution, cardData.language);
        solutionRendered = true;
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
