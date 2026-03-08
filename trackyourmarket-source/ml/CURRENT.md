# TrackYourMarket ML — Current State

**Last updated:** 2026-03-08
**Current phase:** Phase 0 — Planning & Design Complete, Ready to Begin Phase 1

## What's Done

- Two-model architecture decided: news classifier (FinBERT-based) + relevance scorer (XGBoost)
- 7-category multi-label news taxonomy designed
- Full relevance scoring factor framework designed (4 groups, 18 features, 3-layer architecture)
- Technical design document completed → `ml/docs/ML-System-Design.docx`
- File management system established (this file + LOG.md + conversations/)

## What's In Progress

- Nothing yet — ready to begin Phase 1

## What's Next

1. Write the LLM classification prompt for Gemini 2.5 Flash (silver labeling)
2. Run classifier on existing article DB (~2,000+ articles from Google News RSS)
3. Begin manual review of silver labels (target: 500 gold-labeled examples)
4. Evaluate FinBERT-base vs. FinBERT-tone on a small test set

## Open Questions

- FinBERT-base (`ProsusAI/finbert`) vs. FinBERT-tone (`yiyanghkust/finbert-tone`): need to test both on our news headlines to see which handles RSS-style text better
- Category 6 (Market Structure & Technical) may be underrepresented in training data — may need heavier synthetic data generation
- Category 7 (Broad Market Commentary) boundary with Category 5 (Industry & Sector) needs clear rules to reduce classifier confusion
- Decision threshold for multi-label: default 0.5, but may need per-category tuning

## Key Numbers

| Metric | Value |
|--------|-------|
| Articles in DB | ~2,000+ (accumulating every 15 min) |
| Gold-labeled examples | 0 (not started) |
| Silver-labeled examples | 0 (not started) |
| Classifier accuracy | N/A (no model yet) |
| Relevance model NDCG | N/A (no model yet) |
| Current scoring method | Keyword heuristic (`newsService.ts`) |
