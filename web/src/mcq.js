import { answerCard, playFeedbackSound } from "./bridge.js";
import { renderCodeBlock } from "./code-block.js";
import { FIRST_TRY_RATINGS, ensureRatingRow } from "./rating-row.js";
import { getRoot } from "./root.js";

import { setHidden } from "./ui.js";

export function initMcqCard(cardData) {
  var choiceConfig = buildChoices(cardData.choices);
  var state = {
    cardData: cardData,
    choices: shuffleChoices(choiceConfig.choices),
    hasValidAnswer: choiceConfig.valid,
    hadWrongAttempt: false,
    solvedOnFirstTry: false,
    pendingContinue: false,
    selectedId: null,
    lastEliminatedChoice: null,
  };

  prepareLayout(cardData);
  bindPrimaryAction(state);
  bindRatingActions();
  renderMcq(state);
}

function prepareLayout(cardData) {
  var container = getRoot().getElementById("foggy-container");
  var grid = getRoot().getElementById("foggy-grid");
  var mcqView = getRoot().getElementById("foggy-mcq-view");
  var headerRun = getRoot().getElementById("foggy-run-btn");
  var mcqActions = getRoot().getElementById("foggy-mcq-actions");
  var question = getRoot().getElementById("foggy-mcq-question");
  container.classList.add("foggy-container--mcq");
  setHidden(grid, true);
  setHidden(mcqView, false);
  setHidden(headerRun, true);
  setHidden(mcqActions, true);

  question.textContent = cardData.question || cardData.title || "Untitled question";

  if (cardData.code && cardData.code.snippet) {
    var lineCount = cardData.code.snippet.split("\n").length;

    if (lineCount > 10) {
      var codePanel = getRoot().getElementById("foggy-mcq-code-panel");
      mcqView.classList.add("has-code");
      setHidden(codePanel, false);
      renderCodeBlock(codePanel, cardData.code.snippet, cardData.code.language);
    } else {
      mcqView.classList.add("has-code-inline");
      var inlineCode = document.createElement("div");
      inlineCode.id = "foggy-mcq-code-inline";
      var panel = getRoot().getElementById("foggy-mcq-panel");
      var choices = getRoot().getElementById("foggy-mcq-choices");
      panel.insertBefore(inlineCode, choices);
      renderCodeBlock(inlineCode, cardData.code.snippet, cardData.code.language);
    }
  }
}

function bindPrimaryAction(state) {
  var button = getRoot().getElementById("foggy-check-btn");
  button.addEventListener("click", function () {
    handlePrimaryAction(state);
  });
}

function bindRatingActions() {
  ensureRatingRow({
    id: "foggy-mcq-rating-row",
    ratings: FIRST_TRY_RATINGS,
    hidden: true,
  });
}

function handlePrimaryAction(state) {
  if (state.pendingContinue) {
    answerCard(state.hadWrongAttempt ? 1 : 3);
    return;
  }

  if (state.solvedOnFirstTry) {
    answerCard(3);
    return;
  }

  if (!state.hasValidAnswer || !state.selectedId) {
    return;
  }

  var selectedChoice = findChoice(state.choices, state.selectedId);
  if (!selectedChoice) {
    return;
  }

  if (selectedChoice.isCorrect) {
    playFeedbackSound("correct");

    if (state.hadWrongAttempt) {
      state.pendingContinue = true;
      renderMcq(state);
      return;
    }

    state.solvedOnFirstTry = true;
    renderMcq(state);
    return;
  }

  playFeedbackSound("incorrect");
  selectedChoice.isEliminated = true;
  state.lastEliminatedChoice = selectedChoice;
  state.selectedId = null;
  state.hadWrongAttempt = true;
  renderMcq(state);
}

function renderMcq(state) {
  renderChoices(state);
  renderFeedback(state);
  renderActions(state);
}

