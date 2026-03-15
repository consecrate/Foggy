from __future__ import annotations

import json

from ..models import (
    MCQ_NOTETYPE_NAME,
    NOTETYPE_NAME,
    TRANSLATE_MODE_TRANSLATE,
    TRANSLATE_NOTETYPE_NAME,
)


def _get_field(card, field_name: str) -> str:
    note = card.note()
    model = note.note_type()
    field_names = [field["name"] for field in model["flds"]]
    if field_name in field_names:
        return note.fields[field_names.index(field_name)]
    return ""


def _build_card_data(card, note_kind: str, is_answer: bool, serve_id: int) -> dict[str, object]:
    if note_kind == "mcq":
        question = _get_field(card, "Question")
        code_raw = _get_field(card, "Code").strip()
        code = None
        if code_raw:
            try:
                code = json.loads(code_raw)
            except (json.JSONDecodeError, ValueError):
                pass
        return {
            "kind": "mcq",
            "title": question,
            "question": question,
            "difficulty": _get_field(card, "Difficulty"),
            "choices": _get_field(card, "Choices"),
            "code": code,
            "cardId": card.id,
            "serveId": serve_id,
            "isAnswer": is_answer,
        }

    if note_kind == "translate":
        english = _get_field(card, "English")
        german = _get_field(card, "German")
        return {
            "kind": "translate",
            "mode": _translate_mode_for_card(card),
            "title": english or german or "Foggy Translate",
            "english": english,
            "german": german,
            "audio": _get_field(card, "Audio"),
            "context": _get_field(card, "Context"),
            "notes": _get_field(card, "Notes"),
            "fillBlank": _get_field(card, "FillBlank"),
            "cardId": card.id,
            "serveId": serve_id,
            "isAnswer": is_answer,
        }

    return {
        "kind": "coding",
        "title": _get_field(card, "Title"),
        "difficulty": _get_field(card, "Difficulty"),
        "language": _get_field(card, "Language"),
        "description": _get_field(card, "Description"),
        "functionName": _get_field(card, "FunctionName"),
        "starterCode": _get_field(card, "StarterCode"),
        "solution": _get_field(card, "Solution"),
        "testCases": _get_field(card, "TestCases"),
        "cardId": card.id,
        "serveId": serve_id,
        "isAnswer": is_answer,
    }


def _get_note_kind(card) -> str | None:
    note = card.note()
    model = note.note_type()
    if model["name"] == NOTETYPE_NAME:
        return "coding"
    if model["name"] == MCQ_NOTETYPE_NAME:
        return "mcq"
    if model["name"] == TRANSLATE_NOTETYPE_NAME:
        return "translate"
    return None


def _translate_mode_for_card(card) -> str:
    return TRANSLATE_MODE_TRANSLATE


def _parse_json_array_field(card, field_name: str) -> list[object]:
    raw_value = _get_field(card, field_name).strip()
    if not raw_value:
        return []

    try:
        parsed = json.loads(raw_value)
    except (json.JSONDecodeError, ValueError):
        return []

    return parsed if isinstance(parsed, list) else []
