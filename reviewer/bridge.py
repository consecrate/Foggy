from __future__ import annotations

import json
import re

from aqt import mw

from .. import executor
from .assets import get_feedback_sound_path
from .chrome import return_to_home, show_reviewer_bottom_bar
from .render import continue_wrapped_review_cycle, reset_wrapped_review_state


def on_js_message(handled: tuple[bool, object], message: str, context) -> tuple[bool, object]:
    if not message.startswith("foggy:"):
        return handled

    _, _, payload = message.partition(":")
    action, _, data = payload.partition(":")
    web = _resolve_webview(context)

    if action == "run":
        try:
            request = json.loads(data)
            user_code = request["code"]
            function_name = request["functionName"]
            test_cases = json.loads(request["testCases"])
            language = _normalize_language(request.get("language", "Python"))

            if language == "python":
                result = executor.run_python(user_code, function_name, test_cases)
            elif language == "cpp":
                result = executor.run_cpp(user_code, function_name, test_cases)
            else:
                result = {
                    "results": [],
                    "passed": 0,
                    "total": len(test_cases),
                    "error": f"Language '{request.get('language', 'Python')}' is not yet supported.",
                }

            if web is not None:
                web.eval(f"window.foggyReceiveResults({json.dumps(result)});")
        except Exception as error:
            if web is not None:
                web.eval(
                    "window.foggyReceiveResults("
                    + json.dumps(
                        {
                            "results": [],
                            "passed": 0,
                            "total": 0,
                            "error": str(error),
                        }
                    )
                    + ");"
                )

        return (True, None)

    if action == "home":
        reset_wrapped_review_state()
        return_to_home()
        return (True, None)

    if action == "reward-continue":
        continue_wrapped_review_cycle()
        show_reviewer_bottom_bar()
        return (True, None)

    if action == "info":
        try:
            reviewer = getattr(mw, "reviewer", None)
            if reviewer is not None:
                reviewer.on_card_info()
        except Exception:
            pass
        return (True, None)

    if action == "answer":
        try:
            ease = int(data)
            reviewer = getattr(mw, "reviewer", None)
            if reviewer and reviewer.card:
                mw.col.sched.answerCard(reviewer.card, ease)
                reviewer.nextCard()
        except Exception:
            pass
        return (True, None)

    if action == "play-audio":
        try:
            _play_audio_markup(data)
        except Exception:
            pass
        return (True, None)

    if action == "play-feedback":
        try:
            _play_feedback_sound(data)
        except Exception:
            pass
        return (True, None)

    return handled


def _resolve_webview(context):
    web = getattr(context, "web", None)
    if web is not None:
        return web

    if hasattr(context, "eval"):
        return context

    reviewer = getattr(mw, "reviewer", None)
    return getattr(reviewer, "web", None)


def _play_audio_markup(audio_markup: str) -> None:
    from anki.sound import SoundOrVideoTag
    from aqt.sound import av_player

    filenames = _extract_sound_filenames(audio_markup)
    if not filenames:
        return

    av_player.play_tags([SoundOrVideoTag(filename) for filename in filenames])


def _play_feedback_sound(result: str) -> None:
    from anki.sound import SoundOrVideoTag
    from aqt.sound import av_player

    sound_path = get_feedback_sound_path(result)
    if not sound_path:
        return

    play_file = getattr(av_player, "play_file", None)
    if callable(play_file):
        play_file(sound_path)
        return

    av_player.play_tags([SoundOrVideoTag(sound_path)])


def _extract_sound_filenames(audio_markup: str) -> list[str]:
    return re.findall(r"\[sound:([^\]]+)\]", str(audio_markup or ""))


def _normalize_language(language: object) -> str:
    normalized = str(language or "Python").strip().lower()
    if normalized in {"python", "py"}:
        return "python"
    if normalized in {"c++", "cpp", "cxx", "cc"}:
        return "cpp"
    return normalized
