export function navigateHome() {
  pycmd("foggy:home");
}

export function continueWrappedReward() {
  pycmd("foggy:reward-continue");
}

export function sendRunRequest(request) {
  pycmd("foggy:run:" + JSON.stringify(request));
}

export function answerCard(ease) {
  pycmd("foggy:answer:" + ease);
}

export function playFeedbackSound(kind) {
  if (kind !== "correct" && kind !== "incorrect") {
    return;
  }
  pycmd("foggy:play-feedback:" + kind);
}

export function playCardAudio(audioMarkup) {
  if (!audioMarkup) {
    return;
  }
  pycmd("foggy:play-audio:" + audioMarkup);
}

export function registerResultHandler(handler) {
  window.foggyReceiveResults = handler;
}
