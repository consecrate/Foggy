const DESCRIPTION_ALLOWED_TAGS = new Set([
  "p",
  "br",
  "pre",
  "code",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
]);

export function renderDescription(html) {
  var container = document.getElementById("foggy-description");
  container.textContent = "";

  if (!html) {
    return;
  }

  var parser = new DOMParser();
  var doc = parser.parseFromString("<div>" + html + "</div>", "text/html");
  var sourceRoot = doc.body.firstElementChild || doc.body;
  var sanitized = document.createDocumentFragment();

  sourceRoot.childNodes.forEach(function (node) {
    appendSanitizedNode(sanitized, node);
  });

  container.appendChild(sanitized);
}

function appendSanitizedNode(parent, node) {
  if (node.nodeType === Node.TEXT_NODE) {
    parent.appendChild(document.createTextNode(node.textContent || ""));
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  var tagName = node.tagName.toLowerCase();
  if (!DESCRIPTION_ALLOWED_TAGS.has(tagName)) {
    node.childNodes.forEach(function (child) {
      appendSanitizedNode(parent, child);
    });
    return;
  }

  var sanitizedNode = document.createElement(tagName);
  if (tagName === "a") {
    var href = node.getAttribute("href") || "";
    if (isSafeHref(href)) {
      sanitizedNode.setAttribute("href", href);
      sanitizedNode.setAttribute("rel", "noreferrer noopener");
    }
  }

  node.childNodes.forEach(function (child) {
    appendSanitizedNode(sanitizedNode, child);
  });

  parent.appendChild(sanitizedNode);
}

function isSafeHref(href) {
  try {
    var url = new URL(href, window.location.href);
    return ["http:", "https:", "mailto:"].indexOf(url.protocol) !== -1;
  } catch (error) {
    return false;
  }
}
