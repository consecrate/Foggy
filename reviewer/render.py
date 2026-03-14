from __future__ import annotations

import base64
from html import escape
import io
import json
import threading
import traceback
import urllib.request

from aqt import mw
from aqt.utils import tr

from ..models import MCQ_NOTETYPE_NAME, NOTETYPE_NAME
from ..wrapped_review_state import WrappedReviewState
from .assets import get_web_assets
from .chrome import hide_reviewer_chrome, restore_reviewer_chrome

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

WRAPPED_REWARD_GOAL = 10
WRAPPED_REWARD_PREFETCH_PROGRESS = 5
_REWARD_PREFETCH_TIMEOUT_SECONDS = 12

_serve_sequence = 0
_active_serves: dict[int, int] = {}
_wrapped_review_state = WrappedReviewState(WRAPPED_REWARD_GOAL)
_prefetched_reward_data: dict[int, str] = {}
_prefetch_inflight: dict[int, int] = {}
_prefetch_generation = 0
_prefetch_lock = threading.Lock()


def on_card_will_show(text: str, card, kind: str) -> str:
    try:
        if kind not in FOGGY_REVIEW_KINDS:
            return text

        note_kind = _get_note_kind(card)
        if note_kind is None:
            if kind not in REVIEW_KINDS:
                restore_reviewer_chrome()
                return text

            progress, show_reward, reward_key = _get_wrapped_review_state(card, kind)
            _maybe_prefetch_wrapped_reward(progress, show_reward)
            hide_reviewer_chrome(hide_bottom_bar=show_reward)
            return _render_wrapped_review(text, progress, show_reward, reward_key)

        hide_reviewer_chrome()
        assets = get_web_assets()
        card_data = _build_card_data(
            card,
            note_kind,
            kind in ("reviewAnswer", "previewAnswer"),
            _get_serve_id(card, kind),
        )

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


