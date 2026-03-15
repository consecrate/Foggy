"""Code execution engine — runs user code against test cases via subprocess."""
from __future__ import annotations

from dataclasses import dataclass
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

PYTHON_TIMEOUT_SECONDS = 5
CPP_COMPILE_TIMEOUT_SECONDS = 10
CPP_RUN_TIMEOUT_SECONDS = 5

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

CPP_PREAMBLE = r"""\
#include <algorithm>
#include <cstdint>
#include <exception>
#include <iomanip>
#include <iostream>
#include <limits>
#include <sstream>
#include <string>
#include <type_traits>
#include <vector>

using namespace std;

inline string foggy_escape_json_string(const string& value) {
    ostringstream out;
    out << '"';
    for (char ch : value) {
        switch (ch) {
            case '\\':
                out << "\\\\";
                break;
            case '"':
                out << "\\\"";
                break;
            case '\b':
                out << "\\b";
                break;
            case '\f':
                out << "\\f";
                break;
            case '\n':
                out << "\\n";
                break;
            case '\r':
                out << "\\r";
                break;
            case '\t':
                out << "\\t";
                break;
            default:
                out << ch;
                break;
        }
    }
    out << '"';
    return out.str();
}

inline string foggy_to_json(const string& value) {
    return foggy_escape_json_string(value);
}

inline string foggy_to_json(const char* value) {
    return foggy_to_json(string(value));
}

inline string foggy_to_json(bool value) {
    return value ? "true" : "false";
}

template <typename T, typename enable_if<is_integral<T>::value && !is_same<T, bool>::value, int>::type = 0>
string foggy_to_json(T value) {
    return to_string(value);
}

template <typename T, typename enable_if<is_floating_point<T>::value, int>::type = 0>
string foggy_to_json(T value) {
    ostringstream out;
    out << setprecision(numeric_limits<T>::max_digits10) << value;
    string text = out.str();
    if (text.find('.') == string::npos && text.find('e') == string::npos && text.find('E') == string::npos) {
        text += ".0";
    }
    return text;
}

template <typename T>
string foggy_to_json(const vector<T>& value) {
    ostringstream out;
    out << "[";
    for (size_t index = 0; index < value.size(); ++index) {
        if (index != 0) {
            out << ",";
        }
        out << foggy_to_json(value[index]);
    }
    out << "]";
    return out.str();
}
"""

CPP_HARNESS_TEMPLATE = """\
{preamble}

// --- user code ---
{user_code}

// --- harness ---
int main() {{
    int _foggy_passed = 0;
{test_blocks}
    cout << "DONE " << _foggy_passed << "/{total_tests}" << endl;
    return 0;
}}
"""

CPP_SIGNATURE_PATTERN = r"""
(?P<return_type>
    (?:
        [\w:<>,&*\[\]]+
        |
        \s+
    )+?
)
\b{function_name}\s*
\(
    (?P<params>[^)]*)
\)
\s*
(?:const\s*)?
(?:noexcept\s*)?
\{{
"""

SUPPORTED_CPP_SCALARS = {
    "bool",
    "double",
    "float",
    "int",
    "int16_t",
    "int32_t",
    "int64_t",
    "long",
    "long double",
    "long int",
    "long long",
    "long long int",
    "short",
    "short int",
    "size_t",
    "string",
    "uint16_t",
    "uint32_t",
    "uint64_t",
    "unsigned",
    "unsigned int",
    "unsigned long",
    "unsigned long int",
    "unsigned long long",
    "unsigned long long int",
    "unsigned short",
    "unsigned short int",
}


@dataclass(frozen=True)
class CppSignature:
    return_type: str
    parameter_types: list[str]


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

    with tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".py",
        prefix="foggy_",
        delete=False,
    ) as handle:
        path = handle.name
        handle.write(source)

    try:
        proc = subprocess.run(
            ["python3", path],
            capture_output=True,
            text=True,
            timeout=PYTHON_TIMEOUT_SECONDS,
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
                "error": _coalesce_subprocess_error(proc.stderr, proc.stdout, "Execution failed"),
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
            "error": f"Time limit exceeded ({PYTHON_TIMEOUT_SECONDS}s)",
        }
    except Exception as error:
        return {
            "results": [],
            "passed": 0,
            "total": len(test_cases),
            "error": str(error),
        }
    finally:
        Path(path).unlink(missing_ok=True)


