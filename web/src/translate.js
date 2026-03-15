import { answerCard, playCardAudio, playFeedbackSound } from "./bridge.js";
import { getRoot } from "./root.js";
import { FIRST_TRY_RATINGS, ensureRatingRow } from "./rating-row.js";
import { setHidden } from "./ui.js";
import {
  buildAcceptedAnswers,
  buildFillBlankEvaluation,
  buildStandardEvaluation,
  hasPlayableAudio,
  splitFillBlankPattern,
} from "./translate-logic.js";

export function initTranslateCard(cardData) {
  var fillBlankPieces = splitFillBlankPattern(cardData.fillBlank);
  var blankCount = fillBlankPieces.filter(function (piece) {
    return piece.type === "blank";
  }).length;

  var state = {
    cardData: cardData,
    acceptedAnswers: buildAcceptedAnswers(cardData),
    checked: false,
    pendingContinue: false,
    solvedClean: false,
    evaluation: null,
    fillBlankPieces: fillBlankPieces,
    blankValues: new Array(blankCount).fill(""),
  };

  prepareLayout(cardData);
  bindKeyboardShortcuts(state);
  bindPrimaryAction(state);
  bindAudioAction(cardData);
  bindRatingActions();
  bindInputTracking(state);
  renderTranslate(state);
}

function prepareLayout(cardData) {
  var container = getRoot().getElementById("foggy-container");
  var grid = getRoot().getElementById("foggy-grid");
  var mcqView = getRoot().getElementById("foggy-mcq-view");
  var translateView = getRoot().getElementById("foggy-translate-view");
  var headerRun = getRoot().getElementById("foggy-run-btn");
  var checkButton = getRoot().getElementById("foggy-check-btn");

  container.classList.add("foggy-container--translate");
  setHidden(grid, true);
  setHidden(mcqView, true);
  setHidden(translateView, false);
  setHidden(headerRun, true);

  checkButton.textContent = "Check";
  checkButton.disabled = false;

  getRoot().getElementById("foggy-translate-prompt-title").textContent = promptTitle(cardData.mode);
}

function bindKeyboardShortcuts(state) {
  var view = getRoot().getElementById("foggy-translate-view");
  view.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" || event.shiftKey || event.altKey || event.metaKey) {
      return;
    }
    event.preventDefault();
    handlePrimaryAction(state);
  });
}

function bindPrimaryAction(state) {
  var button = getRoot().getElementById("foggy-check-btn");
  button.addEventListener("click", function () {
    handlePrimaryAction(state);
  });
}

function bindAudioAction(cardData) {
  var button = getRoot().getElementById("foggy-translate-audio-btn");
  button.addEventListener("click", function () {
    playCardAudio(cardData.audio);
  });
}

function bindRatingActions() {
  ensureRatingRow({
    id: "foggy-translate-rating-row",
    ratings: FIRST_TRY_RATINGS,
    hidden: true,
  });
}

function bindInputTracking(state) {
  var standardInput = getRoot().getElementById("foggy-translate-input");
  if (standardInput) {
    standardInput.addEventListener("input", function () {
      renderActions(state);
    });
  }

  var fillWrap = getRoot().getElementById("foggy-translate-fillblank");
  if (fillWrap) {
    fillWrap.addEventListener("input", function () {
      renderActions(state);
    });
  }
}

function handlePrimaryAction(state) {
  if (state.pendingContinue) {
    answerCard(1);
    return;
  }

  if (state.solvedClean) {
    answerCard(3);
    return;
  }

  var evaluation = evaluateSubmission(state);
  state.evaluation = evaluation;
  state.checked = true;
  state.solvedClean = evaluation.isCorrect;
  state.pendingContinue = !state.solvedClean;
  playFeedbackSound(evaluation.isCorrect ? "correct" : "incorrect");
  renderTranslate(state);
}

function evaluateSubmission(state) {
  if (state.cardData.mode === "fill_blank") {
    return buildFillBlankEvaluation(state.blankValues, state.cardData.german, state.cardData.fillBlank);
  }
  return buildStandardEvaluation(readStandardInput(), state.acceptedAnswers);
}

function renderTranslate(state) {
  renderPrompt(state);
  renderContext(state.cardData.context);
  renderInputs(state);
  renderFeedback(state);
  renderActions(state);
  focusInputIfNeeded(state);
}

function renderPrompt(state) {
  var text = getRoot().getElementById("foggy-translate-prompt-text");
  var audioButton = getRoot().getElementById("foggy-translate-audio-btn");
  var englishReveal = getRoot().getElementById("foggy-translate-english-reveal");

  setHidden(audioButton, !hasPlayableAudio(state.cardData.audio));
  setHidden(englishReveal, true);

  if (state.cardData.mode === "listen") {
    text.textContent = "Listen and type the German sentence you hear.";
    if (state.checked) {
      englishReveal.textContent = state.cardData.english || "";
      setHidden(englishReveal, !state.cardData.english);
    }
    return;
  }

  text.textContent = state.cardData.english || "";
}

function renderContext(contextValue) {
  var container = getRoot().getElementById("foggy-translate-context");
  if (!contextValue) {
    container.replaceChildren();
    setHidden(container, true);
    return;
  }

  container.innerHTML = String(contextValue);
  setHidden(container, false);
}

