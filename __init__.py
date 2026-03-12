"""Foggy — LeetCode-style coding cards for Anki."""

from aqt import gui_hooks, mw
from aqt.utils import showInfo, qconnect
from aqt.qt import QAction

SAMPLE_CARD = {
    "Title": "Hello World",
    "Difficulty": "Easy",
    "Language": "Python",
    "Description": "Write a function that returns the string 'Hello World'.",
    "FunctionName": "hello_world",
    "StarterCode": "def hello_world():\n    pass",
    "Solution": "def hello_world():\n    return 'Hello World'",
    "TestCases": '[{"input": [], "output": "Hello World"}]',
}


def _on_profile_loaded() -> None:
    """Initialize Foggy after Anki profile is loaded."""
    from . import models, reviewer

    models.ensure_note_type()
    reviewer.register_hooks()


def _initialize() -> None:
    """Create the Foggy deck and ensure the Hello World sample card exists."""
    col = mw.col
    if col is None:
        showInfo("Please open a profile first.")
        return

    from . import models

    models.ensure_note_type()
    deck_id = col.decks.id("Foggy")
    notetype = col.models.by_name(models.NOTETYPE_NAME)
    if notetype is None:
        showInfo("Error: Foggy note type not found.")
        return

    if _sample_note_exists(col, notetype["id"]):
        showInfo("Foggy initialized!\nDeck: Foggy\nCard: Hello World already exists")
        return

    note = col.new_note(notetype)
    for field_name, value in SAMPLE_CARD.items():
        note[field_name] = value

    col.add_note(note, deck_id)
    showInfo("Foggy initialized!\nDeck: Foggy\nCard: Hello World")


def _sample_note_exists(col, notetype_id: int) -> bool:
    """Check whether the bundled sample card already exists."""
    note_ids = col.find_notes(f"mid:{notetype_id}")
    for note_id in note_ids:
        note = col.get_note(note_id)
        if (
            note["Title"] == SAMPLE_CARD["Title"]
            and note["FunctionName"] == SAMPLE_CARD["FunctionName"]
            and note["Language"] == SAMPLE_CARD["Language"]
        ):
            return True
    return False


gui_hooks.profile_did_open.append(_on_profile_loaded)

# Add "Initialize" to the Tools menu
_action = QAction("Initialize", mw)
qconnect(_action.triggered, _initialize)
mw.form.menuTools.addAction(_action)
