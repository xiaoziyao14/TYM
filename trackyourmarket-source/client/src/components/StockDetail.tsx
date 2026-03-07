import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, TrendingUp, TrendingDown, ArrowLeft, ExternalLink, Plus, Check, ChevronDown } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface StockDetailProps {
  symbol: string;
  onBack: () => void;
}

type TimeRange = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "MAX";

interface LocalWatchlist {
  id: string;
  name: string;
  stocks: string[];
}

const rangeConfig: Record<TimeRange, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "5D": { range: "5d", interval: "15m" },
  "1M": { range: "1mo", interval: "1d" },
  "6M": { range: "6mo", interval: "1d" },
  "YTD": { range: "ytd", interval: "1d" },
  "1Y": { range: "1y", interval: "1wk" },
  "5Y": { range: "5y", interval: "1mo" },
  "MAX": { range: "max", interval: "1mo" },
};

// localStorage helper functions
const WATCHLISTS_KEY = "trackyourmarket_watchlists";

const getWatchlistsFromStorage = (): LocalWatchlist[] => {
  try {
    const stored = localStorage.getItem(WATCHLISTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading watchlists from localStorage:", e);
  }
  return [];
};

const saveWatchlistsToStorage = (watchlists: LocalWatchlist[]) => {
  try {
    localStorage.setItem(WATCHLISTS_KEY, JSON.stringify(watchlists));
  } catch (e) {
    console.error("Error saving watchlists to localStorage:", e);
  }
};

export default function StockDetail({ symbol, onBack }: StockDetailProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("1M");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [addedToWatchlist, setAddedToWatchlist] = useState<string | null>(null);
  const [watchlists, setWatchlists] = useState<LocalWatchlist[]>([]);

  // Load watchlists from localStorage on mount
  useEffect(() => {
    setWatchlists(getWatchlistsFromStorage());
  }, []);

  const config = rangeConfig[selectedRange];

  const quoteQuery = trpc.stocks.getQuote.useQuery(
    { symbol },
    { refetchInterval: 60000 }
  );

  const chartQuery = trpc.stocks.getChart.useQuery(
    { symbol, range: config.range, interval: config.interval }
  );

  const quote = quoteQuery.data;
  const chart = chartQuery.data;

  const chartData = useMemo(() => {
    if (!chart?.dataPoints) return [];
    return chart.dataPoints.map((point: any) => {
      const date = new Date(point.timestamp);
      let label: string;
      if (selectedRange === "1D") {
        label = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } else if (selectedRange === "5D") {
        label = date.toLocaleDateString([], { weekday: "short", hour: "2-digit" });
      } else {
        label = date.toLocaleDateString([], { month: "short", day: "numeric" });
      }
      return {
        label,
        price: point.close,
        timestamp: point.timestamp,
      };
    });
  }, [chart, selectedRange]);

  const priceChange = quote?.regularMarketChange ?? 0;
  const priceChangePercent = quote?.regularMarketChangePercent ?? 0;
  const isPositive = priceChange >= 0;

  // Chart colors - Scholar Inbox style (more subtle)
  const chartColor = isPositive ? "#16a34a" : "#dc2626";
  const chartGradientId = `gradient-${symbol}`;

  // Get first price for reference line
  const firstPrice = chartData.length > 0 ? chartData[0].price : null;

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  // Check if stock is already in a watchlist
  const isInWatchlist = (watchlistId: string) => {
    const watchlist = watchlists.find(w => w.id === watchlistId);
    return watchlist?.stocks?.includes(symbol) ?? false;
  };

  const handleAddToWatchlist = (watchlistId: string) => {
    if (!isInWatchlist(watchlistId)) {
      const updatedWatchlists = watchlists.map(w => {
        if (w.id === watchlistId) {
          return { ...w, stocks: [...w.stocks, symbol] };
        }
        return w;
      });
      setWatchlists(updatedWatchlists);
      saveWatchlistsToStorage(updatedWatchlists);
      const watchlist = watchlists.find(w => w.id === watchlistId);
      setAddedToWatchlist(watchlist?.name || "Watchlist");
      setTimeout(() => setAddedToWatchlist(null), 3000);
    }
  };

  const handleCreateAndAdd = () => {
    if (newWatchlistName.trim()) {
      const newWatchlist: LocalWatchlist = {
        id: Date.now().toString(),
        name: newWatchlistName.trim(),
        stocks: [symbol],
      };
      const updatedWatchlists = [...watchlists, newWatchlist];
      setWatchlists(updatedWatchlists);
      saveWatchlistsToStorage(updatedWatchlists);
      setAddedToWatchlist(newWatchlist.name);
      setTimeout(() => setAddedToWatchlist(null), 3000);
      setShowCreateDialog(false);
      setNewWatchlistName("");
    }
  };

  if (quoteQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading stock data...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Failed to load stock data</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Card - Scholar Inbox Style */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {/* Back button and actions */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={onBack} className="gap-2 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              {/* Add to Watchlist Button - No login required */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant={addedToWatchlist ? "default" : "outline"} 
                    size="sm" 
                    className="gap-2"
                  >
                    {addedToWatchlist ? (
                      <>
                        <Check className="h-4 w-4" />
                        Added to {addedToWatchlist}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add to Watchlist
                        <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {watchlists.length > 0 ? (
                    <>
                      {watchlists.map((watchlist) => (
                        <DropdownMenuItem
                          key={watchlist.id}
                          onClick={() => handleAddToWatchlist(watchlist.id)}
                          disabled={isInWatchlist(watchlist.id)}
                          className="flex items-center justify-between"
                        >
                          <span>{watchlist.name}</span>
                          {isInWatchlist(watchlist.id) && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  ) : null}
                  <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Watchlist
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <a 
                href={`https://finance.yahoo.com/quote/${symbol}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Yahoo Finance
                </Button>
              </a>
            </div>
          </div>

          {/* Stock Info */}
          <div className="flex items-start gap-4 mb-6">
            <div className="flex items-center justify-center w-14 h-14 bg-primary/10 rounded-xl">
              <span className="text-xl font-bold text-primary">{symbol.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{symbol}</h1>
              <p className="text-muted-foreground">{quote.longName || "Stock"}</p>
            </div>
          </div>

          {/* Price Display */}
          <div className="flex items-baseline gap-4 mb-2">
            <span className="text-4xl font-bold text-foreground tracking-tight">
              ${quote.regularMarketPrice?.toFixed(2) ?? "—"}
            </span>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
              isPositive 
                ? "bg-green-50 text-green-600" 
                : "bg-red-50 text-red-600"
            }`}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })} · Market {new Date().getHours() >= 9 && new Date().getHours() < 16 ? "Open" : "Closed"}
          </p>
        </CardContent>
      </Card>

      {/* Chart Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {/* Time Range Selector - Scholar Inbox Tab Style */}
          <div className="flex items-center gap-1 mb-6 pb-4 border-b border-border overflow-x-auto">
            {(Object.keys(rangeConfig) as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                  selectedRange === range
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Chart Area */}
          <div className="h-[350px]">
            {chartQuery.isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={chartGradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColor} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    interval="preserveStartEnd"
                    minTickGap={50}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                    width={60}
                  />
                  {firstPrice && (
                    <ReferenceLine
                      y={firstPrice}
                      stroke="#e5e7eb"
                      strokeDasharray="4 4"
                    />
                  )}
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      padding: "12px 16px",
                    }}
                    labelStyle={{ color: "#6b7280", marginBottom: 4, fontSize: 12 }}
                    formatter={(value: number) => [
                      <span className="font-semibold text-foreground">${value.toFixed(2)}</span>, 
                      "Price"
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={chartColor}
                    strokeWidth={2}
                    fill={`url(#${chartGradientId})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No chart data available for this time range
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Stats Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Key Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatItem label="Open" value={`$${quote.regularMarketOpen?.toFixed(2) ?? "—"}`} />
            <StatItem label="Day High" value={`$${quote.regularMarketDayHigh?.toFixed(2) ?? "—"}`} />
            <StatItem label="Day Low" value={`$${quote.regularMarketDayLow?.toFixed(2) ?? "—"}`} />
            <StatItem 
              label="Volume" 
              value={quote.regularMarketVolume ? formatNumber(quote.regularMarketVolume) : "—"} 
            />
            <StatItem 
              label="Previous Close" 
              value={`$${quote.regularMarketPreviousClose?.toFixed(2) ?? "—"}`} 
            />
            <StatItem 
              label="52 Week High" 
              value={`$${quote.fiftyTwoWeekHigh?.toFixed(2) ?? "—"}`} 
            />
            <StatItem 
              label="52 Week Low" 
              value={`$${quote.fiftyTwoWeekLow?.toFixed(2) ?? "—"}`} 
            />
            <StatItem 
              label="Market Cap" 
              value={quote.marketCap ? formatNumber(quote.marketCap) : "—"} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Create Watchlist Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Watchlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Watchlist name"
              value={newWatchlistName}
              onChange={(e) => setNewWatchlistName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateAndAdd();
                }
              }}
            />
            <p className="text-sm text-muted-foreground">
              {symbol} will be added to this watchlist automatically.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAndAdd}
              disabled={!newWatchlistName.trim()}
            >
              Create & Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}
