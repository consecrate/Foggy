# Foggy Translate — Duolingo-style Language Learning for Anki

One sentence mined via asbplayer → three exercise cards (translate, listen, fill-in-blank), auto-enriched by LLM via OpenRouter.

## User Review Required

> [!IMPORTANT]
> **OpenRouter API key**: Stored in Anki addon config (`meta.json`). Is that acceptable?

> [!IMPORTANT]
> **Enrichment trigger**: "🇩🇪 Enrich Deutsch" menu action: finds cards in "Deutsch Temporary" with empty `German` field → calls OpenRouter → fills fields → moves to "Deutsch" deck.

---

## Architecture: One Note → Three Cards

A single `Foggy Translate` note type with **three card templates**. Each template renders a different exercise mode. Anki generates all three cards automatically when you create one note.

### Note Fields

| Field | Purpose | Filled by |
|---|---|---|
| `English` | Source sentence | asbplayer |
| `German` | Correct translation | LLM |
| `Audio` | Audio clip | asbplayer |
| `Context` | Screenshot / subtitle context | asbplayer |
| `Hints` | JSON: `[{"word":"Laden","hint":"store"}]` | LLM |
| `Notes` | Grammar explanation | LLM |
| `FillBlank` | German with `___` gaps | LLM |

### Three Card Templates

| Template | Front shows | User task |
|---|---|---|
| **Translate** | English sentence + audio button | Type full German translation |
| **Listen** | Audio button only (no text) | Type what you hear in German |
| **Fill Blank** | English + German with `___` | Type the missing word(s) |

Each card has its own SRS schedule. Template name is used by [render.py](file:///Users/thientrung/Library/Application%20Support/Anki2/addons21/Foggy/reviewer/render.py) to determine which exercise UI to serve.

---

## Proposed Changes

### Note Type

#### [MODIFY] [models.py](file:///Users/thientrung/Library/Application%20Support/Anki2/addons21/Foggy/models.py)

- Add `TRANSLATE_NOTETYPE_NAME = "Foggy Translate"`
- Extend [NoteTypeSpec](file:///Users/thientrung/Library/Application%20Support/Anki2/addons21/Foggy/models.py#14-20) to support multiple templates (currently only supports one)
- Define `TRANSLATE_SPEC` with 8 fields and 3 card templates
- Register in `NOTE_TYPE_SPECS`

---

### Batch Enrichment via OpenRouter

#### [NEW] [enricher.py](file:///Users/thientrung/Library/Application%20Support/Anki2/addons21/Foggy/enricher.py)

- `enrich_temporary_deck(col)` — finds notes in "Deutsch Temporary" with empty `German` field
- Batches sentences (5–10 per API call) to OpenRouter
- LLM generates: `german`, `notes`, `fillBlank`
- Fills fields, moves cards to "Deutsch" deck
- Uses `urllib.request` (no external deps, consistent with existing [render.py](file:///Users/thientrung/Library/Application%20Support/Anki2/addons21/Foggy/reviewer/render.py))

#### [NEW] [config.json](file:///Users/thientrung/Library/Application%20Support/Anki2/addons21/Foggy/config.json)

```json
{
  "openrouter_api_key": "",
  "openrouter_model": "meta-llama/llama-4-maverick:free"
}
```

#### [MODIFY] [\_\_init\_\_.py](file:///Users/thientrung/Library/Application%20Support/Anki2/addons21/Foggy/__init__.py)

Add "🇩🇪 Enrich Deutsch" menu action with progress dialog.

---

### Review UI

#### [NEW] [translate.js](file:///Users/thientrung/Library/Application%20Support/Anki2/addons21/Foggy/web/src/translate.js)

All three modes in one module, selected by `cardData.templateName`:

- **Translate**: English text + optional 🔊 button → text input → token-level diff on check
- **Listen**: Large 🔊 button only → text input → reveals English after check
- **Fill Blank**: Inline `___` input within German sentence → word comparison

Shared Duolingo UX across all modes:
- Bottom-anchored green/red feedback bar with slide-up animation
- Sound effects (tiny base64 audio for correct/incorrect)
- Enter to check, Enter again to continue
- Auto-focus on input
- Token-level diff highlighting (green = correct, red = wrong/missing)
- Progressive hint reveal (tap 💡)
- Case-insensitive, punctuation-normalized matching against `German`

#### [MODIFY] [index.js](file:///Users/thientrung/Library/Application%20Support/Anki2/addons21/Foggy/web/src/index.js)

Route `kind === "translate"` → `initTranslateCard(cardData)`.

#### [MODIFY] [render.py](file:///Users/thientrung/Library/Application%20Support/Anki2/addons21/Foggy/reviewer/render.py)

- Add `TRANSLATE_NOTETYPE_NAME` to [_get_note_kind](file:///Users/thientrung/Library/Application%20Support/Anki2/addons21/Foggy/reviewer/render.py#802-810)
- Add `"translate"` branch in [_build_card_data](file:///Users/thientrung/Library/Application%20Support/Anki2/addons21/Foggy/reviewer/render.py#753-789) that includes all translate fields + `templateName` (to differentiate the three cards)

#### Template HTML & CSS

Add translate view markup to the shared HTML template and `.foggy-translate-*` styles to the stylesheet.

---

## Verification Plan

### Automated Tests

#### [NEW] [test_enricher.py](file:///Users/thientrung/Library/Application%20Support/Anki2/addons21/Foggy/tests/test_enricher.py)

- Prompt construction with batched sentences
- Response parsing and field population
- Error handling (API failures, malformed LLM output)
- Skipping already-enriched notes

```bash
cd "/Users/thientrung/Library/Application Support/Anki2/addons21/Foggy/tests"
python -m pytest test_enricher.py -v
```

### Manual Verification

1. **Note type**: Initialize → verify "Foggy Translate" exists with 3 card templates
2. **Card creation**: Create note with English+German → verify 3 cards generated
3. **Translate UI**: Review Card 1 → type translation → verify diff feedback
4. **Listen UI**: Review Card 2 → play audio → type answer → verify
5. **Fill-blank UI**: Review Card 3 → type missing word → verify
6. **Enrichment**: Create cards in "Deutsch Temporary" with only English → run Enrich → verify all fields populated and cards moved
