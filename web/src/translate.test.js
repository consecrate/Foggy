import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAcceptedAnswers,
  buildFillBlankEvaluation,
  buildStandardEvaluation,
  extractBlankAnswers,
  hasPlayableAudio,
  normalizeText,
} from "./translate-logic.js";

test("normalizeText ignores punctuation and case", function () {
  assert.equal(normalizeText("Guten, TAG!"), "guten tag");
});

test("extractBlankAnswers maps placeholders back to the source sentence", function () {
  assert.deepEqual(
    extractBlankAnswers("Ich gehe in den Laden.", "Ich gehe in den ___."),
    ["Laden"]
  );
});

test("buildFillBlankEvaluation compares each blank independently", function () {
  var evaluation = buildFillBlankEvaluation(
    ["Berlin", "Hamburg"],
    "Heute gehen wir nach Berlin, morgen nach Hamburg.",
    "Heute gehen wir nach ___, morgen nach ___."
  );

  assert.equal(evaluation.isCorrect, true);
  assert.deepEqual(evaluation.expectedBlanks, ["Berlin", "Hamburg"]);
});

test("hasPlayableAudio detects Anki sound tags", function () {
  assert.equal(hasPlayableAudio("[sound:example.mp3]"), true);
  assert.equal(hasPlayableAudio("plain text"), false);
});
