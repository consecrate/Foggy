"""Code execution engine — runs user code against test cases via subprocess."""
from __future__ import annotations

import json
import os
import subprocess
import tempfile
from typing import Any

PYTHON_HARNESS = """\
import json

# --- user code ---
{user_code}

# --- harness ---
_tests = json.loads('''{test_cases_json}''')
_passed = 0
for _i, _t in enumerate(_tests):
    try:
        _result = {function_name}(*_t["input"])
        if _result == _t["output"]:
            print(f"PASS {{_i}}")
            _passed += 1
        else:
            print(f"FAIL {{_i}} expected={{json.dumps(_t['output'])}} got={{json.dumps(_result)}}")
    except Exception as _e:
        print(f"ERROR {{_i}} {{_e}}")
print(f"DONE {{_passed}}/{{len(_tests)}}")
"""


def run_python(
    user_code: str, function_name: str, test_cases: list[dict[str, Any]]
) -> dict[str, Any]:
    """Execute user Python code against test cases.

    Returns dict with keys: results, passed, total, error.
    """
    test_cases_json = json.dumps(test_cases)
    source = PYTHON_HARNESS.format(
        user_code=user_code,
        function_name=function_name,
        test_cases_json=test_cases_json,
    )

    fd, path = tempfile.mkstemp(suffix=".py", prefix="beep_")
    try:
        with os.fdopen(fd, "w") as f:
            f.write(source)

        proc = subprocess.run(
            ["python3", path],
            capture_output=True,
            text=True,
            timeout=5,
        )

        parsed = _parse_output(proc.stdout, len(test_cases))
        completed = _has_valid_completion(parsed, len(test_cases))

        if proc.returncode != 0:
            if completed:
                return _finalize_result(parsed)

            return {
                "results": parsed["results"],
                "passed": parsed["passed"],
                "total": len(test_cases),
                "error": proc.stderr.strip() or "Execution failed",
            }

        if not completed:
            return {
                "results": parsed["results"],
                "passed": parsed["passed"],
                "total": len(test_cases),
                "error": "Execution did not complete successfully",
            }

        return _finalize_result(parsed)

    except subprocess.TimeoutExpired:
        return {
            "results": [],
            "passed": 0,
            "total": len(test_cases),
            "error": "Time limit exceeded (5s)",
        }
    except Exception as e:
        return {
            "results": [],
            "passed": 0,
            "total": len(test_cases),
            "error": str(e),
        }
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass


def _parse_output(stdout: str, total: int) -> dict[str, Any]:
    """Parse harness stdout into structured results."""
    results = []
    passed = 0
    completed = False

    for line in stdout.strip().splitlines():
        parts = line.split(maxsplit=2)
        if not parts:
            continue

        status = parts[0]

        if status == "PASS":
            results.append({"status": "pass"})
        elif status == "FAIL":
            # Format: FAIL <i> expected=<json> got=<json>
            detail = parts[2] if len(parts) > 2 else ""
            expected = got = ""
            if " got=" in detail:
                exp_part, got_part = detail.rsplit(" got=", 1)
                if exp_part.startswith("expected="):
                    expected = exp_part[len("expected="):]
                got = got_part
            results.append({
                "status": "fail",
                "expected": expected,
                "got": got,
            })
        elif status == "ERROR":
            msg = parts[2] if len(parts) > 2 else "Runtime error"
            results.append({"status": "error", "message": msg})
        elif status == "DONE":
            # DONE n/m
            if len(parts) > 1 and "/" in parts[1]:
                p, _ = parts[1].split("/")
                passed = int(p)
                completed = True

    return {
        "results": results,
        "passed": passed,
        "total": total,
        "error": None,
        "completed": completed,
    }


def _finalize_result(parsed: dict[str, Any]) -> dict[str, Any]:
    """Remove internal parsing metadata before returning results."""
    return {
        "results": parsed["results"],
        "passed": parsed["passed"],
        "total": parsed["total"],
        "error": parsed["error"],
    }


def _has_valid_completion(parsed: dict[str, Any], total: int) -> bool:
    """Require the harness completion marker and one result entry per test."""
    return parsed["completed"] and len(parsed["results"]) == total
