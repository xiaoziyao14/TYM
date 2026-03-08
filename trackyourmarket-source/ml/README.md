# ml/ — Machine Learning Subsystem

This directory contains everything related to TrackYourMarket's news classification and relevance scoring models.

## Quick Orientation

| Need to know... | Look here |
|-----------------|-----------|
| Current project state | [`CURRENT.md`](CURRENT.md) |
| What changed recently | [`LOG.md`](LOG.md) (read from bottom) |
| Why a decision was made | [`docs/decisions/`](docs/decisions/) |
| Full reasoning from discussions | [`conversations/`](conversations/) |
| Technical design details | [`docs/ML-System-Design.docx`](docs/ML-System-Design.docx) |

## Directory Structure

```
ml/
├── CURRENT.md              ← Project snapshot (overwrite each update)
├── LOG.md                  ← Change timeline (append-only)
├── README.md               ← You are here
│
├── conversations/          ← Saved discussion notes (raw reference)
│   └── YYYY-MM-DD-topic.md
│
├── docs/                   ← Polished design documents
│   ├── ML-System-Design.docx
│   ├── decisions/          ← Architecture Decision Records
│   │   ├── ADR-001-*.md
│   │   └── ...
│   └── research/           ← Paper notes, benchmarks, competitor analysis
│
├── src/                    ← Production model code (when development begins)
│   ├── classifier/         ← FinBERT news classification
│   ├── relevance/          ← XGBoost relevance scoring
│   └── pipeline/           ← Data processing & integration
│
├── data/                   ← Datasets (see .gitignore — large files excluded)
│   ├── labeled/            ← Human-reviewed gold labels
│   ├── silver/             ← LLM-generated labels (before review)
│   └── splits/             ← Train/val/test splits (versioned)
│
├── experiments/            ← Model training runs
│   ├── classifier/
│   └── relevance/
│
└── notebooks/              ← Exploratory analysis (Jupyter)
```

## How the Tracking System Works

**After every conversation or work session:**

1. Save discussion notes → `conversations/YYYY-MM-DD-topic.md`
2. Update affected project files (code, docs, data, etc.)
3. Append entry to `LOG.md` (date + summary + files changed)
4. If the project state shifted, overwrite `CURRENT.md`

**Tracing how an idea evolved:**

`CURRENT.md` (where are we now?) → `LOG.md` (when did it change?) → `conversations/` (why?)
