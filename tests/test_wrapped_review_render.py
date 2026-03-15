from __future__ import annotations

import importlib.util
from pathlib import Path
import sys
import types
import unittest


ROOT = Path(__file__).resolve().parents[1]
PACKAGE_NAME = "foggy_testpkg_wrapped_render"


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


def _install_fake_anki_modules() -> None:
    anki_module = types.ModuleType("anki")
    anki_models_module = types.ModuleType("anki.models")
    anki_models_module.NotetypeDict = dict

    aqt_module = types.ModuleType("aqt")
    aqt_module.mw = types.SimpleNamespace(col=None)
    aqt_utils_module = types.ModuleType("aqt.utils")
    aqt_utils_module.tr = lambda *args, **kwargs: ""

    sys.modules["anki"] = anki_module
    sys.modules["anki.models"] = anki_models_module
    sys.modules["aqt"] = aqt_module
    sys.modules["aqt.utils"] = aqt_utils_module


def _install_reviewer_stubs(chrome_calls: list[tuple[str, dict[str, object]]]) -> None:
    assets_module = types.ModuleType(f"{PACKAGE_NAME}.reviewer.assets")
    assets_module.get_web_assets = lambda: types.SimpleNamespace(
        style_css="",
        template_html="",
        split_bundle_js="",
        cm_bundle_js="",
        main_js="",
    )

    chrome_module = types.ModuleType(f"{PACKAGE_NAME}.reviewer.chrome")

    def hide_reviewer_chrome(*args, **kwargs) -> None:
        chrome_calls.append(("hide", dict(kwargs)))

    def restore_reviewer_chrome(*args, **kwargs) -> None:
        chrome_calls.append(("restore", dict(kwargs)))

    chrome_module.hide_reviewer_chrome = hide_reviewer_chrome
    chrome_module.restore_reviewer_chrome = restore_reviewer_chrome

    sys.modules[f"{PACKAGE_NAME}.reviewer.assets"] = assets_module
    sys.modules[f"{PACKAGE_NAME}.reviewer.chrome"] = chrome_module


class FakeNote:
    def __init__(self, model_name: str, field_values: dict[str, str]) -> None:
        self._model = {
            "name": model_name,
            "flds": [{"name": name} for name in field_values],
        }
        self.fields = list(field_values.values())

    def note_type(self):
        return self._model


class FakeCard:
    def __init__(self, note: FakeNote, card_id: int) -> None:
        self._note = note
        self.id = card_id

    def note(self) -> FakeNote:
        return self._note


class WrappedReviewRenderTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.chrome_calls: list[tuple[str, dict[str, object]]] = []
        _install_fake_anki_modules()
        _ensure_fake_package()
        _install_reviewer_stubs(cls.chrome_calls)
        cls.wrapped_review_state = _load_module(
            f"{PACKAGE_NAME}.wrapped_review_state",
            ROOT / "wrapped_review_state.py",
        )
        cls.models = _load_module(f"{PACKAGE_NAME}.models", ROOT / "models.py")
        cls.render = _load_module(
            f"{PACKAGE_NAME}.reviewer.render",
            ROOT / "reviewer" / "render.py",
        )

    def setUp(self) -> None:
        self.chrome_calls.clear()
        self.original_get_wrapped_review_state = self.render._get_wrapped_review_state

    def tearDown(self) -> None:
        self.render._get_wrapped_review_state = self.original_get_wrapped_review_state

    def test_wrapped_non_foggy_reward_keeps_native_bottom_bar_visible(self) -> None:
        self.render._get_wrapped_review_state = lambda card, kind: (10, True, 1, 10)
        card = FakeCard(FakeNote("Basic", {}), card_id=10)

        rendered = self.render.on_card_will_show("<div>Question</div>", card, "reviewQuestion")

        self.assertEqual(self.chrome_calls, [("hide", {"hide_bottom_bar": False})])
        self.assertIn("foggy-wrap-reward", rendered)
        self.assertIn("Review streak: 10 of 10 cards", rendered)

    def test_wrapped_non_foggy_short_cycle_uses_remaining_pill_count(self) -> None:
        self.render._get_wrapped_review_state = lambda card, kind: (4, False, 0, 4)
        card = FakeCard(FakeNote("Basic", {}), card_id=10)

        rendered = self.render.on_card_will_show("<div>Question</div>", card, "reviewQuestion")

        self.assertIn("Review streak: 4 of 4 cards", rendered)
        self.assertIn("--foggy-wrap-progress-pill-count: 4", rendered)
        self.assertIn("repeat(4, minmax(0, 1fr))", rendered)

    def test_wrapped_non_foggy_single_pill_cycle_keeps_single_pill_width(self) -> None:
        self.render._get_wrapped_review_state = lambda card, kind: (1, False, 0, 1)
        card = FakeCard(FakeNote("Basic", {}), card_id=10)

        rendered = self.render.on_card_will_show("<div>Question</div>", card, "reviewQuestion")

        self.assertIn("Review streak: 1 of 1 cards", rendered)
        self.assertIn("--foggy-wrap-progress-pill-count: 1", rendered)
        self.assertIn("repeat(1, minmax(0, 1fr))", rendered)

    def test_foggy_cards_still_hide_full_reviewer_chrome(self) -> None:
        self.render._get_wrapped_review_state = lambda card, kind: (7, False, 0, 7)
        card = FakeCard(FakeNote(self.models.NOTETYPE_NAME, {"Title": "Prompt"}), card_id=11)

        rendered = self.render.on_card_will_show("<div>Question</div>", card, "reviewQuestion")

        self.assertEqual(self.chrome_calls, [("hide", {})])
        self.assertIn("foggy-host", rendered)
        self.assertIn('"wrappedReview"', rendered)
        self.assertIn('"pillCount": 7', rendered)


if __name__ == "__main__":
    unittest.main()
