from __future__ import annotations

import io
import json
import traceback

from .assets import get_web_assets
from .card_data import _build_card_data, _get_note_kind, _parse_json_array_field, _translate_mode_for_card
from .chrome import hide_reviewer_chrome, restore_reviewer_chrome
from .wrapped import (
    _build_wrapped_review_payload,
    _get_wrapped_review_state,
    _maybe_prefetch_wrapped_reward,
    _render_wrapped_review,
    continue_wrapped_review_cycle,
    reset_wrapped_review_state,
    undo_wrapped_review_state,
)

FOGGY_REVIEW_KINDS = {
    "reviewQuestion",
    "reviewAnswer",
    "previewQuestion",
    "previewAnswer",
}

QUESTION_KINDS = {
    "reviewQuestion",
    "previewQuestion",
}

REVIEW_KINDS = {
    "reviewQuestion",
    "reviewAnswer",
}

_serve_sequence = 0
_active_serves: dict[int, int] = {}


def on_card_will_show(text: str, card, kind: str) -> str:
    try:
        if kind not in FOGGY_REVIEW_KINDS:
            return text

        wrapped_review_payload: dict[str, object] | None = None
        wrapped_progress = 0
        wrapped_show_reward = False
        wrapped_reward_key = 0
        wrapped_pill_count = 10

        if kind in REVIEW_KINDS:
            (
                wrapped_progress,
                wrapped_show_reward,
                wrapped_reward_key,
                wrapped_pill_count,
            ) = _get_wrapped_review_state(card, kind)
            _maybe_prefetch_wrapped_reward(wrapped_progress, wrapped_show_reward)
            wrapped_review_payload = _build_wrapped_review_payload(
                wrapped_progress,
                wrapped_show_reward,
                wrapped_reward_key,
                wrapped_pill_count,
            )

        note_kind = _get_note_kind(card)
        if note_kind is None:
            if kind not in REVIEW_KINDS:
                restore_reviewer_chrome()
                return text

            hide_reviewer_chrome(hide_bottom_bar=False)
            return _render_wrapped_review(
                text,
                wrapped_progress,
                wrapped_show_reward,
                wrapped_reward_key,
                wrapped_pill_count,
            )

        hide_reviewer_chrome()
        assets = get_web_assets()
        card_data = _build_card_data(
            card,
            note_kind,
            kind in ("reviewAnswer", "previewAnswer"),
            _get_serve_id(card, kind),
        )
        if wrapped_review_payload is not None:
            card_data["wrappedReview"] = wrapped_review_payload

        return f"""
<div id="foggy-host"></div>
<script id="foggy-style" type="text/plain">{assets.style_css}</script>
<template id="foggy-template">{assets.template_html}</template>
<script id="foggy-data" type="application/json">
{json.dumps(card_data)}
</script>
<script>
{assets.split_bundle_js}
</script>
<script>
{assets.cm_bundle_js}
</script>
<script>
{assets.main_js}
</script>
"""
    except Exception:
        buffer = io.StringIO()
        traceback.print_exc(file=buffer)
        print(buffer.getvalue())
        return text


def _get_serve_id(card, kind: str) -> int:
    global _serve_sequence

    card_id = card.id
    if kind in QUESTION_KINDS or card_id not in _active_serves:
        _serve_sequence += 1
        _active_serves[card_id] = _serve_sequence

    return _active_serves[card_id]
