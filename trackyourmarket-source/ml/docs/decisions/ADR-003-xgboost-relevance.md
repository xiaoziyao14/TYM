# ADR-003: Use XGBoost/LightGBM for Relevance Scoring

**Date:** 2026-03-08
**Status:** Accepted

## Context

The relevance model needs to produce a personalized score for each (article, user) pair. The input is structured tabular features (category labels, holding weights, source scores, volume ratios, etc.), not raw text.

## Decision

Use **XGBoost or LightGBM** with a gradient-boosted decision tree architecture. The model consumes ~20–30 structured features organized into 4 groups: News Characteristics, User–News Relationship, Market Context, and Social/Behavioral Signals.

Scoring uses a 3-layer architecture:
- Layer 1: Base Importance Score (0–100, user-independent, cached at ingestion)
- Layer 2: Personal Relevance Multiplier (0.2x–3.0x, per-user at query time)
- Layer 3: Contextual Adjustment (±bonus, periodic background updates)

Final score = `clamp(Base × Multiplier + Adjustment, 0, 100)`

## Alternatives Considered

- **Neural network / deep learning**: Overkill for tabular data. Tree models consistently outperform neural approaches on structured features and are far more interpretable.
- **Simple weighted heuristic (current system)**: The current `calculateRelevanceIndex` in `newsService.ts`. Cannot learn from data, no personalization, limited to keyword matching.
- **Collaborative filtering**: Requires a large user base. Not viable at current scale.

## Consequences

- **Positive:** Fast inference (microseconds), interpretable (feature importances), modest data requirements.
- **Positive:** 3-layer architecture allows incremental deployment and graceful degradation for non-logged-in users.
- **Negative:** Requires user interaction data for the personalization layer (solved by cold-start strategy with editorial dataset + heuristic teacher).
