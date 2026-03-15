import { answerCard } from "./bridge.js";
import { getRoot } from "./root.js";

export var FIRST_TRY_RATINGS = [
  { ease: 2, label: "Hard", cls: "hard" },
  { ease: 3, label: "Good", cls: "good" },
];

export var REVIEW_RATINGS = [
  { ease: 1, label: "Again", cls: "again" },
  { ease: 2, label: "Hard", cls: "hard" },
  { ease: 3, label: "Good", cls: "good" },
  { ease: 4, label: "Easy", cls: "easy" },
];

export function ensureRatingRow(options) {
  var rowId = options.id;
  var ratings = options.ratings;
  var hidden = !!options.hidden;
  var existing = getRoot().getElementById(rowId);

  if (existing) {
    existing.classList.toggle("is-hidden", hidden);
    return existing;
  }

  var row = document.createElement("div");
  row.id = rowId;
  row.className = "foggy-rating-row";
  row.classList.toggle("is-hidden", hidden);

  ratings.slice().reverse().forEach(function (rating) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "foggy-rating-btn foggy-rating-btn--" + rating.cls;
    button.textContent = rating.label;
    button.addEventListener("click", function () {
      answerCard(rating.ease);
    });
    row.appendChild(button);
  });

  var bar = getRoot().getElementById("foggy-bottom-bar");
  var anchor = getRoot().getElementById(options.anchorId || "foggy-check-btn");
  if (bar && anchor) {
    bar.insertBefore(row, anchor);
  } else if (bar) {
    bar.appendChild(row);
  }

  return row;
}

export function removeRatingRow(rowId) {
  var existing = getRoot().getElementById(rowId);
  if (existing) {
    existing.remove();
  }
}
