import { callDataApi } from "./_core/dataApi";
import { US_STOCKS } from "./usStocks";

export interface StockQuote {
  symbol: string;
  longName: string;
  shortName?: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  regularMarketOpen?: number;
  regularMarketPreviousClose?: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketCap?: number;
  marketState?: string;
}

export interface ChartDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockChartData {
  symbol: string;
  meta: {
    currency: string;
    symbol: string;
    exchangeName: string;
    regularMarketPrice: number;
    chartPreviousClose: number;
  };
  dataPoints: ChartDataPoint[];
}

/**
 * Fetch stock chart data from Yahoo Finance
 */
export async function getStockChart(
  symbol: string,
  range: string = "1mo",
  interval: string = "1d"
): Promise<StockChartData | null> {
  try {
    const response = await callDataApi("YahooFinance/get_stock_chart", {
      query: {
        symbol: symbol.toUpperCase(),
        region: "US",
        interval,
        range,
      },
    });

    if (!response || typeof response !== 'object' || !('chart' in response)) {
      return null;
    }

    const chartResponse = response as { chart: { result: Array<any> } };
    if (!chartResponse.chart?.result?.[0]) {
      return null;
    }

    const result = chartResponse.chart.result[0];
    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};

    const dataPoints: ChartDataPoint[] = timestamps.map((ts: number, i: number) => ({
      timestamp: ts * 1000, // Convert to milliseconds
      open: quotes.open?.[i] || 0,
      high: quotes.high?.[i] || 0,
      low: quotes.low?.[i] || 0,
      close: quotes.close?.[i] || 0,
      volume: quotes.volume?.[i] || 0,
    }));

    return {
      symbol: meta.symbol,
      meta: {
        currency: meta.currency,
        symbol: meta.symbol,
        exchangeName: meta.exchangeName,
        regularMarketPrice: meta.regularMarketPrice,
        chartPreviousClose: meta.chartPreviousClose,
      },
      dataPoints,
    };
  } catch (error) {
    console.error(`Error fetching chart for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get stock quote (current price and basic info)
 */
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const chartData = await getStockChart(symbol, "1d", "1m");
    if (!chartData) return null;

    const latestPoint = chartData.dataPoints[chartData.dataPoints.length - 1];
    const firstPoint = chartData.dataPoints[0];
    const previousClose = chartData.meta.chartPreviousClose;
    const currentPrice = latestPoint?.close || chartData.meta.regularMarketPrice;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    // Calculate day high/low from all data points
    const dayHigh = Math.max(...chartData.dataPoints.map((d) => d.high).filter(h => h > 0));
    const dayLow = Math.min(...chartData.dataPoints.map((d) => d.low).filter(l => l > 0));

    // Get company name from US stocks list if available
    const stockInfo = US_STOCKS.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
    const companyName = stockInfo?.name || chartData.symbol;

    return {
      symbol: chartData.symbol,
      longName: companyName,
      shortName: chartData.symbol,
      regularMarketPrice: currentPrice,
      regularMarketChange: change,
      regularMarketChangePercent: changePercent,
      regularMarketDayHigh: dayHigh,
      regularMarketDayLow: dayLow,
      regularMarketVolume: latestPoint?.volume || 0,
      regularMarketOpen: firstPoint?.open || 0,
      regularMarketPreviousClose: previousClose,
      fiftyTwoWeekHigh: 0, // Would need separate API call
      fiftyTwoWeekLow: 0,
      marketCap: 0, // Would need separate API call
      marketState: "REGULAR", // Assume market is open
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Search for stocks by symbol or company name
 * Searches through all 7000+ US stocks from NASDAQ, NYSE, and AMEX
 */
export async function searchStocks(query: string): Promise<Array<{ symbol: string; name: string; exchange?: string }>> {
  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) {
    return [];
  }

  // Search through all US stocks
  const results = US_STOCKS.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(lowerQuery) || 
      stock.name.toLowerCase().includes(lowerQuery)
  );

  // Sort results: exact symbol matches first, then by symbol alphabetically
  results.sort((a, b) => {
    const aExact = a.symbol.toLowerCase() === lowerQuery;
    const bExact = b.symbol.toLowerCase() === lowerQuery;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    const aStartsWith = a.symbol.toLowerCase().startsWith(lowerQuery);
    const bStartsWith = b.symbol.toLowerCase().startsWith(lowerQuery);
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    return a.symbol.localeCompare(b.symbol);
  });

  // Limit to 50 results for performance
  return results.slice(0, 50).map(stock => ({
    symbol: stock.symbol,
    name: stock.name,
    exchange: stock.exchange,
  }));
}
