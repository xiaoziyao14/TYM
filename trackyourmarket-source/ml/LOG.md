# TrackYourMarket ML — Change Log

> Append-only. Never edit old entries. Newest entries at the bottom.
> Each entry: date, one-line summary, bullets on what changed, linked files.

---

## 2026-03-08

**Changed:** Established two-model architecture and classification taxonomy

- Decided to separate news classification (FinBERT) from relevance scoring (XGBoost)
- Designed 7-category multi-label taxonomy: Company Operations, Earnings, Analyst Sentiment, Macro & Policy, Industry & Sector, Market Structure, Broad Market Commentary
- Decided on multi-label classification (articles can have multiple tags)
- Created: `ml/docs/decisions/ADR-001-two-model-architecture.md`
- Created: `ml/docs/decisions/ADR-002-finbert-classifier.md`
- Conversation: `ml/conversations/2026-03-08-taxonomy-and-architecture.md`

---

## 2026-03-08 (later)

**Changed:** Designed relevance scoring factor framework and model strategy

- Defined 4 factor groups with 18 total features
- Designed 3-layer scoring architecture: Base Importance × Personal Multiplier + Context Adjustment
- Decided on XGBoost with pairwise ranking (lambdarank) over pointwise regression
- Decided on safety floor mechanism to prevent filter bubbles
- Created: `ml/docs/decisions/ADR-003-xgboost-relevance.md`
- Created: `ml/docs/decisions/ADR-004-pairwise-ranking.md`
- Conversation: `ml/conversations/2026-03-08-relevance-framework.md`

---

## 2026-03-08 (later)

**Changed:** Defined implementation roadmap and data strategy

- Established 5-phase implementation plan (LLM bootstrap → FinBERT → Instrumentation → XGBoost → Iterate)
- Decided to bootstrap training labels using LLM (Gemini 2.5 Flash) before human review
- Identified data sources: internal DB, Reuters Corpus, Financial PhraseBank, synthetic generation
- Created: `ml/docs/ML-System-Design.docx` (full technical design document)
- Created: `ml/docs/decisions/ADR-005-llm-bootstrap-labels.md`
- Conversation: `ml/conversations/2026-03-08-data-and-implementation.md`

---

## 2026-03-08 (later)

**Changed:** Set up project tracking system

- Created `ml/` directory in repo for all ML work
- Created `ml/CURRENT.md` (project snapshot), `ml/LOG.md` (this file)
- Created `ml/conversations/` for saving discussion notes
- Created `ml/docs/decisions/` for architecture decision records
- Updated: `.gitignore` (added ML data exclusions)
- Updated: `ml/CURRENT.md`