def _render_wrapped_review(
    text: str,
    progress: int,
    show_reward: bool,
    reward_key: int,
) -> str:
    progress_markup = _build_wrapped_progress(progress)
    reward_markup = _build_wrapped_reward(reward_key) if show_reward else ""
    card_hidden_class = " foggy-wrap-card--hidden" if show_reward else ""

    # Wrapped cards still use Anki's native reviewer bottom bar, except while the
    # reward overlay is visible because it already provides its own continue CTA.

    return f"""
<style>
:root {{
  --foggy-bg: oklch(0.24 0.04 145);
  --foggy-bg-muted: oklch(0.28 0.045 145);
  --foggy-bg-panel: oklch(0.32 0.05 145);
  --foggy-bg-panel-strong: oklch(0.26 0.042 145);
  --foggy-surface: oklch(0.36 0.05 145);
  --foggy-text: oklch(0.98 0.01 145);
  --foggy-text-muted: oklch(0.82 0.04 145);
  --foggy-text-subtle: oklch(0.65 0.05 145);
  --foggy-text-dim: oklch(0.50 0.04 145);
  --foggy-accent: oklch(0.78 0.14 145);
  --foggy-accent-hover: oklch(0.82 0.14 145);
  --foggy-danger: oklch(0.75 0.16 25);
  --foggy-warning: oklch(0.85 0.16 85);
  --foggy-good: oklch(0.74 0.14 250);
  --foggy-font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --foggy-font-mono: "SF Mono", "Fira Code", "Cascadia Code", monospace;
}}

html,
body {{
  width: 100%;
  height: 100%;
  margin: 0 !important;
  padding: 0 !important;
  background: var(--foggy-bg) !important;
  overflow: hidden;
}}

body {{
  color: var(--foggy-text);
  font-family: var(--foggy-font-sans);
}}

.card {{
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  color: inherit;
}}

.foggy-wrap-shell {{
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--foggy-bg);
  color: var(--foggy-text);
}}

.foggy-wrap-shell,
.foggy-wrap-shell * {{
  box-sizing: border-box;
}}

.foggy-wrap-bottombar,
#foggy-wrap-header {{
  display: flex;
  align-items: center;
  width: 100%;
  background: var(--foggy-bg-muted);
  color: var(--foggy-text);
  font-family: var(--foggy-font-sans);
  flex-shrink: 0;
}}

#foggy-wrap-header {{
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 36px;
  gap: 12px;
  height: 44px;
  min-height: 44px;
  max-height: 44px;
  padding: 0 10px;
  overflow: hidden;
}}

.foggy-wrap-bottombar {{
  gap: 12px;
  justify-content: space-between;
  min-height: 72px;
  padding: 14px 18px;
  overflow-x: auto;
  overflow-y: hidden;
}}

.foggy-wrap-bottom-left,
.foggy-wrap-bottom-center,
.foggy-wrap-bottom-right {{
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 10px;
  min-width: 0;
}}

.foggy-wrap-bottom-right {{
  margin-left: auto;
}}

.foggy-wrap-button {{
  appearance: none;
  -webkit-appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 18px;
  border: 0;
  border-radius: 12px;
  background: oklch(0.98 0 0 / 0.06);
  color: var(--foggy-text-muted);
  font: 700 14px/1 var(--foggy-font-sans);
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
}}

.foggy-wrap-button:hover {{
  background: var(--foggy-surface);
  color: var(--foggy-text);
}}

.foggy-wrap-button:active {{
  transform: scale(0.95);
}}

#foggy-wrap-home-btn {{
  all: unset;
  box-sizing: border-box;
  appearance: none;
  -webkit-appearance: none;
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  min-height: 28px !important;
  max-width: 28px !important;
  max-height: 28px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: none !important;
  padding: 0 !important;
  border-radius: 6px !important;
  background: transparent !important;
  box-shadow: none !important;
  cursor: pointer;
  color: var(--foggy-text-subtle) !important;
  transition:
    background 0.15s,
    color 0.15s,
    transform 0.1s ease;
}}

#foggy-wrap-home-btn:hover {{
  background: var(--foggy-surface) !important;
  color: var(--foggy-text) !important;
}}

#foggy-wrap-home-btn:active {{
  transform: scale(0.95);
}}

#foggy-wrap-home-btn .foggy-home-icon {{
  width: 18px;
  height: 18px;
}}

#foggy-wrap-home-btn svg {{
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}}

.foggy-wrap-header-spacer {{
  width: 28px;
  height: 28px;
}}

.foggy-wrap-progress {{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
}}

.foggy-wrap-progress-track {{
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 8px;
  width: min(100%, 460px);
}}

.foggy-wrap-progress-segment {{
  height: 6px;
  border-radius: 999px;
  background: var(--foggy-surface);
  transition: background 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease;
}}

.foggy-wrap-progress-segment.is-filled {{
  background: var(--foggy-accent);
}}

.foggy-wrap-progress-segment.is-goal {{
  box-shadow: 0 0 0 1px oklch(0.78 0.14 145 / 0.4);
}}

.foggy-wrap-button--primary {{
  min-width: 140px;
  padding: 0 28px;
  background: var(--foggy-accent);
  color: white;
}}

.foggy-wrap-button--primary:hover {{
  background: var(--foggy-accent-hover);
  color: white;
}}

.foggy-wrap-button--primary:active {{
  background: oklch(0.74 0.14 145);
}}

.foggy-wrap-button--again {{
  color: var(--foggy-danger);
}}

.foggy-wrap-button--hard {{
  color: var(--foggy-warning);
}}

.foggy-wrap-button--good {{
  color: var(--foggy-good);
}}

.foggy-wrap-button--easy {{
  color: var(--foggy-accent);
}}

.foggy-wrap-body {{
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 18px 20px;
  background: var(--foggy-bg);
}}

.foggy-wrap-card {{
  min-height: 100%;
  width: 100%;
}}

.foggy-wrap-card--hidden {{
  display: none;
}}

.foggy-wrap-card table,
.foggy-wrap-card img,
.foggy-wrap-card video {{
  max-width: 100%;
}}

.foggy-wrap-card .card {{
  /* Keep the host card chrome transparent without breaking MathJax fraction rules. */
  min-height: 100%;
  background: transparent !important;
  color: inherit;
  border: 0 !important;
  box-shadow: none !important;
}}

.foggy-wrap-reward {{
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 28px 16px;
}}

.foggy-wrap-reward-panel {{
  width: min(100%, 760px);
  padding: 22px;
  border: 1px solid oklch(0.52 0.05 252 / 0.42);
  border-radius: 28px;
  background:
    linear-gradient(180deg, oklch(0.3 0.05 252 / 0.98), oklch(0.24 0.04 252 / 0.98));
  box-shadow: 0 28px 64px oklch(0.1 0.02 252 / 0.28);
}}

.foggy-wrap-reward-copy {{
  margin: 0 0 18px;
  color: var(--foggy-text-muted);
  font: 600 14px/1.5 var(--foggy-font-sans);
}}

.foggy-wrap-reward-title {{
  margin: 0 0 12px;
  color: var(--foggy-text);
  font: 800 32px/1.05 var(--foggy-font-sans);
  letter-spacing: -0.03em;
}}

.foggy-wrap-reward-image-wrap {{
  overflow: hidden;
  border-radius: 22px;
  background: oklch(0.2 0.03 252);
  aspect-ratio: 4 / 3;
}}

.foggy-wrap-reward-image {{
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}}

.foggy-wrap-reward-actions {{
  display: flex;
  justify-content: center;
  margin-top: 18px;
}}

@media (max-width: 720px) {{
  #foggy-wrap-header,
  .foggy-wrap-bottombar {{
    padding: 10px 12px;
  }}

  #foggy-wrap-header {{
    grid-template-columns: 32px minmax(0, 1fr) 32px;
    gap: 10px;
  }}

  .foggy-wrap-bottombar,
  .foggy-wrap-bottom-left,
  .foggy-wrap-bottom-center,
  .foggy-wrap-bottom-right {{
    gap: 8px;
  }}

  .foggy-wrap-bottombar {{
    flex-wrap: wrap;
    overflow-x: visible;
    overflow-y: visible;
  }}

  .foggy-wrap-button {{
    min-height: 40px;
    padding: 0 14px;
  }}

  .foggy-wrap-button--primary {{
    min-width: 0;
    padding: 0 20px;
  }}

  .foggy-wrap-body {{
    padding: 14px 12px;
  }}

  .foggy-wrap-progress-track {{
    gap: 6px;
  }}

  .foggy-wrap-progress-segment {{
    height: 8px;
  }}

  .foggy-wrap-reward {{
    padding: 16px 4px;
  }}

  .foggy-wrap-reward-panel {{
    padding: 18px;
    border-radius: 22px;
  }}

  .foggy-wrap-reward-title {{
    font-size: 26px;
  }}
}}
</style>
<div class="foggy-wrap-shell">
  <div id="foggy-wrap-header">
    <button id="foggy-wrap-home-btn" type="button" aria-label="Return to home" title="Return to Decks" onclick="pycmd('foggy:home');">
      <span class="foggy-panel-icon foggy-home-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </button>
    {progress_markup}
    <div class="foggy-wrap-header-spacer" aria-hidden="true"></div>
  </div>
  <div class="foggy-wrap-body">
    {reward_markup}
    <div id="foggy-wrap-card" class="foggy-wrap-card{card_hidden_class}">
      {text}
    </div>
  </div>
</div>
<script>
(function() {{
  var reward = document.getElementById("foggy-wrap-reward");
  if (!reward) {{
    return;
  }}

  var continueButton = document.getElementById("foggy-wrap-reward-continue");
  var card = document.getElementById("foggy-wrap-card");
  if (!continueButton || !card) {{
    return;
  }}

  continueButton.addEventListener("click", function() {{
    var progress = document.querySelector(".foggy-wrap-progress");
    var filledSegments = document.querySelectorAll(".foggy-wrap-progress-segment.is-filled");

    pycmd('foggy:reward-continue');
    if (progress) {{
      progress.setAttribute(
        "aria-label",
        "Non-Foggy review streak: 0 of {WRAPPED_REWARD_GOAL} cards"
      );
    }}
    filledSegments.forEach(function(segment) {{
      segment.classList.remove("is-filled");
    }});
    reward.remove();
    card.classList.remove("foggy-wrap-card--hidden");
    if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {{
      window.MathJax.typesetPromise([card]).catch(function() {{}});
    }}
  }});
}})();
</script>
"""


