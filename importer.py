"""JSON importer for Foggy notes."""

from __future__ import annotations

import json
from dataclasses import dataclass
from textwrap import dedent
from typing import Any

CODING_KIND = "coding"
MCQ_KIND = "mcq"

DuplicateKey = tuple[str, ...]


@dataclass(frozen=True)
class ValidatedImportItem:
    kind: str
    data: dict[str, Any]


@dataclass(frozen=True)
class ImportOperationResult:
    changes: Any
    imported_count: int
    skipped_duplicates: int
    total_count: int


PROMPT_TEMPLATES = {
    "Mixed": dedent(
        """
        Generate raw JSON only. No markdown fences. Return either a single object or an array of objects.
        Every object must include a "kind" field set to "coding" or "mcq".

        Coding schema:
        {
          "kind": "coding",
          "title": "Two Sum",
          "difficulty": "Easy",
          "language": "Python",
          "description": "Write the full problem statement here.",
          "functionName": "two_sum",
          "starterCode": "def two_sum(nums, target):\\n    pass",
          "solution": "def two_sum(nums, target):\\n    seen = {}\\n    for index, value in enumerate(nums):\\n        need = target - value\\n        if need in seen:\\n            return [seen[need], index]\\n        seen[value] = index",
          "testCases": [
            {"input": [[2, 7, 11, 15], 9], "output": [0, 1]},
            {"input": [[3, 2, 4], 6], "output": [1, 2]}
          ]
        }

        MCQ schema:
        {
          "kind": "mcq",
          "question": "Which statement about binary search is correct?",
          "difficulty": "Easy",
          "choices": [
            {"text": "It requires sorted input.", "correct": true, "notes": "Binary search only works when the search space is ordered."},
            {"text": "It always runs in O(n)."},
            {"text": "It checks every element."}
          ],
          "code": {
            "snippet": "def binary_search(nums, target):\\n    left, right = 0, len(nums) - 1",
            "language": "python"
          }
        }

        Use real arrays and objects for nested JSON fields. Escape newlines inside strings.
        """
    ).strip(),
    "Coding": dedent(
        """
        Generate raw JSON only. No markdown fences. Return either one coding object or an array of coding objects.
        Every object must match this exact schema:

        {
          "kind": "coding",
          "title": "Problem title",
          "difficulty": "Easy",
          "language": "Python",
          "description": "Full prompt text",
          "functionName": "function_name",
          "starterCode": "def function_name(arg1, arg2):\\n    pass",
          "solution": "def function_name(arg1, arg2):\\n    return arg1 + arg2",
          "testCases": [
            {"input": [1, 2], "output": 3},
            {"input": [5, 7], "output": 12}
          ]
        }

        testCases must be an array of objects with "input" as an array and "output" as any JSON value.
        Escape newlines inside strings.
        """
    ).strip(),
    "MCQ": dedent(
        """
        Generate raw JSON only. No markdown fences. Return either one mcq object or an array of mcq objects.
        Every object must match this exact schema:

        {
          "kind": "mcq",
          "question": "Question text",
          "difficulty": "Medium",
          "choices": [
            {"text": "Choice A"},
            {"text": "Choice B", "correct": true, "notes": "Explain why this is correct."},
            {"text": "Choice C", "notes": "Optional rationale for why this is wrong."}
          ],
          "code": {
            "snippet": "for index in range(3):\\n    print(index)",
            "language": "python"
          }
        }

        choices must contain exactly one object with "correct": true.
        Omit the "code" object if the question has no code snippet.
        Escape newlines inside strings.
        """
    ).strip(),
}


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


try:
    from aqt import mw
    from aqt.deckchooser import DeckChooser
    from aqt.operations import CollectionOp
    from aqt.qt import (
        QApplication,
        QDialog,
        QFontDatabase,
        QGroupBox,
        QHBoxLayout,
        QLabel,
        QPlainTextEdit,
        QPushButton,
        QSplitter,
        QTabWidget,
        QVBoxLayout,
        QWidget,
        Qt,
    )
    from aqt.utils import qconnect, showInfo, showWarning, tooltip

    AQT_AVAILABLE = True
except ImportError:
    AQT_AVAILABLE = False
    mw = None


