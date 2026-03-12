export function getStoredCode(codeStorageKey) {
  if (!codeStorageKey || !window.sessionStorage) {
    return null;
  }

  try {
    return window.sessionStorage.getItem(codeStorageKey);
  } catch (error) {
    return null;
  }
}

export function storeCode(codeStorageKey, code) {
  if (!codeStorageKey || !window.sessionStorage) {
    return;
  }

  try {
    window.sessionStorage.setItem(codeStorageKey, code);
  } catch (error) {
  }
}
