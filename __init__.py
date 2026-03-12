"""Foggy — LeetCode-style coding cards for Anki."""

import json

from aqt import gui_hooks, mw
from aqt.utils import showInfo, qconnect
from aqt.qt import QAction, QMenu

CODE_DECK_NAME = "Foggy Code"
MCQ_DECK_NAME = "Foggy MCQ"

CODE_SAMPLE_CARD = {
    "Title": "Hello World",
    "Difficulty": "Easy",
    "Language": "Python",
    "Description": "Write a function that returns the string 'Hello World'.",
    "FunctionName": "hello_world",
    "StarterCode": "def hello_world():\n    pass",
    "Solution": "def hello_world():\n    return 'Hello World'",
    "TestCases": '[{"input": [], "output": "Hello World"}]',
}

MCQ_SAMPLE_CARD = {
    "Question": "A duck is pair-programming with you. Why did your code suddenly start working?",
    "Difficulty": "Easy",
    "Description": "Choose the most suspiciously correct explanation.",
    "Choices": json.dumps([
        {"text": "The duck stared the bug into submission."},
        {"text": "You finally explained the problem out loud.", "correct": True},
        {"text": "Python got nervous and fixed itself."},
        {"text": "The compiler wanted to impress the duck."},
    ]),
}


def _on_profile_loaded() -> None:
    """Initialize Foggy after Anki profile is loaded."""
    from . import models, reviewer

    models.ensure_note_types()
    reviewer.register_hooks()


def _initialize() -> None:
    """Create the starter Foggy decks and seed the bundled example cards."""
    col = mw.col
    if col is None:
        showInfo("Please open a profile first.")
        return

    from . import models

    models.ensure_note_types()
    code_notetype = col.models.by_name(models.NOTETYPE_NAME)
    mcq_notetype = col.models.by_name(models.MCQ_NOTETYPE_NAME)
    if code_notetype is None or mcq_notetype is None:
        showInfo("Error: Foggy note types not found.")
        return

    code_added = _ensure_sample_note(
        col=col,
        deck_name=CODE_DECK_NAME,
        notetype=code_notetype,
        sample_fields=CODE_SAMPLE_CARD,
        matcher=_is_code_sample,
    )
    mcq_added = _ensure_sample_note(
        col=col,
        deck_name=MCQ_DECK_NAME,
        notetype=mcq_notetype,
        sample_fields=MCQ_SAMPLE_CARD,
        matcher=_is_mcq_sample,
    )

    showInfo(
        "Foggy initialized!\n"
        + f"{CODE_DECK_NAME}: {'added Hello World' if code_added else 'Hello World already exists'}\n"
        + f"{MCQ_DECK_NAME}: {'added duck debugging MCQ' if mcq_added else 'duck debugging MCQ already exists'}"
    )


def _ensure_sample_note(col, deck_name: str, notetype, sample_fields: dict[str, str], matcher) -> bool:
    """Ensure a bundled sample note exists in the requested deck."""
    deck_id = col.decks.id(deck_name)
    if _sample_note_exists(col, notetype["id"], matcher):
        return False

    note = col.new_note(notetype)
    for field_name, value in sample_fields.items():
        note[field_name] = value

    col.add_note(note, deck_id)
    return True


def _sample_note_exists(col, notetype_id: int, matcher) -> bool:
    """Check whether a bundled sample note already exists."""
    note_ids = col.find_notes(f"mid:{notetype_id}")
    for note_id in note_ids:
        note = col.get_note(note_id)
        if matcher(note):
            return True
    return False


def _is_code_sample(note) -> bool:
    return (
        note["Title"] == CODE_SAMPLE_CARD["Title"]
        and note["FunctionName"] == CODE_SAMPLE_CARD["FunctionName"]
        and note["Language"] == CODE_SAMPLE_CARD["Language"]
    )


def _is_mcq_sample(note) -> bool:
    return (
        note["Question"] == MCQ_SAMPLE_CARD["Question"]
        and note["Description"] == MCQ_SAMPLE_CARD["Description"]
    )


gui_hooks.profile_did_open.append(_on_profile_loaded)

_foggy_menu = QMenu("Foggy", mw)
mw.form.menubar.addMenu(_foggy_menu)
_action = QAction("Initialize", mw)
qconnect(_action.triggered, _initialize)
_foggy_menu.addAction(_action)
