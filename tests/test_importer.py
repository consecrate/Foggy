from __future__ import annotations

import json
import unittest

from importer import (
    CODING_KIND,
    MCQ_KIND,
    PROMPT_TEMPLATES,
    ValidatedImportItem,
    build_duplicate_key,
    normalize_import_payload,
    parse_import_json,
    partition_duplicate_items,
    serialize_note_fields,
    validate_import_payload,
)


class ImporterTests(unittest.TestCase):
    def test_coding_prompt_mentions_replacing_placeholder_values(self) -> None:
        prompt = PROMPT_TEMPLATES["Coding"]

        self.assertIn("treat the example values as placeholders only", prompt)
        self.assertIn("If the source implies a different language", prompt)

    def test_coding_prompt_mentions_markdown_readability(self) -> None:
        prompt = PROMPT_TEMPLATES["Coding"]

        self.assertIn('Write "description" as readable Markdown', prompt)
        self.assertIn("Avoid returning one long unformatted block of text.", prompt)

    def test_mixed_prompt_mentions_replacing_placeholder_values(self) -> None:
        prompt = PROMPT_TEMPLATES["Mixed"]

        self.assertIn("Use the schemas below as structure only.", prompt)
        self.assertIn("Do not copy placeholder values", prompt)

    def test_normalize_import_payload_wraps_single_object(self) -> None:
        payload = {"kind": CODING_KIND, "title": "Two Sum"}

        normalized = normalize_import_payload(payload)

        self.assertEqual(normalized, [payload])

    def test_parse_import_json_accepts_mixed_payload(self) -> None:
        raw_json = json.dumps(
            [
                {
                    "kind": CODING_KIND,
                    "title": "Two Sum",
                    "difficulty": "Easy",
                    "language": "Python",
                    "description": "Find two indexes.",
                    "functionName": "two_sum",
                    "starterCode": "def two_sum(nums, target):\n    pass",
                    "solution": "def two_sum(nums, target):\n    return [0, 1]",
                    "testCases": [
                        {"input": [[2, 7, 11, 15], 9], "output": [0, 1]},
                    ],
                },
                {
                    "kind": MCQ_KIND,
                    "question": "What is the time complexity of binary search?",
                    "difficulty": "Easy",
                    "choices": [
                        {"text": "O(n)"},
                        {"text": "O(log n)", "correct": True, "notes": "Halves the range."},
                        {"text": "O(n log n)"},
                    ],
                    "code": {
                        "snippet": "def binary_search(nums, target):\n    pass",
                        "language": "python",
                    },
                },
            ]
        )

        items, errors = parse_import_json(raw_json)

        self.assertEqual(errors, [])
        self.assertEqual([item.kind for item in items], [CODING_KIND, MCQ_KIND])
        self.assertEqual(items[0].data["testCases"][0]["output"], [0, 1])
        self.assertEqual(items[1].data["code"]["language"], "python")

    def test_parse_import_json_rejects_invalid_json(self) -> None:
        items, errors = parse_import_json("{")

        self.assertEqual(items, [])
        self.assertEqual(len(errors), 1)
        self.assertIn("Invalid JSON", errors[0])

    def test_validate_import_payload_requires_kind(self) -> None:
        items, errors = validate_import_payload([{"title": "Missing kind"}])

        self.assertEqual(items, [])
        self.assertEqual(errors, ["Item 1: kind must be 'coding' or 'mcq'."])

    def test_validate_coding_item_rejects_bad_test_cases(self) -> None:
        payload = [
            {
                "kind": CODING_KIND,
                "title": "Two Sum",
                "difficulty": "Easy",
                "language": "Python",
                "description": "Find two indexes.",
                "functionName": "two_sum",
                "starterCode": "def two_sum(nums, target):\n    pass",
                "solution": "def two_sum(nums, target):\n    return [0, 1]",
                "testCases": [
                    {"input": "not-an-array", "output": [0, 1]},
                ],
            }
        ]

        items, errors = validate_import_payload(payload)

        self.assertEqual(items, [])
        self.assertEqual(
            errors,
            ["Item 1 testCases[1]: input must be an array."],
        )

    def test_validate_mcq_item_rejects_multiple_correct_answers(self) -> None:
        payload = [
            {
                "kind": MCQ_KIND,
                "question": "Pick one",
                "difficulty": "Easy",
                "choices": [
                    {"text": "A", "correct": True},
                    {"text": "B", "correct": True},
                ],
            }
        ]

        items, errors = validate_import_payload(payload)

        self.assertEqual(items, [])
        self.assertEqual(
            errors,
            ["Item 1: choices must contain exactly one correct answer."],
        )

    def test_validate_mcq_item_rejects_bad_code_shape(self) -> None:
        payload = [
            {
                "kind": MCQ_KIND,
                "question": "Pick one",
                "difficulty": "Easy",
                "choices": [
                    {"text": "A", "correct": True},
                    {"text": "B"},
                ],
                "code": {"snippet": "", "language": 123},
            }
        ]

        items, errors = validate_import_payload(payload)

        self.assertEqual(items, [])
        self.assertEqual(
            errors,
            [
                "Item 1: code.snippet must be a non-empty string.",
                "Item 1: code.language must be a non-empty string.",
            ],
        )

    def test_partition_duplicate_items_skips_existing_and_payload_duplicates(self) -> None:
        first = ValidatedImportItem(
            kind=CODING_KIND,
            data={
                "title": "Two Sum",
                "difficulty": "Easy",
                "language": "Python",
                "description": "desc",
                "functionName": "two_sum",
                "starterCode": "def two_sum(nums, target):\n    pass",
                "solution": "def two_sum(nums, target):\n    return [0, 1]",
                "testCases": [{"input": [[2, 7], 9], "output": [0, 1]}],
            },
        )
        second = ValidatedImportItem(
            kind=CODING_KIND,
            data={
                "title": "  two sum  ",
                "difficulty": "Easy",
                "language": "python",
                "description": "desc",
                "functionName": "Two_Sum",
                "starterCode": "def two_sum(nums, target):\n    pass",
                "solution": "def two_sum(nums, target):\n    return [0, 1]",
                "testCases": [{"input": [[2, 7], 9], "output": [0, 1]}],
            },
        )
        third = ValidatedImportItem(
            kind=MCQ_KIND,
            data={
                "question": "Binary search complexity?",
                "difficulty": "Easy",
                "choices": [{"text": "O(log n)", "correct": True}, {"text": "O(n)"}],
            },
        )

        existing_keys = {build_duplicate_key(CODING_KIND, first.data)}
        importable, skipped = partition_duplicate_items([first, second, third], existing_keys)

        self.assertEqual(importable, [third])
        self.assertEqual(skipped, 2)

    def test_serialize_note_fields_preserves_nested_json(self) -> None:
        coding_item = ValidatedImportItem(
            kind=CODING_KIND,
            data={
                "title": "Two Sum",
                "difficulty": "Easy",
                "language": "Python",
                "description": "Find two indexes.",
                "functionName": "two_sum",
                "starterCode": "def two_sum(nums, target):\n    pass",
                "solution": "def two_sum(nums, target):\n    return [0, 1]",
                "testCases": [{"input": [[2, 7], 9], "output": [0, 1]}],
            },
        )
        mcq_item = ValidatedImportItem(
            kind=MCQ_KIND,
            data={
                "question": "Pick one",
                "difficulty": "Easy",
                "choices": [
                    {"text": "A"},
                    {"text": "B", "correct": True, "notes": "Right answer."},
                ],
                "code": {"snippet": "print('hi')", "language": "python"},
            },
        )

        coding_fields = serialize_note_fields(coding_item)
        mcq_fields = serialize_note_fields(mcq_item)

        self.assertEqual(json.loads(coding_fields["TestCases"]), coding_item.data["testCases"])
        self.assertEqual(json.loads(mcq_fields["Choices"]), mcq_item.data["choices"])
        self.assertEqual(json.loads(mcq_fields["Code"]), mcq_item.data["code"])


if __name__ == "__main__":
    unittest.main()
