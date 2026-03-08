# ADR-002: Adapt FinBERT as the Base Model for News Classification

**Date:** 2026-03-08
**Status:** Accepted

## Context

The news classification model needs a base architecture. Options ranged from training from scratch to using various pretrained models.

## Decision

Fine-tune **FinBERT** (`ProsusAI/finbert` on HuggingFace) for multi-label financial news classification. Replace FinBERT's single-output softmax head with a multi-label sigmoid head (7 independent outputs, one per category).

Evaluate `yiyanghkust/finbert-tone` as an alternative during experimentation — it was pretrained on financial news headlines rather than SEC filings, which may align better with our RSS input data.

## Alternatives Considered

- **Train from scratch**: Reinventing the wheel. Financial NLP has strong pretrained models available. Would require far more training data.
- **General-purpose BERT**: Would work but requires more fine-tuning data to bridge the domain gap. FinBERT already understands financial terminology.
- **LLM-based classification (Gemini 2.5 Flash)**: Used as a bootstrapping tool for generating silver labels, but too expensive and slow for production inference on every article at 15-minute intervals.

## Consequences

- **Positive:** FinBERT's financial domain pretraining dramatically reduces the amount of fine-tuning data needed (300–500 per category vs. thousands).
- **Positive:** Runs locally in milliseconds at zero marginal cost, replacing the LLM-based approach.
- **Negative:** Requires a labeled training dataset (bootstrapped via LLM + human review, see ADR-005).
- **Open:** FinBERT-base vs. FinBERT-tone comparison still needs experimentation.
