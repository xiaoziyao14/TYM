import { desc, eq, sql } from "drizzle-orm";
import { newsArticles, type InsertNewsArticle } from "../drizzle/schema";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";

export interface NewsItem {
  id: number;
  title: string;
  url: string;
  source: string;
  publishedAt: Date;
  summary: string | null;
  aiSummary: string | null;
  keyPoints: string[]; // Array of key points with data highlights
  companies: string[];
  relevanceIndex: number;
  eventType: string | null;
}

export interface NewsDetailItem extends NewsItem {
  aiSummary: string | null;
}

/**
 * Calculate relevance index for a news article (0-100 scale)
 */
export function calculateRelevanceIndex(article: {
  title: string;
  source: string;
  publishedAt: Date;
  eventType?: string;
}): number {
  let score = 50; // Base score

  const title = article.title.toLowerCase();

  // Event type scoring
  if (article.eventType === "earnings" || title.includes("earnings") || title.includes("revenue")) {
    score += 30;
  } else if (
    article.eventType === "macro" ||
    title.includes("fed") ||
    title.includes("interest rate") ||
    title.includes("inflation")
  ) {
    score += 25;
  } else if (article.eventType === "supply_chain" || title.includes("supply chain")) {
    score += 15;
  }

  // Source credibility boost
  const sourceBoosts: Record<string, number> = {
    "Wall Street Journal": 15,
    Bloomberg: 15,
    Reuters: 12,
    "Yahoo Finance": 8,
    CNBC: 10,
    "Financial Times": 15,
    Forbes: 10,
    "The Motley Fool": 6,
    Investopedia: 8,
    "New York Times": 12,
  };

  for (const [source, boost] of Object.entries(sourceBoosts)) {
    if (article.source.includes(source)) {
      score += boost;
      break;
    }
  }

  // Recency boost
  const hoursOld = (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60);
  if (hoursOld < 2) {
    score += 15;
  } else if (hoursOld < 6) {
    score += 10;
  } else if (hoursOld < 24) {
    score += 5;
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Detect event type from article title
 */
export function detectEventType(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("earnings") || lower.includes("revenue") || lower.includes("profit")) {
    return "earnings";
  }
  if (lower.includes("fed") || lower.includes("interest rate") || lower.includes("inflation")) {
    return "macro";
  }
  if (lower.includes("supply chain") || lower.includes("shortage")) {
    return "supply_chain";
  }
  return "general";
}

/**
 * Parse summary into key points array
 */
function parseKeyPoints(summary: string | null): string[] {
  if (!summary) return [];
  
  // If summary already contains bullet points or newlines, split by them
  if (summary.includes("•") || summary.includes("\n")) {
    return summary
      .split(/[•\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }
  
  // Otherwise, split by periods but keep data-rich sentences together
  const sentences = summary.split(/(?<=\.)\s+/);
  return sentences.filter(s => s.trim().length > 0);
}

/**
 * Fetch news from database, sorted by relevance
 */
export async function getNewsByRelevance(limit: number = 30): Promise<NewsItem[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select()
    .from(newsArticles)
    .orderBy(desc(newsArticles.relevanceIndex), desc(newsArticles.publishedAt))
    .limit(limit);

  return results.map((article) => ({
    ...article,
    companies: article.companies ? JSON.parse(article.companies) : [],
    keyPoints: parseKeyPoints(article.summary),
  }));
}

/**
 * Search news by query (company name or ticker)
 */
export async function searchNews(query: string, limit: number = 30): Promise<NewsItem[]> {
  const db = await getDb();
  if (!db) return [];

  const lowerQuery = query.toLowerCase();

  const results = await db
    .select()
    .from(newsArticles)
    .where(
      sql`LOWER(${newsArticles.title}) LIKE ${`%${lowerQuery}%`} OR LOWER(${newsArticles.companies}) LIKE ${`%${lowerQuery}%`}`
    )
    .orderBy(desc(newsArticles.publishedAt))
    .limit(limit);

  return results.map((article) => ({
    ...article,
    companies: article.companies ? JSON.parse(article.companies) : [],
    keyPoints: parseKeyPoints(article.summary),
  }));
}

/**
 * Insert or update news article
 */
export async function upsertNewsArticle(article: Omit<InsertNewsArticle, "id" | "createdAt">): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(newsArticles).values(article).onDuplicateKeyUpdate({
      set: {
        title: article.title,
        summary: article.summary,
        relevanceIndex: article.relevanceIndex,
      },
    });
  } catch (error) {
    console.error("Error upserting news article:", error);
  }
}

/**
 * Real news data from verified sources (January 2026)
 * Updated with key points format - bullet points highlighting important data
 */
export async function fetchAndStoreNews(): Promise<void> {
  // Real news articles from verified sources - January 29, 2026
  // Summary format: Key points with data highlights separated by bullet points
  const realNews = [
    // AAPL News (2 articles)
    {
      title: "Apple Q1 Earnings Preview: iPhone Sales and AI Outlook in Focus",
      url: "https://finance.yahoo.com/news/apples-first-quarter-earnings-will-focus-on-iphone-sales-ai-outlook-170801438.html",
      source: "Yahoo Finance",
      publishedAt: new Date("2026-01-29T12:00:00Z"),
      summary: "• Expected revenue: $138.42 billion\n• iPhone revenue forecast: $78.3 billion (+13% YoY)\n• Focus: AI integration progress and Apple Intelligence adoption\n• Services segment expected to show continued growth",
      companies: JSON.stringify(["AAPL"]),
      eventType: "earnings",
    },
    {
      title: "What Could Send Apple Stock To New All-Time Highs?",
      url: "https://www.forbes.com/sites/greatspeculations/2026/01/29/what-could-send-apple-stock-to-new-all-time-highs/",
      source: "Forbes",
      publishedAt: new Date("2026-01-29T10:00:00Z"),
      summary: "• Historical growth: Multiple years with 30%+ stock increases\n• Key catalyst: AI features driving upgrade cycle\n• Services revenue growing at double-digit rate\n• Analysts see potential for new all-time highs",
      companies: JSON.stringify(["AAPL"]),
      eventType: "general",
    },
    // NVDA News (2 articles)
    {
      title: "Nvidia's Plans to Sell More Chips in China Just Cleared a Major Hurdle",
      url: "https://www.investopedia.com/nvidia-plans-to-sell-more-chips-in-china-just-cleared-a-major-hurdle-nvda-11894059",
      source: "Investopedia",
      publishedAt: new Date("2026-01-28T14:00:00Z"),
      summary: "• China approved purchase of thousands of H200 AI chips\n• Major tech companies cleared for procurement\n• Opens significant market opportunity for Nvidia\n• Export restrictions remain on most advanced chips",
      companies: JSON.stringify(["NVDA"]),
      eventType: "general",
    },
    {
      title: "Amazon and Google Eat Into Nvidia's A.I. Chip Supremacy",
      url: "https://www.nytimes.com/2026/01/29/technology/amazon-google-nvidia-chips-competition.html",
      source: "New York Times",
      publishedAt: new Date("2026-01-29T15:30:00Z"),
      summary: "• Amazon Trainium chip revenue: Multiple billions in 2025\n• Google TPU adoption accelerating\n• Tech giants developing custom AI chips\n• Goal: Reduce Nvidia dependence and costs",
      companies: JSON.stringify(["NVDA"]),
      eventType: "general",
    },
    // MSFT News (2 articles)
    {
      title: "Microsoft Q2 Earnings Beat, But Stock Drops 7% on Slowing Cloud Growth",
      url: "https://www.cnbc.com/2026/01/28/microsoft-msft-q2-earnings-report-2026.html",
      source: "CNBC",
      publishedAt: new Date("2026-01-29T08:00:00Z"),
      summary: "• EPS: $4.14 vs $3.97 expected (beat)\n• Revenue: $81.27B vs $80.27B expected (beat)\n• Stock dropped 7% on Azure growth concerns\n• Record AI infrastructure spending announced",
      companies: JSON.stringify(["MSFT"]),
      eventType: "earnings",
    },
    {
      title: "Microsoft Cloud and AI Strength Drives Second Quarter Results",
      url: "https://news.microsoft.com/source/2026/01/28/microsoft-cloud-and-ai-strength-drives-second-quarter-results-3/",
      source: "Microsoft News",
      publishedAt: new Date("2026-01-28T21:00:00Z"),
      summary: "• Revenue: $81.3 billion (+17% YoY)\n• Operating income: $38.3 billion (+21% YoY)\n• Cloud revenue: $51.5 billion for Q2\n• AI services driving enterprise adoption",
      companies: JSON.stringify(["MSFT"]),
      eventType: "earnings",
    },
    // TSLA News (2 articles)
    {
      title: "Tesla Q4 Earnings Beat Estimates, But Reports First Annual Revenue Decline",
      url: "https://www.cnbc.com/2026/01/28/tesla-tsla-2025-q4-earnings.html",
      source: "CNBC",
      publishedAt: new Date("2026-01-29T06:00:00Z"),
      summary: "• Adjusted EPS: $0.50 vs $0.45 expected (beat)\n• First full-year revenue decline on record\n• Automotive margins under pressure\n• Energy storage business showing strong growth",
      companies: JSON.stringify(["TSLA"]),
      eventType: "earnings",
    },
    {
      title: "Tesla Plots $20 Billion Splurge to Support Musk's AI Future",
      url: "https://www.bloomberg.com/news/articles/2026-01-28/tesla-posts-fourth-quarter-profit-that-beats-expectations",
      source: "Bloomberg",
      publishedAt: new Date("2026-01-29T14:00:00Z"),
      summary: "• Planned AI infrastructure spending: $20 billion\n• Cash position: $44.06 billion (+21% YoY)\n• Optimus robots on track for production\n• FSD and robotaxi development accelerating",
      companies: JSON.stringify(["TSLA"]),
      eventType: "general",
    },
  ];

  // Clear existing news and insert fresh data
  const db = await getDb();
  if (db) {
    try {
      await db.delete(newsArticles);
    } catch (error) {
      console.error("Error clearing news articles:", error);
    }
  }

  for (const news of realNews) {
    const relevanceIndex = calculateRelevanceIndex({
      title: news.title,
      source: news.source,
      publishedAt: news.publishedAt,
      eventType: news.eventType,
    });

    await upsertNewsArticle({
      ...news,
      relevanceIndex,
    });
  }
}


/**
 * Get a single news article by ID
 */
export async function getNewsById(id: number): Promise<NewsDetailItem | null> {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(newsArticles)
    .where(eq(newsArticles.id, id))
    .limit(1);

  if (results.length === 0) return null;

  const article = results[0];
  return {
    ...article,
    companies: article.companies ? JSON.parse(article.companies) : [],
    keyPoints: parseKeyPoints(article.summary),
  };
}

/**
 * Get or generate AI summary for a news article
 */
export async function getOrGenerateAiSummary(id: number): Promise<{ aiSummary: string | null; generated: boolean }> {
  const db = await getDb();
  if (!db) return { aiSummary: null, generated: false };

  // First check if we already have an AI summary
  const results = await db
    .select()
    .from(newsArticles)
    .where(eq(newsArticles.id, id))
    .limit(1);

  if (results.length === 0) return { aiSummary: null, generated: false };

  const article = results[0];

  // If we already have an AI summary, return it
  if (article.aiSummary) {
    return { aiSummary: article.aiSummary, generated: false };
  }

  // Generate AI summary using LLM
  try {
    const companies = article.companies ? JSON.parse(article.companies) : [];
    const companyList = companies.length > 0 ? companies.join(", ") : "general market";

    const prompt = `You are a financial news analyst. Write a concise but informative summary of this news article in 2-3 paragraphs. Focus on the key facts, numbers, and implications for investors.

Title: ${article.title}
Source: ${article.source}
Related Stocks: ${companyList}
Published: ${article.publishedAt.toISOString()}

Key Points from the article:
${article.summary || "No additional details available."}

Write a professional summary that:
1. Explains the main news event and its significance
2. Highlights key numbers, percentages, or financial data mentioned
3. Discusses potential implications for investors or the market

Write in a professional, objective tone. Do not use bullet points - write in paragraph form.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a professional financial news analyst who writes clear, concise summaries for investors." },
        { role: "user", content: prompt },
      ],
    });

    const aiSummary = response.choices[0]?.message?.content as string || null;

    // Save the AI summary to the database
    if (aiSummary) {
      await db
        .update(newsArticles)
        .set({ aiSummary })
        .where(eq(newsArticles.id, id));
    }

    return { aiSummary, generated: true };
  } catch (error) {
    console.error("Error generating AI summary:", error);
    return { aiSummary: null, generated: false };
  }
}
