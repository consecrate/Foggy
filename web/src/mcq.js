import { answerCard } from "./bridge.js";
import { renderDescription } from "./description.js";
import { setHidden } from "./ui.js";

var FIRST_TRY_RATINGS = [
  { ease: 2, label: "Hard", cls: "hard" },
  { ease: 4, label: "Easy", cls: "easy" },
];

export function initMcqCard(cardData) {
  var choiceConfig = buildChoices(cardData.choices);
  var state = {
    cardData: cardData,
    choices: shuffleChoices(choiceConfig.choices),
    hasValidAnswer: choiceConfig.valid,
    hadWrongAttempt: false,
    solvedOnFirstTry: false,
    selectedId: null,
  };

  prepareLayout(cardData);
  bindPrimaryAction(state);
  bindRatingActions();
  renderMcq(state);
}

function prepareLayout(cardData) {
  var container = document.getElementById("foggy-container");
  var grid = document.getElementById("foggy-grid");
  var mcqView = document.getElementById("foggy-mcq-view");
  var headerRun = document.getElementById("foggy-run-btn");
  var headerCheck = document.getElementById("foggy-check-btn");
  var question = document.getElementById("foggy-mcq-question");
  var description = document.getElementById("foggy-mcq-description");

  container.classList.add("foggy-container--mcq");
  setHidden(grid, true);
  setHidden(mcqView, false);
  setHidden(headerRun, true);
  setHidden(headerCheck, true);

  question.textContent = cardData.question || cardData.title || "Untitled question";

  if (cardData.description) {
    renderDescription(cardData.description, description);
  } else {
    description.replaceChildren();
  }
  setHidden(description, !cardData.description);
}

function bindPrimaryAction(state) {
  var button = document.getElementById("foggy-mcq-primary-btn");
  button.addEventListener("click", function () {
    handlePrimaryAction(state);
  });
}

function bindRatingActions() {
  var row = document.getElementById("foggy-mcq-rating-row");
  row.replaceChildren();

  FIRST_TRY_RATINGS.forEach(function (rating) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "foggy-rating-btn foggy-rating-btn--" + rating.cls;
    button.textContent = rating.label;
    button.addEventListener("click", function () {
      answerCard(rating.ease);
    });
    row.appendChild(button);
  });
}

function handlePrimaryAction(state) {
  if (!state.hasValidAnswer || !state.selectedId) {
    return;
  }

  var selectedChoice = findChoice(state.choices, state.selectedId);
  if (!selectedChoice) {
    return;
  }

  if (selectedChoice.isCorrect) {
    if (state.hadWrongAttempt) {
      answerCard(1);
      return;
    }

    state.solvedOnFirstTry = true;
    renderMcq(state);
    return;
  }

  selectedChoice.isEliminated = true;
  state.selectedId = null;
  state.hadWrongAttempt = true;
  renderMcq(state);
}

function renderMcq(state) {
  renderChoices(state);
  renderActions(state);
}

function renderChoices(state) {
  var container = document.getElementById("foggy-mcq-choices");
  container.replaceChildren();

  state.choices.forEach(function (choice, index) {
    var button = document.createElement("button");
    var isSelected = state.selectedId === choice.id;
    var isSolvedCorrect = state.solvedOnFirstTry && choice.isCorrect;

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

    button.disabled = choice.isEliminated || state.solvedOnFirstTry || !state.hasValidAnswer;

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

function renderActions(state) {
  var primaryButton = document.getElementById("foggy-mcq-primary-btn");
  var ratingRow = document.getElementById("foggy-mcq-rating-row");

  if (state.solvedOnFirstTry) {
    setHidden(primaryButton, true);
    setHidden(ratingRow, false);
    return;
  }

  setHidden(primaryButton, false);
  setHidden(ratingRow, true);
  primaryButton.textContent = state.hadWrongAttempt ? "Continue" : "Check";
  primaryButton.disabled = !state.hasValidAnswer || !state.selectedId;
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

