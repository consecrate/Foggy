"""Foggy note type creation and management."""

from __future__ import annotations

from dataclasses import dataclass

from anki.models import NotetypeDict
from aqt import mw

NOTETYPE_NAME = "Foggy"
MCQ_NOTETYPE_NAME = "Foggy MCQ"
TRANSLATE_NOTETYPE_NAME = "Foggy Translate"

TRANSLATE_MODE_TRANSLATE = "translate"


@dataclass(frozen=True)
class TemplateSpec:
    name: str
    front_template: str
    back_template: str


@dataclass(frozen=True)
class NoteTypeSpec:
    name: str
    fields: tuple[str, ...]
    templates: tuple[TemplateSpec, ...]
    trim_extra_templates: bool = False


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
    templates=(
        TemplateSpec(
            name="Card 1",
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
        ),
    ),
)

MCQ_SPEC = NoteTypeSpec(
    name=MCQ_NOTETYPE_NAME,
    fields=(
        "Question",
        "Difficulty",
        "Choices",
        "Code",
    ),
    templates=(
        TemplateSpec(
            name="Card 1",
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
        ),
    ),
)

TRANSLATE_SPEC = NoteTypeSpec(
    name=TRANSLATE_NOTETYPE_NAME,
    fields=(
        "German",
        "English",
        "Audio",
        "Context",
        "Notes",
        "FillBlank",
    ),
    templates=(
        TemplateSpec(
            name="Translate",
            front_template="""\
{{#German}}
<div data-foggy-translate-mode="translate">{{English}}</div>
{{/German}}
""",
            back_template="""\
{{FrontSide}}
<hr id="answer">
{{German}}
""",
        ),
    ),
    trim_extra_templates=True,
)

NOTE_TYPE_SPECS = (CODING_SPEC, MCQ_SPEC, TRANSLATE_SPEC)


def ensure_note_types(col=None) -> None:
    """Create or migrate all Foggy note types."""
    col = col or mw.col
    if col is None:
        return

    for spec in NOTE_TYPE_SPECS:
        _ensure_note_type(col, spec)


def ensure_note_type(col=None) -> None:
    """Backward-compatible wrapper for existing callers."""
    ensure_note_types(col)


def _ensure_note_type(col, spec: NoteTypeSpec) -> None:
    model = col.models.by_name(spec.name)
    if model is None:
        _create_note_type(col, spec)
        return

    changed = _ensure_fields(col, model, spec.fields)
    changed = _ensure_templates(col, model, spec.templates, spec.trim_extra_templates) or changed
    if changed:
        col.models.save(model)


def _create_note_type(col, spec: NoteTypeSpec) -> NotetypeDict:
    """Create a fresh Foggy note type."""
    model: NotetypeDict = col.models.new(spec.name)
    _ensure_fields(col, model, spec.fields)
    _ensure_templates(col, model, spec.templates, spec.trim_extra_templates)
    col.models.add(model)
    return model


def _ensure_fields(col, model: NotetypeDict, fields: tuple[str, ...]) -> bool:
    """Ensure the note type has the required fields in the correct order."""
    changed = False
    existing_fields = {field["name"] for field in model["flds"]}

    for field_name in fields:
        if field_name in existing_fields:
            continue

        field = col.models.new_field(field_name)
        col.models.add_field(model, field)
        changed = True

    # Enforce field order to match the spec.
    for expected_idx, field_name in enumerate(fields):
        current_idx = next(
            i for i, f in enumerate(model["flds"]) if f["name"] == field_name
        )
        if current_idx != expected_idx:
            col.models.reposition_field(model, model["flds"][current_idx], expected_idx)
            changed = True

    return changed


def _ensure_templates(
    col,
    model: NotetypeDict,
    template_specs: tuple[TemplateSpec, ...],
    trim_extra_templates: bool,
) -> bool:
    """Ensure the note type templates match the current Foggy templates."""
    changed = False
    templates = model["tmpls"]

    for index, template_spec in enumerate(template_specs):
        if index < len(templates):
            template = templates[index]
        else:
            template = col.models.new_template(template_spec.name)
            col.models.add_template(model, template)
            templates = model["tmpls"]
            changed = True

        if template.get("name") != template_spec.name:
            template["name"] = template_spec.name
            changed = True

        if template.get("qfmt") != template_spec.front_template:
            template["qfmt"] = template_spec.front_template
            changed = True

        if template.get("afmt") != template_spec.back_template:
            template["afmt"] = template_spec.back_template
            changed = True

    if trim_extra_templates and len(templates) > len(template_specs):
        del templates[len(template_specs):]
        changed = True

    return changed
