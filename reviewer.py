"""Reviewer integration — replaces card HTML and handles JS↔Python bridge."""
from __future__ import annotations

import json
import os

from aqt import gui_hooks, mw
from aqt.qt import QWidget

from . import executor

ADDON_DIR = os.path.dirname(__file__)
WEB_DIR = os.path.join(ADDON_DIR, "web")

# Cache template contents
_template_html: str | None = None
_style_css: str | None = None
_main_js: str | None = None
_cm_bundle_js: str | None = None
_split_bundle_js: str | None = None
_hooks_registered = False
_toolbar_hidden = False
_bottom_bar_hidden = False
_toolbar_widget_state: list[tuple[QWidget, bool, int, int, bool | None]] = []
_bottom_bar_widget_state: list[tuple[QWidget, bool, int, int, bool | None]] = []
_FOGGY_REVIEW_KINDS = {
    "reviewQuestion",
    "reviewAnswer",
    "previewQuestion",
    "previewAnswer",
}


def _load_web_assets() -> None:
    """Load and cache web assets from disk."""
    global _template_html, _style_css, _main_js, _cm_bundle_js, _split_bundle_js

    with open(os.path.join(WEB_DIR, "index.html"), "r", encoding="utf-8") as f:
        _template_html = f.read()
    with open(os.path.join(WEB_DIR, "style.css"), "r", encoding="utf-8") as f:
        _style_css = f.read()
    with open(os.path.join(WEB_DIR, "main.js"), "r", encoding="utf-8") as f:
        _main_js = f.read()
    with open(
        os.path.join(WEB_DIR, "vendor", "codemirror", "codemirror.bundle.js"),
        "r",
        encoding="utf-8",
    ) as f:
        _cm_bundle_js = f.read()
    with open(
        os.path.join(WEB_DIR, "vendor", "split-grid", "split-grid.bundle.js"),
        "r",
        encoding="utf-8",
    ) as f:
        _split_bundle_js = f.read()


def _get_field(card, field_name: str) -> str:
    """Get a field value from a card's note."""
    note = card.note()
    model = note.note_type()
    field_names = [f["name"] for f in model["flds"]]
    if field_name in field_names:
        idx = field_names.index(field_name)
        return note.fields[idx]
    return ""


def _is_foggy_card(card) -> bool:
    """Check if a card belongs to the Foggy note type."""
    note = card.note()
    model = note.note_type()
    return model["name"] == "Foggy"


def _hide_widgets(widgets: list[QWidget]) -> list[tuple[QWidget, bool, int, int, bool | None]]:
    """Collapse widgets with Qt visibility while preserving Anki's hidden state."""
    hidden_states: list[tuple[QWidget, bool, int, int, bool | None]] = []
    for widget in widgets:
        hidden_state = getattr(widget, "hidden", None)
        if not isinstance(hidden_state, bool):
            hidden_state = None

        hidden_states.append((
            widget,
            widget.isVisible(),
            widget.minimumHeight(),
            widget.maximumHeight(),
            hidden_state,
        ))
        widget.setMinimumHeight(0)
        widget.setMaximumHeight(0)
        widget.setVisible(False)
        widget.updateGeometry()

    return hidden_states


def _restore_widgets(
    widget_states: list[tuple[QWidget, bool, int, int, bool | None]],
) -> None:
    """Restore widgets hidden by _hide_widgets()."""
    for widget, was_visible, min_height, max_height, hidden_state in reversed(widget_states):
        widget.setMinimumHeight(min_height)
        widget.setMaximumHeight(max_height)
        widget.setVisible(was_visible)

        # Restore Anki's toolbar-specific hidden/show state after Qt visibility.
        if was_visible and hidden_state is True:
            widget.hide()
        elif was_visible and hidden_state is False:
            widget.show()

        widget.updateGeometry()


def _hide_toolbar() -> None:
    """Hide Anki's top toolbar (Decks, Add, Browse, Stats, Sync)."""
    global _toolbar_hidden, _toolbar_widget_state
    if _toolbar_hidden:
        return
    toolbar = getattr(mw, "toolbar", None)
    web = getattr(toolbar, "web", None)
    if not isinstance(web, QWidget):
        return

    central = getattr(getattr(mw, "form", None), "centralwidget", None)
    widgets: list[QWidget] = [web]
    parent = web.parentWidget()
    if isinstance(parent, QWidget) and parent not in (mw, central):
        widgets.append(parent)

    _toolbar_widget_state = _hide_widgets(widgets)

    layout = getattr(mw, "mainLayout", None)
    if layout is not None:
        layout.activate()
    _toolbar_hidden = bool(_toolbar_widget_state)


def _show_toolbar() -> None:
    """Restore Anki's top toolbar."""
    global _toolbar_hidden, _toolbar_widget_state
    if not _toolbar_hidden:
        return
    _restore_widgets(_toolbar_widget_state)

    layout = getattr(mw, "mainLayout", None)
    if layout is not None:
        layout.activate()
    _toolbar_widget_state = []
    _toolbar_hidden = False


