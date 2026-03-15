"""Collection-side import operations for Foggy notes."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

try:
    from .importer_validation import (
        CODING_KIND,
        MCQ_KIND,
        DuplicateKey,
        ValidatedImportItem,
        build_duplicate_key,
        partition_duplicate_items,
        serialize_note_fields,
    )
except ImportError:
    from importer_validation import (
        CODING_KIND,
        MCQ_KIND,
        DuplicateKey,
        ValidatedImportItem,
        build_duplicate_key,
        partition_duplicate_items,
        serialize_note_fields,
    )


@dataclass(frozen=True)
class ImportOperationResult:
    changes: Any
    imported_count: int
    skipped_duplicates: int
    total_count: int


def run_import_operation(col, items: list[ValidatedImportItem], deck_id) -> ImportOperationResult:
    from anki.collection import AddNoteRequest, OpChanges

    try:
        from . import models
    except ImportError:
        import models

    models.ensure_note_types(col)

    coding_model = col.models.by_name(models.NOTETYPE_NAME)
    mcq_model = col.models.by_name(models.MCQ_NOTETYPE_NAME)
    if coding_model is None or mcq_model is None:
        raise RuntimeError("Foggy note types are unavailable.")

    existing_keys = load_existing_duplicate_keys(
        col,
        coding_model_id=coding_model["id"],
        mcq_model_id=mcq_model["id"],
    )
    importable_items, skipped_duplicates = partition_duplicate_items(items, existing_keys)

    requests = []
    for item in importable_items:
        note = col.new_note(coding_model if item.kind == CODING_KIND else mcq_model)
        for field_name, value in serialize_note_fields(item).items():
            note[field_name] = value
        requests.append(AddNoteRequest(note=note, deck_id=deck_id))

    changes = col.add_notes(requests) if requests else OpChanges()
    return ImportOperationResult(
        changes=changes,
        imported_count=len(requests),
        skipped_duplicates=skipped_duplicates,
        total_count=len(items),
    )


def load_existing_duplicate_keys(
    col,
    *,
    coding_model_id: int,
    mcq_model_id: int,
) -> set[DuplicateKey]:
    keys: set[DuplicateKey] = set()

    for note_id in col.find_notes(f"mid:{coding_model_id}"):
        note = col.get_note(note_id)
        keys.add(
            build_duplicate_key(
                CODING_KIND,
                {
                    "title": note["Title"],
                    "functionName": note["FunctionName"],
                    "language": note["Language"],
                },
            )
        )

    for note_id in col.find_notes(f"mid:{mcq_model_id}"):
        note = col.get_note(note_id)
        keys.add(
            build_duplicate_key(
                MCQ_KIND,
                {
                    "question": note["Question"],
                },
            )
        )

    return keys
