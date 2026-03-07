import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  stocks: router({
    getQuote: publicProcedure
      .input(z.object({ symbol: z.string() }))
      .query(async ({ input }) => {
        const { getStockQuote } = await import("./yahooFinance");
        return await getStockQuote(input.symbol);
      }),
    getChart: publicProcedure
      .input(
        z.object({
          symbol: z.string(),
          range: z.string().optional().default("1mo"),
          interval: z.string().optional().default("1d"),
        })
      )
      .query(async ({ input }) => {
        const { getStockChart } = await import("./yahooFinance");
        return await getStockChart(input.symbol, input.range, input.interval);
      }),
    search: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        const { searchStocks } = await import("./yahooFinance");
        return await searchStocks(input.query);
      }),
  }),

  news: router({
    getByRelevance: publicProcedure
      .input(z.object({ limit: z.number().optional().default(30) }))
      .query(async ({ input }) => {
        const { getNewsByRelevance } = await import("./newsService");
        return await getNewsByRelevance(input.limit);
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getNewsById } = await import("./newsService");
        return await getNewsById(input.id);
      }),
    getAiSummary: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getOrGenerateAiSummary } = await import("./newsService");
        return await getOrGenerateAiSummary(input.id);
      }),
    search: publicProcedure
      .input(z.object({ query: z.string(), limit: z.number().optional().default(30) }))
      .query(async ({ input }) => {
        const { searchNews } = await import("./newsService");
        return await searchNews(input.query, input.limit);
      }),
    refresh: publicProcedure.mutation(async () => {
      const { refreshNews } = await import("./newsScheduler");
      const result = await refreshNews();
      return { success: true, added: result.added, errors: result.errors };
    }),
    schedulerStatus: publicProcedure.query(async () => {
      const { isSchedulerRunning } = await import("./newsScheduler");
      return { running: isSchedulerRunning(), interval: "15 minutes" };
    }),
  }),

  calendar: router({
    getAll: publicProcedure.query(async () => {
      const { getAllEvents } = await import("./calendarService");
      return await getAllEvents();
    }),
    getByMonth: publicProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ input }) => {
        const { getEventsByMonth } = await import("./calendarService");
        return await getEventsByMonth(input.year, input.month);
      }),
    getUpcoming: publicProcedure
      .input(z.object({ days: z.number().optional().default(7) }))
      .query(async ({ input }) => {
        const { getUpcomingEvents } = await import("./calendarService");
        return await getUpcomingEvents(input.days);
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getEventById } = await import("./calendarService");
        return await getEventById(input.id);
      }),
    create: publicProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          eventDate: z.string().transform((s) => new Date(s)),
          eventType: z.enum(["earnings", "dividend", "economic", "ipo", "custom"]),
          symbol: z.string().optional(),
          importance: z.enum(["low", "medium", "high"]),
        })
      )
      .mutation(async ({ input }) => {
        const { createEvent } = await import("./calendarService");
        return await createEvent(input);
      }),
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          eventDate: z.string().transform((s) => new Date(s)).optional(),
          eventType: z.enum(["earnings", "dividend", "economic", "ipo", "custom"]).optional(),
          symbol: z.string().optional(),
          importance: z.enum(["low", "medium", "high"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const { updateEvent } = await import("./calendarService");
        return await updateEvent(id, data);
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteEvent } = await import("./calendarService");
        return await deleteEvent(input.id);
      }),
  }),

  watchlist: router({
    // Get all watchlists for the current user
    getAll: protectedProcedure.query(async ({ ctx }) => {
      const { getUserWatchlists } = await import("./watchlistService");
      return await getUserWatchlists(ctx.user.id);
    }),

    // Get a single watchlist by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getWatchlistById } = await import("./watchlistService");
        return await getWatchlistById(input.id, ctx.user.id);
      }),

    // Get or create default watchlist
    getDefault: protectedProcedure.query(async ({ ctx }) => {
      const { getOrCreateDefaultWatchlist } = await import("./watchlistService");
      return await getOrCreateDefaultWatchlist(ctx.user.id);
    }),

    // Create a new watchlist
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(128),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createWatchlist } = await import("./watchlistService");
        return await createWatchlist(ctx.user.id, input.name, input.description);
      }),

    // Update a watchlist (rename or update description)
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(128).optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        const { updateWatchlist } = await import("./watchlistService");
        return await updateWatchlist(id, ctx.user.id, updates);
      }),

    // Delete a watchlist
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteWatchlist } = await import("./watchlistService");
        return await deleteWatchlist(input.id, ctx.user.id);
      }),

    // Add a stock to a watchlist
    addStock: protectedProcedure
      .input(
        z.object({
          watchlistId: z.number(),
          symbol: z.string().min(1).max(16),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { addStockToWatchlist } = await import("./watchlistService");
        return await addStockToWatchlist(input.watchlistId, ctx.user.id, input.symbol);
      }),

    // Remove a stock from a watchlist
    removeStock: protectedProcedure
      .input(
        z.object({
          watchlistId: z.number(),
          symbol: z.string().min(1).max(16),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { removeStockFromWatchlist } = await import("./watchlistService");
        return await removeStockFromWatchlist(input.watchlistId, ctx.user.id, input.symbol);
      }),

    // Set a watchlist as default
    setDefault: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { setDefaultWatchlist } = await import("./watchlistService");
        return await setDefaultWatchlist(input.id, ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