def run_cpp(
    user_code: str, function_name: str, test_cases: list[dict[str, Any]]
) -> dict[str, Any]:
    """Compile and execute user C++ code against JSON-backed test cases."""
    compiler = _find_cpp_compiler()
    if compiler is None:
        return {
            "results": [],
            "passed": 0,
            "total": len(test_cases),
            "error": "No C++ compiler found. Install g++ or clang++ to run C++ cards.",
        }

    try:
        signature = _extract_cpp_signature(user_code, function_name)
        source = _build_cpp_source(user_code, function_name, test_cases, signature)
    except ValueError as error:
        return {
            "results": [],
            "passed": 0,
            "total": len(test_cases),
            "error": str(error),
        }

    try:
        with tempfile.TemporaryDirectory(prefix="foggy_cpp_") as temp_dir:
            source_path = Path(temp_dir) / "main.cpp"
            binary_path = Path(temp_dir) / "main"
            source_path.write_text(source, encoding="utf-8")

            compile_proc = subprocess.run(
                [
                    compiler,
                    "-std=c++17",
                    "-O2",
                    str(source_path),
                    "-o",
                    str(binary_path),
                ],
                capture_output=True,
                text=True,
                timeout=CPP_COMPILE_TIMEOUT_SECONDS,
            )
            if compile_proc.returncode != 0:
                return {
                    "results": [],
                    "passed": 0,
                    "total": len(test_cases),
                    "error": _coalesce_subprocess_error(
                        compile_proc.stderr,
                        compile_proc.stdout,
                        "Compilation failed",
                    ),
                }

            run_proc = subprocess.run(
                [str(binary_path)],
                capture_output=True,
                text=True,
                timeout=CPP_RUN_TIMEOUT_SECONDS,
            )

            parsed = _parse_output(run_proc.stdout, len(test_cases))
            completed = _has_valid_completion(parsed, len(test_cases))

            if run_proc.returncode != 0:
                if completed:
                    return _finalize_result(parsed)

                return {
                    "results": parsed["results"],
                    "passed": parsed["passed"],
                    "total": len(test_cases),
                    "error": _coalesce_subprocess_error(
                        run_proc.stderr,
                        run_proc.stdout,
                        "Execution failed",
                    ),
                }

            if not completed:
                return {
                    "results": parsed["results"],
                    "passed": parsed["passed"],
                    "total": len(test_cases),
                    "error": "Execution did not complete successfully",
                }

            return _finalize_result(parsed)

    except subprocess.TimeoutExpired as error:
        timeout_seconds = (
            CPP_COMPILE_TIMEOUT_SECONDS
            if error.cmd and len(error.cmd) > 1 and error.cmd[0] == compiler
            else CPP_RUN_TIMEOUT_SECONDS
        )
        stage = "Compilation" if timeout_seconds == CPP_COMPILE_TIMEOUT_SECONDS else "Time limit exceeded"
        message = (
            f"{stage} timed out ({timeout_seconds}s)"
            if stage == "Compilation"
            else f"{stage} ({timeout_seconds}s)"
        )
        return {
            "results": [],
            "passed": 0,
            "total": len(test_cases),
            "error": message,
        }
    except Exception as error:
        return {
            "results": [],
            "passed": 0,
            "total": len(test_cases),
            "error": str(error),
        }


