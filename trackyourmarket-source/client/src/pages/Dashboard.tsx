import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Plus, TrendingUp, TrendingDown, X, Calendar, Search, ThumbsUp, ExternalLink, Bookmark, MoreVertical, Edit2, Trash2, FolderPlus, ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import StockDetail from "@/components/StockDetail";

interface WatchlistStock {
  symbol: string;
  name: string;
}

interface LocalWatchlist {
  id: string;
  name: string;
  stocks: string[];
}

// S&P 100 stock names for display
const SP100_STOCKS: Record<string, string> = {
  AAPL: "Apple Inc.",
  ABBV: "AbbVie Inc.",
  ABT: "Abbott Laboratories",
  ACN: "Accenture plc",
  ADBE: "Adobe Inc.",
  AIG: "American International Group",
  AMD: "Advanced Micro Devices",
  AMGN: "Amgen Inc.",
  AMT: "American Tower Corporation",
  AMZN: "Amazon.com Inc.",
  AVGO: "Broadcom Inc.",
  AXP: "American Express Company",
  BA: "Boeing Company",
  BAC: "Bank of America Corporation",
  BK: "BNY Mellon",
  BKNG: "Booking Holdings Inc.",
  BLK: "BlackRock Inc.",
  BMY: "Bristol-Myers Squibb",
  "BRK.B": "Berkshire Hathaway Inc.",
  C: "Citigroup Inc.",
  CAT: "Caterpillar Inc.",
  CHTR: "Charter Communications",
  CL: "Colgate-Palmolive Company",
  CMCSA: "Comcast Corporation",
  COF: "Capital One Financial",
  COP: "ConocoPhillips",
  COST: "Costco Wholesale Corporation",
  CRM: "Salesforce Inc.",
  CSCO: "Cisco Systems Inc.",
  CVS: "CVS Health Corporation",
  CVX: "Chevron Corporation",
  DE: "Deere & Company",
  DHR: "Danaher Corporation",
  DIS: "Walt Disney Company",
  DOW: "Dow Inc.",
  DUK: "Duke Energy Corporation",
  EMR: "Emerson Electric Co.",
  EXC: "Exelon Corporation",
  F: "Ford Motor Company",
  FDX: "FedEx Corporation",
  GD: "General Dynamics Corporation",
  GE: "General Electric Company",
  GILD: "Gilead Sciences Inc.",
  GM: "General Motors Company",
  GOOG: "Alphabet Inc. (Class C)",
  GOOGL: "Alphabet Inc. (Class A)",
  GS: "Goldman Sachs Group Inc.",
  HD: "Home Depot Inc.",
  HON: "Honeywell International",
  IBM: "IBM Corporation",
  INTC: "Intel Corporation",
  JNJ: "Johnson & Johnson",
  JPM: "JPMorgan Chase & Co.",
  KHC: "Kraft Heinz Company",
  KO: "Coca-Cola Company",
  LIN: "Linde plc",
  LLY: "Eli Lilly and Company",
  LMT: "Lockheed Martin Corporation",
  LOW: "Lowe's Companies Inc.",
  MA: "Mastercard Inc.",
  MCD: "McDonald's Corporation",
  MDLZ: "Mondelez International",
  MDT: "Medtronic plc",
  MET: "MetLife Inc.",
  META: "Meta Platforms Inc.",
  MMM: "3M Company",
  MO: "Altria Group Inc.",
  MRK: "Merck & Co. Inc.",
  MS: "Morgan Stanley",
  MSFT: "Microsoft Corporation",
  NEE: "NextEra Energy Inc.",
  NFLX: "Netflix Inc.",
  NKE: "Nike Inc.",
  NVDA: "NVIDIA Corporation",
  ORCL: "Oracle Corporation",
  PEP: "PepsiCo Inc.",
  PFE: "Pfizer Inc.",
  PG: "Procter & Gamble Company",
  PM: "Philip Morris International",
  PYPL: "PayPal Holdings Inc.",
  QCOM: "Qualcomm Inc.",
  RTX: "RTX Corporation",
  SBUX: "Starbucks Corporation",
  SCHW: "Charles Schwab Corporation",
  SO: "Southern Company",
  SPG: "Simon Property Group",
  T: "AT&T Inc.",
  TGT: "Target Corporation",
  TMO: "Thermo Fisher Scientific",
  TMUS: "T-Mobile US Inc.",
  TSLA: "Tesla Inc.",
  TXN: "Texas Instruments Inc.",
  UNH: "UnitedHealth Group Inc.",
  UNP: "Union Pacific Corporation",
  UPS: "United Parcel Service",
  USB: "U.S. Bancorp",
  V: "Visa Inc.",
  VZ: "Verizon Communications",
  WBA: "Walgreens Boots Alliance",
  WFC: "Wells Fargo & Company",
  WMT: "Walmart Inc.",
  XOM: "Exxon Mobil Corporation",
  UBER: "Uber Technologies Inc.",
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
  // Return default watchlist if none exists
  const defaultWatchlist: LocalWatchlist = {
    id: "default",
    name: "My Watchlist",
    stocks: ["AAPL", "NVDA", "MSFT", "TSLA"],
  };
  saveWatchlistsToStorage([defaultWatchlist]);
  return [defaultWatchlist];
};

