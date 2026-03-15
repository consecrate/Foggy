"""Batch enrichment for Foggy Translate notes."""

from __future__ import annotations

from dataclasses import dataclass
import json
from typing import Any
import urllib.error
import urllib.request

TEMP_DECK_NAME = "Deutsch Temporary"
TARGET_DECK_NAME = "Deutsch"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_BATCH_SIZE = 5

CONFIG_DEFAULTS = {
    "openrouter_api_key": "",
    "openrouter_model": "",
}

ENRICHMENT_SCHEMA = {
    "name": "foggy_translate_enrichment_batch",
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
                "items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "sourceIndex": {"type": "integer", "minimum": 0},
                            "german": {"type": "string"},
                            "english": {"type": "string"},
                        "notes": {"type": "string"},
                        "fillBlank": {"type": "string"},
                    },
                    "required": [
                        "sourceIndex",
                        "german",
                        "english",
                        "notes",
                        "fillBlank",
                    ],
                },
            },
        },
        "required": ["items"],
    },
}


@dataclass(frozen=True)
class EnrichmentCandidate:
    note_id: int
    german: str


@dataclass(frozen=True)
class EnrichmentItem:
    source_index: int
    german: str
    english: str
    notes: str
    fill_blank: str


@dataclass(frozen=True)
class EnrichmentUpdate:
    note_id: int
    german: str
    english: str
    notes: str
    fill_blank: str


@dataclass(frozen=True)
class EnrichmentQueryResult:
    updates: tuple[EnrichmentUpdate, ...]
    total_candidates: int


@dataclass(frozen=True)
class ApplyEnrichmentResult:
    changes: Any
    updated_count: int
    skipped_count: int
    total_candidates: int


def merged_config(raw_config: dict[str, Any] | None) -> dict[str, Any]:
    config = dict(CONFIG_DEFAULTS)
    if raw_config:
        config.update(raw_config)
    return config


def validate_runtime_config(raw_config: dict[str, Any] | None) -> dict[str, str]:
    config = merged_config(raw_config)
    api_key = str(config.get("openrouter_api_key", "") or "").strip()
    model = str(config.get("openrouter_model", "") or "").strip()
    if not api_key:
        raise ValueError("Set openrouter_api_key in the add-on config before enriching.")
    if not model:
        raise ValueError("Set openrouter_model in the add-on config before enriching.")
    return {
        "openrouter_api_key": api_key,
        "openrouter_model": model,
    }


def enrich_temporary_deck(col, config: dict[str, str], batch_size: int = DEFAULT_BATCH_SIZE) -> EnrichmentQueryResult:
    candidates = load_enrichment_candidates(col)
    if not candidates:
        return EnrichmentQueryResult(updates=(), total_candidates=0)

    updates: list[EnrichmentUpdate] = []
    for offset in range(0, len(candidates), batch_size):
        batch = candidates[offset:offset + batch_size]
        items = enrich_batch(batch, config)
        updates.extend(build_enrichment_updates(batch, items))

    return EnrichmentQueryResult(
        updates=tuple(updates),
        total_candidates=len(candidates),
    )


def load_enrichment_candidates(col) -> list[EnrichmentCandidate]:
    from . import models

    notetype = col.models.by_name(models.TRANSLATE_NOTETYPE_NAME)
    if notetype is None:
        return []

    if col.decks.by_name(TEMP_DECK_NAME) is None:
        return []

    notes: list[EnrichmentCandidate] = []
    note_ids = col.find_notes(f'mid:{notetype["id"]} deck:"{TEMP_DECK_NAME}"')
    for note_id in note_ids:
        note = col.get_note(note_id)
        english = str(note["English"]).strip()
        german = str(note["German"]).strip()
        if english or not german:
            continue
        notes.append(EnrichmentCandidate(note_id=note_id, german=german))

    return notes


def build_request_payload(batch: list[EnrichmentCandidate], config: dict[str, str]) -> dict[str, Any]:
    return {
        "model": config["openrouter_model"],
        "temperature": 0.2,
        "provider": {
            "require_parameters": True,
            "allow_fallbacks": False,
        },
        "response_format": {
            "type": "json_schema",
            "json_schema": ENRICHMENT_SCHEMA,
        },
        "messages": [
            {
                "role": "system",
                "content": (
                    "You enrich German learning flashcards. "
                    "For each German sentence, return the same sentence in the `german` "
                    "field, provide a natural English translation in the `english` field, "
                    "brief English learning notes, "
                    "and a fill-in-the-blank German sentence that uses `___` for the "
                    "missing part. Keep the sourceIndex unchanged. Return only "
                    "schema-compliant JSON."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "items": [
                            {
                                "sourceIndex": index,
                                "german": candidate.german,
                            }
                            for index, candidate in enumerate(batch)
                        ]
                    },
                    ensure_ascii=False,
                ),
            },
        ],
    }


