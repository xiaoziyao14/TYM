"""
TrackYourMarket — Standalone News Collector
Fetches financial news from Google News RSS every 15 minutes.
Covers ~80 stocks across all 11 GICS sectors for unbiased training data.

Usage:
    python collect_news.py              # Run once
    python collect_news.py --daemon     # Run every 15 minutes continuously
    python collect_news.py --stats      # Show collection statistics

Output: articles are appended to ml/data/raw/collected_articles.json
"""

import json
import os
import sys
import time
import hashlib
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import URLError
from html import unescape
import re
import argparse

# ═══════════════════════════════════════════════════════════════
# DIVERSIFIED STOCK LIST — ~7-8 per GICS sector
# Chosen for: high news coverage, sector representation, mix of
# mega-cap and mid-cap to get variety in news types
# ═══════════════════════════════════════════════════════════════

STOCKS_BY_SECTOR = {
    "Technology": [
        ("AAPL", "Apple"),
        ("MSFT", "Microsoft"),
        ("NVDA", "Nvidia"),
        ("GOOGL", "Google Alphabet"),
        ("META", "Meta Facebook"),
        ("CRM", "Salesforce"),
        ("ADBE", "Adobe"),
        ("INTC", "Intel"),
    ],
    "Healthcare": [
        ("JNJ", "Johnson Johnson"),
        ("UNH", "UnitedHealth"),
        ("PFE", "Pfizer"),
        ("ABBV", "AbbVie"),
        ("LLY", "Eli Lilly"),
        ("MRK", "Merck"),
        ("TMO", "Thermo Fisher"),
    ],
    "Financials": [
        ("JPM", "JPMorgan"),
        ("BAC", "Bank of America"),
        ("GS", "Goldman Sachs"),
        ("V", "Visa"),
        ("MA", "Mastercard"),
        ("BRK.B", "Berkshire Hathaway"),
        ("C", "Citigroup"),
    ],
    "Consumer Discretionary": [
        ("AMZN", "Amazon"),
        ("TSLA", "Tesla"),
        ("NKE", "Nike"),
        ("MCD", "McDonalds"),
        ("SBUX", "Starbucks"),
        ("HD", "Home Depot"),
        ("TGT", "Target"),
    ],
    "Consumer Staples": [
        ("PG", "Procter Gamble"),
        ("KO", "Coca-Cola"),
        ("PEP", "PepsiCo"),
        ("WMT", "Walmart"),
        ("COST", "Costco"),
        ("CL", "Colgate-Palmolive"),
    ],
    "Energy": [
        ("XOM", "Exxon Mobil"),
        ("CVX", "Chevron"),
        ("COP", "ConocoPhillips"),
        ("SLB", "Schlumberger"),
        ("EOG", "EOG Resources"),
        ("OXY", "Occidental Petroleum"),
    ],
    "Industrials": [
        ("CAT", "Caterpillar"),
        ("BA", "Boeing"),
        ("UPS", "UPS"),
        ("HON", "Honeywell"),
        ("GE", "GE Aerospace"),
        ("LMT", "Lockheed Martin"),
        ("DE", "John Deere"),
    ],
    "Materials": [
        ("LIN", "Linde"),
        ("APD", "Air Products"),
        ("NEM", "Newmont"),
        ("FCX", "Freeport-McMoRan"),
        ("NUE", "Nucor"),
        ("DOW", "Dow Inc"),
    ],
    "Real Estate": [
        ("AMT", "American Tower"),
        ("PLD", "Prologis"),
        ("SPG", "Simon Property"),
        ("O", "Realty Income"),
        ("EQIX", "Equinix"),
    ],
    "Utilities": [
        ("NEE", "NextEra Energy"),
        ("DUK", "Duke Energy"),
        ("SO", "Southern Company"),
        ("D", "Dominion Energy"),
        ("AEP", "American Electric Power"),
    ],
    "Communication Services": [
        ("NFLX", "Netflix"),
        ("DIS", "Disney"),
        ("CMCSA", "Comcast"),
        ("TMUS", "T-Mobile"),
        ("VZ", "Verizon"),
    ],
    "General Market": [
        ("MARKET", "stock market today"),
        ("MACRO", "federal reserve economy"),
        ("EARNINGS", "earnings season results"),
    ],
}

# Flatten for easy iteration
ALL_FEEDS = []
for sector, stocks in STOCKS_BY_SECTOR.items():
    for symbol, search_name in stocks:
        ALL_FEEDS.append({
            "symbol": symbol,
            "search_name": search_name,
            "sector": sector,
        })