def reset_wrapped_review_state() -> None:
    _invalidate_reward_prefetches()
    _wrapped_review_state.reset()


def continue_wrapped_review_cycle() -> None:
    _invalidate_reward_prefetches()
    _wrapped_review_state.continue_cycle()


def undo_wrapped_review_state() -> None:
    _invalidate_reward_prefetches()
    _wrapped_review_state.undo()


def _get_wrapped_review_state(card, kind: str) -> tuple[int, bool, int]:
    if kind == "reviewQuestion":
        return _wrapped_review_state.state_for_question(card.id)

    progress, _, reward_key = _wrapped_review_state.current_state()
    return (progress, False, reward_key)


def _build_wrapped_progress(progress: int) -> str:
    segments = []
    for index in range(WRAPPED_REWARD_GOAL):
        classes = ["foggy-wrap-progress-segment"]
        if index < progress:
            classes.append("is-filled")
        if index == WRAPPED_REWARD_GOAL - 1:
            classes.append("is-goal")

        segments.append(f'<span class="{" ".join(classes)}" aria-hidden="true"></span>')

    return (
        '<div class="foggy-wrap-progress" '
        f'aria-label="Non-Foggy review streak: {progress} of {WRAPPED_REWARD_GOAL} cards">'
        '<div class="foggy-wrap-progress-track">'
        + "".join(segments)
        + "</div>"
        "</div>"
    )


