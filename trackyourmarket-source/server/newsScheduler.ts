/**
 * News Scheduler - Automatic news refresh service
 * Fetches news from Google News RSS feeds every 15 minutes
 */

import { sql } from "drizzle-orm";
import { newsArticles } from "../drizzle/schema";
import { getDb } from "./db";

// Google News RSS feeds for tracked stocks
const NEWS_FEEDS: Record<string, string> = {
  AAPL: "https://news.google.com/rss/search?q=AAPL+stock+Apple&hl=en-US&gl=US&ceid=US:en",
  NVDA: "https://news.google.com/rss/search?q=NVDA+stock+Nvidia&hl=en-US&gl=US&ceid=US:en",
  MSFT: "https://news.google.com/rss/search?q=MSFT+stock+Microsoft&hl=en-US&gl=US&ceid=US:en",
  TSLA: "https://news.google.com/rss/search?q=TSLA+stock+Tesla&hl=en-US&gl=US&ceid=US:en",
  GOOGL: "https://news.google.com/rss/search?q=GOOGL+stock+Google+Alphabet&hl=en-US&gl=US&ceid=US:en",
  AMZN: "https://news.google.com/rss/search?q=AMZN+stock+Amazon&hl=en-US&gl=US&ceid=US:en",
  META: "https://news.google.com/rss/search?q=META+stock+Facebook&hl=en-US&gl=US&ceid=US:en",
  MARKET: "https://news.google.com/rss/search?q=stock+market+today&hl=en-US&gl=US&ceid=US:en",
};

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description?: string;
}

/**
 * Clean HTML content and decode entities
 */
function cleanHtml(html: string): string {
  if (!html) return "";
  
  // Remove all HTML tags
  let text = html.replace(/<[^>]*>/g, " ");
  
  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&apos;/g, "'");
  text = text.replace(/&#x27;/g, "'");
  text = text.replace(/&#x2F;/g, "/");
  
  // Remove URLs and encoded URLs
  text = text.replace(/https?:\/\/[^\s]+/g, "");
  text = text.replace(/com\/rss\/articles\/[^\s;]+/g, "");
  text = text.replace(/oc=\d+/g, "");
  
  // Remove extra whitespace
  text = text.replace(/\s+/g, " ").trim();
  
  return text;
}

/**
 * Parse RSS XML to extract news items
 */
function parseRSSXML(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  // Simple regex-based XML parsing for RSS items
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    
    const titleMatch = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/.exec(itemXml);
    const linkMatch = /<link>([\s\S]*?)<\/link>/.exec(itemXml);
    const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(itemXml);
    const sourceMatch = /<source[^>]*>([\s\S]*?)<\/source>/.exec(itemXml);
    
    if (titleMatch && linkMatch) {
      // Clean the title
      const rawTitle = (titleMatch[1] || titleMatch[2] || "").trim();
      const cleanTitle = cleanHtml(rawTitle);
      
      // Get source name
      const rawSource = sourceMatch ? sourceMatch[1].trim() : "Google News";
      const cleanSource = cleanHtml(rawSource);
      
      items.push({
        title: cleanTitle,
        link: linkMatch[1].trim(),
        pubDate: pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString(),
        source: cleanSource,
        description: undefined, // We'll generate summary from title
      });
    }
  }
  
  return items;
}

/**
 * Fetch news from a Google News RSS feed
 */