if AQT_AVAILABLE:
    _import_window = None

    class FoggyImportWindow(QDialog):
        def __init__(self) -> None:
            super().__init__(mw, Qt.WindowType.Window)
            self._is_importing = False
            self._close_button: QPushButton | None = None
            self._deck_chooser = None
            self._cleanup_done = False
            self._json_editor: QPlainTextEdit | None = None
            self._import_button: QPushButton | None = None
            self.setAttribute(Qt.WidgetAttribute.WA_DeleteOnClose, True)
            self.setWindowTitle("Foggy Import")
            self.resize(1120, 720)
            self._build_ui()

        def closeEvent(self, event) -> None:  # type: ignore[override]
            if self._is_importing:
                event.ignore()
                tooltip("Import is still running.")
                return

            self._cleanup()
            super().closeEvent(event)

        def _build_ui(self) -> None:
            layout = QVBoxLayout(self)
            layout.setContentsMargins(16, 16, 16, 16)
            layout.setSpacing(12)

            intro = QLabel(
                "Paste mixed Foggy JSON on the left, choose a target deck on the right, and import."
            )
            intro.setWordWrap(True)
            layout.addWidget(intro)

            splitter = QSplitter(Qt.Orientation.Horizontal, self)
            splitter.addWidget(self._build_json_panel())
            splitter.addWidget(self._build_side_panel())
            splitter.setStretchFactor(0, 3)
            splitter.setStretchFactor(1, 2)
            layout.addWidget(splitter, 1)

            button_row = QHBoxLayout()
            button_row.addStretch(1)

            close_button = QPushButton("Close", self)
            qconnect(close_button.clicked, self.close)
            button_row.addWidget(close_button)
            self._close_button = close_button

            import_button = QPushButton("Import", self)
            import_button.setDefault(True)
            qconnect(import_button.clicked, self._start_import)
            button_row.addWidget(import_button)
            self._import_button = import_button

            layout.addLayout(button_row)

        def _build_json_panel(self) -> QWidget:
            panel = QGroupBox("Import JSON", self)
            layout = QVBoxLayout(panel)
            layout.setContentsMargins(12, 12, 12, 12)
            layout.setSpacing(8)

            hint = QLabel(
                "Accepts either one object or an array of objects. Keep nested fields as real JSON."
            )
            hint.setWordWrap(True)
            layout.addWidget(hint)

            editor = QPlainTextEdit(panel)
            editor.setPlaceholderText("Paste Foggy import JSON here...")
            editor.setLineWrapMode(_plain_text_wrap_mode("NoWrap"))
            editor.setTabChangesFocus(False)
            editor.setFont(_fixed_width_font())
            layout.addWidget(editor, 1)
            self._json_editor = editor

            return panel

        def _build_side_panel(self) -> QWidget:
            panel = QWidget(self)
            layout = QVBoxLayout(panel)
            layout.setContentsMargins(0, 0, 0, 0)
            layout.setSpacing(12)

            deck_group = QGroupBox("Target Deck", panel)
            deck_layout = QVBoxLayout(deck_group)
            deck_layout.setContentsMargins(12, 12, 12, 12)
            deck_layout.setSpacing(8)
            deck_area = QWidget(deck_group)
            self._deck_chooser = DeckChooser(mw, deck_area)
            deck_layout.addWidget(deck_area)
            layout.addWidget(deck_group)

            prompts_group = QGroupBox("AI Prompts", panel)
            prompts_layout = QVBoxLayout(prompts_group)
            prompts_layout.setContentsMargins(12, 12, 12, 12)
            prompts_layout.setSpacing(8)

            prompt_hint = QLabel(
                "Copy one of these prompts into your AI tool to generate JSON that matches the importer schema."
            )
            prompt_hint.setWordWrap(True)
            prompts_layout.addWidget(prompt_hint)

            tabs = QTabWidget(prompts_group)
            for tab_name, prompt_text in PROMPT_TEMPLATES.items():
                tabs.addTab(self._build_prompt_tab(tab_name, prompt_text), tab_name)
            prompts_layout.addWidget(tabs, 1)

            layout.addWidget(prompts_group, 1)
            return panel

        def _build_prompt_tab(self, tab_name: str, prompt_text: str) -> QWidget:
            tab = QWidget(self)
            layout = QVBoxLayout(tab)
            layout.setContentsMargins(0, 0, 0, 0)
            layout.setSpacing(8)

            editor = QPlainTextEdit(tab)
            editor.setPlainText(prompt_text)
            editor.setReadOnly(True)
            editor.setLineWrapMode(_plain_text_wrap_mode("WidgetWidth"))
            editor.setFont(_fixed_width_font())
            layout.addWidget(editor, 1)

            copy_button = QPushButton("Copy Prompt", tab)
            qconnect(
                copy_button.clicked,
                lambda _checked=False, label=tab_name, text=prompt_text: self._copy_prompt(
                    label, text
                ),
            )
            layout.addWidget(copy_button)
            return tab

        def _copy_prompt(self, label: str, prompt_text: str) -> None:
            clipboard = QApplication.clipboard()
            if clipboard is not None:
                clipboard.setText(prompt_text)
            tooltip(f"{label} prompt copied to clipboard.")

        def _start_import(self) -> None:
            assert self._json_editor is not None
            assert self._import_button is not None
            assert self._deck_chooser is not None

            items, errors = parse_import_json(self._json_editor.toPlainText())
            if errors:
                showWarning(_format_error_report(errors), parent=self)
                return

            self._set_importing(True)
            deck_id = self._deck_chooser.selected_deck_id
            CollectionOp(
                self,
                lambda col, payload=items, target_deck_id=deck_id: _run_import_operation(
                    col,
                    payload,
                    target_deck_id,
                ),
            ).success(self._on_import_success).failure(self._on_import_failure).run_in_background(
                initiator=self
            )

        def _on_import_success(self, result: ImportOperationResult) -> None:
            self._set_importing(False)
            showInfo(
                "Import complete.\n"
                f"Imported: {result.imported_count}\n"
                f"Skipped duplicates: {result.skipped_duplicates}\n"
                f"Total items: {result.total_count}",
                parent=self,
            )

        def _on_import_failure(self, error: Exception) -> None:
            self._set_importing(False)
            showWarning(f"Import failed.\n{error}", parent=self)

        def _set_importing(self, importing: bool) -> None:
            self._is_importing = importing
            assert self._json_editor is not None
            assert self._import_button is not None
            assert self._close_button is not None
            assert self._deck_chooser is not None
            self._json_editor.setReadOnly(importing)
            self._import_button.setEnabled(not importing)
            self._close_button.setEnabled(not importing)
            self._deck_chooser.deck.setEnabled(not importing)

        def _cleanup(self) -> None:
            if self._cleanup_done:
                return
            if self._deck_chooser is not None:
                self._deck_chooser.cleanup()
            self._cleanup_done = True


