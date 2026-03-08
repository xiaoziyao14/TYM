# 2026-03-08 — Architecture, Taxonomy, Relevance Framework, and Data Strategy

## Context

First major design discussion for the ML upgrade to TrackYourMarket's news scoring system. The current system uses keyword matching in `newsService.ts` (`detectEventType` + `calculateRelevanceIndex`) which is limited to single-label, no personalization, and no learning.

## Key Decisions

### Two-Model Architecture
- Separate classifier from relevance scorer (rather than one end-to-end model)
- Classifier runs at ingestion → labels become features for relevance model
- Allows independent improvement and incremental deployment

### News Classification Taxonomy (7 categories, multi-label)
1. Company Operations & Strategy (exec changes, M&A, products, legal, workforce)
2. Earnings & Financial Reports (results, guidance, pre-announcements)
3. Analyst & Market Sentiment (upgrades, price targets, insider trading)
4. Macro & Policy (central bank, fiscal, trade/tariffs, employment data)
5. Industry & Sector (trends, supply chain, commodities, conferences)
6. Market Structure & Technical (index rebalancing, splits, IPOs, options)
7. Broad Market Commentary (outlook, roundups, cross-asset)

Multi-label is essential — articles frequently span multiple categories.

### Classifier: FinBERT (adapted, not built from scratch)
- Base model: `ProsusAI/finbert` (or `yiyanghkust/finbert-tone` — test both)
- Modification: replace softmax head with multi-label sigmoid head
- Training: 300–500 gold labels per category, bootstrapped via LLM

### Relevance Model: XGBoost (built from scratch, not adapted)
- Gradient-boosted decision trees with pairwise ranking objective
- 18 features across 4 groups: News Characteristics, User–News Relationship, Market Context, Social/Behavioral
- 3-layer scoring: Base (cached) × Personal Multiplier (per-user) + Context Adjustment
- Safety floor: watchlist stocks never drop below minimum relevance

### Data Strategy
- Phase 1: LLM (Gemini 2.5 Flash) classifies existing DB → silver labels
- Phase 2: Human reviews 500+ → gold labels
- Supplement with Reuters Corpus, Financial PhraseBank, synthetic generation (≤30%)
- Frontend instrumentation needed for relevance model training data (impressions, clicks, dwell time)

### Implementation Sequence
- Phase 1 (Wk 1–2): LLM bootstrap
- Phase 2 (Wk 3–4): Fine-tune FinBERT
- Phase 3 (Wk 3–4): Instrument frontend
- Phase 4 (Wk 5–6): Train XGBoost
- Phase 5 (Wk 7+): Iterate

## Open Questions Raised
- FinBERT-base vs FinBERT-tone: needs head-to-head test
- Category 6 may be underrepresented in training data
- Category 5/7 boundary needs clearer rules
- Per-category confidence thresholds (default 0.5 may not be optimal)

## Files Created/Updated
- `ml/docs/ML-System-Design.docx` — full technical design document
- `ml/docs/decisions/ADR-001` through `ADR-005`
- `ml/CURRENT.md`, `ml/LOG.md`, `ml/README.md`
