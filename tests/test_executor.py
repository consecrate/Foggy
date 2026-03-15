from __future__ import annotations

import shutil
import unittest

import executor


CPP_COMPILER_AVAILABLE = shutil.which("g++") or shutil.which("clang++")


class ExecutorTests(unittest.TestCase):
    def test_run_python_passes_simple_case(self) -> None:
        result = executor.run_python(
            "def add(a, b):\n    return a + b\n",
            "add",
            [{"input": [2, 3], "output": 5}],
        )

        self.assertEqual(result["passed"], 1)
        self.assertEqual(result["total"], 1)
        self.assertIsNone(result["error"])
        self.assertEqual(result["results"], [{"status": "pass"}])

    @unittest.skipUnless(CPP_COMPILER_AVAILABLE, "C++ compiler required")
    def test_run_cpp_passes_vector_case(self) -> None:
        result = executor.run_cpp(
            """
int removeElement(vector<int>& nums, int val) {
    int k = 0;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        if (nums[i] != val) {
            nums[k++] = nums[i];
        }
    }
    return k;
}
""".strip(),
            "removeElement",
            [{"input": [[3, 2, 2, 3], 3], "output": 2}],
        )

        self.assertEqual(result["passed"], 1)
        self.assertEqual(result["total"], 1)
        self.assertIsNone(result["error"])
        self.assertEqual(result["results"], [{"status": "pass"}])

    @unittest.skipUnless(CPP_COMPILER_AVAILABLE, "C++ compiler required")
    def test_run_cpp_reports_compile_errors(self) -> None:
        result = executor.run_cpp(
            "int broken(vector<int>& nums, int val) { return nums.size() }",
            "broken",
            [{"input": [[1, 2, 3], 2], "output": 3}],
        )

        self.assertEqual(result["passed"], 0)
        self.assertEqual(result["total"], 1)
        self.assertIsNotNone(result["error"])

    def test_run_cpp_requires_named_function_definition(self) -> None:
        result = executor.run_cpp(
            "int other(vector<int>& nums, int val) { return 0; }",
            "removeElement",
            [{"input": [[1, 2, 3], 2], "output": 2}],
        )

        self.assertEqual(result["passed"], 0)
        self.assertEqual(result["total"], 1)
        self.assertIn("Could not find a C++ function definition", result["error"])


if __name__ == "__main__":
    unittest.main()
