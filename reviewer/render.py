from __future__ import annotations

import io
import json
import traceback

from ..models import MCQ_NOTETYPE_NAME, NOTETYPE_NAME
from .assets import get_web_assets
from .chrome import hide_reviewer_chrome, restore_reviewer_chrome

FOGGY_REVIEW_KINDS = {
    "reviewQuestion",
    "reviewAnswer",
    "previewQuestion",
    "previewAnswer",
}


def on_card_will_show(text: str, card, kind: str) -> str:
    try:
        if kind not in FOGGY_REVIEW_KINDS:
            return text

        note_kind = _get_note_kind(card)
        if note_kind is None:
            restore_reviewer_chrome()
            return text

        hide_reviewer_chrome()
        assets = get_web_assets()
        card_data = _build_card_data(card, note_kind, kind in ("reviewAnswer", "previewAnswer"))

        return f"""
<style>{assets.style_css}</style>
{assets.template_html}
<script id="foggy-data" type="application/json">
{json.dumps(card_data)}
</script>
<script>
{assets.split_bundle_js}
</script>
<script>
{assets.cm_bundle_js}
</script>
<script>
{assets.main_js}
</script>
"""
    except Exception:
        buffer = io.StringIO()
        traceback.print_exc(file=buffer)
        print(buffer.getvalue())
        return text


def _get_field(card, field_name: str) -> str:
    note = card.note()
    model = note.note_type()
    field_names = [field["name"] for field in model["flds"]]
    if field_name in field_names:
        return note.fields[field_names.index(field_name)]
    return ""


def _build_card_data(card, note_kind: str, is_answer: bool) -> dict[str, object]:
    if note_kind == "mcq":
        question = _get_field(card, "Question")
        return {
            "kind": "mcq",
            "title": question,
            "question": question,
            "difficulty": _get_field(card, "Difficulty"),
            "description": _get_field(card, "Description"),
            "choices": _get_field(card, "Choices"),
            "cardId": card.id,
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
        "isAnswer": is_answer,
    }


def _get_note_kind(card) -> str | None:
    note = card.note()
    model = note.note_type()
    if model["name"] == NOTETYPE_NAME:
        return "coding"
    if model["name"] == MCQ_NOTETYPE_NAME:
        return "mcq"
    return None