def _hide_bottom_bar() -> None:
    """Hide Anki's native reviewer bottom bar."""
    global _bottom_bar_hidden, _bottom_bar_widget_state
    if _bottom_bar_hidden:
        return

    bottom_web = getattr(mw, "bottomWeb", None)
    if not isinstance(bottom_web, QWidget):
        return

    _bottom_bar_widget_state = _hide_widgets([bottom_web])

    layout = getattr(mw, "mainLayout", None)
    if layout is not None:
        layout.activate()
    _bottom_bar_hidden = bool(_bottom_bar_widget_state)


def _show_bottom_bar() -> None:
    """Restore Anki's native reviewer bottom bar."""
    global _bottom_bar_hidden, _bottom_bar_widget_state
    if not _bottom_bar_hidden:
        return

    _restore_widgets(_bottom_bar_widget_state)

    layout = getattr(mw, "mainLayout", None)
    if layout is not None:
        layout.activate()
    _bottom_bar_widget_state = []
    _bottom_bar_hidden = False


def _resolve_webview(context):
    """Resolve the active webview from the current JS message context."""
    web = getattr(context, "web", None)
    if web is not None:
        return web

    if hasattr(context, "eval"):
        return context

    reviewer = getattr(mw, "reviewer", None)
    return getattr(reviewer, "web", None)


def _return_to_home() -> None:
    """Leave the reviewer and return to the deck browser when possible."""
    move_to_state = getattr(mw, "moveToState", None)
    if callable(move_to_state):
        for state in ("deckBrowser", "overview"):
            try:
                move_to_state(state)
                _show_toolbar()
                _show_bottom_bar()
                return
            except Exception:
                continue

    for handler_name in ("moveToState", "onOverview", "onDeckBrowser"):
        handler = getattr(mw, handler_name, None)
        if not callable(handler):
            continue
        try:
            if handler_name == "moveToState":
                handler("deckBrowser")
            else:
                handler()
            _show_toolbar()
            _show_bottom_bar()
            return
        except Exception:
            continue


def _on_card_will_show(text: str, card, kind: str) -> str:
    """Replace card HTML with Foggy coding UI for Foggy-type cards."""
    try:
        if kind not in _FOGGY_REVIEW_KINDS:
            return text

        if not _is_foggy_card(card):
            _show_toolbar()
            _show_bottom_bar()
            return text

        _hide_toolbar()
        _hide_bottom_bar()

        if _template_html is None:
            _load_web_assets()

        # Extract card data
        card_data = {
            "title": _get_field(card, "Title"),
            "difficulty": _get_field(card, "Difficulty"),
            "language": _get_field(card, "Language"),
            "description": _get_field(card, "Description"),
            "functionName": _get_field(card, "FunctionName"),
            "starterCode": _get_field(card, "StarterCode"),
            "solution": _get_field(card, "Solution"),
            "testCases": _get_field(card, "TestCases"),
            "cardId": card.id,
            "isAnswer": kind in ("reviewAnswer", "previewAnswer"),
        }

        # Build the full HTML page
        html = f"""
<style>{_style_css}</style>
{_template_html}
<script id="foggy-data" type="application/json">
{json.dumps(card_data)}
</script>
<script>
{_split_bundle_js}
</script>
<script>
{_cm_bundle_js}
</script>
<script>
{_main_js}
</script>
"""
        return html
    except Exception:
        import traceback, io
        buf = io.StringIO()
        traceback.print_exc(file=buf)
        print(buf.getvalue())
        return text


def _on_js_message(handled: tuple[bool, object], message: str, context) -> tuple[bool, object]:
    """Handle messages from JS via pycmd('foggy:...')."""
    if not message.startswith("foggy:"):
        return handled

    _, _, payload = message.partition(":")
    action, _, data = payload.partition(":")
    web = _resolve_webview(context)

    if action == "run":
        try:
            req = json.loads(data)
            user_code = req["code"]
            function_name = req["functionName"]
            test_cases = json.loads(req["testCases"])
            language = req.get("language", "Python")

            if language == "Python":
                result = executor.run_python(user_code, function_name, test_cases)
            else:
                result = {
                    "results": [],
                    "passed": 0,
                    "total": len(test_cases),
                    "error": f"Language '{language}' is not yet supported.",
                }

            # Send results back to JS
            result_json = json.dumps(result)
            if web is not None:
                web.eval(f"window.foggyReceiveResults({result_json});")
        except Exception as e:
            error_result = json.dumps({
                "results": [],
                "passed": 0,
                "total": 0,
                "error": str(e),
            })
            if web is not None:
                web.eval(f"window.foggyReceiveResults({error_result});")

        return (True, None)

    if action == "home":
        _return_to_home()
        return (True, None)

    return handled


def _on_reviewer_will_end() -> None:
    """Restore Foggy-hidden native reviewer chrome when leaving the reviewer."""
    _show_toolbar()
    _show_bottom_bar()


def register_hooks() -> None:
    """Register all Foggy reviewer hooks."""
    global _hooks_registered
    if _hooks_registered:
        return

    gui_hooks.card_will_show.append(_on_card_will_show)
    gui_hooks.webview_did_receive_js_message.append(_on_js_message)
    gui_hooks.reviewer_will_end.append(_on_reviewer_will_end)
    _hooks_registered = True