const saveWatchlistsToStorage = (watchlists: LocalWatchlist[]) => {
  try {
    localStorage.setItem(WATCHLISTS_KEY, JSON.stringify(watchlists));
  } catch (e) {
    console.error("Error saving watchlists to localStorage:", e);
  }
};

export default function Dashboard() {
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<"brief" | "watchlist">("brief");
  
  // Watchlist management state
  const [watchlists, setWatchlists] = useState<LocalWatchlist[]>([]);
  const [expandedWatchlists, setExpandedWatchlists] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddStockDialog, setShowAddStockDialog] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [renameWatchlistName, setRenameWatchlistName] = useState("");
  const [watchlistToEdit, setWatchlistToEdit] = useState<LocalWatchlist | null>(null);
  const [addStockToWatchlistId, setAddStockToWatchlistId] = useState<string | null>(null);

  // Load watchlists from localStorage
  useEffect(() => {
    const loaded = getWatchlistsFromStorage();
    setWatchlists(loaded);
    // Expand all watchlists by default
    setExpandedWatchlists(new Set(loaded.map(w => w.id)));
  }, []);

  // Search stocks
  const stockSearch = trpc.stocks.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  // Get news feed
  const newsFeed = trpc.news.getByRelevance.useQuery({ limit: 20 });

  // Refresh news on mount
  const refreshNews = trpc.news.refresh.useMutation();
  useEffect(() => {
    refreshNews.mutate();
  }, []);

  // Toggle watchlist expansion
  const toggleWatchlistExpand = (id: string) => {
    setExpandedWatchlists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Create new watchlist
  const handleCreateWatchlist = () => {
    if (!newWatchlistName.trim()) return;
    const newWatchlist: LocalWatchlist = {
      id: Date.now().toString(),
      name: newWatchlistName.trim(),
      stocks: [],
    };
    const updated = [...watchlists, newWatchlist];
    setWatchlists(updated);
    saveWatchlistsToStorage(updated);
    setExpandedWatchlists(prev => new Set([...Array.from(prev), newWatchlist.id]));
    setShowCreateDialog(false);
    setNewWatchlistName("");
  };

  // Rename watchlist
  const handleRenameWatchlist = () => {
    if (!watchlistToEdit || !renameWatchlistName.trim()) return;
    const updated = watchlists.map(w => 
      w.id === watchlistToEdit.id ? { ...w, name: renameWatchlistName.trim() } : w
    );
    setWatchlists(updated);
    saveWatchlistsToStorage(updated);
    setShowRenameDialog(false);
    setRenameWatchlistName("");
    setWatchlistToEdit(null);
  };

  // Delete watchlist
  const handleDeleteWatchlist = () => {
    if (!watchlistToEdit) return;
    const updated = watchlists.filter(w => w.id !== watchlistToEdit.id);
    setWatchlists(updated);
    saveWatchlistsToStorage(updated);
    setShowDeleteDialog(false);
    setWatchlistToEdit(null);
  };

  // Add stock to watchlist
  const handleAddStock = (symbol: string) => {
    if (!addStockToWatchlistId) return;
    const updated = watchlists.map(w => {
      if (w.id === addStockToWatchlistId && !w.stocks.includes(symbol)) {
        return { ...w, stocks: [...w.stocks, symbol] };
      }
      return w;
    });
    setWatchlists(updated);
    saveWatchlistsToStorage(updated);
    setShowAddStockDialog(false);
    setSearchQuery("");
    setAddStockToWatchlistId(null);
  };

  // Remove stock from watchlist
  const handleRemoveStock = (watchlistId: string, symbol: string) => {
    const updated = watchlists.map(w => {
      if (w.id === watchlistId) {
        return { ...w, stocks: w.stocks.filter(s => s !== symbol) };
      }
      return w;
    });
    setWatchlists(updated);
    saveWatchlistsToStorage(updated);
    if (selectedStock === symbol) {
      setSelectedStock(null);
    }
  };

  // Handle stock click from search
  const handleSearchStockClick = (symbol: string) => {
    setSelectedStock(symbol);
    setActiveTab("watchlist");
    setShowSearch(false);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Scholar Inbox Style */}
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">TrackYourMarket</h1>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => { setActiveTab("brief"); setSelectedStock(null); }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "brief" && !selectedStock
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                Daily Brief
              </button>
              <button
                onClick={() => setActiveTab("watchlist")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "watchlist" || selectedStock
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                Watchlist
              </button>
              <Link href="/calendar">
                <button className="px-4 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendar
                </button>
              </Link>
            </nav>

            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearch(true)}
                  className="pl-9 w-48 md:w-64 h-9 bg-muted/50 border-0 focus:bg-white focus:border focus:border-border"
                />
                {showSearch && stockSearch.data && stockSearch.data.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                    {stockSearch.data.map((stock) => (
                      <button
                        key={stock.symbol}
                        onClick={() => handleSearchStockClick(stock.symbol)}
                        className="w-full px-4 py-3 text-left hover:bg-muted/50 border-b border-border last:border-0 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-foreground">{stock.symbol}</div>
                          <div className="text-xs text-muted-foreground">{stock.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {showSearch && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                  className="h-9 w-9 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto px-4 py-6">
        {selectedStock ? (
          <StockDetail 
            symbol={selectedStock} 
            onBack={() => setSelectedStock(null)} 
          />
        ) : activeTab === "watchlist" ? (
          <div>
            {/* Watchlist Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">My Watchlists</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {watchlists.length} watchlist{watchlists.length !== 1 ? 's' : ''} • {watchlists.reduce((acc, w) => acc + w.stocks.length, 0)} stocks total
                </p>
              </div>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <FolderPlus className="h-4 w-4" />
                New Watchlist
              </Button>
            </div>

            {/* Watchlists List */}
            <div className="space-y-4">
              {watchlists.map((watchlist) => (
                <Card key={watchlist.id} className="overflow-hidden">
                  {/* Watchlist Header */}
                  <div 
                    className="flex items-center justify-between px-5 py-4 bg-muted/30 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleWatchlistExpand(watchlist.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedWatchlists.has(watchlist.id) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <h3 className="font-semibold text-foreground">{watchlist.name}</h3>
                        <p className="text-xs text-muted-foreground">{watchlist.stocks.length} stocks</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAddStockToWatchlistId(watchlist.id);
                          setShowAddStockDialog(true);
                        }}
                        className="h-8 gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add Stock
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setWatchlistToEdit(watchlist);
                            setRenameWatchlistName(watchlist.name);
                            setShowRenameDialog(true);
                          }}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setWatchlistToEdit(watchlist);
                              setShowDeleteDialog(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Watchlist Stocks */}
                  {expandedWatchlists.has(watchlist.id) && (
                    <CardContent className="p-0">
                      {watchlist.stocks.length > 0 ? (
                        <div className="divide-y divide-border">
                          {watchlist.stocks.map((symbol) => (
                            <WatchlistStockRow
                              key={symbol}
                              symbol={symbol}
                              name={SP100_STOCKS[symbol] || symbol}
                              onSelect={() => setSelectedStock(symbol)}
                              onRemove={() => handleRemoveStock(watchlist.id, symbol)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-muted-foreground mb-3">No stocks in this watchlist yet.</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setAddStockToWatchlistId(watchlist.id);
                              setShowAddStockDialog(true);
                            }}
                            className="gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Add Your First Stock
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {watchlists.length === 0 && (
              <Card className="py-12">
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-4">No watchlists yet. Create your first one!</p>
                  <Button onClick={() => setShowCreateDialog(true)} variant="outline" className="gap-2">
                    <FolderPlus className="h-4 w-4" />
                    Create Watchlist
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <NewsFeed news={newsFeed.data || []} loading={newsFeed.isLoading} />
        )}
      </main>

      {/* Create Watchlist Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Watchlist</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Watchlist name"
              value={newWatchlistName}
              onChange={(e) => setNewWatchlistName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateWatchlist()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWatchlist}
              disabled={!newWatchlistName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Watchlist Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Watchlist</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="New name"
              value={renameWatchlistName}
              onChange={(e) => setRenameWatchlistName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameWatchlist()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRenameWatchlist}
              disabled={!renameWatchlistName.trim()}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Watchlist Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Watchlist</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete "{watchlistToEdit?.name}"? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteWatchlist}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Stock Dialog */}
      <Dialog open={showAddStockDialog} onOpenChange={setShowAddStockDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Stock to Watchlist</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by symbol or company name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            {stockSearch.data && stockSearch.data.length > 0 && (
              <div className="mt-4 max-h-60 overflow-y-auto border rounded-lg">
                {stockSearch.data.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleAddStock(stock.symbol)}
                    className="w-full px-4 py-3 text-left hover:bg-muted/50 border-b border-border last:border-0 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-foreground">{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground">{stock.name}</div>
                    </div>
                    <Plus className="h-4 w-4 text-primary" />
                  </button>
                ))}
              </div>
            )}
            {searchQuery && stockSearch.data?.length === 0 && (
              <p className="text-center text-muted-foreground mt-4">No stocks found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WatchlistStockRow({
  symbol,
  name,
  onSelect,
  onRemove,
}: {
  symbol: string;
  name: string;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const quote = trpc.stocks.getQuote.useQuery({ symbol }, { refetchInterval: 60000 });

  return (
    <div 
      className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 cursor-pointer transition-colors group"
      onClick={onSelect}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <span className="text-sm font-bold text-primary">{symbol.slice(0, 2)}</span>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-foreground">{symbol}</div>
          <div className="text-sm text-muted-foreground">{name}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {quote.isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : quote.data ? (
          <div className="text-right">
            <div className="font-semibold text-foreground">
              ${quote.data.regularMarketPrice.toFixed(2)}
            </div>
            <div className={`text-sm flex items-center justify-end gap-1 ${
              quote.data.regularMarketChangePercent >= 0 
                ? "text-green-600" 
                : "text-red-600"
            }`}>
              {quote.data.regularMarketChangePercent >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(quote.data.regularMarketChangePercent).toFixed(2)}%
            </div>
          </div>
        ) : null}
        
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function NewsFeed({ news, loading }: { news: any[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading market news...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Today's Market Brief</h2>
        <p className="text-muted-foreground mt-2">
          Ranked by relevance — not by time. Stay informed with the most important market news.
        </p>
      </div>

      {/* Info Card */}
      <Card className="mb-8 border-l-4 border-l-primary bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ThumbsUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Relevance Index: 0 — 100</p>
              <p className="text-sm text-muted-foreground mt-1">
                This index measures how important this news is to market participants, not price prediction.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* News List - Scholar Inbox Style */}
      <div className="space-y-4">
        {news.map((article, index) => (
          <Card 
            key={article.id} 
            className="hover:shadow-md transition-all group border-l-4 border-l-transparent hover:border-l-primary"
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Index Number */}
                <div className="hidden md:flex items-center justify-center w-8 h-8 bg-muted rounded-full text-sm font-medium text-muted-foreground shrink-0">
                  {index + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <Link
                    href={`/news/${article.id}`}
                    className="text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 group-hover:underline decoration-primary/30 cursor-pointer"
                  >
                    {article.title}
                  </Link>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="font-medium">{article.source}</span>
                    <span>•</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>

                  {/* Key Points */}
                  {article.keyPoints && article.keyPoints.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {article.keyPoints.map((point: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary font-bold mt-0.5">•</span>
                          <span dangerouslySetInnerHTML={{ 
                            __html: point.replace(/([\$€£¥]?[\d,]+\.?\d*[%BMK]?(?:\s*(?:billion|million|vs|YoY|QoQ))?)/gi, '<strong class="text-foreground">$1</strong>')
                          }} />
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    {/* Tags */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {article.companies.length > 0 && article.companies.map((symbol: string) => (
                        <span
                          key={symbol}
                          className="px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium hover:bg-primary/20 transition-colors cursor-pointer"
                        >
                          {symbol}
                        </span>
                      ))}
                    </div>

                    {/* Actions & Score */}
                    <div className="flex items-center gap-4">
                      {/* Relevance Score */}
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        article.relevanceIndex >= 80
                          ? "bg-green-50 text-green-600"
                          : article.relevanceIndex >= 50
                          ? "bg-yellow-50 text-yellow-600"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {article.relevanceIndex}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Bookmark className="h-4 w-4" />
                        </Button>
                        <a href={article.url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {news.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <p className="text-muted-foreground">No news articles available at the moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