async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TrackYourMarket/1.0)",
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch RSS feed: ${response.status}`);
      return [];
    }
    
    const xml = await response.text();
    return parseRSSXML(xml);
  } catch (error) {
    console.error(`Error fetching RSS feed: ${error}`);
    return [];
  }
}

/**
 * Calculate relevance score based on content
 */
function calculateRelevanceScore(title: string, stock: string): number {
  let score = 50; // Base score
  const lowerTitle = title.toLowerCase();
  
  // High relevance keywords
  const highRelevanceKeywords = ["earnings", "revenue", "profit", "beat", "miss", "guidance", "forecast", "acquisition", "merger"];
  const mediumRelevanceKeywords = ["upgrade", "downgrade", "target", "analyst", "rating", "growth", "decline", "surge", "plunge"];
  const lowRelevanceKeywords = ["stock", "market", "trading", "shares", "price"];
  
  highRelevanceKeywords.forEach(keyword => {
    if (lowerTitle.includes(keyword)) score += 15;
  });
  
  mediumRelevanceKeywords.forEach(keyword => {
    if (lowerTitle.includes(keyword)) score += 8;
  });
  
  lowRelevanceKeywords.forEach(keyword => {
    if (lowerTitle.includes(keyword)) score += 3;
  });
  
  // Bonus for specific stock mention
  if (lowerTitle.includes(stock.toLowerCase())) score += 10;
  
  // Cap the score at 100
  return Math.min(score, 100);
}

/**
 * Generate summary bullet points from title using keyword extraction
 */
function generateSummary(title: string, stock: string): string {
  const points: string[] = [];
  const lowerTitle = title.toLowerCase();
  
  // Extract key information from the title
  
  // Earnings related
  if (lowerTitle.includes("earnings") || lowerTitle.includes("revenue") || lowerTitle.includes("profit")) {
    if (lowerTitle.includes("beat")) {
      points.push("• Earnings exceeded analyst expectations");
    } else if (lowerTitle.includes("miss")) {
      points.push("• Earnings fell short of expectations");
    } else {
      points.push("• Quarterly financial results reported");
    }
  }
  
  // Stock movement
  if (lowerTitle.includes("surge") || lowerTitle.includes("soar") || lowerTitle.includes("jump") || lowerTitle.includes("rally")) {
    points.push("• Stock showing strong upward momentum");
  } else if (lowerTitle.includes("drop") || lowerTitle.includes("fall") || lowerTitle.includes("plunge") || lowerTitle.includes("decline")) {
    points.push("• Stock experiencing downward pressure");
  }
  
  // Analyst actions
  if (lowerTitle.includes("upgrade")) {
    points.push("• Analyst upgraded rating on the stock");
  } else if (lowerTitle.includes("downgrade")) {
    points.push("• Analyst downgraded rating on the stock");
  } else if (lowerTitle.includes("target") && lowerTitle.includes("price")) {
    points.push("• Price target updated by analysts");
  }
  
  // AI/Tech related
  if (lowerTitle.includes("ai") || lowerTitle.includes("artificial intelligence")) {
    points.push("• AI developments impacting company outlook");
  }
  
  // Cloud/Growth
  if (lowerTitle.includes("cloud") || lowerTitle.includes("growth")) {
    points.push("• Cloud/growth metrics in focus");
  }
  
  // Market context
  if (lowerTitle.includes("market") && stock === "MARKET") {
    points.push("• Broader market conditions affecting stocks");
  }
  
  // If no specific points extracted, create a generic summary
  if (points.length === 0) {
    // Extract the main subject from title
    if (stock !== "MARKET") {
      points.push(`• ${stock} stock news update`);
    } else {
      points.push("• Market news and analysis");
    }
  }
  
  // Add stock context as second point
  if (stock !== "MARKET") {
    points.push(`• Relevant to ${stock} investors`);
  } else {
    points.push("• General market intelligence");
  }
  
  return points.join("\n");
}

/**
 * Fetch and store news for all tracked stocks
 */
export async function refreshNews(): Promise<{ added: number; errors: number }> {
  console.log(`[NewsScheduler] Starting news refresh at ${new Date().toISOString()}`);
  
  const db = await getDb();
  if (!db) {
    console.error("[NewsScheduler] Database not available");
    return { added: 0, errors: 1 };
  }
  
  let added = 0;
  let errors = 0;
  
  for (const [stock, feedUrl] of Object.entries(NEWS_FEEDS)) {
    try {
      const items = await fetchRSSFeed(feedUrl);
      console.log(`[NewsScheduler] Fetched ${items.length} items for ${stock}`);
      
      // Take only the latest 2 items per stock to avoid flooding
      const latestItems = items.slice(0, 2);
      
      for (const item of latestItems) {
        try {
          // Skip items with invalid or empty titles
          if (!item.title || item.title.length < 10) {
            continue;
          }
          
          // Check if article already exists by URL using raw SQL
          const existing = await db
            .select({ id: newsArticles.id })
            .from(newsArticles)
            .where(sql`${newsArticles.url} = ${item.link}`)
            .limit(1);
          
          if (existing.length === 0) {
            const companies = stock === "MARKET" ? JSON.stringify(["MARKET"]) : JSON.stringify([stock]);
            const relevanceIndex = calculateRelevanceScore(item.title, stock);
            const summary = generateSummary(item.title, stock);
            
            await db.insert(newsArticles).values({
              title: item.title,
              source: item.source || "Google News",
              url: item.link,
              publishedAt: new Date(item.pubDate),
              companies: companies,
              summary: summary,
              relevanceIndex: relevanceIndex,
              eventType: stock === "MARKET" ? "macro" : "general",
            });
            
            added++;
            console.log(`[NewsScheduler] Added: ${item.title.substring(0, 50)}...`);
          }
        } catch (insertError) {
          console.error(`[NewsScheduler] Error inserting article: ${insertError}`);
          errors++;
        }
      }
      
      // Small delay between feeds to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (feedError) {
      console.error(`[NewsScheduler] Error fetching feed for ${stock}: ${feedError}`);
      errors++;
    }
  }
  
  console.log(`[NewsScheduler] Refresh complete. Added: ${added}, Errors: ${errors}`);
  return { added, errors };
}

// Scheduler state
let schedulerInterval: NodeJS.Timeout | null = null;
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Start the news scheduler
 */
export function startNewsScheduler(): void {
  if (schedulerInterval) {
    console.log("[NewsScheduler] Scheduler already running");
    return;
  }
  
  console.log("[NewsScheduler] Starting scheduler (15-minute interval)");
  
  // Run immediately on start
  refreshNews().catch(err => console.error("[NewsScheduler] Initial refresh error:", err));
  
  // Then run every 15 minutes
  schedulerInterval = setInterval(() => {
    refreshNews().catch(err => console.error("[NewsScheduler] Scheduled refresh error:", err));
  }, REFRESH_INTERVAL);
}

/**
 * Stop the news scheduler
 */
export function stopNewsScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[NewsScheduler] Scheduler stopped");
  }
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning(): boolean {
  return schedulerInterval !== null;
}
