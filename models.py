"""Beep note type creation and management."""

from anki.models import NotetypeDict
from aqt import mw

NOTETYPE_NAME = "Beep"

FIELDS = [
    "Title",
    "Difficulty",
    "Language",
    "Description",
    "FunctionName",
    "StarterCode",
    "Solution",
    "TestCases",
]

# Minimal templates — the real UI is injected via card_will_show hook.
FRONT_TEMPLATE = """\
<div id="beep-front">
  <div class="beep-title">{{Title}}</div>
  <div class="beep-desc">{{Description}}</div>
</div>
"""

BACK_TEMPLATE = """\
<div id="beep-back">
  <div class="beep-title">Reference Solution</div>
  <pre class="beep-solution">{{Solution}}</pre>
</div>
"""


def ensure_note_type() -> None:
    """Create or migrate the Beep note type."""
    col = mw.col
    if col is None:
        return

    model = col.models.by_name(NOTETYPE_NAME)
    if model is None:
        model = _create_note_type(col)
        return

    changed = _ensure_fields(col, model)
    changed = _ensure_template(col, model) or changed
    if changed:
        col.models.save(model)


def _create_note_type(col) -> NotetypeDict:
    """Create a fresh Beep note type."""
    model: NotetypeDict = col.models.new(NOTETYPE_NAME)
    _ensure_fields(col, model)
    _ensure_template(col, model)
    col.models.add(model)
    return model


def _ensure_fields(col, model: NotetypeDict) -> bool:
    """Ensure the Beep note type has the required fields."""
    changed = False
    existing_fields = {field["name"] for field in model["flds"]}

    for field_name in FIELDS:
        if field_name in existing_fields:
            continue

        field = col.models.new_field(field_name)
        col.models.add_field(model, field)
        changed = True

    return changed


def _ensure_template(col, model: NotetypeDict) -> bool:
    """Ensure the primary card template matches the current Beep templates."""
    templates = model["tmpls"]
    if templates:
        template = templates[0]
        changed = False
    else:
        template = col.models.new_template("Card 1")
        col.models.add_template(model, template)
        changed = True

    if template["qfmt"] != FRONT_TEMPLATE:
        template["qfmt"] = FRONT_TEMPLATE
        changed = True

    if template["afmt"] != BACK_TEMPLATE:
        template["afmt"] = BACK_TEMPLATE
        changed = True

    return changed