def _build_cpp_source(
    user_code: str,
    function_name: str,
    test_cases: list[dict[str, Any]],
    signature: CppSignature,
) -> str:
    if signature.return_type == "void":
        raise ValueError("C++ cards must return a value; void functions are not supported.")

    test_blocks: list[str] = []
    for index, test_case in enumerate(test_cases):
        inputs = test_case.get("input")
        if not isinstance(inputs, list):
            raise ValueError(f"Test case {index + 1}: input must be an array.")
        if len(inputs) != len(signature.parameter_types):
            raise ValueError(
                f"Test case {index + 1}: expected {len(signature.parameter_types)} inputs, "
                f"got {len(inputs)}."
            )
        if "output" not in test_case:
            raise ValueError(f"Test case {index + 1}: output is required.")

        arg_lines = []
        arg_names = []
        for arg_index, (value, param_type) in enumerate(zip(inputs, signature.parameter_types)):
            arg_name = f"_foggy_arg_{arg_index}"
            arg_literal = _cpp_literal(value, param_type)
            arg_lines.append(f"        {param_type} {arg_name} = {arg_literal};")
            arg_names.append(arg_name)

        expected_literal = _cpp_literal(test_case["output"], signature.return_type)
        test_blocks.append(
            "\n".join(
                [
                    "    {",
                    *arg_lines,
                    f"        auto _foggy_expected = {expected_literal};",
                    "        try {",
                    f"            auto _foggy_result = {function_name}({', '.join(arg_names)});",
                    "            if (_foggy_result == _foggy_expected) {",
                    f'                cout << "PASS {index}" << endl;',
                    "                _foggy_passed++;",
                    "            } else {",
                    f'                cout << "FAIL {index} expected=" << foggy_to_json(_foggy_expected)',
                    '                     << " got=" << foggy_to_json(_foggy_result) << endl;',
                    "            }",
                    "        } catch (const exception& _foggy_error) {",
                    f'            cout << "ERROR {index} " << _foggy_error.what() << endl;',
                    "        } catch (...) {",
                    f'            cout << "ERROR {index} Runtime error" << endl;',
                    "        }",
                    "    }",
                ]
            )
        )

    return CPP_HARNESS_TEMPLATE.format(
        preamble=CPP_PREAMBLE,
        user_code=user_code,
        total_tests=len(test_cases),
        test_blocks="\n".join(test_blocks),
    )


def _extract_cpp_signature(user_code: str, function_name: str) -> CppSignature:
    pattern = re.compile(
        CPP_SIGNATURE_PATTERN.format(function_name=re.escape(function_name)),
        re.MULTILINE | re.VERBOSE,
    )
    match = pattern.search(user_code)
    if match is None:
        raise ValueError(
            f"Could not find a C++ function definition named '{function_name}'. "
            "Keep the original function signature in your answer."
        )

    return_type = _normalize_cpp_type(match.group("return_type"))
    if not return_type:
        raise ValueError(f"Could not parse the return type for '{function_name}'.")

    params_source = match.group("params").strip()
    parameter_types = _parse_cpp_parameters(params_source)
    return CppSignature(return_type=return_type, parameter_types=parameter_types)


def _parse_cpp_parameters(params_source: str) -> list[str]:
    if not params_source or params_source == "void":
        return []

    parameter_types = []
    for raw_param in _split_cpp_top_level(params_source):
        param = raw_param.split("=", 1)[0].strip()
        match = re.match(r"^(?P<type>.+?)(?P<name>[A-Za-z_]\w*)$", param)
        if match is None:
            raise ValueError(f"Unsupported C++ parameter declaration: '{raw_param.strip()}'.")

        cpp_type = _normalize_cpp_type(match.group("type"))
        if not cpp_type:
            raise ValueError(f"Unsupported C++ parameter declaration: '{raw_param.strip()}'.")
        parameter_types.append(cpp_type)

    return parameter_types


def _split_cpp_top_level(source: str) -> list[str]:
    parts: list[str] = []
    start = 0
    angle_depth = 0
    paren_depth = 0
    bracket_depth = 0

    for index, char in enumerate(source):
        if char == "<":
            angle_depth += 1
        elif char == ">":
            angle_depth = max(0, angle_depth - 1)
        elif char == "(":
            paren_depth += 1
        elif char == ")":
            paren_depth = max(0, paren_depth - 1)
        elif char == "[":
            bracket_depth += 1
        elif char == "]":
            bracket_depth = max(0, bracket_depth - 1)
        elif char == "," and angle_depth == 0 and paren_depth == 0 and bracket_depth == 0:
            parts.append(source[start:index].strip())
            start = index + 1

    parts.append(source[start:].strip())
    return [part for part in parts if part]


