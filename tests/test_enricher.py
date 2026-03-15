from __future__ import annotations

import json
import unittest

from enricher import (
    EnrichmentCandidate,
    EnrichmentUpdate,
    apply_enrichment_updates,
    build_enrichment_updates,
    build_request_payload,
    parse_batch_response,
    validate_runtime_config,
)


class FakeDecks:
    def __init__(self) -> None:
        self.created = {}

    def id(self, name: str) -> int:
        if name not in self.created:
            self.created[name] = len(self.created) + 100
        return self.created[name]


class FakeNote:
    def __init__(self, note_id: int, german: str, english: str = "") -> None:
        self.id = note_id
        self.fields = {
            "German": german,
            "English": english,
            "Notes": "",
            "FillBlank": "",
        }
        self._card_ids = [note_id * 10 + 1, note_id * 10 + 2, note_id * 10 + 3]

    def __getitem__(self, item: str) -> str:
        return self.fields[item]

    def __setitem__(self, item: str, value: str) -> None:
        self.fields[item] = value

    def card_ids(self) -> list[int]:
        return list(self._card_ids)


class FakeOpChanges:
    def __init__(self, **flags: bool) -> None:
        self.note = False
        self.card = False
        self.deck = False
        self.study_queues = False
        for name, value in flags.items():
            setattr(self, name, value)

    def MergeFrom(self, other) -> None:
        for field_name in ("note", "card", "deck", "study_queues"):
            if getattr(other, field_name, False):
                setattr(self, field_name, True)


class FakeOpChangesWithCount:
    def __init__(self, changes: FakeOpChanges, count: int = 0) -> None:
        self.changes = changes
        self.count = count


class FakeCollection:
    def __init__(self, notes: dict[int, FakeNote]) -> None:
        self.notes = notes
        self.decks = FakeDecks()
        self.updated_notes: list[int] = []
        self.deck_moves: list[tuple[list[int], int]] = []
        self.last_note_change = None
        self.last_deck_change = None
        self.last_deck_wrapper = None

    def get_note(self, note_id: int) -> FakeNote | None:
        return self.notes.get(note_id)

    def update_note(self, note: FakeNote):
        self.updated_notes.append(note.id)
        self.last_note_change = FakeOpChanges(note=True)
        return self.last_note_change

    def set_deck(self, card_ids: list[int], deck_id: int):
        self.deck_moves.append((list(card_ids), deck_id))
        self.last_deck_change = FakeOpChanges(card=True, deck=True, study_queues=True)
        self.last_deck_wrapper = FakeOpChangesWithCount(
            changes=self.last_deck_change,
            count=len(card_ids),
        )
        return self.last_deck_wrapper


class FakeCollectionWithoutNoteChanges(FakeCollection):
    def update_note(self, note: FakeNote):
        self.updated_notes.append(note.id)
        self.last_note_change = None
        return None


