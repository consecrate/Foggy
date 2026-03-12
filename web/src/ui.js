import { hasDisplayValue } from "./format.js";

export function setHidden(element, hidden) {
  if (element) {
    element.classList.toggle("is-hidden", hidden);
  }
}

export function renderHint(container, text) {
  var hint = document.createElement("span");
  hint.className = "foggy-hint";
  hint.textContent = text;
  container.replaceChildren(hint);
}

export function createDetailSection(title) {
  var section = document.createElement("section");
  section.className = "foggy-detail-section";

  var heading = document.createElement("div");
  heading.className = "foggy-detail-heading";
  heading.textContent = title;

  section.appendChild(heading);
  return section;
}

export function createDetailField(label, valueText, modifierClass) {
  var field = document.createElement("div");
  field.className = "foggy-case-field";

  if (label) {
    var labelEl = document.createElement("div");
    labelEl.className = "foggy-case-label";
    labelEl.textContent = label;
    field.appendChild(labelEl);
  } else {
    field.classList.add("foggy-case-field--plain");
  }

  var value = document.createElement("div");
  value.className = "foggy-case-value";
  if (modifierClass) {
    value.classList.add(modifierClass);
  }
  value.textContent = valueText;

  field.appendChild(value);
  return field;
}

export function renderInputSection(parent, inputs) {
  if (!inputs.length) {
    return;
  }

  var section = createDetailSection("Input");
  var stack = document.createElement("div");
  stack.className = "foggy-detail-stack";

  inputs.forEach(function (input) {
    stack.appendChild(createDetailField(input.label, input.value));
  });

  section.appendChild(stack);
  parent.appendChild(section);
}

export function renderValueSection(parent, title, valueText, modifierClass) {
  if (!hasDisplayValue(valueText)) {
    return;
  }

  var section = createDetailSection(title);
  section.appendChild(createDetailField("", valueText, modifierClass));
  parent.appendChild(section);
}
