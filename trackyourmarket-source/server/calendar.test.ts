import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsByMonth,
  getUpcomingEvents,
} from "./calendarService";

describe("calendar API", () => {
  let createdEventId: number | null = null;

  it("should create a calendar event", async () => {
    const result = await createEvent({
      title: "Test Earnings Report",
      description: "Q4 2025 earnings call",
      eventDate: new Date("2026-02-15T10:00:00Z"),
      eventType: "earnings",
      symbol: "AAPL",
      importance: "high",
    });

    expect(result).not.toBeNull();
    expect(result?.id).toBeGreaterThan(0);
    createdEventId = result?.id || null;
  });

  it("should get all events", async () => {
    const events = await getAllEvents();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
  });

  it("should get event by ID", async () => {
    if (!createdEventId) {
      throw new Error("No event created to test");
    }

    const event = await getEventById(createdEventId);
    expect(event).not.toBeNull();
    expect(event?.title).toBe("Test Earnings Report");
    expect(event?.symbol).toBe("AAPL");
    expect(event?.eventType).toBe("earnings");
  });

  it("should update a calendar event", async () => {
    if (!createdEventId) {
      throw new Error("No event created to test");
    }

    const success = await updateEvent(createdEventId, {
      title: "Updated Earnings Report",
      importance: "medium",
    });

    expect(success).toBe(true);

    const updated = await getEventById(createdEventId);
    expect(updated?.title).toBe("Updated Earnings Report");
    expect(updated?.importance).toBe("medium");
  });

  it("should get events by month", async () => {
    const events = await getEventsByMonth(2026, 2);
    expect(Array.isArray(events)).toBe(true);
  });

  it("should delete a calendar event", async () => {
    if (!createdEventId) {
      throw new Error("No event created to test");
    }

    const success = await deleteEvent(createdEventId);
    expect(success).toBe(true);

    const deleted = await getEventById(createdEventId);
    expect(deleted).toBeNull();
  });
});
