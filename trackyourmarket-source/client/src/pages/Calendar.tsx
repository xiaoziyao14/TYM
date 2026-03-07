import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Trash2,
  TrendingUp,
  DollarSign,
  Globe,
  Rocket,
  Star,
  ArrowLeft
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";

type EventType = "earnings" | "dividend" | "economic" | "ipo" | "custom";
type Importance = "low" | "medium" | "high";

interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  eventDate: Date;
  eventType: EventType;
  symbol: string | null;
  importance: Importance;
}

const eventTypeIcons: Record<EventType, React.ReactNode> = {
  earnings: <TrendingUp className="h-4 w-4" />,
  dividend: <DollarSign className="h-4 w-4" />,
  economic: <Globe className="h-4 w-4" />,
  ipo: <Rocket className="h-4 w-4" />,
  custom: <Star className="h-4 w-4" />,
};

const eventTypeColors: Record<EventType, string> = {
  earnings: "bg-blue-50 text-blue-600 border-blue-200",
  dividend: "bg-green-50 text-green-600 border-green-200",
  economic: "bg-amber-50 text-amber-600 border-amber-200",
  ipo: "bg-purple-50 text-purple-600 border-purple-200",
  custom: "bg-gray-50 text-gray-600 border-gray-200",
};

const eventTypeLabels: Record<EventType, string> = {
  earnings: "Earnings",
  dividend: "Dividend",
  economic: "Economic",
  ipo: "IPO",
  custom: "Custom",
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formEventType, setFormEventType] = useState<EventType>("custom");
  const [formSymbol, setFormSymbol] = useState("");
  const [formImportance, setFormImportance] = useState<Importance>("medium");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // Fetch events for the current month
  const eventsQuery = trpc.calendar.getByMonth.useQuery({ year, month });
  const createMutation = trpc.calendar.create.useMutation();
  const updateMutation = trpc.calendar.update.useMutation();
  const deleteMutation = trpc.calendar.delete.useMutation();
  const utils = trpc.useUtils();

  // Get days in month
  const daysInMonth = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const days: Date[] = [];

    // Add padding days from previous month
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, -i);
      days.push(d);
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month - 1, i));
    }

    // Add padding days for next month to complete the grid
    const endPadding = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= endPadding; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [year, month]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    if (eventsQuery.data) {
      for (const event of eventsQuery.data) {
        const dateKey = new Date(event.eventDate).toDateString();
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(event as CalendarEvent);
      }
    }
    return map;
  }, [eventsQuery.data]);

  const navigateMonth = (delta: number) => {
    setCurrentDate(new Date(year, month - 1 + delta, 1));
    setSelectedDate(null);
  };

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormEventType("custom");
    setFormSymbol("");
    setFormImportance("medium");
    setEditingEvent(null);
  };

  const openAddDialog = (date?: Date) => {
    resetForm();
    if (date) {
      setSelectedDate(date);
    }
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || "");
    setFormEventType(event.eventType);
    setFormSymbol(event.symbol || "");
    setFormImportance(event.importance);
    setSelectedDate(new Date(event.eventDate));
    setIsAddDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formTitle || !selectedDate) return;

    const eventData = {
      title: formTitle,
      description: formDescription || undefined,
      eventDate: selectedDate.toISOString(),
      eventType: formEventType,
      symbol: formSymbol || undefined,
      importance: formImportance,
    };

    if (editingEvent) {
      await updateMutation.mutateAsync({ id: editingEvent.id, ...eventData });
    } else {
      await createMutation.mutateAsync(eventData);
    }

    utils.calendar.getByMonth.invalidate({ year, month });
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    utils.calendar.getByMonth.invalidate({ year, month });
  };

  const isCurrentMonth = (date: Date) => date.getMonth() === month - 1;
  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

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
                <Link href="/">
                  <h1 className="text-xl font-bold text-foreground tracking-tight cursor-pointer hover:text-primary transition-colors">
                    TrackYourMarket
                  </h1>
                </Link>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/">
                <button className="px-4 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  Daily Brief
                </button>
              </Link>
              <Link href="/">
                <button className="px-4 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  Watchlist
                </button>
              </Link>
              <button className="px-4 py-2 text-sm font-medium rounded-md bg-primary/10 text-primary flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Calendar
              </button>
            </nav>

            {/* Add Event Button */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openAddDialog()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    {editingEvent ? "Edit Event" : "Add New Event"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Event title"
                      className="h-10"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate ? selectedDate.toISOString().split("T")[0] : ""}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      className="h-10"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">Event Type</Label>
                      <Select value={formEventType} onValueChange={(v) => setFormEventType(v as EventType)}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="earnings">Earnings Report</SelectItem>
                          <SelectItem value="dividend">Dividend</SelectItem>
                          <SelectItem value="economic">Economic Event</SelectItem>
                          <SelectItem value="ipo">IPO</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="importance">Importance</Label>
                      <Select value={formImportance} onValueChange={(v) => setFormImportance(v as Importance)}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="symbol">Stock Symbol (optional)</Label>
                    <Input
                      id="symbol"
                      value={formSymbol}
                      onChange={(e) => setFormSymbol(e.target.value.toUpperCase())}
                      placeholder="e.g., AAPL"
                      className="h-10"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter className="flex gap-2">
                  {editingEvent && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleDelete(editingEvent.id);
                        setIsAddDialogOpen(false);
                        resetForm();
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                  <Button onClick={handleSubmit} disabled={!formTitle || !selectedDate}>
                    {editingEvent ? "Update Event" : "Create Event"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Market Calendar</h2>
              <p className="text-sm text-muted-foreground">Track earnings, dividends, and market events</p>
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h3 className="text-xl font-semibold text-foreground">
                {monthNames[month - 1]} {year}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-6">
          {(Object.keys(eventTypeColors) as EventType[]).map((type) => (
            <div key={type} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${eventTypeColors[type]}`}>
              {eventTypeIcons[type]}
              <span className="text-sm font-medium">{eventTypeLabels[type]}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-0">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/30">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-3 text-center text-sm font-semibold text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {daysInMonth.map((date, index) => {
                const dateEvents = eventsByDate.get(date.toDateString()) || [];
                const inCurrentMonth = isCurrentMonth(date);
                const today = isToday(date);

                return (
                  <div
                    key={index}
                    className={`min-h-[110px] p-2 border-b border-r border-border cursor-pointer hover:bg-muted/30 transition-colors ${
                      !inCurrentMonth ? "bg-muted/10" : "bg-white"
                    } ${today ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : ""}`}
                    onClick={() => openAddDialog(date)}
                  >
                    <div
                      className={`text-sm font-medium mb-2 w-7 h-7 flex items-center justify-center rounded-full ${
                        !inCurrentMonth ? "text-muted-foreground/40" : "text-foreground"
                      } ${today ? "bg-primary text-white" : ""}`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dateEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs p-1.5 rounded border truncate cursor-pointer hover:shadow-sm transition-shadow ${eventTypeColors[event.eventType]}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(event);
                          }}
                        >
                          {event.symbol && <span className="font-semibold">{event.symbol} </span>}
                          {event.title}
                        </div>
                      ))}
                      {dateEvents.length > 2 && (
                        <div className="text-xs text-primary font-medium pl-1">
                          +{dateEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events Section */}
        {eventsQuery.data && eventsQuery.data.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Events This Month</h3>
              <div className="space-y-3">
                {eventsQuery.data.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => openEditDialog(event as CalendarEvent)}
                  >
                    <div className={`p-2 rounded-lg ${eventTypeColors[event.eventType as EventType]}`}>
                      {eventTypeIcons[event.eventType as EventType]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {event.symbol && <span className="text-primary mr-2">{event.symbol}</span>}
                        {event.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.eventDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${eventTypeColors[event.eventType as EventType]}`}>
                      {eventTypeLabels[event.eventType as EventType]}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
