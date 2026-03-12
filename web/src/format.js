export function hasDisplayValue(value) {
  return value !== undefined && !(typeof value === "string" && value.length === 0);
}

export function formatJsonValue(value) {
  if (value === undefined) {
    return "undefined";
  }

  var serialized = JSON.stringify(value);
  return serialized === undefined ? String(value) : serialized;
}

export function formatSerializedResult(value) {
  if (!hasDisplayValue(value)) {
    return "";
  }

  if (typeof value !== "string") {
    return formatJsonValue(value);
  }

  try {
    return formatJsonValue(JSON.parse(value));
  } catch (error) {
    return value;
  }
}