def enrich_batch(batch: list[EnrichmentCandidate], config: dict[str, str]) -> tuple[EnrichmentItem, ...]:
    request_payload = build_request_payload(batch, config)
    response_payload = post_openrouter_payload(request_payload, config["openrouter_api_key"])
    return parse_batch_response(response_payload, len(batch))


def post_openrouter_payload(payload: dict[str, Any], api_key: str) -> dict[str, Any]:
    request = urllib.request.Request(
        OPENROUTER_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenRouter request failed with HTTP {error.code}: {detail}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"OpenRouter request failed: {error.reason}") from error


def parse_batch_response(response_payload: dict[str, Any], expected_count: int) -> tuple[EnrichmentItem, ...]:
    raw_content = extract_response_content(response_payload)
    try:
        parsed = json.loads(raw_content)
    except json.JSONDecodeError as error:
        raise ValueError(f"OpenRouter returned invalid JSON: {error}") from error

    return validate_enrichment_payload(parsed, expected_count)


def extract_response_content(response_payload: dict[str, Any]) -> str:
    choices = response_payload.get("choices")
    if not isinstance(choices, list) or not choices:
        raise ValueError("OpenRouter response did not include any choices.")

    message = choices[0].get("message")
    if not isinstance(message, dict):
        raise ValueError("OpenRouter response did not include a message payload.")

    content = message.get("content")
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and isinstance(item.get("text"), str):
                parts.append(item["text"])
        joined = "".join(parts).strip()
        if joined:
            return joined

    raise ValueError("OpenRouter response did not include textual content.")


def validate_enrichment_payload(payload: Any, expected_count: int) -> tuple[EnrichmentItem, ...]:
    if not isinstance(payload, dict):
        raise ValueError("Enrichment payload must be an object.")

    items = payload.get("items")
    if not isinstance(items, list):
        raise ValueError("Enrichment payload must include an items array.")
    if len(items) != expected_count:
        raise ValueError(
            f"Enrichment payload returned {len(items)} items, expected {expected_count}."
        )

    parsed_items: list[EnrichmentItem] = []
    seen_indexes: set[int] = set()
    for raw_item in items:
        if not isinstance(raw_item, dict):
            raise ValueError("Enrichment items must be objects.")

        source_index = raw_item.get("sourceIndex")
        german = raw_item.get("german")
        english = raw_item.get("english")
        notes = raw_item.get("notes")
        fill_blank = raw_item.get("fillBlank")

        if not isinstance(source_index, int) or source_index < 0 or source_index >= expected_count:
            raise ValueError(f"Invalid sourceIndex in enrichment payload: {source_index!r}.")
        if source_index in seen_indexes:
            raise ValueError(f"Duplicate sourceIndex in enrichment payload: {source_index}.")
        seen_indexes.add(source_index)

        if not isinstance(german, str) or not german.strip():
            raise ValueError(f"Item {source_index}: german must be a non-empty string.")
        if not isinstance(english, str) or not english.strip():
            raise ValueError(f"Item {source_index}: english must be a non-empty string.")
        if not isinstance(notes, str):
            raise ValueError(f"Item {source_index}: notes must be a string.")
        if not isinstance(fill_blank, str) or not fill_blank.strip():
            raise ValueError(f"Item {source_index}: fillBlank must be a non-empty string.")

        parsed_items.append(
            EnrichmentItem(
                source_index=source_index,
                german=german.strip(),
                english=english.strip(),
                notes=notes.strip(),
                fill_blank=fill_blank.strip(),
            )
        )

    parsed_items.sort(key=lambda item: item.source_index)
    return tuple(parsed_items)


def build_enrichment_updates(
    candidates: list[EnrichmentCandidate],
    items: tuple[EnrichmentItem, ...],
) -> tuple[EnrichmentUpdate, ...]:
    updates: list[EnrichmentUpdate] = []
    for item in items:
        candidate = candidates[item.source_index]
        if item.german != candidate.german:
            raise ValueError(
                f"Enrichment item {item.source_index} returned a different German sentence."
            )
        updates.append(
            EnrichmentUpdate(
                note_id=candidate.note_id,
                german=candidate.german,
                english=item.english,
                notes=item.notes,
                fill_blank=item.fill_blank,
            )
        )
    return tuple(updates)


