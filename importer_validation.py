"""Validation and serialization helpers for Foggy JSON imports."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

CODING_KIND = "coding"
MCQ_KIND = "mcq"

DuplicateKey = tuple[str, ...]


@dataclass(frozen=True)
class ValidatedImportItem:
    kind: str
    data: dict[str, Any]


def parse_import_json(raw_text: str) -> tuple[list[ValidatedImportItem], list[str]]:
    """Parse raw JSON text into validated import items."""
    if not raw_text.strip():
        return [], ["JSON input is empty."]

    try:
        payload = json.loads(raw_text)
    except json.JSONDecodeError as error:
        return [], [
            f"Invalid JSON: {error.msg} (line {error.lineno}, column {error.colno})."
        ]

    return validate_import_payload(payload)


def normalize_import_payload(payload: Any) -> list[dict[str, Any]]:
    """Normalize the top-level payload into a list of objects."""
    if isinstance(payload, dict):
        items = [payload]
    elif isinstance(payload, list):
        items = payload
    else:
        raise ValueError("Top-level JSON must be an object or an array of objects.")

    if not items:
        raise ValueError("Top-level JSON must include at least one item.")

    return items


def validate_import_payload(payload: Any) -> tuple[list[ValidatedImportItem], list[str]]:
    """Validate a normalized payload and return accepted items plus errors."""
    try:
        raw_items = normalize_import_payload(payload)
    except ValueError as error:
        return [], [str(error)]

    items: list[ValidatedImportItem] = []
    errors: list[str] = []

    for item_index, raw_item in enumerate(raw_items, start=1):
        if not isinstance(raw_item, dict):
            errors.append(f"Item {item_index}: expected an object.")
            continue

        kind = raw_item.get("kind")
        if kind == CODING_KIND:
            item_data, item_errors = validate_coding_item(raw_item, item_index)
        elif kind == MCQ_KIND:
            item_data, item_errors = validate_mcq_item(raw_item, item_index)
        else:
            errors.append(f"Item {item_index}: kind must be 'coding' or 'mcq'.")
            continue

        if item_errors:
            errors.extend(item_errors)
            continue

        items.append(ValidatedImportItem(kind=kind, data=item_data))

    return items, errors


def validate_coding_item(item: dict[str, Any], item_index: int) -> tuple[dict[str, Any], list[str]]:
    """Validate a coding import item."""
    errors: list[str] = []
    data = {
        "title": _require_string(item, "title", item_index, errors, trim=True),
        "difficulty": _require_string(item, "difficulty", item_index, errors, trim=True),
        "language": _require_string(item, "language", item_index, errors, trim=True),
        "description": _require_string(item, "description", item_index, errors),
        "functionName": _require_string(item, "functionName", item_index, errors, trim=True),
        "starterCode": _require_string(item, "starterCode", item_index, errors),
        "solution": _require_string(item, "solution", item_index, errors),
    }

    test_cases = item.get("testCases")
    normalized_cases: list[dict[str, Any]] = []
    if not isinstance(test_cases, list) or not test_cases:
        errors.append(f"Item {item_index}: testCases must be a non-empty array.")
    else:
        for case_index, test_case in enumerate(test_cases, start=1):
            prefix = f"Item {item_index} testCases[{case_index}]"
            if not isinstance(test_case, dict):
                errors.append(f"{prefix}: expected an object.")
                continue
            if "input" not in test_case:
                errors.append(f"{prefix}: missing required field 'input'.")
                continue
            if "output" not in test_case:
                errors.append(f"{prefix}: missing required field 'output'.")
                continue
            if not isinstance(test_case["input"], list):
                errors.append(f"{prefix}: input must be an array.")
                continue
            normalized_cases.append(
                {
                    "input": test_case["input"],
                    "output": test_case["output"],
                }
            )

    if errors:
        return {}, errors

    data["testCases"] = normalized_cases
    return data, []


def validate_mcq_item(item: dict[str, Any], item_index: int) -> tuple[dict[str, Any], list[str]]:
    """Validate an MCQ import item."""
    errors: list[str] = []
    data = {
        "question": _require_string(item, "question", item_index, errors, trim=True),
        "difficulty": _require_string(item, "difficulty", item_index, errors, trim=True),
    }

    choices = item.get("choices")
    normalized_choices: list[dict[str, Any]] = []
    correct_count = 0
    if not isinstance(choices, list) or not choices:
        errors.append(f"Item {item_index}: choices must be a non-empty array.")
    else:
        for choice_index, choice in enumerate(choices, start=1):
            prefix = f"Item {item_index} choices[{choice_index}]"
            if not isinstance(choice, dict):
                errors.append(f"{prefix}: expected an object.")
                continue

            text = choice.get("text")
            if not isinstance(text, str) or not text.strip():
                errors.append(f"{prefix}: text must be a non-empty string.")
                continue

            if "correct" in choice and not isinstance(choice["correct"], bool):
                errors.append(f"{prefix}: correct must be a boolean when provided.")
                continue

            notes = choice.get("notes")
            if notes is not None and not isinstance(notes, str):
                errors.append(f"{prefix}: notes must be a string when provided.")
                continue

            is_correct = choice.get("correct", False)
            if is_correct:
                correct_count += 1

            normalized_choice = {"text": text}
            if is_correct:
                normalized_choice["correct"] = True
            if notes:
                normalized_choice["notes"] = notes
            normalized_choices.append(normalized_choice)

    code = item.get("code")
    if code is None:
        normalized_code = None
    elif not isinstance(code, dict):
        errors.append(f"Item {item_index}: code must be an object when provided.")
        normalized_code = None
    else:
        snippet = code.get("snippet")
        language = code.get("language")
        if not isinstance(snippet, str) or not snippet.strip():
            errors.append(f"Item {item_index}: code.snippet must be a non-empty string.")
        if not isinstance(language, str) or not language.strip():
            errors.append(f"Item {item_index}: code.language must be a non-empty string.")
        normalized_code = (
            {
                "snippet": snippet,
                "language": language.strip(),
            }
            if not errors or (
                isinstance(snippet, str)
                and snippet.strip()
                and isinstance(language, str)
                and language.strip()
            )
            else None
        )

    if isinstance(choices, list) and choices and correct_count != 1:
        errors.append(f"Item {item_index}: choices must contain exactly one correct answer.")

    if errors:
        return {}, errors

    data["choices"] = normalized_choices
    if normalized_code is not None:
        data["code"] = normalized_code
    return data, []


def build_duplicate_key(kind: str, data: dict[str, Any]) -> DuplicateKey:
    """Build a normalized key for duplicate detection."""
    if kind == CODING_KIND:
        return (
            CODING_KIND,
            _normalize_key_part(data["title"]),
            _normalize_key_part(data["functionName"]),
            _normalize_key_part(data["language"]),
        )
    if kind == MCQ_KIND:
        return (MCQ_KIND, _normalize_key_part(data["question"]))
    raise ValueError(f"Unsupported kind: {kind}")


def partition_duplicate_items(
    items: list[ValidatedImportItem],
    existing_keys: set[DuplicateKey] | None = None,
) -> tuple[list[ValidatedImportItem], int]:
    """Split validated items into importable and skipped duplicates."""
    seen_keys = set(existing_keys or set())
    importable: list[ValidatedImportItem] = []
    skipped_duplicates = 0

    for item in items:
        key = build_duplicate_key(item.kind, item.data)
        if key in seen_keys:
            skipped_duplicates += 1
            continue
        seen_keys.add(key)
        importable.append(item)

    return importable, skipped_duplicates


def serialize_note_fields(item: ValidatedImportItem) -> dict[str, str]:
    """Map a validated item into Foggy note fields."""
    if item.kind == CODING_KIND:
        return {
            "Title": item.data["title"],
            "Difficulty": item.data["difficulty"],
            "Language": item.data["language"],
            "Description": item.data["description"],
            "FunctionName": item.data["functionName"],
            "StarterCode": item.data["starterCode"],
            "Solution": item.data["solution"],
            "TestCases": json.dumps(item.data["testCases"], ensure_ascii=False),
        }

    if item.kind == MCQ_KIND:
        code = item.data.get("code")
        return {
            "Question": item.data["question"],
            "Difficulty": item.data["difficulty"],
            "Choices": json.dumps(item.data["choices"], ensure_ascii=False),
            "Code": json.dumps(code, ensure_ascii=False) if code is not None else "",
        }

    raise ValueError(f"Unsupported kind: {item.kind}")


def _normalize_key_part(value: Any) -> str:
    return " ".join(str(value).split()).casefold()


def _require_string(
    item: dict[str, Any],
    field_name: str,
    item_index: int,
    errors: list[str],
    *,
    trim: bool = False,
) -> str:
    value = item.get(field_name)
    if not isinstance(value, str) or not value.strip():
        errors.append(f"Item {item_index}: {field_name} must be a non-empty string.")
        return ""
    return value.strip() if trim else value