function renderChoices(state) {
  var container = getRoot().getElementById("foggy-mcq-choices");
  container.replaceChildren();

  state.choices.forEach(function (choice, index) {
    var button = document.createElement("button");
    var isSelected = state.selectedId === choice.id;
    var isSolvedCorrect = (state.solvedOnFirstTry || state.pendingContinue) && choice.isCorrect;

    button.type = "button";
    button.className = "foggy-mcq-choice";
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", isSelected ? "true" : "false");

    if (isSelected) {
      button.classList.add("is-selected");
    }
    if (choice.isEliminated) {
      button.classList.add("is-eliminated");
    }
    if (isSolvedCorrect) {
      button.classList.add("is-correct");
    }

    button.disabled = choice.isEliminated || state.solvedOnFirstTry || state.pendingContinue || !state.hasValidAnswer;

    var text = document.createElement("span");
    text.className = "foggy-mcq-choice-text";
    text.textContent = choice.text;

    var indexBadge = document.createElement("span");
    indexBadge.className = "foggy-mcq-choice-index";
    indexBadge.textContent = String(index + 1);

    button.appendChild(text);
    button.appendChild(indexBadge);
    button.addEventListener("click", function () {
      state.selectedId = choice.id;
      renderMcq(state);
    });

    container.appendChild(button);
  });
}

function renderFeedback(state) {
  var container = getRoot().getElementById("foggy-mcq-feedback");
  var showCorrect = state.solvedOnFirstTry || (state.pendingContinue && !state.solvedOnFirstTry);
  var showWrong = !!state.lastEliminatedChoice;

  if (!showCorrect && !showWrong) {
    setHidden(container, true);
    return;
  }

  container.replaceChildren();

  var feedbackChoice = showCorrect
    ? state.choices.find(function (c) { return c.isCorrect; })
    : state.lastEliminatedChoice;
  var notes = feedbackChoice ? feedbackChoice.notes : "";

  container.className = showCorrect ? "foggy-mcq-feedback is-correct" : "foggy-mcq-feedback is-wrong";

  var label = document.createElement("span");
  label.className = "foggy-mcq-feedback-label";
  label.textContent = showCorrect ? "\u2713 Correct" : "\u2717 Wrong";
  container.appendChild(label);

  if (notes) {
    var notesEl = document.createElement("p");
    notesEl.className = "foggy-mcq-feedback-notes";
    notesEl.textContent = notes;
    container.appendChild(notesEl);
  }

  setHidden(container, false);
}

function renderActions(state) {
  var checkBtn = getRoot().getElementById("foggy-check-btn");
  var ratingRow = getRoot().getElementById("foggy-mcq-rating-row");

  if (state.pendingContinue) {
    setHidden(ratingRow, true);
    checkBtn.innerHTML = "Continue";
    checkBtn.disabled = false;
    return;
  }

  if (state.solvedOnFirstTry) {
    setHidden(ratingRow, false);
    checkBtn.innerHTML = "Continue";
    checkBtn.disabled = false;
    return;
  }

  setHidden(ratingRow, true);
  var label = "Check";
  checkBtn.innerHTML = label;
  checkBtn.disabled = !state.hasValidAnswer || !state.selectedId;
}

function buildChoices(rawChoices) {
  var parsed = parseJsonChoices(rawChoices);
  return parsed;
}

/**
 * Parse the Choices field, which may be wrapped in Anki HTML.
 * Expected JSON format: [{"text": "...", "correct": true}, {"text": "..."}, ...]
 * Returns { choices, valid }.
 */
function parseJsonChoices(rawChoices) {
  var json;
  try {
    json = JSON.parse(stripAnkiHtml(String(rawChoices || "")));
  } catch (_) {
    return { choices: [], valid: false };
  }

  if (!Array.isArray(json) || json.length === 0) {
    return { choices: [], valid: false };
  }

  var correctCount = json.filter(function (item) { return item.correct === true; }).length;
  if (correctCount !== 1) {
    return { choices: [], valid: false };
  }

  return {
    choices: json.map(function (item, index) {
      return {
        id: "mcq-choice-" + index,
        text: String(item.text || ""),
        isCorrect: item.correct === true,
        isEliminated: false,
        notes: item.notes ? String(item.notes) : "",
      };
    }),
    valid: true,
  };
}

/** Strip HTML that Anki wraps around field content before JSON.parse. */
function stripAnkiHtml(raw) {
  var div = document.createElement("div");
  div.innerHTML = raw;
  return div.textContent.trim();
}

function shuffleChoices(choices) {
  var shuffled = choices.slice();

  for (var index = shuffled.length - 1; index > 0; index -= 1) {
    var swapIndex = Math.floor(Math.random() * (index + 1));
    var current = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }

  return shuffled;
}

function findChoice(choices, id) {
  return choices.find(function (choice) {
    return choice.id === id;
  });
}
