from __future__ import annotations

from aqt import mw
from aqt.qt import QWidget

_toolbar_hidden = False
_bottom_bar_hidden = False
_toolbar_widget_state: list[tuple[QWidget, bool, int, int, bool | None]] = []
_bottom_bar_widget_state: list[tuple[QWidget, bool, int, int, bool | None]] = []


def hide_reviewer_chrome() -> None:
    _hide_toolbar()
    _hide_bottom_bar()


def restore_reviewer_chrome() -> None:
    _show_toolbar()
    _show_bottom_bar()


def return_to_home() -> None:
    move_to_state = getattr(mw, "moveToState", None)
    if callable(move_to_state):
        for state in ("deckBrowser", "overview"):
            try:
                move_to_state(state)
                restore_reviewer_chrome()
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
            restore_reviewer_chrome()
            return
        except Exception:
            continue


def _hide_toolbar() -> None:
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
    global _bottom_bar_hidden, _bottom_bar_widget_state
    if not _bottom_bar_hidden:
        return

    _restore_widgets(_bottom_bar_widget_state)

    layout = getattr(mw, "mainLayout", None)
    if layout is not None:
        layout.activate()
    _bottom_bar_widget_state = []
    _bottom_bar_hidden = False


def _hide_widgets(widgets: list[QWidget]) -> list[tuple[QWidget, bool, int, int, bool | None]]:
    hidden_states: list[tuple[QWidget, bool, int, int, bool | None]] = []
    for widget in widgets:
        hidden_state = getattr(widget, "hidden", None)
        if not isinstance(hidden_state, bool):
            hidden_state = None

        hidden_states.append(
            (
                widget,
                widget.isVisible(),
                widget.minimumHeight(),
                widget.maximumHeight(),
                hidden_state,
            )
        )
        widget.setMinimumHeight(0)
        widget.setMaximumHeight(0)
        widget.setVisible(False)
        widget.updateGeometry()

    return hidden_states


def _restore_widgets(
    widget_states: list[tuple[QWidget, bool, int, int, bool | None]],
) -> None:
    for widget, was_visible, min_height, max_height, hidden_state in reversed(widget_states):
        widget.setMinimumHeight(min_height)
        widget.setMaximumHeight(max_height)
        widget.setVisible(was_visible)

        if was_visible and hidden_state is True:
            widget.hide()
        elif was_visible and hidden_state is False:
            widget.show()

        widget.updateGeometry()
