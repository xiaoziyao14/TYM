# 2026-03-16 — News Collection Pipeline and Silver Labeling

## Context

Continued from the design phase. Today's goal was to start Phase 1: build the data collection pipeline and begin silver labeling articles for FinBERT training.

## Key Decisions

### Infrastructure: Local Python collector instead of Manus
- Manus won't share .env credentials (DATABASE_URL, API keys are platform-managed)
- The Forge API (LLM, data) only works within Manus hosting environment
- Decided to build independent local pipeline instead of depending on Manus
- Existing 170 articles exported as JSON from Manus database

### Diversified stock coverage for unbiased training
- Expanded from 7 tech stocks to 72 stocks across all 11 GICS sectors
- ~7-8 stocks per sector chosen for high news coverage and variety
- Added 3 general feeds: market overview, Fed/economy, earnings season
- Rationale: training only on tech stock news would bias the classifier

### Google News RSS as data source
- Same method Manus used (newsScheduler.ts)
- Free, no API key needed, aggregates from major outlets (WSJ, CNBC, Reuters, etc.)
- Returns ~100 articles per query, collector takes top 3 per stock per run
- Limitation: only recent articles (few weeks back), not historical

### Silver labeling via Claude Sonnet API
- Set up Anthropic API key for programmatic labeling
- Batches of 20 articles, ~$0.50 per 453 articles
- Multi-label classification with confidence scores
- Results saved to ml/data/silver/silver_labels.json

## Results

- 453 articles collected and labeled
- Category distribution shows analyst_sentiment heavily dominant (269)
- market_structure (38) and macro_policy (35) underrepresented as predicted
- All scripts save progress incrementally (safe to interrupt and resume)

## Open Questions

- Is analyst_sentiment overrepresented because the LLM is too aggressive with that label, or because financial news genuinely skews that way?
- Need to spot-check silver labels for accuracy before scaling up
- Historical news: decided to defer (not needed for classification model training, titles are structurally similar across time periods)
- Cost of scaling: labeling 2,000+ articles would cost ~$2-3, negligible

## Files Created
- `ml/src/pipeline/collect_news.py` — standalone news collector (Python)
- `ml/src/pipeline/merge_manus_export.py` — merge Manus export with collector data
- `ml/src/pipeline/generate_silver_labels.py` — silver labeling via Claude API
- `ml/data/raw/collected_articles.json` — 453 articles (local only, gitignored)
- `ml/data/raw/news_articles_export.json` — Manus export (local only, gitignored)
- `ml/data/silver/silver_labels.json` — 453 silver labels (local only, gitignored)

## Files to Update
- `ml/CURRENT.md` — update with current progress
- `ml/LOG.md` — append today's entry
