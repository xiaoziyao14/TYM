"""
Merge the Manus news_articles_export.json into collected_articles.json
Run once, from the trackyourmarket-source directory:

    python3 ml/src/pipeline/merge_manus_export.py
"""

import json
import os
import hashlib
from datetime import datetime, timezone

def make_url_hash(url: str) -> str:
    return hashlib.md5(url.encode()).hexdigest()[:12]

# Paths
base_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(base_dir, "..", "..", ".."))
raw_dir = os.path.join(project_root, "ml", "data", "raw")

manus_path = os.path.join(raw_dir, "news_articles_export.json")
collected_path = os.path.join(raw_dir, "collected_articles.json")

# Check files exist
if not os.path.exists(manus_path):
    print(f"ERROR: Manus export not found at {manus_path}")
    print("Make sure news_articles_export.json is in ml/data/raw/")
    exit(1)

if not os.path.exists(collected_path):
    print(f"ERROR: Collected articles not found at {collected_path}")
    print("Run collect_news.py first.")
    exit(1)

# Load both files
with open(manus_path, "r", encoding="utf-8") as f:
    manus_data = json.load(f)

with open(collected_path, "r", encoding="utf-8") as f:
    collected_data = json.load(f)

# Build set of existing titles and URLs for deduplication
existing_titles = set(a["title"].lower().strip() for a in collected_data["articles"])
existing_urls = set(collected_data.get("seenUrls", []))

# Merge Manus articles
added = 0
skipped = 0

for article in manus_data["articles"]:
    title_lower = article["title"].lower().strip()
    url_hash = make_url_hash(article.get("url", ""))

    # Skip duplicates
    if title_lower in existing_titles or url_hash in existing_urls:
        skipped += 1
        continue

    # Convert to collector format
    companies = article.get("companies", [])
    symbol = companies[0] if companies else "UNKNOWN"

    merged_article = {
        "id": f"manus-{article.get('id', added)}",
        "title": article["title"],
        "url": article.get("url", ""),
        "source": article.get("source", "Unknown"),
        "publishedAt": article.get("publishedAt", ""),
        "symbol": symbol,
        "sector": "Manus Import",
        "collectedAt": datetime.now(timezone.utc).isoformat(),
        "categories": None,
    }

    collected_data["articles"].append(merged_article)
    existing_titles.add(title_lower)
    existing_urls.add(url_hash)
    added += 1

# Update metadata
collected_data["seenUrls"] = list(existing_urls)
collected_data["metadata"]["totalArticles"] = len(collected_data["articles"])
collected_data["metadata"]["lastUpdated"] = datetime.now(timezone.utc).isoformat()

# Save
with open(collected_path, "w", encoding="utf-8") as f:
    json.dump(collected_data, f, indent=2, ensure_ascii=False)

print(f"\nMerge complete!")
print(f"  Added from Manus export: {added}")
print(f"  Duplicates skipped:      {skipped}")
print(f"  Total articles now:      {len(collected_data['articles'])}")
print(f"  Saved to: {collected_path}")
