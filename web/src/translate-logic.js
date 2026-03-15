import { diffWords } from "diff";

var BLANK_MARKER = "___";
var TOKEN_PATTERN = /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu;
var SOUND_TAG_PATTERN = /\[sound:[^\]]+\]/i;

export function normalizeText(value) {
  return tokenizeComparableText(value).join(" ");
}

export function tokenizeComparableText(value) {
  var normalized = String(value || "").normalize("NFKC");
  var tokens = normalized.match(TOKEN_PATTERN);
  return tokens ? tokens.map(function (token) {
    return token.toLocaleLowerCase();
  }) : [];
}

export function buildAcceptedAnswers(cardData) {
  return [cardData.german].filter(function (answer) {
    return !!normalizeText(answer);
  });
}

export function hasPlayableAudio(value) {
  return SOUND_TAG_PATTERN.test(String(value || ""));
}

export function buildStandardEvaluation(submitted, acceptedAnswers) {
  var normalizedSubmitted = normalizeText(submitted);
  var candidates = acceptedAnswers.map(function (expected) {
    return buildCandidateEvaluation(normalizedSubmitted, expected);
  });

  if (!candidates.length) {
    return {
      isCorrect: false,
      expected: "",
      normalizedExpected: "",
      normalizedSubmitted: normalizedSubmitted,
      diffParts: [],
    };
  }

  candidates.sort(function (left, right) {
    if (left.isCorrect !== right.isCorrect) {
      return left.isCorrect ? -1 : 1;
    }
    if (left.distance !== right.distance) {
      return left.distance - right.distance;
    }
    return left.expected.localeCompare(right.expected);
  });

  var best = candidates[0];
  return {
    isCorrect: best.isCorrect,
    expected: best.expected,
    normalizedExpected: best.normalizedExpected,
    normalizedSubmitted: normalizedSubmitted,
    diffParts: best.diffParts,
  };
}

export function splitFillBlankPattern(fillBlank) {
  var source = String(fillBlank || "");
  if (!source) {
    return [];
  }

  var pieces = [];
  var index = 0;
  while (index < source.length) {
    var nextBlank = source.indexOf(BLANK_MARKER, index);
    if (nextBlank === -1) {
      pieces.push({ type: "text", value: source.slice(index) });
      break;
    }
    if (nextBlank > index) {
      pieces.push({ type: "text", value: source.slice(index, nextBlank) });
    }
    pieces.push({ type: "blank" });
    index = nextBlank + BLANK_MARKER.length;
  }

  if (!pieces.length) {
    pieces.push({ type: "text", value: source });
  }
  return pieces;
}

export function extractBlankAnswers(german, fillBlank) {
  var source = String(fillBlank || "");
  if (!source.includes(BLANK_MARKER)) {
    return [];
  }

  var expression = source
    .split(BLANK_MARKER)
    .map(escapeLiteralForBlankPattern)
    .join("([\\s\\S]+?)");
  var match = new RegExp("^" + expression + "$", "u").exec(String(german || ""));
  if (!match) {
    return [];
  }

  return match.slice(1).map(function (value) {
    return value.trim();
  });
}

export function buildFillBlankEvaluation(submittedBlanks, german, fillBlank) {
  var expectedBlanks = extractBlankAnswers(german, fillBlank);
  var normalizedExpected = expectedBlanks.map(normalizeText);
  var normalizedSubmitted = submittedBlanks.map(normalizeText);
  var isCorrect =
    expectedBlanks.length > 0 &&
    expectedBlanks.length === submittedBlanks.length &&
    normalizedExpected.every(function (expected, index) {
      return expected === normalizedSubmitted[index];
    });

  return {
    isCorrect: isCorrect,
    expectedBlanks: expectedBlanks,
    normalizedExpected: normalizedExpected,
    normalizedSubmitted: normalizedSubmitted,
    diffPartsByBlank: expectedBlanks.map(function (expected, index) {
      return buildDiffParts(normalizedSubmitted[index] || "", normalizeText(expected));
    }),
  };
}

function buildCandidateEvaluation(normalizedSubmitted, expected) {
  var normalizedExpected = normalizeText(expected);
  var diffParts = buildDiffParts(normalizedSubmitted, normalizedExpected);
  return {
    expected: expected,
    normalizedExpected: normalizedExpected,
    isCorrect: normalizedSubmitted === normalizedExpected && !!normalizedSubmitted,
    diffParts: diffParts,
    distance: countChangedTokens(diffParts),
  };
}

function buildDiffParts(normalizedSubmitted, normalizedExpected) {
  return diffWords(normalizedSubmitted, normalizedExpected).map(function (part) {
    return {
      value: part.value,
      kind: part.added ? "missing" : (part.removed ? "wrong" : "correct"),
    };
  });
}

function countChangedTokens(diffParts) {
  return diffParts.reduce(function (count, part) {
    if (part.kind === "correct") {
      return count;
    }
    return count + tokenizeComparableText(part.value).length;
  }, 0);
}

function escapeLiteralForBlankPattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
}
