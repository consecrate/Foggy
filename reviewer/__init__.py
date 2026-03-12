from __future__ import annotations

from aqt import gui_hooks

from .bridge import on_js_message
from .chrome import restore_reviewer_chrome
from .render import on_card_will_show

_hooks_registered = False


def register_hooks() -> None:
    global _hooks_registered
    if _hooks_registered:
        return

    gui_hooks.card_will_show.append(on_card_will_show)
    gui_hooks.webview_did_receive_js_message.append(on_js_message)
    gui_hooks.reviewer_will_end.append(restore_reviewer_chrome)
    _hooks_registered = True
