import { continueWrappedReward } from "./bridge.js";
import { getRoot } from "./root.js";
import { setHidden } from "./ui.js";

var currentWrappedReview = null;
var continueBound = false;

export function initWrappedReview(cardData) {
  currentWrappedReview = cardData && cardData.wrappedReview ? cardData.wrappedReview : null;

  renderProgress();
  renderReward();
  bindContinueAction();
}

function bindContinueAction() {
  if (continueBound) {
    return;
  }

  var button = getRoot().getElementById("foggy-review-reward-continue");
  if (!button) {
    return;
  }

  button.addEventListener("click", function () {
    if (!currentWrappedReview) {
      return;
    }

    continueWrappedReward();
    currentWrappedReview = Object.assign({}, currentWrappedReview, {
      progress: 0,
      showReward: false,
    });
    renderProgress();
    renderReward();
  });
  continueBound = true;
}

function renderProgress() {
  var progress = getRoot().getElementById("foggy-review-progress");
  var track = getRoot().getElementById("foggy-review-progress-track");
  if (!progress || !track || !currentWrappedReview || !currentWrappedReview.pillCount) {
    if (progress) {
      progress.setAttribute("aria-hidden", "true");
    }
    setHidden(progress, true);
    return;
  }

  var pillCount = currentWrappedReview.pillCount;
  var filled = currentWrappedReview.progress || 0;
  track.style.setProperty("--foggy-review-progress-pill-count", String(pillCount));
  track.style.gridTemplateColumns = "repeat(" + pillCount + ", minmax(0, 1fr))";
  track.replaceChildren();

  for (var index = 0; index < pillCount; index += 1) {
    var segment = document.createElement("span");
    segment.className = "foggy-review-progress-segment";
    if (index < filled) {
      segment.classList.add("is-filled");
    }
    if (index === pillCount - 1) {
      segment.classList.add("is-goal");
    }
    segment.setAttribute("aria-hidden", "true");
    track.appendChild(segment);
  }

  progress.setAttribute("aria-label", progressLabel(filled, pillCount));
  progress.setAttribute("aria-hidden", "false");
  setHidden(progress, false);
}

function renderReward() {
  var reward = getRoot().getElementById("foggy-review-reward");
  var image = getRoot().getElementById("foggy-review-reward-image");
  if (!reward || !image || !currentWrappedReview || !currentWrappedReview.showReward) {
    setHidden(reward, true);
    return;
  }

  image.src = currentWrappedReview.rewardImageUrl || "";
  setHidden(reward, false);
}

function progressLabel(progress, pillCount) {
  return "Review streak: " + progress + " of " + pillCount + " cards";
}
