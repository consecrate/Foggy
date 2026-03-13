"""Foggy note type creation and management."""

from __future__ import annotations

from dataclasses import dataclass

from anki.models import NotetypeDict
from aqt import mw

NOTETYPE_NAME = "Foggy"
MCQ_NOTETYPE_NAME = "Foggy MCQ"


@dataclass(frozen=True)
class NoteTypeSpec:
    name: str
    fields: tuple[str, ...]
    front_template: str
    back_template: str


CODING_SPEC = NoteTypeSpec(
    name=NOTETYPE_NAME,
    fields=(
        "Title",
        "Difficulty",
        "Language",
        "Description",
        "FunctionName",
        "StarterCode",
        "Solution",
        "TestCases",
    ),
    front_template="""\
<div id="foggy-front">
  <div class="foggy-title">{{Title}}</div>
  <div class="foggy-desc">{{Description}}</div>
</div>
""",
    back_template="""\
<div id="foggy-back">
  <div class="foggy-title">Reference Solution</div>
  <pre class="foggy-solution">{{Solution}}</pre>
</div>
""",
)

MCQ_SPEC = NoteTypeSpec(
    name=MCQ_NOTETYPE_NAME,
    fields=(
        "Question",
        "Difficulty",
        "Choices",
    ),
    front_template="""\
<div id="foggy-mcq-front">
  <div class="foggy-title">{{Question}}</div>
</div>
""",
    back_template="""\
<div id="foggy-mcq-back">
  <div class="foggy-title">{{Question}}</div>
</div>
""",
)

NOTE_TYPE_SPECS = (CODING_SPEC, MCQ_SPEC)


def ensure_note_types() -> None:
    """Create or migrate all Foggy note types."""
    col = mw.col
    if col is None:
        return

    for spec in NOTE_TYPE_SPECS:
        _ensure_note_type(col, spec)


def ensure_note_type() -> None:
    """Backward-compatible wrapper for existing callers."""
    ensure_note_types()


def _ensure_note_type(col, spec: NoteTypeSpec) -> None:
    model = col.models.by_name(spec.name)
    if model is None:
        _create_note_type(col, spec)
        return

    changed = _ensure_fields(col, model, spec.fields)
    changed = _ensure_template(col, model, spec.front_template, spec.back_template) or changed
    if changed:
        col.models.save(model)


def _create_note_type(col, spec: NoteTypeSpec) -> NotetypeDict:
    """Create a fresh Foggy note type."""
    model: NotetypeDict = col.models.new(spec.name)
    _ensure_fields(col, model, spec.fields)
    _ensure_template(col, model, spec.front_template, spec.back_template)
    col.models.add(model)
    return model


def _ensure_fields(col, model: NotetypeDict, fields: tuple[str, ...]) -> bool:
    """Ensure the note type has the required fields."""
    changed = False
    existing_fields = {field["name"] for field in model["flds"]}

    for field_name in fields:
        if field_name in existing_fields:
            continue

        field = col.models.new_field(field_name)
        col.models.add_field(model, field)
        changed = True

    return changed


def _ensure_template(
    col,
    model: NotetypeDict,
    front_template: str,
    back_template: str,
) -> bool:
    """Ensure the primary card template matches the current Foggy templates."""
    templates = model["tmpls"]
    if templates:
        template = templates[0]
        changed = False
    else:
        template = col.models.new_template("Card 1")
        col.models.add_template(model, template)
        changed = True

    if template["qfmt"] != front_template:
        template["qfmt"] = front_template
        changed = True

    if template["afmt"] != back_template:
        template["afmt"] = back_template
        changed = True

    return changed
