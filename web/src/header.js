import { setHidden } from "./ui.js";

import { getRoot } from "./root.js";

export function initHeader(cardData) {
  var headerTitle = getRoot().getElementById("foggy-header-title");
  var headerState = getRoot().getElementById("foggy-header-state");
  var langBadge = getRoot().getElementById("foggy-lang-badge");
  var diffBadge = getRoot().getElementById("foggy-difficulty-badge");
  var title = cardData.title || "Foggy";
  var isMcq = cardData.kind === "mcq";
  var diff = (cardData.difficulty || "").toLowerCase();

  headerTitle.textContent = isMcq ? "MCQ" : title;
  headerState.textContent = cardData.isAnswer ? "Answer" : "Practice";
  setHidden(headerTitle, true);
  setHidden(headerState, true);

  if (cardData.language) {
    langBadge.textContent = cardData.language;
    setHidden(langBadge, false);
  } else {
    langBadge.textContent = "";
    setHidden(langBadge, true);
  }

  diffBadge.textContent = cardData.difficulty || "";
  diffBadge.classList.remove("easy", "medium", "hard");
  if (diff) {
    diffBadge.classList.add(diff);
  }
  setHidden(diffBadge, true);
}
