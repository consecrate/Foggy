var _root = document;

export function setRoot(shadowRoot) {
  _root = shadowRoot;
}

export function getRoot() {
  return _root;
}
