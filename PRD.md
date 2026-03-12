# Foggy v0 — Product Requirements Document

An Anki addon that turns flashcards into a LeetCode-like coding environment. Each card presents a problem on the left and a CodeMirror 6 editor on the right. You write a solution from memory, run it against test cases, and can only grade your recall after all tests pass.

**Languages:** Python 3, C++17
**Card creation:** Manual (no importer)

---

## 1. Card Structure

### Note Type: `Foggy`

| Field | Type | Example |
|---|---|---|
| `Title` | text | `Two Sum` |
| `Difficulty` | text | `Easy` / `Medium` / `Hard` |
| `Language` | text | `Python` / `C++` |
| `Description` | HTML | `Given an array of integers nums...` |
| `FunctionName` | text | `twoSum` |
| `StarterCode` | text | `def twoSum(nums, target):` |
| `Solution` | text | Full working solution |
| `TestCases` | JSON | See below |

### Test Case Format

Test cases are **language-agnostic** — one set of I/O pairs per card. The addon generates the harness for each language automatically.

```json
[
  {"input": [[2,7,11,15], 9], "output": [0,1]},
  {"input": [[3,2,4], 6], "output": [1,2]}
]
```

- `input`: positional arguments to the function, as JSON values
- `output`: expected return value, as a JSON value

**Why this works for both languages:**

The addon generates a wrapper that deserializes JSON args, calls the user's function, serializes the result, and compares to expected output. The serialization layer handles type conversion:

| JSON type | Python type | C++ type |
|---|---|---|
| `[1,2,3]` | `list[int]` | `vector<int>` |
| `[[1,2],[3,4]]` | `list[list[int]]` | `vector<vector<int>>` |
| `"abc"` | `str` | `string` |
| `42` | `int` | `int` |
| `true` | `bool` | `bool` |
| `3.14` | `float` | `double` |

For C++, the starter code's function signature provides the type information needed for deserialization. A small vendored header (`json.hpp` from nlohmann, single-header ~500KB) handles JSON ↔ C++ conversion.

**What the user authors (total):**

```
Language: Python
FunctionName: twoSum
StarterCode: def twoSum(nums, target):
Solution: <full working solution>
TestCases: [{"input": [[2,7,11,15], 9], "output": [0,1]}]
```

Each card targets a single language. The `Language` field determines which executor/harness is used.

---

## 2. Review Flow

```
┌────────────────────────────────────────────────────────┐
│ [Python ▾]                                    [▶ Run]  │
│ ┌─────────────────────┬──────────────────────────────┐ │
│ │                     │                              │ │
│ │  Two Sum            │  def twoSum(nums, target):   │ │
│ │                     │      █                       │ │
│ │  Given an array of  │                              │ │
│ │  integers nums and  │                              │ │
│ │  an integer target, │                              │ │
│ │  return indices...  │                              │ │
│ │                     │                              │ │
│ │  Example 1:         │                              │ │
│ │  Input: [2,7,11,15] │                              │ │
│ │  Output: [0,1]      │                              │ │
│ │                     │                              │ │
│ ├─────────────────────┴──────────────────────────────┤ │
│ │  ✅ Test 1: PASS   ❌ Test 2: FAIL                 │ │
│ │  Expected [1,2], got [2,1]                         │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│        [ Show Answer 🔒 ]    ← locked until all pass  │
│                                                        │
│ ─────────── after unlock + flip ─────────────────────  │
│                                                        │
│  [ Again ]   [ Hard ]   [ Good ]   [ Easy ]            │
└────────────────────────────────────────────────────────┘
```

### Step-by-step

1. Card appears → split pane: problem (left) + CodeMirror editor (right)
2. Language is determined by the card's `Language` field (displayed as a label, not toggleable)
3. Editor pre-filled with starter code for selected language
4. User writes solution from memory
5. Click **▶ Run** → code sent to Python backend via `pycmd()`
6. Backend executes via subprocess, returns per-test results
7. Results shown in bottom panel (✅/❌ per test case with diff on failure)
8. **All tests pass → "Show Answer" unlocks**
9. User flips card → sees reference solution for comparison
10. User grades recall normally

---

## 3. Code Execution

### Python

```
User code → temp .py file → subprocess.run(["python3", path], timeout=5)
```

