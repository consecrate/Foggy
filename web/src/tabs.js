import { setHidden } from "./ui.js";

export function initTabs(onSelect) {
  document.querySelectorAll(".foggy-panel-tab[data-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      onSelect(tab.getAttribute("data-tab") || "testcase");
    });
  });
}

export function setActiveTab(target, state) {
  state.activeTab = target;

  document.querySelectorAll(".foggy-panel-tab[data-tab]").forEach(function (tab) {
    var isActive = tab.getAttribute("data-tab") === target;
    tab.classList.toggle("active", isActive);
  });

  setHidden(document.getElementById("foggy-tab-testcase"), target !== "testcase");
  setHidden(document.getElementById("foggy-tab-result"), target !== "result");
}