function renderInputs(state) {
  var standardWrap = getRoot().getElementById("foggy-translate-standard-input");
  var fillWrap = getRoot().getElementById("foggy-translate-fillblank");
  setHidden(standardWrap, state.cardData.mode === "fill_blank");
  setHidden(fillWrap, state.cardData.mode !== "fill_blank");

  if (state.cardData.mode === "fill_blank") {
    renderFillBlankInputs(state);
    return;
  }

  var input = getRoot().getElementById("foggy-translate-input");
  var oldDiff = getRoot().getElementById("foggy-translate-diff");
  if (oldDiff) oldDiff.remove();

  if (state.checked && state.evaluation && !state.evaluation.isCorrect) {
    setHidden(input, true);
    var diff = document.createElement("div");
    diff.id = "foggy-translate-diff";
    diff.className = "foggy-translate-diff";
    state.evaluation.diffParts.forEach(function (part) {
      var span = document.createElement("span");
      span.textContent = part.value;
      span.className = "foggy-diff-" + part.kind;
      diff.appendChild(span);
    });
    standardWrap.appendChild(diff);
    return;
  }

  setHidden(input, false);
  input.placeholder = state.cardData.mode === "listen"
    ? "Type the sentence in German"
    : "Translate to German";
  input.disabled = state.checked;

  input.classList.remove("is-correct", "is-wrong");
  if (state.checked && state.evaluation) {
    input.classList.add(state.evaluation.isCorrect ? "is-correct" : "is-wrong");
  }
}

function renderFillBlankInputs(state) {
  var container = getRoot().getElementById("foggy-translate-fillblank");
  container.replaceChildren();

  var sentence = document.createElement("div");
  sentence.className = "foggy-translate-fillblank-sentence";
  var blankIndex = 0;

  state.fillBlankPieces.forEach(function (piece) {
    if (piece.type === "text") {
      sentence.appendChild(document.createTextNode(piece.value));
      return;
    }

    var currentBlankIndex = blankIndex;
    var input = document.createElement("input");
    input.type = "text";
    input.className = "foggy-translate-blank-input";
    input.value = state.blankValues[currentBlankIndex] || "";
    input.placeholder = "blank";
    input.disabled = state.checked;
    input.dataset.blankIndex = String(currentBlankIndex);
    input.addEventListener("input", function (event) {
      state.blankValues[currentBlankIndex] = event.target.value;
    });

    if (state.checked && state.evaluation) {
      var blankCorrect = state.evaluation.normalizedExpected &&
        state.evaluation.normalizedExpected[currentBlankIndex] === state.evaluation.normalizedSubmitted[currentBlankIndex];
      input.classList.add(blankCorrect ? "is-correct" : "is-wrong");
    }

    sentence.appendChild(input);
    blankIndex += 1;
  });

  container.appendChild(sentence);
}



function renderFeedback(state) {
  var notes = getRoot().getElementById("foggy-translate-notes");

  // Remove any previous inline correction
  var old = getRoot().getElementById("foggy-translate-correction");
  if (old) old.remove();

  if (!state.checked || !state.evaluation) {
    setHidden(notes, true);
    return;
  }

  // Show notes if present
  if (state.cardData.notes) {
    notes.textContent = state.cardData.notes;
    setHidden(notes, false);
  } else {
    setHidden(notes, true);
  }

  // If wrong, show expected answer inline below the input (fill_blank only;
  // standard mode uses the inline diff rendered in renderInputs)
  if (!state.evaluation.isCorrect && state.cardData.mode === "fill_blank") {
    var correction = document.createElement("div");
    correction.id = "foggy-translate-correction";
    correction.className = "foggy-translate-correction";
    correction.textContent = state.cardData.german || "";

    var anchor = getRoot().getElementById("foggy-translate-fillblank");
    anchor.parentNode.insertBefore(correction, anchor.nextSibling);
  }
}

function renderActions(state) {
  var checkBtn = getRoot().getElementById("foggy-check-btn");
  var ratingRow = getRoot().getElementById("foggy-translate-rating-row");

  if (state.pendingContinue) {
    setHidden(ratingRow, true);
    checkBtn.textContent = "Continue";
    checkBtn.disabled = false;
    return;
  }

  if (state.solvedClean) {
    setHidden(ratingRow, false);
    checkBtn.textContent = "Continue";
    checkBtn.disabled = false;
    return;
  }

  setHidden(ratingRow, true);
  checkBtn.textContent = "Check";
  checkBtn.disabled = !hasSubmissionValue(state);
}

function hasSubmissionValue(state) {
  if (state.cardData.mode === "fill_blank") {
    return state.blankValues.every(function (value) {
      return String(value || "").trim();
    });
  }
  return !!readStandardInput().trim();
}

function focusInputIfNeeded(state) {
  if (state.checked) {
    return;
  }

  if (state.cardData.mode === "fill_blank") {
    var blank = getRoot().querySelector(".foggy-translate-blank-input");
    if (blank) {
      blank.focus();
    }
    return;
  }

  var input = getRoot().getElementById("foggy-translate-input");
  if (input) {
    input.focus();
  }
}

function readStandardInput() {
  var input = getRoot().getElementById("foggy-translate-input");
  return input ? input.value : "";
}



function promptTitle(mode) {
  if (mode === "listen") {
    return "Listen closely";
  }
  if (mode === "fill_blank") {
    return "Fill in the blanks";
  }
  return "Translate to German";
}
