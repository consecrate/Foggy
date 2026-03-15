from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import sys
import types
import unittest


ROOT = Path(__file__).resolve().parents[1]
PACKAGE_NAME = "foggy_testpkg_bridge"


def _ensure_fake_package() -> None:
    package = types.ModuleType(PACKAGE_NAME)
    package.__path__ = [str(ROOT)]
    sys.modules[PACKAGE_NAME] = package

    reviewer_package = types.ModuleType(f"{PACKAGE_NAME}.reviewer")
    reviewer_package.__path__ = [str(ROOT / "reviewer")]
    sys.modules[f"{PACKAGE_NAME}.reviewer"] = reviewer_package


def _load_module(module_name: str, path: Path):
    spec = importlib.util.spec_from_file_location(module_name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


class FakeSoundOrVideoTag:
    def __init__(self, filename: str) -> None:
        self.filename = filename


class FakeAvPlayer:
    def __init__(self) -> None:
        self.played_batches: list[list[str]] = []
        self.played_files: list[str] = []

    def play_tags(self, tags) -> None:
        self.played_batches.append([tag.filename for tag in tags])

    def play_file(self, path: str) -> None:
        self.played_files.append(path)


class FakeWebView:
    def __init__(self) -> None:
        self.scripts: list[str] = []

    def eval(self, script: str) -> None:
        self.scripts.append(script)


def _install_stubs(av_player: FakeAvPlayer) -> None:
    anki_module = types.ModuleType("anki")
    anki_sound_module = types.ModuleType("anki.sound")
    anki_sound_module.SoundOrVideoTag = FakeSoundOrVideoTag

    aqt_module = types.ModuleType("aqt")
    aqt_module.mw = None
    aqt_sound_module = types.ModuleType("aqt.sound")
    aqt_sound_module.av_player = av_player

    executor_module = types.ModuleType(f"{PACKAGE_NAME}.executor")
    executor_state = {"calls": []}

    def run_python(*args, **kwargs):
        executor_state["calls"].append(("python", args, kwargs))
        return {"results": [], "passed": 1, "total": 1, "error": None, "engine": "python"}

    def run_cpp(*args, **kwargs):
        executor_state["calls"].append(("cpp", args, kwargs))
        return {"results": [], "passed": 1, "total": 1, "error": None, "engine": "cpp"}

    executor_module.run_python = run_python
    executor_module.run_cpp = run_cpp
    executor_module._state = executor_state

    chrome_module = types.ModuleType(f"{PACKAGE_NAME}.reviewer.chrome")
    chrome_module.return_to_home = lambda: None
    chrome_module.show_reviewer_bottom_bar = lambda: None

    render_module = types.ModuleType(f"{PACKAGE_NAME}.reviewer.render")
    render_module.continue_wrapped_review_cycle = lambda: None
    render_module.reset_wrapped_review_state = lambda: None

    sys.modules["anki"] = anki_module
    sys.modules["anki.sound"] = anki_sound_module
    sys.modules["aqt"] = aqt_module
    sys.modules["aqt.sound"] = aqt_sound_module
    sys.modules[f"{PACKAGE_NAME}.executor"] = executor_module
    sys.modules[f"{PACKAGE_NAME}.reviewer.chrome"] = chrome_module
    sys.modules[f"{PACKAGE_NAME}.reviewer.render"] = render_module


class ReviewerBridgeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.av_player = FakeAvPlayer()
        _ensure_fake_package()
        _install_stubs(cls.av_player)
        cls.bridge = _load_module(
            f"{PACKAGE_NAME}.reviewer.bridge",
            ROOT / "reviewer" / "bridge.py",
        )

    def setUp(self) -> None:
        self.av_player.played_batches.clear()
        self.av_player.played_files.clear()
        sys.modules[f"{PACKAGE_NAME}.executor"]._state["calls"].clear()

    def test_play_audio_action_queues_all_sound_tags(self) -> None:
        handled, payload = self.bridge.on_js_message(
            (False, None),
            "foggy:play-audio:[sound:first.mp3][sound:second.ogg]",
            object(),
        )

        self.assertEqual((handled, payload), (True, None))
        self.assertEqual(self.av_player.played_batches, [["first.mp3", "second.ogg"]])

    def test_play_audio_action_ignores_markup_without_sound_tags(self) -> None:
        handled, payload = self.bridge.on_js_message(
            (False, None),
            "foggy:play-audio:no audio here",
            object(),
        )

        self.assertEqual((handled, payload), (True, None))
        self.assertEqual(self.av_player.played_batches, [])

    def test_play_feedback_action_plays_packaged_sound(self) -> None:
        handled, payload = self.bridge.on_js_message(
            (False, None),
            "foggy:play-feedback:correct",
            object(),
        )

        self.assertEqual((handled, payload), (True, None))
        self.assertEqual(
            self.av_player.played_files,
            [str(ROOT / "reviewer" / "media" / "correct.mp3")],
        )

    def test_run_action_dispatches_python_executor(self) -> None:
        web = FakeWebView()
        handled, payload = self.bridge.on_js_message(
            (False, None),
            "foggy:run:"
            + json.dumps(
                {
                    "code": "def two_sum(nums, target):\n    return [0, 1]",
                    "functionName": "two_sum",
                    "testCases": json.dumps([{"input": [[2, 7], 9], "output": [0, 1]}]),
                    "language": "Python",
                }
            ),
            web,
        )

        self.assertEqual((handled, payload), (True, None))
        self.assertEqual(sys.modules[f"{PACKAGE_NAME}.executor"]._state["calls"][0][0], "python")
        self.assertIn('"engine": "python"', web.scripts[0])

    def test_run_action_dispatches_cpp_executor(self) -> None:
        web = FakeWebView()
        handled, payload = self.bridge.on_js_message(
            (False, None),
            "foggy:run:"
            + json.dumps(
                {
                    "code": "int removeElement(vector<int>& nums, int val) { return 0; }",
                    "functionName": "removeElement",
                    "testCases": json.dumps([{"input": [[1, 2, 3], 2], "output": 2}]),
                    "language": "C++",
                }
            ),
            web,
        )

        self.assertEqual((handled, payload), (True, None))
        self.assertEqual(sys.modules[f"{PACKAGE_NAME}.executor"]._state["calls"][0][0], "cpp")
        self.assertIn('"engine": "cpp"', web.scripts[0])


if __name__ == "__main__":
    unittest.main()
