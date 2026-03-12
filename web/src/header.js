import { setHidden } from "./ui.js";

export function initHeader(cardData) {
  var headerTitle = document.getElementById("foggy-header-title");
  var headerState = document.getElementById("foggy-header-state");
  var langBadge = document.getElementById("foggy-lang-badge");
  var diffBadge = document.getElementById("foggy-difficulty-badge");
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
