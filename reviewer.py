"""Reviewer integration — replaces card HTML and handles JS↔Python bridge."""
from __future__ import annotations

import json
import os

from aqt import gui_hooks, mw

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


def _hide_toolbar() -> None:
    """Hide Anki's top toolbar (Decks, Add, Browse, Stats, Sync)."""
    global _toolbar_hidden
    if _toolbar_hidden:
        return
    toolbar = getattr(mw, "toolbar", None)
    if toolbar and hasattr(toolbar, "web"):
        toolbar.web.hide()
        _toolbar_hidden = True


def _show_toolbar() -> None:
    """Restore Anki's top toolbar."""
    global _toolbar_hidden
    if not _toolbar_hidden:
        return
    toolbar = getattr(mw, "toolbar", None)
    if toolbar and hasattr(toolbar, "web"):
        toolbar.web.show()
        _toolbar_hidden = False


def _resolve_webview(context):
    """Resolve the active webview from the current JS message context."""
    web = getattr(context, "web", None)
    if web is not None:
        return web

    if hasattr(context, "eval"):
        return context

    reviewer = getattr(mw, "reviewer", None)
    return getattr(reviewer, "web", None)


def _on_card_will_show(text: str, card, kind: str) -> str:
    """Replace card HTML with Foggy coding UI for Foggy-type cards."""
    try:
        if kind not in ("reviewQuestion", "previewQuestion"):
            return text

        if not _is_foggy_card(card):
            _show_toolbar()
            return text

        _hide_toolbar()

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
            "testCases": _get_field(card, "TestCases"),
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

    return handled


def _on_reviewer_will_end() -> None:
    """Restore the toolbar when leaving the reviewer."""
    _show_toolbar()


def register_hooks() -> None:
    """Register all Foggy reviewer hooks."""
    global _hooks_registered
    if _hooks_registered:
        return

    gui_hooks.card_will_show.append(_on_card_will_show)
    gui_hooks.webview_did_receive_js_message.append(_on_js_message)
    gui_hooks.reviewer_will_end.append(_on_reviewer_will_end)
    _hooks_registered = True
