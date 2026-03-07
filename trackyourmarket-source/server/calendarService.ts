import { eq, and, gte, lte, desc } from "drizzle-orm";
import { calendarEvents, type InsertCalendarEvent, type CalendarEvent } from "../drizzle/schema";
import { getDb } from "./db";

export type EventType = "earnings" | "dividend" | "economic" | "ipo" | "custom";
export type Importance = "low" | "medium" | "high";

export interface CalendarEventInput {
  title: string;
  description?: string;
  eventDate: Date;
  eventType: EventType;
  symbol?: string;
  importance: Importance;
}

/**
 * Get all calendar events
 */
export async function getAllEvents(): Promise<CalendarEvent[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(calendarEvents)
    .orderBy(desc(calendarEvents.eventDate));
}

/**
 * Get events for a specific month
 */
export async function getEventsByMonth(year: number, month: number): Promise<CalendarEvent[]> {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        gte(calendarEvents.eventDate, startDate),
        lte(calendarEvents.eventDate, endDate)
      )
    )
    .orderBy(calendarEvents.eventDate);
}

/**
 * Get events for a specific date range
 */
export async function getEventsByDateRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        gte(calendarEvents.eventDate, startDate),
        lte(calendarEvents.eventDate, endDate)
      )
    )
    .orderBy(calendarEvents.eventDate);
}

/**
 * Get a single event by ID
 */
export async function getEventById(id: number): Promise<CalendarEvent | null> {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.id, id))
    .limit(1);

  return results[0] || null;
}

/**
 * Create a new calendar event
 */
export async function createEvent(event: CalendarEventInput): Promise<{ id: number } | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(calendarEvents).values({
      title: event.title,
      description: event.description || null,
      eventDate: event.eventDate,
      eventType: event.eventType,
      symbol: event.symbol || null,
      importance: event.importance,
    });

    return { id: Number(result[0].insertId) };
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return null;
  }
}

/**
 * Update an existing calendar event
 */
export async function updateEvent(id: number, event: Partial<CalendarEventInput>): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const updateData: Partial<InsertCalendarEvent> = {};
    if (event.title !== undefined) updateData.title = event.title;
    if (event.description !== undefined) updateData.description = event.description;
    if (event.eventDate !== undefined) updateData.eventDate = event.eventDate;
    if (event.eventType !== undefined) updateData.eventType = event.eventType;
    if (event.symbol !== undefined) updateData.symbol = event.symbol;
    if (event.importance !== undefined) updateData.importance = event.importance;

    await db
      .update(calendarEvents)
      .set(updateData)
      .where(eq(calendarEvents.id, id));

    return true;
  } catch (error) {
    console.error("Error updating calendar event:", error);
    return false;
  }
}

/**
 * Delete a calendar event
 */
export async function deleteEvent(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
    return true;
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return false;
  }
}

/**
 * Get upcoming events (next 7 days)
 */
export async function getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        gte(calendarEvents.eventDate, now),
        lte(calendarEvents.eventDate, endDate)
      )
    )
    .orderBy(calendarEvents.eventDate);
}
