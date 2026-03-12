export function navigateHome() {
  pycmd("foggy:home");
}

export function sendRunRequest(request) {
  pycmd("foggy:run:" + JSON.stringify(request));
}

export function answerCard(ease) {
  pycmd("foggy:answer:" + ease);
}

export function registerResultHandler(handler) {
  window.foggyReceiveResults = handler;
}
