from __future__ import annotations

import json

from aqt import mw

from .. import executor
from .chrome import return_to_home


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
            language = request.get("language", "Python")

            if language == "Python":
                result = executor.run_python(user_code, function_name, test_cases)
            else:
                result = {
                    "results": [],
                    "passed": 0,
                    "total": len(test_cases),
                    "error": f"Language '{language}' is not yet supported.",
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
        return_to_home()
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

    return handled


def _resolve_webview(context):
    web = getattr(context, "web", None)
    if web is not None:
        return web

    if hasattr(context, "eval"):
        return context

    reviewer = getattr(mw, "reviewer", None)
    return getattr(reviewer, "web", None)
