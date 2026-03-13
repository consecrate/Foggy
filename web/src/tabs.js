import { getRoot } from "./root.js";
import { setHidden } from "./ui.js";

export function initTabs(onSelect) {
  getRoot().querySelectorAll(".foggy-panel-tab[data-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      onSelect(tab.getAttribute("data-tab") || "testcase");
    });
  });
}

export function setActiveTab(target, state) {
  state.activeTab = target;

  getRoot().querySelectorAll(".foggy-panel-tab[data-tab]").forEach(function (tab) {
    var isActive = tab.getAttribute("data-tab") === target;
    tab.classList.toggle("active", isActive);
  });

  setHidden(getRoot().getElementById("foggy-tab-testcase"), target !== "testcase");
  setHidden(getRoot().getElementById("foggy-tab-result"), target !== "result");
}
