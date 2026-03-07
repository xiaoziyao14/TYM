import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * News articles table for storing market news with relevance scoring
 */
export const newsArticles = mysqlTable("news_articles", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  source: varchar("source", { length: 128 }).notNull(),
  publishedAt: timestamp("publishedAt").notNull(),
  summary: text("summary"),
  aiSummary: text("aiSummary"), // AI-generated detailed paragraph summary
  companies: text("companies"), // JSON array of ticker symbols
  relevanceIndex: int("relevanceIndex").notNull(), // 0-100 scale
  eventType: varchar("eventType", { length: 64 }).default("general"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NewsArticle = typeof newsArticles.$inferSelect;
export type InsertNewsArticle = typeof newsArticles.$inferInsert;

/**
 * Calendar events table for tracking earnings dates, economic events, etc.
 */
export const calendarEvents = mysqlTable("calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  eventDate: timestamp("eventDate").notNull(),
  eventType: mysqlEnum("eventType", ["earnings", "dividend", "economic", "ipo", "custom"]).default("custom").notNull(),
  symbol: varchar("symbol", { length: 16 }), // Optional stock ticker
  importance: mysqlEnum("importance", ["low", "medium", "high"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

/**
 * Watchlists table for user-created stock watchlists
 */
export const watchlists = mysqlTable("watchlists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // References users.id
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  isDefault: int("isDefault").default(0).notNull(), // 1 = default watchlist
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Watchlist = typeof watchlists.$inferSelect;
export type InsertWatchlist = typeof watchlists.$inferInsert;

/**
 * Watchlist stocks table for stocks in each watchlist
 */
export const watchlistStocks = mysqlTable("watchlist_stocks", {
  id: int("id").autoincrement().primaryKey(),
  watchlistId: int("watchlistId").notNull(), // References watchlists.id
  symbol: varchar("symbol", { length: 16 }).notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type WatchlistStock = typeof watchlistStocks.$inferSelect;
export type InsertWatchlistStock = typeof watchlistStocks.$inferInsert;