def _build_wrapped_reward(reward_key: int) -> str:
    cat_url = _reward_image_src(reward_key)

    return f"""
<div id="foggy-wrap-reward" class="foggy-wrap-reward">
  <div class="foggy-wrap-reward-panel">
    <h1 class="foggy-wrap-reward-title">Keep on goin'!</h1>
    <p class="foggy-wrap-reward-copy">Ten non-Foggy cards down. Take the cat, then jump back in.</p>
    <div class="foggy-wrap-reward-image-wrap">
      <img class="foggy-wrap-reward-image" src="{cat_url}" alt="Random cat reward from CATAAS" decoding="async">
    </div>
    <div class="foggy-wrap-reward-actions">
      <button id="foggy-wrap-reward-continue" class="foggy-wrap-button foggy-wrap-button--primary" type="button">
        Continue
      </button>
    </div>
  </div>
</div>
"""


def _build_bottom_actions(card, is_answer: bool) -> str:
    # Wrapped cards currently use Anki's native bottom bar, but keep the custom
    # button builder here so the replacement bar can be re-enabled later.
    if not is_answer:
        return (
            '<button class="foggy-wrap-button foggy-wrap-button--primary" '
            'type="button" onclick="pycmd(\'ans\');">'
            + escape(tr.studying_show_answer())
            + "</button>"
        )

    return "".join(_build_answer_button(ease, label) for ease, label in _answer_buttons(card))


def _answer_buttons(card) -> tuple[tuple[int, str], ...]:
    button_count = 4
    try:
        if mw.col and mw.col.sched:
            button_count = mw.col.sched.answerButtons(card)
    except Exception:
        pass

    if button_count == 2:
        return (
            (1, tr.studying_again()),
            (2, tr.studying_good()),
        )
    if button_count == 3:
        return (
            (1, tr.studying_again()),
            (2, tr.studying_good()),
            (3, tr.studying_easy()),
        )
    return (
        (1, tr.studying_again()),
        (2, tr.studying_hard()),
        (3, tr.studying_good()),
        (4, tr.studying_easy()),
    )


def _build_answer_button(ease: int, label: str) -> str:
    class_map = {
        1: " foggy-wrap-button--again",
        2: " foggy-wrap-button--hard",
        3: " foggy-wrap-button--good",
        4: " foggy-wrap-button--easy",
    }
    modifier = class_map.get(ease, "")
    return (
        f'<button class="foggy-wrap-button{modifier}" '
        f'type="button" onclick="pycmd(\'ease{ease}\');">'
        f"{escape(label)}</button>"
    )


