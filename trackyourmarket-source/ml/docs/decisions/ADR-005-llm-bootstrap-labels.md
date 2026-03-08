# ADR-005: Bootstrap Training Labels Using LLM Before Human Review

**Date:** 2026-03-08
**Status:** Accepted

## Context

Fine-tuning FinBERT requires labeled training data (300–500 examples per category). Manually labeling thousands of articles from scratch is time-consuming.

## Decision

Use a two-stage labeling pipeline:
1. **Silver labels**: Run the existing Gemini 2.5 Flash integration (`invokeLLM` in `server/_core/llm.ts`) with a structured classification prompt on the article database to generate initial labels automatically.
2. **Gold labels**: Human reviews and corrects a subset (500+) of silver-labeled articles to create the final training set.

Supplement with public datasets (Reuters Corpus, Financial PhraseBank) and limited synthetic data generation (≤30% of total).

## Alternatives Considered

- **Manual labeling only**: Accurate but slow. Labeling 2,000+ articles from scratch would take days.
- **Using public datasets only**: Available datasets don't match our specific 7-category taxonomy. They can supplement but not replace project-specific labels.
- **Active learning loop**: Start with a small labeled set, train a weak model, use it to suggest labels for human review. Good approach but adds infrastructure complexity. Can be adopted later as an optimization.

## Consequences

- **Positive:** Generates thousands of initial labels in minutes using existing infrastructure. Human effort is focused on correction (faster than labeling from scratch).
- **Positive:** The LLM prompt serves double duty — it also immediately improves the production classification (replacing `detectEventType`) while the FinBERT model is being trained.
- **Negative:** Silver labels contain noise (~15–20% error rate expected). The human review step is essential.
