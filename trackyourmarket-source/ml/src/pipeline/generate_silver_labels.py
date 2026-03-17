"""
TrackYourMarket — Silver Label Generator
Classifies news articles using the 7-category taxonomy via LLM.

This script reads collected_articles.json, classifies each unlabeled article,
and saves results to ml/data/silver/silver_labels.json

Usage:
    python3 ml/src/pipeline/generate_silver_labels.py

You need an API key for one of:
  - Anthropic Claude: export ANTHROPIC_API_KEY=sk-ant-...
  - OpenAI GPT:       export OPENAI_API_KEY=sk-...

The script auto-detects which key is available.
"""

import json
import os
import sys
import time
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import URLError

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

CATEGORIES = {
    "company_operations": "Company-specific news: executive/board changes, product launches/discontinuations, M&A activity, partnerships and contracts, legal/regulatory actions, workforce changes (layoffs, hiring)",
    "earnings": "Earnings and financial reports: quarterly/annual results, guidance revisions, pre-announcements, restatements, analyst reactions to earnings",
    "analyst_sentiment": "Analyst and market sentiment: upgrades/downgrades, price target changes, initiation of coverage, short interest reports, insider trading disclosures",
    "macro_policy": "Macroeconomic and policy: central bank decisions/commentary, fiscal policy, trade policy/tariffs/sanctions, employment/inflation data, geopolitical events affecting markets",
    "industry_sector": "Industry and sector: sector-wide trends, supply chain disruptions, commodity price shifts, regulatory changes for an industry, major conferences (CES, WWDC)",
    "market_structure": "Market structure and technical: index rebalancing (S&P 500 adds/removes), stock splits, dividends, IPOs/SPACs, options activity, trading halts",
    "broad_commentary": "Broad market commentary: general market outlook, 'markets today' roundups, year-end predictions, cross-asset commentary",
}

SYSTEM_PROMPT = """You are a financial news classifier. For each article headline, assign one or more category labels from this taxonomy:

1. company_operations — Company-specific: exec changes, products, M&A, partnerships, legal, workforce
2. earnings — Earnings/financial reports: quarterly results, guidance, pre-announcements
3. analyst_sentiment — Analyst activity: upgrades/downgrades, price targets, insider trading
4. macro_policy — Macro/policy: Fed decisions, fiscal policy, tariffs, employment data, geopolitics
5. industry_sector — Industry/sector: sector trends, supply chain, commodities, industry regulation, conferences
6. market_structure — Market structure: index rebalancing, stock splits, dividends, IPOs, options
7. broad_commentary — Broad commentary: market outlook, roundups, predictions, general analysis

Rules:
- An article can have MULTIPLE labels (e.g., both "earnings" and "analyst_sentiment")
- Assign a confidence score (0.0 to 1.0) for each label
- Only include labels with confidence >= 0.3
- Respond in valid JSON only, no other text"""

USER_PROMPT_TEMPLATE = """Classify these {count} articles. Return a JSON array where each element has "id" (the article id) and "labels" (array of {{"category": "...", "confidence": 0.0-1.0}}).

Articles:
{articles_text}

Return ONLY valid JSON, no explanation."""

# ═══════════════════════════════════════════════════════════════
# LLM API CALLS
# ═══════════════════════════════════════════════════════════════

def detect_api():
    """Detect which LLM API is available."""
    if os.environ.get("ANTHROPIC_API_KEY"):
        return "anthropic"
    if os.environ.get("OPENAI_API_KEY"):
        return "openai"
    return None


def call_anthropic(system_prompt: str, user_prompt: str) -> str:
    """Call Anthropic Claude API."""
    api_key = os.environ["ANTHROPIC_API_KEY"]
    payload = json.dumps({
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 4096,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}],
    }).encode("utf-8")

    req = Request(
        "https://api.anthropic.com/v1/messages",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )

    with urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read().decode("utf-8"))

    return result["content"][0]["text"]


