# ADR-004: Use Pairwise Ranking Objective Over Pointwise Regression

**Date:** 2026-03-08
**Status:** Accepted

## Context

The relevance model can be trained with different objectives: predict an absolute score (pointwise) or predict which of two articles a user would prefer (pairwise).

## Decision

Use a **pairwise ranking objective** (LightGBM's lambdarank or XGBoost's rank objective). Training pairs are derived from user click behavior: if a user clicked article A but not article B when both were visible, then A > B.

## Alternatives Considered

- **Pointwise regression**: Predict a relevance score directly (0–100). Simpler to implement but optimizes for absolute score accuracy rather than ordering quality. Since we care about ranking (which articles appear first), pairwise is a better fit.

## Consequences

- **Positive:** Directly optimizes for the ordering that matters to users, not for predicting an abstract number.
- **Positive:** Training pairs are naturally derived from implicit feedback (impressions + clicks), which is easier to collect than explicit ratings.
- **Negative:** Requires instrumented frontend to track impressions (which articles were shown) alongside clicks. This is a prerequisite for Phase 3.