def _maybe_prefetch_wrapped_reward(progress: int, show_reward: bool) -> None:
    if show_reward or progress < WRAPPED_REWARD_PREFETCH_PROGRESS or progress >= WRAPPED_REWARD_GOAL:
        return

    reward_key = _wrapped_review_state.upcoming_reward_key

    with _prefetch_lock:
        generation = _prefetch_generation
        if reward_key in _prefetched_reward_data:
            return
        if _prefetch_inflight.get(reward_key) == generation:
            return
        _prefetch_inflight[reward_key] = generation

    thread = threading.Thread(
        target=_prefetch_reward_image,
        args=(reward_key, generation),
        daemon=True,
        name=f"foggy-reward-prefetch-{reward_key}",
    )
    thread.start()


def _prefetch_reward_image(reward_key: int, generation: int) -> None:
    data_url: str | None = None
    try:
        request = urllib.request.Request(_cat_reward_url(reward_key), headers={"User-Agent": "Foggy/1.0"})
        with urllib.request.urlopen(request, timeout=_REWARD_PREFETCH_TIMEOUT_SECONDS) as response:
            image_bytes = response.read()
            content_type = response.headers.get_content_type() or "image/jpeg"
        encoded = base64.b64encode(image_bytes).decode("ascii")
        data_url = f"data:{content_type};base64,{encoded}"
    except Exception:
        pass

    with _prefetch_lock:
        if _prefetch_inflight.get(reward_key) == generation:
            _prefetch_inflight.pop(reward_key, None)

        if data_url is None or generation != _prefetch_generation:
            return

        _prefetched_reward_data[reward_key] = data_url


def _reward_image_src(reward_key: int) -> str:
    with _prefetch_lock:
        prefetched = _prefetched_reward_data.get(reward_key)

    return prefetched or _cat_reward_url(reward_key)


def _invalidate_reward_prefetches() -> None:
    global _prefetch_generation

    with _prefetch_lock:
        _prefetch_generation += 1
        _prefetched_reward_data.clear()
        _prefetch_inflight.clear()


def _cat_reward_url(reward_key: int) -> str:
    return f"https://cataas.com/cat?width=1100&height=900&reward={reward_key}"


def _get_field(card, field_name: str) -> str:
    note = card.note()
    model = note.note_type()
    field_names = [field["name"] for field in model["flds"]]
    if field_name in field_names:
        return note.fields[field_names.index(field_name)]
    return ""


def _build_card_data(card, note_kind: str, is_answer: bool, serve_id: int) -> dict[str, object]:
    if note_kind == "mcq":
        question = _get_field(card, "Question")
        code_raw = _get_field(card, "Code").strip()
        code = None
        if code_raw:
            try:
                code = json.loads(code_raw)
            except (json.JSONDecodeError, ValueError):
                pass
        return {
            "kind": "mcq",
            "title": question,
            "question": question,
            "difficulty": _get_field(card, "Difficulty"),
            "choices": _get_field(card, "Choices"),
            "code": code,
            "cardId": card.id,
            "serveId": serve_id,
            "isAnswer": is_answer,
        }

    return {
        "kind": "coding",
        "title": _get_field(card, "Title"),
        "difficulty": _get_field(card, "Difficulty"),
        "language": _get_field(card, "Language"),
        "description": _get_field(card, "Description"),
        "functionName": _get_field(card, "FunctionName"),
        "starterCode": _get_field(card, "StarterCode"),
        "solution": _get_field(card, "Solution"),
        "testCases": _get_field(card, "TestCases"),
        "cardId": card.id,
        "serveId": serve_id,
        "isAnswer": is_answer,
    }


def _get_serve_id(card, kind: str) -> int:
    global _serve_sequence

    card_id = card.id
    if kind in QUESTION_KINDS or card_id not in _active_serves:
        _serve_sequence += 1
        _active_serves[card_id] = _serve_sequence

    return _active_serves[card_id]


def _get_note_kind(card) -> str | None:
    note = card.note()
    model = note.note_type()
    if model["name"] == NOTETYPE_NAME:
        return "coding"
    if model["name"] == MCQ_NOTETYPE_NAME:
        return "mcq"
    return None