TOTAL_STOCKS = sum(len(v) for v in STOCKS_BY_SECTOR.values())

# ═══════════════════════════════════════════════════════════════
# RSS FETCHING
# ═══════════════════════════════════════════════════════════════

def build_rss_url(search_name: str) -> str:
    """Build a Google News RSS search URL."""
    query = f"{search_name} stock"
    query_encoded = query.replace(" ", "+")
    return f"https://news.google.com/rss/search?q={query_encoded}&hl=en-US&gl=US&ceid=US:en"


def fetch_rss_feed(url: str, timeout: int = 15) -> list[dict]:
    """Fetch and parse a Google News RSS feed. Returns list of articles."""
    try:
        req = Request(url, headers={
            "User-Agent": "Mozilla/5.0 (compatible; TrackYourMarket/2.0)"
        })
        with urlopen(req, timeout=timeout) as resp:
            xml_text = resp.read().decode("utf-8")
    except (URLError, TimeoutError, Exception) as e:
        print(f"    [ERROR] Failed to fetch RSS: {e}")
        return []

    articles = []
    try:
        root = ET.fromstring(xml_text)
        for item in root.findall(".//item"):
            title_el = item.find("title")
            link_el = item.find("link")
            pub_date_el = item.find("pubDate")
            source_el = item.find("source")

            if title_el is None or link_el is None:
                continue

            title = clean_text(title_el.text or "")
            if len(title) < 10:
                continue

            articles.append({
                "title": title,
                "url": (link_el.text or "").strip(),
                "publishedAt": (pub_date_el.text or "").strip() if pub_date_el is not None else "",
                "source": clean_text(source_el.text or "Google News") if source_el is not None else "Google News",
            })
    except ET.ParseError as e:
        print(f"    [ERROR] XML parse error: {e}")

    return articles


def clean_text(text: str) -> str:
    """Remove HTML tags, decode entities, clean whitespace."""
    text = re.sub(r"<[^>]*>", " ", text)
    text = unescape(text)
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

# ═══════════════════════════════════════════════════════════════
# STORAGE
# ═══════════════════════════════════════════════════════════════

def get_data_path() -> str:
    """Get the path to the collected articles file."""
    # Try to find ml/data/raw/ relative to this script or current directory
    candidates = [
        os.path.join(os.path.dirname(__file__), "..", "data", "raw"),
        os.path.join(os.getcwd(), "ml", "data", "raw"),
        os.path.join(os.getcwd(), "data", "raw"),
        os.path.join(os.getcwd()),
    ]
    for candidate in candidates:
        parent = os.path.dirname(candidate)
        if os.path.isdir(parent):
            os.makedirs(candidate, exist_ok=True)
            return os.path.join(candidate, "collected_articles.json")

    # Fallback: current directory
    return os.path.join(os.getcwd(), "collected_articles.json")


def load_existing_articles(path: str) -> dict:
    """Load existing collected data or create empty structure."""
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "metadata": {
            "created": datetime.now(timezone.utc).isoformat(),
            "lastUpdated": None,
            "totalArticles": 0,
            "totalRuns": 0,
            "sectors": list(STOCKS_BY_SECTOR.keys()),
            "stockCount": TOTAL_STOCKS,
        },
        "articles": [],
        "seenUrls": [],
    }


def save_articles(path: str, data: dict):
    """Save collected data to JSON file."""
    data["metadata"]["lastUpdated"] = datetime.now(timezone.utc).isoformat()
    data["metadata"]["totalArticles"] = len(data["articles"])

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def make_url_hash(url: str) -> str:
    """Create a short hash of a URL for deduplication."""
    return hashlib.md5(url.encode()).hexdigest()[:12]

# ═══════════════════════════════════════════════════════════════
# MAIN COLLECTION LOGIC
# ═══════════════════════════════════════════════════════════════

