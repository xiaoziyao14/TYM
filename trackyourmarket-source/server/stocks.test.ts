import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createTestContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("stocks API", () => {
  it("should search for stocks", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stocks.search({ query: "AAPL" });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("symbol");
    expect(result[0]).toHaveProperty("name");
  });

  it("should get stock quote", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stocks.getQuote({ symbol: "AAPL" });

    expect(result).toBeDefined();
    if (result) {
      expect(result).toHaveProperty("symbol");
      expect(result).toHaveProperty("regularMarketPrice");
      expect(typeof result.regularMarketPrice).toBe("number");
    }
  }, 15000); // Longer timeout for API call

  it("should get stock chart data", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stocks.getChart({
      symbol: "AAPL",
      range: "5d",
      interval: "1d",
    });

    expect(result).toBeDefined();
    if (result) {
      expect(result).toHaveProperty("symbol");
      expect(result).toHaveProperty("dataPoints");
      expect(Array.isArray(result.dataPoints)).toBe(true);
      expect(result.dataPoints.length).toBeGreaterThan(0);
    }
  }, 15000);
});

describe("news API", () => {
  it("should refresh and fetch news", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // First refresh news
    const refreshResult = await caller.news.refresh();
    expect(refreshResult.success).toBe(true);
    expect(typeof refreshResult.added).toBe("number");
    expect(typeof refreshResult.errors).toBe("number");

    // Then fetch news
    const newsResult = await caller.news.getByRelevance({ limit: 10 });
    expect(newsResult).toBeDefined();
    expect(Array.isArray(newsResult)).toBe(true);
  }, 15000);

  it("should return news sorted by relevance index", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.news.getByRelevance({ limit: 10 });

    if (result.length > 1) {
      // Check that relevance indices are in descending order
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].relevanceIndex).toBeGreaterThanOrEqual(result[i + 1].relevanceIndex);
      }
    }
  });

  it("should search news by query", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.news.search({ query: "NVIDIA", limit: 10 });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});