def _normalize_cpp_type(type_source: str) -> str:
    normalized = " ".join(type_source.replace("\n", " ").split())
    normalized = re.sub(r"\b(?:const|volatile)\b", "", normalized)
    normalized = normalized.replace("std::", "")
    normalized = normalized.replace("&&", "")
    normalized = normalized.replace("&", "")
    normalized = re.sub(r"\b(?:inline|static|constexpr|virtual|friend|typename)\b", "", normalized)
    normalized = " ".join(normalized.split()).strip()

    if not normalized:
        return ""
    if "*" in normalized:
        raise ValueError(f"Unsupported C++ type '{normalized}'. Pointer types are not supported.")

    normalized = re.sub(r"\s*<\s*", "<", normalized)
    normalized = re.sub(r"\s*>\s*", ">", normalized)
    normalized = re.sub(r"\s*,\s*", ", ", normalized)
    normalized = normalized.replace("> >", ">>")

    if normalized.startswith("vector<") and normalized.endswith(">"):
        inner_type = _vector_inner_type(normalized)
        if inner_type is None:
            raise ValueError(f"Unsupported C++ type '{normalized}'.")
        return f"vector<{_normalize_cpp_type(inner_type)}>"

    if normalized not in SUPPORTED_CPP_SCALARS:
        raise ValueError(
            f"Unsupported C++ type '{normalized}'. "
            "Supported types are numbers, bool, string, and nested vector<...>."
        )
    return normalized


def _vector_inner_type(cpp_type: str) -> str | None:
    if not cpp_type.startswith("vector<") or not cpp_type.endswith(">"):
        return None

    inner = cpp_type[len("vector<") : -1]
    depth = 0
    for index, char in enumerate(inner):
        if char == "<":
            depth += 1
        elif char == ">":
            depth -= 1
            if depth < 0:
                return None
        elif char == "," and depth == 0:
            return None
    return inner


def _cpp_literal(value: Any, cpp_type: str) -> str:
    if cpp_type.startswith("vector<"):
        if not isinstance(value, list):
            raise ValueError(f"Expected JSON array for C++ type '{cpp_type}'.")
        inner_type = _vector_inner_type(cpp_type)
        assert inner_type is not None
        return "{" + ", ".join(_cpp_literal(item, inner_type) for item in value) + "}"

    if cpp_type == "string":
        if not isinstance(value, str):
            raise ValueError("Expected JSON string for C++ type 'string'.")
        return json.dumps(value)

    if cpp_type == "bool":
        if not isinstance(value, bool):
            raise ValueError("Expected JSON boolean for C++ type 'bool'.")
        return "true" if value else "false"

    if cpp_type in {"float", "double", "long double"}:
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            raise ValueError(f"Expected JSON number for C++ type '{cpp_type}'.")
        literal = format(value, ".17g")
        if "." not in literal and "e" not in literal and "E" not in literal:
            literal += ".0"
        return literal

    if cpp_type in SUPPORTED_CPP_SCALARS:
        if not isinstance(value, int) or isinstance(value, bool):
            raise ValueError(f"Expected JSON integer for C++ type '{cpp_type}'.")
        return str(value)

    raise ValueError(f"Unsupported C++ type '{cpp_type}'.")


def _find_cpp_compiler() -> str | None:
    return shutil.which("g++") or shutil.which("clang++")


def _coalesce_subprocess_error(stderr: str, stdout: str, fallback: str) -> str:
    stderr = (stderr or "").strip()
    if stderr:
        return stderr

    stdout = (stdout or "").strip()
    if stdout:
        return stdout

    return fallback


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
            if len(parts) > 1 and "/" in parts[1]:
                passed_text, _ = parts[1].split("/", 1)
                passed = int(passed_text)
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