def run_collection(data_path: str) -> dict:
    """Run one collection cycle across all stocks."""
    data = load_existing_articles(data_path)
    seen_urls = set(data.get("seenUrls", []))
    seen_titles = set(a["title"].lower().strip() for a in data["articles"])

    run_time = datetime.now(timezone.utc).isoformat()
    new_count = 0
    error_count = 0
    skipped_dup = 0

    print(f"\n{'='*60}")
    print(f"  TrackYourMarket News Collector")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Scanning {TOTAL_STOCKS} stocks across {len(STOCKS_BY_SECTOR)} sectors")
    print(f"{'='*60}\n")

    for feed in ALL_FEEDS:
        symbol = feed["symbol"]
        sector = feed["sector"]
        search_name = feed["search_name"]

        print(f"  [{sector}] {symbol} ({search_name})...", end=" ", flush=True)

        url = build_rss_url(search_name)
        articles = fetch_rss_feed(url)

        if not articles:
            print("no articles")
            error_count += 1
            continue

        feed_new = 0
        # Take top 3 articles per stock to avoid flooding
        for article in articles[:3]:
            url_hash = make_url_hash(article["url"])
            title_lower = article["title"].lower().strip()

            # Deduplicate by URL hash AND by title similarity
            if url_hash in seen_urls or title_lower in seen_titles:
                skipped_dup += 1
                continue

            # Store the article
            article_record = {
                "id": f"{symbol}-{url_hash}",
                "title": article["title"],
                "url": article["url"],
                "source": article["source"],
                "publishedAt": article["publishedAt"],
                "symbol": symbol,
                "sector": sector,
                "collectedAt": run_time,
                "categories": None,  # To be filled by classifier
            }

            data["articles"].append(article_record)
            seen_urls.add(url_hash)
            seen_titles.add(title_lower)
            feed_new += 1
            new_count += 1

        print(f"{len(articles)} found, {feed_new} new")

        # Small delay to avoid rate limiting
        time.sleep(0.3)

    # Update metadata
    data["seenUrls"] = list(seen_urls)
    data["metadata"]["totalRuns"] = data["metadata"].get("totalRuns", 0) + 1

    # Save
    save_articles(data_path, data)

    # Summary
    print(f"\n{'='*60}")
    print(f"  Collection complete!")
    print(f"  New articles:     {new_count}")
    print(f"  Duplicates skipped: {skipped_dup}")
    print(f"  Errors:           {error_count}")
    print(f"  Total in database: {len(data['articles'])}")
    print(f"  Saved to: {data_path}")
    print(f"{'='*60}\n")

    return {"new": new_count, "errors": error_count, "total": len(data["articles"])}


def show_stats(data_path: str):
    """Show statistics about collected data."""
    if not os.path.exists(data_path):
        print("No data file found. Run the collector first.")
        return

    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    articles = data["articles"]
    meta = data["metadata"]

    print(f"\n{'='*60}")
    print(f"  TrackYourMarket News Collection Statistics")
    print(f"{'='*60}\n")
    print(f"  Total articles:  {len(articles)}")
    print(f"  Total runs:      {meta.get('totalRuns', 'N/A')}")
    print(f"  Created:         {meta.get('created', 'N/A')}")
    print(f"  Last updated:    {meta.get('lastUpdated', 'N/A')}")
    print()

    # Sector breakdown
    from collections import Counter
    sector_counts = Counter(a.get("sector", "Unknown") for a in articles)
    print("  Articles by sector:")
    for sector, count in sorted(sector_counts.items(), key=lambda x: -x[1]):
        bar = "█" * (count // 3)
        print(f"    {sector:<30} {count:>5}  {bar}")

    # Source breakdown
    source_counts = Counter(a.get("source", "Unknown") for a in articles)
    print(f"\n  Top 10 sources:")
    for source, count in source_counts.most_common(10):
        print(f"    {source:<40} {count:>5}")

    # Labeled vs unlabeled
    labeled = sum(1 for a in articles if a.get("categories"))
    print(f"\n  Labeled:   {labeled}")
    print(f"  Unlabeled: {len(articles) - labeled}")

    # Date range
    dates = [a.get("publishedAt", "") for a in articles if a.get("publishedAt")]
    if dates:
        print(f"\n  Date range: {min(dates)[:10]} to {max(dates)[:10]}")

    print()

# ═══════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="TrackYourMarket News Collector — Fetches financial news for ML training"
    )
    parser.add_argument("--daemon", action="store_true",
                        help="Run continuously every 15 minutes")
    parser.add_argument("--interval", type=int, default=15,
                        help="Collection interval in minutes (default: 15)")
    parser.add_argument("--stats", action="store_true",
                        help="Show collection statistics")
    parser.add_argument("--output", type=str, default=None,
                        help="Custom output file path")

    args = parser.parse_args()
    data_path = args.output or get_data_path()

    if args.stats:
        show_stats(data_path)
        return

    if args.daemon:
        print(f"Starting daemon mode (collecting every {args.interval} minutes)")
        print(f"Output: {data_path}")
        print("Press Ctrl+C to stop.\n")
        try:
            while True:
                run_collection(data_path)
                print(f"Sleeping {args.interval} minutes until next collection...\n")
                time.sleep(args.interval * 60)
        except KeyboardInterrupt:
            print("\nDaemon stopped.")
    else:
        run_collection(data_path)


if __name__ == "__main__":
    main()
