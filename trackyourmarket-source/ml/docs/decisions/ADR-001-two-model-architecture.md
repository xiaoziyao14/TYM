# ADR-001: Separate Classification and Relevance Into Two Independent Models

**Date:** 2026-03-08
**Status:** Accepted

## Context

TrackYourMarket needs to upgrade from keyword-based news scoring (`detectEventType` + `calculateRelevanceIndex` in `newsService.ts`) to a machine learning approach. The question was whether to build one end-to-end model or two separate models.

## Decision

Build two independent models in a pipeline:
1. **News Classification Model** — assigns category labels to each article (multi-label)
2. **Relevance Scoring Model** — produces a personalized 0–100 score per (article, user) pair

The classifier runs first at ingestion time, and its output labels become input features for the relevance model.

## Alternatives Considered

- **Single end-to-end model**: Would combine classification and scoring in one step. Rejected because it entangles two different problems (categorization vs. personalized ranking), making each harder to debug, improve, and retrain independently.
- **LLM-only approach**: Use the existing Gemini 2.5 Flash integration for both tasks at inference time. Rejected due to cost and latency at scale (dozens of articles every 15 minutes).

## Consequences

- **Positive:** Each model can be improved, retrained, and debugged independently. Classification labels become reusable features across the system (not just for scoring). Clearer failure modes.
- **Positive:** The classifier can be deployed first (Phase 2) while keeping the heuristic scorer, then the ML scorer deployed later (Phase 4). Incremental delivery.
- **Negative:** Two models to maintain instead of one. Slightly more complex infrastructure.
