export function initHeader(cardData) {
  var headerTitle = document.getElementById("foggy-header-title");
  var headerState = document.getElementById("foggy-header-state");
  var langBadge = document.getElementById("foggy-lang-badge");
  var diffBadge = document.getElementById("foggy-difficulty-badge");
  var diff = (cardData.difficulty || "").toLowerCase();

  headerTitle.textContent = cardData.title || "Foggy";
  headerState.textContent = cardData.isAnswer ? "Solution" : "Practice";
  langBadge.textContent = cardData.language || "Python";

  diffBadge.textContent = cardData.difficulty || "";
  diffBadge.classList.remove("easy", "medium", "hard");
  if (diff) {
    diffBadge.classList.add(diff);
  }
}

export function initSolutionTab(cardData, setHidden) {
  var hasSolution = Boolean(cardData.isAnswer && cardData.solution);
  var solutionButton = document.getElementById("foggy-solution-tab-btn");
  var solutionDivider = document.getElementById("foggy-solution-divider");
  var solutionContent = document.getElementById("foggy-solution-content");

  setHidden(solutionButton, !hasSolution);
  setHidden(solutionDivider, !hasSolution);

  if (!hasSolution) {
    solutionContent.textContent = "Solution unavailable";
    return;
  }

  solutionContent.textContent = cardData.solution;
}