def apply_enrichment_updates(col, updates: tuple[EnrichmentUpdate, ...], total_candidates: int) -> ApplyEnrichmentResult:
    updated_count = 0
    skipped_count = 0
    target_deck_id = col.decks.id(TARGET_DECK_NAME)
    latest_changes = None

    for update in updates:
        note = col.get_note(update.note_id)
        if note is None:
            skipped_count += 1
            continue

        if str(note["English"]).strip():
            skipped_count += 1
            continue

        note["German"] = update.german
        note["English"] = update.english
        note["Notes"] = update.notes
        note["FillBlank"] = update.fill_blank
        latest_changes = _merge_op_changes(latest_changes, col.update_note(note))
        latest_changes = _merge_op_changes(
            latest_changes,
            _move_note_cards_to_deck(col, note, target_deck_id),
        )
        updated_count += 1

    return ApplyEnrichmentResult(
        changes=latest_changes or _new_empty_changes(),
        updated_count=updated_count,
        skipped_count=skipped_count,
        total_candidates=total_candidates,
    )


def _move_note_cards_to_deck(col, note, target_deck_id: int) -> Any:
    card_ids = _get_note_card_ids(note)
    if not card_ids:
        return None

    if hasattr(col, "set_deck"):
        return col.set_deck(card_ids, target_deck_id)

    for card_id in card_ids:
        card = col.get_card(card_id)
        card.did = target_deck_id
        col.update_card(card)
    return None


def _get_note_card_ids(note) -> list[int]:
    if hasattr(note, "card_ids"):
        return list(note.card_ids())
    if hasattr(note, "cards"):
        return [card.id for card in note.cards()]
    return []


def _merge_op_changes(current: Any, candidate: Any) -> Any:
    candidate_changes = _normalize_op_changes(candidate)
    if candidate_changes is None:
        return current

    if current is None:
        return candidate_changes

    merge_from = getattr(current, "MergeFrom", None)
    if callable(merge_from):
        try:
            merge_from(candidate_changes)
            return current
        except Exception:
            pass

    _merge_change_attrs(current, candidate_changes)
    return current


def _normalize_op_changes(candidate: Any) -> Any:
    if candidate is None:
        return None

    if hasattr(candidate, "changes"):
        nested = getattr(candidate, "changes")
        if nested is not None:
            return nested

    return candidate


def _merge_change_attrs(target: Any, source: Any) -> None:
    if isinstance(target, dict) and isinstance(source, dict):
        target.update(source)
        return

    for name, value in _iter_change_attrs(source):
        if not value:
            continue
        if isinstance(target, dict):
            target[name] = value
        else:
            setattr(target, name, value)


def _iter_change_attrs(source: Any) -> list[tuple[str, Any]]:
    if isinstance(source, dict):
        return list(source.items())

    raw_values = getattr(source, "__dict__", None)
    if isinstance(raw_values, dict):
        return list(raw_values.items())

    attrs: list[tuple[str, Any]] = []
    for name in dir(source):
        if name.startswith("_"):
            continue
        try:
            value = getattr(source, name)
        except Exception:
            continue
        if callable(value):
            continue
        attrs.append((name, value))
    return attrs


def _new_empty_changes() -> Any:
    try:
        from anki.collection import OpChanges
    except ImportError:
        return _FallbackChanges()
    return OpChanges()


class _FallbackChanges:
    pass


try:
    from aqt import mw
    from aqt.operations import CollectionOp, QueryOp
    from aqt.utils import showInfo, showWarning

    AQT_AVAILABLE = True
except ImportError:
    mw = None
    AQT_AVAILABLE = False


def start_enrichment() -> None:
    """Run Deutsch enrichment in the background."""
    if not AQT_AVAILABLE or mw is None or mw.col is None:
        raise RuntimeError("Foggy enrichment requires Anki.")

    try:
        runtime_config = validate_runtime_config(mw.addonManager.getConfig(__name__))
    except ValueError as error:
        showWarning(str(error))
        return

    QueryOp(
        parent=mw,
        op=lambda col: enrich_temporary_deck(col, runtime_config),
        success=lambda result: _on_enrichment_query_success(result),
    ).with_progress().failure(_on_enrichment_failure).run_in_background()


def _on_enrichment_query_success(result: EnrichmentQueryResult) -> None:
    if not AQT_AVAILABLE or mw is None:
        return

    if result.total_candidates == 0:
        showInfo("No Foggy Translate notes in Deutsch Temporary are waiting for enrichment.")
        return

    if not result.updates:
        showInfo("No enrichments were returned by OpenRouter.")
        return

    CollectionOp(
        parent=mw,
        op=lambda col: apply_enrichment_updates(col, result.updates, result.total_candidates),
    ).success(_on_apply_enrichment_success).failure(_on_enrichment_failure).run_in_background()


def _on_apply_enrichment_success(result: ApplyEnrichmentResult) -> None:
    showInfo(
        "Deutsch enrichment complete.\n"
        f"Candidates: {result.total_candidates}\n"
        f"Updated: {result.updated_count}\n"
        f"Skipped: {result.skipped_count}"
    )


def _on_enrichment_failure(error: Exception) -> None:
    showWarning(f"Deutsch enrichment failed.\n{error}")