def call_openai(system_prompt: str, user_prompt: str) -> str:
    """Call OpenAI API (works with GPT-4, GPT-5, etc.)."""
    api_key = os.environ["OPENAI_API_KEY"]
    payload = json.dumps({
        "model": "gpt-4o",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "max_tokens": 4096,
        "temperature": 0.1,
    }).encode("utf-8")

    req = Request(
        "https://api.openai.com/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    with urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read().decode("utf-8"))

    return result["choices"][0]["message"]["content"]


def classify_batch(articles: list[dict], api: str) -> list[dict]:
    """Classify a batch of articles using the selected LLM API."""
    # Build the article text for the prompt
    articles_text = ""
    for a in articles:
        articles_text += f'- id: "{a["id"]}", title: "{a["title"]}", source: "{a.get("source", "Unknown")}"\n'

    user_prompt = USER_PROMPT_TEMPLATE.format(
        count=len(articles),
        articles_text=articles_text.strip(),
    )

    # Call the API
    if api == "anthropic":
        response_text = call_anthropic(SYSTEM_PROMPT, user_prompt)
    else:
        response_text = call_openai(SYSTEM_PROMPT, user_prompt)

    # Parse JSON from response (handle markdown code blocks)
    response_text = response_text.strip()
    if response_text.startswith("```"):
        lines = response_text.split("\n")
        response_text = "\n".join(lines[1:-1])

    try:
        results = json.loads(response_text)
        return results
    except json.JSONDecodeError as e:
        print(f"    [WARN] Failed to parse LLM response: {e}")
        print(f"    Response preview: {response_text[:200]}")
        return []

# ═══════════════════════════════════════════════════════════════
# MAIN LOGIC
# ═══════════════════════════════════════════════════════════════

def main():
    # Find project paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))
    raw_dir = os.path.join(project_root, "ml", "data", "raw")
    silver_dir = os.path.join(project_root, "ml", "data", "silver")
    os.makedirs(silver_dir, exist_ok=True)

    collected_path = os.path.join(raw_dir, "collected_articles.json")
    silver_path = os.path.join(silver_dir, "silver_labels.json")

    # Check data file exists
    if not os.path.exists(collected_path):
        print(f"ERROR: No data file at {collected_path}")
        print("Run collect_news.py first.")
        sys.exit(1)

    # Detect API
    api = detect_api()
    if not api:
        print("ERROR: No API key found.")
        print("Set one of these environment variables:")
        print("  export ANTHROPIC_API_KEY=sk-ant-...")
        print("  export OPENAI_API_KEY=sk-...")
        sys.exit(1)

    print(f"Using API: {api}")

    # Load articles
    with open(collected_path, "r", encoding="utf-8") as f:
        collected_data = json.load(f)
    all_articles = collected_data["articles"]

    # Load existing silver labels (to skip already-labeled articles)
    existing_labels = {}
    if os.path.exists(silver_path):
        with open(silver_path, "r", encoding="utf-8") as f:
            silver_data = json.load(f)
        for item in silver_data.get("labels", []):
            existing_labels[str(item["id"])] = item
        print(f"Found {len(existing_labels)} existing silver labels")

    # Filter to unlabeled articles
    unlabeled = [a for a in all_articles if str(a["id"]) not in existing_labels]
    print(f"Total articles: {len(all_articles)}")
    print(f"Already labeled: {len(existing_labels)}")
    print(f"To label: {len(unlabeled)}")

    if not unlabeled:
        print("All articles already labeled!")
        return

    # Process in batches of 20
    BATCH_SIZE = 20
    batches = [unlabeled[i:i+BATCH_SIZE] for i in range(0, len(unlabeled), BATCH_SIZE)]
    all_labels = list(existing_labels.values())

    print(f"\nProcessing {len(batches)} batches of up to {BATCH_SIZE} articles each...\n")

    for batch_num, batch in enumerate(batches):
        print(f"  Batch {batch_num + 1}/{len(batches)} ({len(batch)} articles)...", end=" ", flush=True)

        try:
            results = classify_batch(batch, api)

            # Merge results
            batch_ids = {str(a["id"]) for a in batch}
            matched = 0
            for result in results:
                result_id = str(result.get("id", ""))
                if result_id in batch_ids:
                    # Add metadata
                    result["labeled_at"] = datetime.now(timezone.utc).isoformat()
                    result["labeled_by"] = f"llm-{api}"
                    result["status"] = "silver"  # not yet human-reviewed
                    all_labels.append(result)
                    existing_labels[result_id] = result
                    matched += 1

            print(f"labeled {matched}/{len(batch)}")

        except Exception as e:
            print(f"ERROR: {e}")

        # Save after each batch (so progress isn't lost if interrupted)
        silver_output = {
            "metadata": {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "api_used": api,
                "total_labeled": len(all_labels),
                "taxonomy_version": "v1",
                "categories": list(CATEGORIES.keys()),
            },
            "labels": all_labels,
        }
        with open(silver_path, "w", encoding="utf-8") as f:
            json.dump(silver_output, f, indent=2, ensure_ascii=False)

        # Rate limiting pause
        time.sleep(1)

    # Final summary
    print(f"\n{'='*60}")
    print(f"  Silver labeling complete!")
    print(f"  Total labeled: {len(all_labels)}")
    print(f"  Saved to: {silver_path}")
    print(f"{'='*60}")

    # Show category distribution
    from collections import Counter
    cat_counts = Counter()
    for item in all_labels:
        for label in item.get("labels", []):
            cat_counts[label["category"]] += 1

    print(f"\n  Category distribution:")
    for cat, count in cat_counts.most_common():
        bar = "█" * (count // 5)
        print(f"    {cat:<25} {count:>5}  {bar}")


if __name__ == "__main__":
    main()
