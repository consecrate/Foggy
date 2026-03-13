import { fromMarkdown } from "mdast-util-from-markdown";

import { getRoot } from "./root.js";

export function renderDescription(markdown, target) {
  var container = target || getRoot().getElementById("foggy-description");
  container.textContent = "";

  if (!markdown) {
    return;
  }

  var tree = fromMarkdown(markdown);
  container.appendChild(renderNodes(tree.children || []));
}

function renderNodes(nodes) {
  var fragment = document.createDocumentFragment();

  nodes.forEach(function (node) {
    var rendered = renderNode(node);
    if (rendered) {
      fragment.appendChild(rendered);
    }
  });

  return fragment;
}

function renderNode(node) {
  if (!node || typeof node.type !== "string") {
    return null;
  }

  switch (node.type) {
    case "text":
      return document.createTextNode(node.value || "");
    case "paragraph":
      return renderElement("p", node.children);
    case "heading":
      return renderHeading(node);
    case "strong":
      return renderElement("strong", node.children);
    case "emphasis":
      return renderElement("em", node.children);
    case "inlineCode":
      return renderCode(node.value || "");
    case "code":
      return renderCodeBlock(node.value || "", node.lang || "");
    case "break":
      return document.createElement("br");
    case "blockquote":
      return renderElement("blockquote", node.children);
    case "list":
      return renderList(node);
    case "listItem":
      return renderElement("li", node.children);
    case "link":
      return renderLink(node);
    default:
      if (Array.isArray(node.children)) {
        return renderNodes(node.children);
      }
      return null;
  }
}

function renderElement(tagName, children) {
  var element = document.createElement(tagName);
  element.appendChild(renderNodes(children || []));
  return element;
}

function renderHeading(node) {
  var depth = Number(node.depth) || 1;
  var tagName = "h" + Math.min(Math.max(depth, 1), 6);
  return renderElement(tagName, node.children);
}

function renderCode(value) {
  var code = document.createElement("code");
  code.textContent = value;
  return code;
}

function renderCodeBlock(value, lang) {
  var pre = document.createElement("pre");
  var code = renderCode(value);
  if (lang) {
    code.setAttribute("data-language", lang);
  }
  pre.appendChild(code);
  return pre;
}

function renderList(node) {
  var listTag = node.ordered ? "ol" : "ul";
  return renderElement(listTag, node.children);
}

function renderLink(node) {
  var href = typeof node.url === "string" ? node.url : "";
  if (!isSafeHref(href)) {
    return renderNodes(node.children || []);
  }

  var link = document.createElement("a");
  link.setAttribute("href", href);
  link.setAttribute("rel", "noreferrer noopener");
  link.appendChild(renderNodes(node.children || []));
  return link;
}

function isSafeHref(href) {
  try {
    var url = new URL(href, window.location.href);
    return ["http:", "https:", "mailto:"].indexOf(url.protocol) !== -1;
  } catch (error) {
    return false;
  }
}