The generated harness:
```python
import json, sys
# --- user code ---
{user_code}
# --- harness ---
tests = json.loads('{test_cases_json}')
passed = 0
for i, t in enumerate(tests):
    result = {function_name}(*t["input"])
    if result == t["output"]:
        print(f"PASS {i}")
        passed += 1
    else:
        print(f"FAIL {i} expected={json.dumps(t['output'])} got={json.dumps(result)}")
print(f"DONE {passed}/{len(tests)}")
```

### C++

```
User code → temp .cpp file → g++ -std=c++17 -O2 → run binary (timeout=5s)
```

The generated harness includes a vendored `nlohmann/json.hpp` for JSON parsing:
```cpp
#include <bits/stdc++.h>
#include "json.hpp"
using namespace std;
using json = nlohmann::json;

// --- user code ---
{user_code}

// --- harness (auto-generated from function signature) ---
int main() {
    json tests = json::parse(R"({test_cases_json})");
    int passed = 0;
    for (int i = 0; i < tests.size(); i++) {
        auto& t = tests[i];
        // Type-specific deserialization from StarterCpp signature
        auto result = {function_call};
        json result_json = result;
        if (result_json == t["output"]) {
            cout << "PASS " << i << endl;
            passed++;
        } else {
            cout << "FAIL " << i << " expected=" << t["output"]
                 << " got=" << result_json << endl;
        }
    }
    cout << "DONE " << passed << "/" << tests.size() << endl;
}
```

### Compiler Detection

On addon load, detect available tools:

| Language | Detection | Fallback |
|---|---|---|
| Python | `shutil.which("python3")` | Always available (Anki runs on Python) |
| C++ | `shutil.which("g++")` or `shutil.which("clang++")` | Warn user, disable C++ |

macOS: `xcode-select --install` is the only setup needed for C++.

### Safety

- **Timeout:** 5s execution, 10s compilation
- **Cleanup:** temp files removed in `finally` blocks
- **No network:** subprocess inherits no special permissions
- Personal tool — no sandboxing needed

---

## 4. File Structure

```
Foggy/
├── __init__.py           # Hook registration + compiler detection
├── models.py             # Note type creation
├── reviewer.py           # card_will_show + JS message handling
├── executor.py           # Subprocess code runner
├── signature_parser.py   # Parse C++ function signatures for type info
├── web/
│   ├── index.html        # Split-pane template
│   ├── style.css         # Dark theme
│   ├── main.js           # CodeMirror init + run logic + results
│   └── vendor/
│       ├── codemirror/    # CodeMirror 6 ESM bundle
│       └── json.hpp      # nlohmann/json single-header for C++
└── tests/
    └── test_executor.py  # Unit tests for execution engine
```

---

## 5. Technology Choices

| Component | Choice | Rationale |
|---|---|---|
| Code editor | CodeMirror 6 | Modern, tree-sitter grammars, better UX |
| C++ JSON | nlohmann/json | Single-header, zero-dependency, industry standard |
| Test format | JSON I/O pairs | Language-agnostic, no per-language duplication |
| Execution | subprocess | Real compilation/execution, accurate feedback |

### CodeMirror 6 Bundling

CM6 is modular (ESM). For Anki's webview, we'll create a pre-built bundle using rollup/esbuild that produces a single `codemirror.bundle.js` containing:
- `@codemirror/view`, `@codemirror/state`
- `@codemirror/lang-python`, `@codemirror/lang-cpp`
- `@codemirror/theme-one-dark` (dark theme)
- `@codemirror/autocomplete`, `@codemirror/search` (basics)

This bundle is built once during development (not at addon install time) and vendored.

---

## 6. Scope Boundaries (v0)

### In scope
- Split-pane review UI with CodeMirror 6
- Python and C++ execution with auto-generated harnesses
- Language-agnostic test cases
- Answer button locking until all tests pass
- Dark-themed UI
- Manual card creation via Anki's built-in editor

### Out of scope (future versions)
- Problem importer (LeetCode, NeetCode, etc.)
- Additional languages (Java, Go, Rust, etc.)
- Tree/linked list test case support (custom deserializers)
- Code persistence across reviews (save partial attempts)
- Performance metrics (runtime, memory comparison)
- AnkiWeb sync of code attempts
