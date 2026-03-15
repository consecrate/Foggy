"""Anki UI for importing Foggy JSON payloads."""

from __future__ import annotations

try:
    from .importer_operation import ImportOperationResult, run_import_operation
    from .importer_prompts import PROMPT_TEMPLATES
    from .importer_validation import parse_import_json
except ImportError:
    from importer_operation import ImportOperationResult, run_import_operation
    from importer_prompts import PROMPT_TEMPLATES
    from importer_validation import parse_import_json

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


FoggyImportWindow = None
_import_window = None


if AQT_AVAILABLE:

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
                lambda col, payload=items, target_deck_id=deck_id: run_import_operation(
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