class EnricherTests(unittest.TestCase):
    def test_validate_runtime_config_requires_key_and_model(self) -> None:
        with self.assertRaisesRegex(ValueError, "openrouter_api_key"):
            validate_runtime_config({})

        with self.assertRaisesRegex(ValueError, "openrouter_model"):
            validate_runtime_config({"openrouter_api_key": "sk-test"})

        config = validate_runtime_config(
            {
                "openrouter_api_key": " sk-test ",
                "openrouter_model": " openrouter/model ",
            }
        )
        self.assertEqual(
            config,
            {
                "openrouter_api_key": "sk-test",
                "openrouter_model": "openrouter/model",
            },
        )

    def test_build_request_payload_preserves_source_indexes_and_german_input(self) -> None:
        payload = build_request_payload(
            [
                EnrichmentCandidate(note_id=11, german="Hallo zusammen."),
                EnrichmentCandidate(note_id=22, german="Wie geht es dir?"),
            ],
            {
                "openrouter_api_key": "sk-test",
                "openrouter_model": "openrouter/model",
            },
        )

        self.assertEqual(payload["model"], "openrouter/model")
        self.assertEqual(payload["provider"]["require_parameters"], True)
        items = json.loads(payload["messages"][1]["content"])["items"]
        self.assertEqual(
            items,
            [
                {"sourceIndex": 0, "german": "Hallo zusammen."},
                {"sourceIndex": 1, "german": "Wie geht es dir?"},
            ],
        )

    def test_parse_batch_response_validates_indexes_and_shape(self) -> None:
        response = {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            {
                                "items": [
                                    {
                                        "sourceIndex": 1,
                                        "german": "Wie geht es dir?",
                                        "english": "How are you?",
                                        "notes": "Common greeting.",
                                        "fillBlank": "Wie ___ es dir?",
                                    },
                                    {
                                        "sourceIndex": 0,
                                        "german": "Hallo zusammen!",
                                        "english": "Hello everyone!",
                                        "notes": "Friendly greeting.",
                                        "fillBlank": "Hallo ___!",
                                    },
                                ]
                            }
                        )
                    }
                }
            ]
        }

        items = parse_batch_response(response, 2)

        self.assertEqual([item.source_index for item in items], [0, 1])
        self.assertEqual(items[0].english, "Hello everyone!")

    def test_build_enrichment_updates_maps_back_to_note_ids_and_english(self) -> None:
        candidates = [
            EnrichmentCandidate(note_id=55, german="Hallo."),
            EnrichmentCandidate(note_id=66, german="Tschuess."),
        ]
        response = {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            {
                                "items": [
                                    {
                                        "sourceIndex": 0,
                                        "german": "Hallo.",
                                        "english": "Hello.",
                                        "notes": "Greeting.",
                                        "fillBlank": "___.",
                                    },
                                    {
                                        "sourceIndex": 1,
                                        "german": "Tschuess.",
                                        "english": "Bye.",
                                        "notes": "Farewell.",
                                        "fillBlank": "___.",
                                    },
                                ]
                            }
                        )
                    }
                }
            ]
        }

        updates = build_enrichment_updates(candidates, parse_batch_response(response, 2))

        self.assertEqual([update.note_id for update in updates], [55, 66])
        self.assertEqual(updates[0].german, "Hallo.")
        self.assertEqual(updates[0].english, "Hello.")

    def test_build_enrichment_updates_rejects_changed_german_sentence(self) -> None:
        candidates = [EnrichmentCandidate(note_id=55, german="Hallo.")]
        response = {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            {
                                "items": [
                                    {
                                        "sourceIndex": 0,
                                        "german": "Guten Tag.",
                                        "english": "Hello.",
                                        "notes": "Formal greeting.",
                                        "fillBlank": "Guten ___.",
                                    }
                                ]
                            }
                        )
                    }
                }
            ]
        }

        with self.assertRaisesRegex(ValueError, "different German sentence"):
            build_enrichment_updates(candidates, parse_batch_response(response, 1))

    def test_apply_enrichment_updates_fills_english_and_skips_existing_translations(self) -> None:
        notes = {
            10: FakeNote(10, german="Hallo", english=""),
            20: FakeNote(20, german="Tschuess", english="Already translated"),
        }
        col = FakeCollection(notes)
        updates = (
            EnrichmentUpdate(
                note_id=10,
                german="Hallo",
                english="Hello",
                notes="Greeting",
                fill_blank="___",
            ),
            EnrichmentUpdate(
                note_id=20,
                german="Tschuess",
                english="Bye",
                notes="Farewell",
                fill_blank="___",
            ),
        )

        result = apply_enrichment_updates(col, updates, total_candidates=2)

        self.assertEqual(result.updated_count, 1)
        self.assertEqual(result.skipped_count, 1)
        self.assertEqual(notes[10]["German"], "Hallo")
        self.assertEqual(notes[10]["English"], "Hello")
        self.assertEqual(notes[20]["English"], "Already translated")
        self.assertEqual(col.updated_notes, [10])
        self.assertEqual(len(col.deck_moves), 1)
        self.assertIsInstance(result.changes, FakeOpChanges)
        self.assertTrue(result.changes.note)
        self.assertTrue(result.changes.card)
        self.assertTrue(result.changes.deck)
        self.assertTrue(result.changes.study_queues)

    def test_apply_enrichment_updates_unwraps_set_deck_changes_from_wrapper(self) -> None:
        notes = {
            10: FakeNote(10, german="Hallo", english=""),
        }
        col = FakeCollectionWithoutNoteChanges(notes)
        updates = (
            EnrichmentUpdate(
                note_id=10,
                german="Hallo",
                english="Hello",
                notes="Greeting",
                fill_blank="___",
            ),
        )

        result = apply_enrichment_updates(col, updates, total_candidates=1)

        self.assertIs(result.changes, col.last_deck_change)
        self.assertIsNot(result.changes, col.last_deck_wrapper)

    def test_apply_enrichment_updates_merges_note_and_deck_change_flags(self) -> None:
        notes = {
            10: FakeNote(10, german="Hallo", english=""),
        }
        col = FakeCollection(notes)
        updates = (
            EnrichmentUpdate(
                note_id=10,
                german="Hallo",
                english="Hello",
                notes="Greeting",
                fill_blank="___",
            ),
        )

        result = apply_enrichment_updates(col, updates, total_candidates=1)

        self.assertIs(result.changes, col.last_note_change)
        self.assertIsNot(result.changes, col.last_deck_wrapper)
        self.assertTrue(result.changes.note)
        self.assertTrue(result.changes.card)
        self.assertTrue(result.changes.deck)
        self.assertTrue(result.changes.study_queues)


if __name__ == "__main__":
    unittest.main()