def show_import_window() -> None:
    """Open the Foggy import window."""
    if not AQT_AVAILABLE:
        raise RuntimeError("Foggy importer UI requires Anki.")

    if mw is None or mw.col is None:
        showInfo("Please open a profile first.")
        return

    global _import_window
    if _import_window is None:
        _import_window = FoggyImportWindow()
        _import_window.destroyed.connect(lambda *_args: _clear_import_window_reference())

    _import_window.show()
    _import_window.raise_()
    _import_window.activateWindow()


def _clear_import_window_reference() -> None:
    global _import_window
    _import_window = None


def _fixed_width_font():
    try:
        return QFontDatabase.systemFont(QFontDatabase.SystemFont.FixedFont)
    except AttributeError:
        return QFontDatabase.systemFont(QFontDatabase.FixedFont)


def _plain_text_wrap_mode(name: str):
    try:
        return getattr(QPlainTextEdit.LineWrapMode, name)
    except AttributeError:
        return getattr(QPlainTextEdit, name)


def _format_error_report(errors: list[str]) -> str:
    lines = ["Import failed:"]
    lines.extend(f"{index}. {message}" for index, message in enumerate(errors, start=1))
    return "\n".join(lines)


def _run_import_operation(col, items: list[ValidatedImportItem], deck_id) -> ImportOperationResult:
    from anki.collection import AddNoteRequest, OpChanges

    from . import models

    models.ensure_note_types(col)

    coding_model = col.models.by_name(models.NOTETYPE_NAME)
    mcq_model = col.models.by_name(models.MCQ_NOTETYPE_NAME)
    if coding_model is None or mcq_model is None:
        raise RuntimeError("Foggy note types are unavailable.")

    existing_keys = _load_existing_duplicate_keys(
        col,
        coding_model_id=coding_model["id"],
        mcq_model_id=mcq_model["id"],
    )
    importable_items, skipped_duplicates = partition_duplicate_items(items, existing_keys)

    requests = []
    for item in importable_items:
        note = col.new_note(coding_model if item.kind == CODING_KIND else mcq_model)
        for field_name, value in serialize_note_fields(item).items():
            note[field_name] = value
        requests.append(AddNoteRequest(note=note, deck_id=deck_id))

    changes = col.add_notes(requests) if requests else OpChanges()
    return ImportOperationResult(
        changes=changes,
        imported_count=len(requests),
        skipped_duplicates=skipped_duplicates,
        total_count=len(items),
    )


def _load_existing_duplicate_keys(
    col,
    *,
    coding_model_id: int,
    mcq_model_id: int,
) -> set[DuplicateKey]:
    keys: set[DuplicateKey] = set()

    for note_id in col.find_notes(f"mid:{coding_model_id}"):
        note = col.get_note(note_id)
        keys.add(
            build_duplicate_key(
                CODING_KIND,
                {
                    "title": note["Title"],
                    "functionName": note["FunctionName"],
                    "language": note["Language"],
                },
            )
        )

    for note_id in col.find_notes(f"mid:{mcq_model_id}"):
        note = col.get_note(note_id)
        keys.add(
            build_duplicate_key(
                MCQ_KIND,
                {
                    "question": note["Question"],
                },
            )
        )

    return keys
