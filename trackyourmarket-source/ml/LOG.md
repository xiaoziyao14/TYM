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

---

## 2026-03-16

**Changed:** Built news collection pipeline and completed first silver labeling run

- Built standalone Python news collector covering 72 stocks across all 11 GICS sectors
- Stocks selected: ~7-8 per sector (Technology, Healthcare, Financials, Consumer Discretionary, Consumer Staples, Energy, Industrials, Materials, Real Estate, Utilities, Communication Services) plus general market/macro/earnings feeds
- Collector uses Google News RSS (same method as Manus newsScheduler.ts, but 10x more stocks)
- Merged 170 Manus export articles with 283 newly collected articles → 453 total
- Set up Anthropic API key for silver labeling
- Ran silver labeling script: all 453 articles classified into 7-category taxonomy using Claude Sonnet
- Category distribution: analyst_sentiment (269), broad_commentary (195), company_operations (108), industry_sector (56), earnings (50), market_structure (38), macro_policy (35)
- Created: `ml/src/pipeline/collect_news.py` (news collector)
- Created: `ml/src/pipeline/merge_manus_export.py` (merge utility)
- Created: `ml/src/pipeline/generate_silver_labels.py` (silver labeler)
- Data saved: `ml/data/raw/collected_articles.json` (453 articles, local only)
- Data saved: `ml/data/silver/silver_labels.json` (453 labeled, local only)
- Updated: `ml/CURRENT.md`
- Conversation: `ml/conversations/2026-03-16-collection-and-labeling.md`
