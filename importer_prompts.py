"""Bundled AI prompt templates for the Foggy importer."""

from __future__ import annotations

from textwrap import dedent


PROMPT_TEMPLATES = {
    "Mixed": dedent(
        """
        Generate raw JSON only. No markdown fences. Return either a single object or an array of objects.
        Every object must include a "kind" field set to "coding" or "mcq".
        Use the schemas below as structure only. Keep the same keys and overall JSON shape, but replace the example values with values that match the source material.
        Do not copy placeholder values such as titles, languages, function names, starter code, solutions, questions, choices, or test cases unless the source genuinely matches them.
        If the source implies a different language or naming convention, update those values accordingly.

        Coding schema:
        {
          "kind": "coding",
          "title": "Two Sum",
          "difficulty": "Easy",
          "language": "Python",
          "description": "Write the full problem statement here.",
          "functionName": "two_sum",
          "starterCode": "def two_sum(nums, target):\\n    pass",
          "solution": "def two_sum(nums, target):\\n    seen = {}\\n    for index, value in enumerate(nums):\\n        need = target - value\\n        if need in seen:\\n            return [seen[need], index]\\n        seen[value] = index",
          "testCases": [
            {"input": [[2, 7, 11, 15], 9], "output": [0, 1]},
            {"input": [[3, 2, 4], 6], "output": [1, 2]}
          ]
        }

        MCQ schema:
        {
          "kind": "mcq",
          "question": "Which statement about binary search is correct?",
          "difficulty": "Easy",
          "choices": [
            {"text": "It requires sorted input.", "correct": true, "notes": "Binary search only works when the search space is ordered."},
            {"text": "It always runs in O(n)."},
            {"text": "It checks every element."}
          ],
          "code": {
            "snippet": "def binary_search(nums, target):\\n    left, right = 0, len(nums) - 1",
            "language": "python"
          }
        }

        For coding items, write "description" as clean, readable Markdown that is easy on the eyes.
        Prefer short paragraphs, bullet lists, inline code, and fenced code blocks when helpful.
        Preserve the problem structure, but improve readability instead of returning one dense wall of text.
        Use real arrays and objects for nested JSON fields. Escape newlines inside strings.
        """
    ).strip(),
    "Coding": dedent(
        """
        Generate raw JSON only. No markdown fences. Return either one coding object or an array of coding objects.
        Every object must match this exact schema:

        {
          "kind": "coding",
          "title": "Problem title",
          "difficulty": "Easy",
          "language": "Python",
          "description": "Full prompt text",
          "functionName": "function_name",
          "starterCode": "def function_name(arg1, arg2):\\n    pass",
          "solution": "def function_name(arg1, arg2):\\n    return arg1 + arg2",
          "testCases": [
            {"input": [1, 2], "output": 3},
            {"input": [5, 7], "output": 12}
          ]
        }

        Use the schema exactly, but treat the example values as placeholders only.
        Replace every sample value with values that fit the source material, including title, difficulty, language, functionName, starterCode, solution, and testCases.
        If the source implies a different language or naming convention, use that instead of the example.
        Write "description" as readable Markdown so the prompt is easy to scan.
        Prefer short paragraphs, bullet lists, inline code, and fenced code blocks when helpful.
        Avoid returning one long unformatted block of text.
        testCases must be an array of objects with "input" as an array and "output" as any JSON value.
        Escape newlines inside strings.
        """
    ).strip(),
    "MCQ": dedent(
        """
        Generate raw JSON only. No markdown fences. Return either one mcq object or an array of mcq objects.
        Every object must match this exact schema:

        {
          "kind": "mcq",
          "question": "Question text",
          "difficulty": "Medium",
          "choices": [
            {"text": "Choice A"},
            {"text": "Choice B", "correct": true, "notes": "Explain why this is correct."},
            {"text": "Choice C", "notes": "Optional rationale for why this is wrong."}
          ],
          "code": {
            "snippet": "for index in range(3):\\n    print(index)",
            "language": "python"
          }
        }

        Use the schema exactly, but treat the example values as placeholders only.
        Replace every sample value with values that fit the source material instead of copying the example text.
        choices must contain exactly one object with "correct": true.
        Omit the "code" object if the question has no code snippet.
        Escape newlines inside strings.
        """
    ).strip(),
}
