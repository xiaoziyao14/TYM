# TrackYourMarket ML — Current State

**Last updated:** 2026-03-16
**Current phase:** Phase 1 — Silver Labeling In Progress

## What's Done

- Two-model architecture decided: news classifier (FinBERT-based) + relevance scorer (XGBoost)
- 7-category multi-label news taxonomy designed
- Full relevance scoring factor framework designed (4 groups, 18 features, 3-layer architecture)
- Technical design document completed → `ml/docs/ML-System-Design.docx`
- File management system established (CURRENT.md + LOG.md + conversations/)
- News collector built: 72 stocks across all 11 GICS sectors + 3 general/macro feeds
- Manus export (170 articles) merged with newly collected articles
- Silver labeling pipeline built and tested using Claude Sonnet API
- First silver labeling run completed: **453 articles labeled**

## What's In Progress

- News collector running (daemon mode, 15-min intervals) — building toward 2,000+ articles
- Silver labels accumulating — re-run labeler after each collection batch

## What's Next

1. Keep collecting articles (target: 2,000+ unique articles)
2. Re-run silver labeler periodically on newly collected articles
3. Spot-check ~50 silver labels for accuracy (human review)
4. Begin converting reviewed silver labels to gold labels
5. Once 2,000+ gold labels ready, start FinBERT fine-tuning

## Open Questions

- FinBERT-base vs. FinBERT-tone: still needs head-to-head test
- `market_structure` (38) and `macro_policy` (35) are underrepresented — may need targeted collection or synthetic data
- `analyst_sentiment` (269) is heavily overrepresented — check if labeling is too aggressive on this category
- Category 5/7 boundary (`industry_sector` vs `broad_commentary`) needs review during gold labeling

## Key Numbers

| Metric | Value |
|--------|-------|
| Total articles collected | 453 |
| Silver-labeled articles | 453 |
| Gold-labeled articles | 0 (not started) |
| Stocks covered | 72 (across 11 GICS sectors) |
| Classifier accuracy | N/A (no model yet) |
| Relevance model NDCG | N/A (no model yet) |
| API cost for labeling | ~$0.50 (453 articles via Claude Sonnet) |

## Category Distribution (Silver Labels)

| Category | Count |
|----------|-------|
| analyst_sentiment | 269 |
| broad_commentary | 195 |
| company_operations | 108 |
| industry_sector | 56 |
| earnings | 50 |
| market_structure | 38 |
| macro_policy | 35 |
