"""JSON importer for Foggy notes."""

from __future__ import annotations

try:
    from .importer_operation import (
        ImportOperationResult,
        load_existing_duplicate_keys as _load_existing_duplicate_keys,
        run_import_operation as _run_import_operation,
    )
    from .importer_prompts import PROMPT_TEMPLATES
    from .importer_ui import (
        AQT_AVAILABLE,
        FoggyImportWindow,
        _format_error_report,
        show_import_window,
    )
    from .importer_validation import (
        CODING_KIND,
        MCQ_KIND,
        ValidatedImportItem,
        build_duplicate_key,
        normalize_import_payload,
        parse_import_json,
        partition_duplicate_items,
        serialize_note_fields,
        validate_import_payload,
    )
except ImportError:
    from importer_operation import (
        ImportOperationResult,
        load_existing_duplicate_keys as _load_existing_duplicate_keys,
        run_import_operation as _run_import_operation,
    )
    from importer_prompts import PROMPT_TEMPLATES
    from importer_ui import (
        AQT_AVAILABLE,
        FoggyImportWindow,
        _format_error_report,
        show_import_window,
    )
    from importer_validation import (
        CODING_KIND,
        MCQ_KIND,
        ValidatedImportItem,
        build_duplicate_key,
        normalize_import_payload,
        parse_import_json,
        partition_duplicate_items,
        serialize_note_fields,
        validate_import_payload,
    )

__all__ = [
    "AQT_AVAILABLE",
    "CODING_KIND",
    "FoggyImportWindow",
    "ImportOperationResult",
    "MCQ_KIND",
    "PROMPT_TEMPLATES",
    "ValidatedImportItem",
    "_format_error_report",
    "_load_existing_duplicate_keys",
    "_run_import_operation",
    "build_duplicate_key",
    "normalize_import_payload",
    "parse_import_json",
    "partition_duplicate_items",
    "serialize_note_fields",
    "show_import_window",
    "validate_import_payload",
]
