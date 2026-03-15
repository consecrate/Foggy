from __future__ import annotations

import importlib.util
from pathlib import Path
import sys
import types
import unittest


ROOT = Path(__file__).resolve().parents[1]
PACKAGE_NAME = "foggy_testpkg"


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
    aqt_module.mw = None
    aqt_utils_module = types.ModuleType("aqt.utils")
    aqt_utils_module.tr = lambda *args, **kwargs: ""

    sys.modules["anki"] = anki_module
    sys.modules["anki.models"] = anki_models_module
    sys.modules["aqt"] = aqt_module
    sys.modules["aqt.utils"] = aqt_utils_module


def _install_reviewer_stubs() -> None:
    assets_module = types.ModuleType(f"{PACKAGE_NAME}.reviewer.assets")
    assets_module.get_web_assets = lambda: None

    chrome_module = types.ModuleType(f"{PACKAGE_NAME}.reviewer.chrome")
    chrome_module.hide_reviewer_chrome = lambda *args, **kwargs: None
    chrome_module.restore_reviewer_chrome = lambda *args, **kwargs: None

    sys.modules[f"{PACKAGE_NAME}.reviewer.assets"] = assets_module
    sys.modules[f"{PACKAGE_NAME}.reviewer.chrome"] = chrome_module


class FakeModelManager:
    def __init__(self) -> None:
        self._models = {}

    def by_name(self, name: str):
        return self._models.get(name)

    def new(self, name: str):
        return {"name": name, "flds": [], "tmpls": []}

    def new_field(self, name: str):
        return {"name": name}

    def add_field(self, model, field) -> None:
        model["flds"].append(field)

    def new_template(self, name: str):
        return {"name": name, "qfmt": "", "afmt": ""}

    def add_template(self, model, template) -> None:
        model["tmpls"].append(template)

    def add(self, model) -> None:
        self._models[model["name"]] = model

    def save(self, model) -> None:
        self._models[model["name"]] = model


class FakeCollection:
    def __init__(self) -> None:
        self.models = FakeModelManager()


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
    def __init__(self, note: FakeNote, ord_value: int) -> None:
        self._note = note
        self.ord = ord_value
        self.id = 123

    def note(self) -> FakeNote:
        return self._note


class TranslateBackendTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        _install_fake_anki_modules()
        _ensure_fake_package()
        _install_reviewer_stubs()
        cls.wrapped_review_state = _load_module(
            f"{PACKAGE_NAME}.wrapped_review_state",
            ROOT / "wrapped_review_state.py",
        )
        cls.models = _load_module(f"{PACKAGE_NAME}.models", ROOT / "models.py")
        cls.render = _load_module(f"{PACKAGE_NAME}.reviewer.render", ROOT / "reviewer" / "render.py")

    def test_translate_notetype_creates_single_stable_template(self) -> None:
        col = FakeCollection()

        self.models.ensure_note_types(col)

        translate_model = col.models.by_name(self.models.TRANSLATE_NOTETYPE_NAME)
        self.assertIsNotNone(translate_model)
        self.assertEqual([tmpl["name"] for tmpl in translate_model["tmpls"]], ["Translate"])
        self.assertIn("{{#German}}", translate_model["tmpls"][0]["qfmt"])

    def test_translate_notetype_trims_extra_templates_on_migration(self) -> None:
        col = FakeCollection()
        existing = col.models.new(self.models.TRANSLATE_NOTETYPE_NAME)
        existing["flds"] = [{"name": name} for name in self.models.TRANSLATE_SPEC.fields]
        existing["tmpls"] = [
            {"name": "Old 1", "qfmt": "", "afmt": ""},
            {"name": "Old 2", "qfmt": "", "afmt": ""},
            {"name": "Old 3", "qfmt": "", "afmt": ""},
            {"name": "Old 4", "qfmt": "", "afmt": ""},
        ]
        col.models.add(existing)

        self.models.ensure_note_types(col)

        translate_model = col.models.by_name(self.models.TRANSLATE_NOTETYPE_NAME)
        self.assertEqual(len(translate_model["tmpls"]), 1)

    def test_translate_reviewer_payload_uses_translate_mode(self) -> None:
        note = FakeNote(
            self.models.TRANSLATE_NOTETYPE_NAME,
            {
                "English": "I am going home.",
                "German": "Ich gehe nach Hause.",
                "Audio": "[sound:go-home.mp3]",
                "Context": "<img src='context.png'>",
                "Notes": "Common phrase.",
                "FillBlank": "Ich gehe nach ___.",
            },
        )
        card = FakeCard(note, ord_value=1)

        payload = self.render._build_card_data(card, "translate", False, 77)

        self.assertEqual(payload["kind"], "translate")
        self.assertEqual(payload["mode"], "translate")
        self.assertEqual(payload["audio"], "[sound:go-home.mp3]")


if __name__ == "__main__":
    unittest.main()
