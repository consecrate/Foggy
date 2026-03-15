"""Foggy — custom study modes for Anki."""

import json

from aqt import gui_hooks, mw
from aqt.utils import showInfo, showWarning, qconnect
from aqt.qt import QAction, QDialog, QFormLayout, QHBoxLayout, QLineEdit, QMenu, QPushButton, QVBoxLayout

CODE_DECK_NAME = "Foggy Code"
MCQ_DECK_NAME = "Foggy MCQ"
CODE_MCQ_DECK_NAME = "Foggy Code MCQ"

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
    "Choices": json.dumps([
        {"text": "The duck stared the bug into submission.", "notes": "While intimidation tactics may work on teammates, bugs are unfortunately immune to staring."},
        {"text": "You finally explained the problem out loud.", "correct": True, "notes": "Rubber duck debugging works because explaining your code out loud forces you to think through each step carefully, often revealing the mistake yourself."},
        {"text": "Python got nervous and fixed itself.", "notes": "Python is many things, but self-aware is not one of them — at least not yet."},
        {"text": "The compiler wanted to impress the duck.", "notes": "Compilers are deterministic and do not have feelings, no matter how much we wish they did."},
    ]),
}

CODE_MCQ_SAMPLE_CARD = {
    "Question": "What does this function return when called with x = 3?",
    "Difficulty": "Easy",
    "Choices": json.dumps([
        {"text": "9", "correct": True, "notes": "The function squares its argument: 3 * 3 = 9."},
        {"text": "6", "notes": "That would be 3 + 3 or 3 * 2, not 3 ** 2."},
        {"text": "3", "notes": "The function modifies x before returning it."},
        {"text": "27", "notes": "That would be 3 ** 3, not 3 ** 2."},
    ]),
    "Code": json.dumps({
        "snippet": "def mystery(x):\n    return x ** 2",
        "language": "python",
    }),
}

_TEST_DECK_NAMES = (CODE_DECK_NAME, MCQ_DECK_NAME, CODE_MCQ_DECK_NAME)


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
    code_mcq_added = _ensure_sample_note(
        col=col,
        deck_name=CODE_MCQ_DECK_NAME,
        notetype=mcq_notetype,
        sample_fields=CODE_MCQ_SAMPLE_CARD,
        matcher=_is_code_mcq_sample,
    )

    showInfo(
        "Foggy initialized!\n"
        + f"{CODE_DECK_NAME}: {'added Hello World' if code_added else 'already exists'}\n"
        + f"{MCQ_DECK_NAME}: {'added sample MCQ' if mcq_added else 'already exists'}\n"
        + f"{CODE_MCQ_DECK_NAME}: {'added code MCQ' if code_mcq_added else 'already exists'}"
    )


def _reset() -> None:
    """Remove all Foggy test decks and their cards."""
    col = mw.col
    if col is None:
        showInfo("Please open a profile first.")
        return

    removed = []
    for deck_name in _TEST_DECK_NAMES:
        deck = col.decks.by_name(deck_name)
        if deck is not None:
            col.decks.remove([deck["id"]])
            removed.append(deck_name)

    if removed:
        showInfo("Removed decks:\n" + "\n".join(f"• {name}" for name in removed))
    else:
        showInfo("No Foggy test decks found.")


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
    return note["Question"] == MCQ_SAMPLE_CARD["Question"]


def _is_code_mcq_sample(note) -> bool:
    return note["Question"] == CODE_MCQ_SAMPLE_CARD["Question"]


def _open_import_window() -> None:
    """Open the Foggy JSON importer."""
    col = mw.col
    if col is None:
        showInfo("Please open a profile first.")
        return

    from . import importer

    importer.show_import_window()


def _enrich_deutsch() -> None:
    """Enrich pending Foggy Translate notes."""
    col = mw.col
    if col is None:
        showInfo("Please open a profile first.")
        return

    from . import enricher

    try:
        enricher.start_enrichment()
    except Exception as error:
        showWarning(str(error))


TRANSLATE_TEMP_DECK = "Deutsch Temporary"
TRANSLATE_DECK = "Deutsch"
DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free"


def _show_translate_setup() -> None:
    """Open the Translate Setup dialog."""
    col = mw.col
    if col is None:
        showInfo("Please open a profile first.")
        return

    config = mw.addonManager.getConfig(__name__) or {}

    dialog = QDialog(mw)
    dialog.setWindowTitle("Translate Setup")
    dialog.setMinimumWidth(420)

    layout = QVBoxLayout(dialog)
    form = QFormLayout()

    key_input = QLineEdit(config.get("openrouter_api_key", ""))
    key_input.setEchoMode(QLineEdit.EchoMode.Password)
    key_input.setPlaceholderText("sk-or-...")
    form.addRow("OpenRouter API Key:", key_input)

    model_input = QLineEdit(config.get("openrouter_model", "") or DEFAULT_MODEL)
    model_input.setPlaceholderText(DEFAULT_MODEL)
    form.addRow("Model:", model_input)

    layout.addLayout(form)

    def _save() -> None:
        config["openrouter_api_key"] = key_input.text().strip()
        config["openrouter_model"] = model_input.text().strip() or DEFAULT_MODEL
        mw.addonManager.writeConfig(__name__, config)
        showInfo("Translate settings saved.")

    def _create_decks() -> None:
        from . import models
        models.ensure_note_types()
        col.decks.id(TRANSLATE_TEMP_DECK)
        col.decks.id(TRANSLATE_DECK)
        showInfo(
            "Decks created!\n\n"
            f"• {TRANSLATE_TEMP_DECK} — add German sentences here\n"
            f"• {TRANSLATE_DECK} — enriched cards land here\n\n"
            "Workflow: add notes to the temporary deck, then use\n"
            "Foggy → 🇩🇪 Enrich Deutsch to translate them."
        )

    btn_row = QHBoxLayout()
    save_btn = QPushButton("Save")
    save_btn.clicked.connect(_save)
    btn_row.addWidget(save_btn)

    create_btn = QPushButton("Create Decks")
    create_btn.clicked.connect(_create_decks)
    btn_row.addWidget(create_btn)

    layout.addLayout(btn_row)
    dialog.exec()


gui_hooks.profile_did_open.append(_on_profile_loaded)

_foggy_menu = QMenu("Foggy", mw)
mw.form.menubar.addMenu(_foggy_menu)

_init_action = QAction("🛠️ Initialize", mw)
qconnect(_init_action.triggered, _initialize)
_foggy_menu.addAction(_init_action)

_import_action = QAction("Import", mw)
qconnect(_import_action.triggered, _open_import_window)
_foggy_menu.addAction(_import_action)

_enrich_action = QAction("🇩🇪 Enrich Deutsch", mw)
qconnect(_enrich_action.triggered, _enrich_deutsch)
_foggy_menu.addAction(_enrich_action)

_translate_setup_action = QAction("🌐 Translate Setup", mw)
qconnect(_translate_setup_action.triggered, _show_translate_setup)
_foggy_menu.addAction(_translate_setup_action)

_foggy_menu.addSeparator()

_reset_action = QAction("🧹 Reset", mw)
qconnect(_reset_action.triggered, _reset)
_foggy_menu.addAction(_reset_action)
