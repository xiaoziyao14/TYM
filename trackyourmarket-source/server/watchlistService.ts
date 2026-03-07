import { getDb } from "./db";
import { watchlists, watchlistStocks } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export interface WatchlistWithStocks {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  isDefault: number;
  createdAt: Date;
  updatedAt: Date;
  stocks: string[];
}

/**
 * Get all watchlists for a user
 */
export async function getUserWatchlists(userId: number): Promise<WatchlistWithStocks[]> {
  const db = await getDb();
  if (!db) return [];

  const userWatchlists = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.userId, userId));

  const result: WatchlistWithStocks[] = [];

  for (const watchlist of userWatchlists) {
    const stocks = await db
      .select()
      .from(watchlistStocks)
      .where(eq(watchlistStocks.watchlistId, watchlist.id));

    result.push({
      ...watchlist,
      stocks: stocks.map((s: { symbol: string }) => s.symbol),
    });
  }

  return result;
}

/**
 * Get a single watchlist by ID
 */
export async function getWatchlistById(
  watchlistId: number,
  userId: number
): Promise<WatchlistWithStocks | null> {
  const db = await getDb();
  if (!db) return null;

  const [watchlist] = await db
    .select()
    .from(watchlists)
    .where(and(eq(watchlists.id, watchlistId), eq(watchlists.userId, userId)));

  if (!watchlist) return null;

  const stocks = await db
    .select()
    .from(watchlistStocks)
    .where(eq(watchlistStocks.watchlistId, watchlistId));

  return {
    ...watchlist,
    stocks: stocks.map((s: { symbol: string }) => s.symbol),
  };
}

/**
 * Create a new watchlist
 */
export async function createWatchlist(
  userId: number,
  name: string,
  description?: string
): Promise<WatchlistWithStocks | null> {
  const db = await getDb();
  if (!db) return null;

  // Check if this is the first watchlist for the user
  const existingWatchlists = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.userId, userId));

  const isDefault = existingWatchlists.length === 0 ? 1 : 0;

  const [result] = await db.insert(watchlists).values({
    userId,
    name,
    description: description || null,
    isDefault,
  });

  const insertId = result.insertId;

  const [newWatchlist] = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.id, insertId));

  return {
    ...newWatchlist,
    stocks: [],
  };
}

/**
 * Update a watchlist (rename or update description)
 */
export async function updateWatchlist(
  watchlistId: number,
  userId: number,
  updates: { name?: string; description?: string }
): Promise<WatchlistWithStocks | null> {
  const db = await getDb();
  if (!db) return null;

  // Verify ownership
  const [existing] = await db
    .select()
    .from(watchlists)
    .where(and(eq(watchlists.id, watchlistId), eq(watchlists.userId, userId)));

  if (!existing) return null;

  const updateData: Partial<typeof watchlists.$inferInsert> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;

  if (Object.keys(updateData).length > 0) {
    await db
      .update(watchlists)
      .set(updateData)
      .where(eq(watchlists.id, watchlistId));
  }

  return getWatchlistById(watchlistId, userId);
}

/**
 * Delete a watchlist
 */
export async function deleteWatchlist(
  watchlistId: number,
  userId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Verify ownership
  const [existing] = await db
    .select()
    .from(watchlists)
    .where(and(eq(watchlists.id, watchlistId), eq(watchlists.userId, userId)));

  if (!existing) return false;

  // Delete all stocks in the watchlist first
  await db
    .delete(watchlistStocks)
    .where(eq(watchlistStocks.watchlistId, watchlistId));

  // Delete the watchlist
  await db.delete(watchlists).where(eq(watchlists.id, watchlistId));

  // If this was the default watchlist, make another one default
  if (existing.isDefault === 1) {
    const [nextWatchlist] = await db
      .select()
      .from(watchlists)
      .where(eq(watchlists.userId, userId))
      .limit(1);

    if (nextWatchlist) {
      await db
        .update(watchlists)
        .set({ isDefault: 1 })
        .where(eq(watchlists.id, nextWatchlist.id));
    }
  }

  return true;
}

/**
 * Add a stock to a watchlist
 */
export async function addStockToWatchlist(
  watchlistId: number,
  userId: number,
  symbol: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Verify ownership
  const [existing] = await db
    .select()
    .from(watchlists)
    .where(and(eq(watchlists.id, watchlistId), eq(watchlists.userId, userId)));

  if (!existing) return false;

  // Check if stock already exists in watchlist
  const [existingStock] = await db
    .select()
    .from(watchlistStocks)
    .where(
      and(
        eq(watchlistStocks.watchlistId, watchlistId),
        eq(watchlistStocks.symbol, symbol.toUpperCase())
      )
    );

  if (existingStock) return true; // Already exists

  await db.insert(watchlistStocks).values({
    watchlistId,
    symbol: symbol.toUpperCase(),
  });

  return true;
}

/**
 * Remove a stock from a watchlist
 */
export async function removeStockFromWatchlist(
  watchlistId: number,
  userId: number,
  symbol: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Verify ownership
  const [existing] = await db
    .select()
    .from(watchlists)
    .where(and(eq(watchlists.id, watchlistId), eq(watchlists.userId, userId)));

  if (!existing) return false;

  await db
    .delete(watchlistStocks)
    .where(
      and(
        eq(watchlistStocks.watchlistId, watchlistId),
        eq(watchlistStocks.symbol, symbol.toUpperCase())
      )
    );

  return true;
}

/**
 * Set a watchlist as default
 */
export async function setDefaultWatchlist(
  watchlistId: number,
  userId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Verify ownership
  const [existing] = await db
    .select()
    .from(watchlists)
    .where(and(eq(watchlists.id, watchlistId), eq(watchlists.userId, userId)));

  if (!existing) return false;

  // Remove default from all user's watchlists
  await db
    .update(watchlists)
    .set({ isDefault: 0 })
    .where(eq(watchlists.userId, userId));

  // Set new default
  await db
    .update(watchlists)
    .set({ isDefault: 1 })
    .where(eq(watchlists.id, watchlistId));

  return true;
}

/**
 * Get or create default watchlist for a user
 */
export async function getOrCreateDefaultWatchlist(
  userId: number
): Promise<WatchlistWithStocks | null> {
  const db = await getDb();
  if (!db) return null;

  // Try to find existing default watchlist
  const [defaultWatchlist] = await db
    .select()
    .from(watchlists)
    .where(and(eq(watchlists.userId, userId), eq(watchlists.isDefault, 1)));

  if (defaultWatchlist) {
    const stocks = await db
      .select()
      .from(watchlistStocks)
      .where(eq(watchlistStocks.watchlistId, defaultWatchlist.id));

    return {
      ...defaultWatchlist,
      stocks: stocks.map((s: { symbol: string }) => s.symbol),
    };
  }

  // No default watchlist, try to find any watchlist
  const [anyWatchlist] = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.userId, userId))
    .limit(1);

  if (anyWatchlist) {
    // Make it default
    await db
      .update(watchlists)
      .set({ isDefault: 1 })
      .where(eq(watchlists.id, anyWatchlist.id));

    const stocks = await db
      .select()
      .from(watchlistStocks)
      .where(eq(watchlistStocks.watchlistId, anyWatchlist.id));

    return {
      ...anyWatchlist,
      isDefault: 1,
      stocks: stocks.map((s: { symbol: string }) => s.symbol),
    };
  }

  // No watchlists at all, create a default one
  return createWatchlist(userId, "My Watchlist");
}
