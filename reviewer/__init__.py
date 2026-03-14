from __future__ import annotations

from aqt import gui_hooks

from .bridge import on_js_message
from .chrome import restore_reviewer_chrome
from .render import on_card_will_show, reset_wrapped_review_state, undo_wrapped_review_state

_hooks_registered = False


def register_hooks() -> None:
    global _hooks_registered
    if _hooks_registered:
        return

    gui_hooks.card_will_show.append(on_card_will_show)
    gui_hooks.webview_did_receive_js_message.append(on_js_message)
    gui_hooks.state_did_undo.append(_on_state_did_undo)
    gui_hooks.reviewer_will_end.append(_on_reviewer_will_end)
    _hooks_registered = True


def _on_reviewer_will_end() -> None:
    restore_reviewer_chrome()
    reset_wrapped_review_state()


def _on_state_did_undo(changes) -> None:
    if not getattr(getattr(changes, "changes", None), "study_queues", False):
        return

    undo_wrapped_review_state()
