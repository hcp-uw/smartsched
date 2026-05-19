import { addMinutes, differenceInMinutes } from "date-fns";
import { supabase } from "../supabaseClient";
import type { CalendarEvent, Task } from "../data/mockData";
import { mockCalendarSources } from "../data/mockData";
import { MIN_EVENT_MINUTES } from "../utils/calendarDrag";

/** Map stored event color to a sidebar calendar (Supabase has no calendar_id column). */
export function calendarIdFromColor(
  hex: string,
  sources = mockCalendarSources
): string {
  const normalized = hex.toLowerCase();
  const match = sources.find((c) => c.color.toLowerCase() === normalized);
  return match?.id ?? sources[0]?.id ?? "cal1";
}

/**
 * Supabase: public.events + public.tasks (team schema).
 * Events: `date` (start), `end_date` (end) — run events_duration.sql in Supabase.
 */

export function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id
  );
}

export function ensureUuid(id: string): string {
  return isUuid(id) ? id : crypto.randomUUID();
}

export function isPersistedEventId(id: string): boolean {
  return /^\d+$/.test(String(id));
}

export function eventDurationMinutesForDb(start: Date, end: Date): number {
  return Math.max(
    MIN_EVENT_MINUTES,
    differenceInMinutes(end, start) || MIN_EVENT_MINUTES
  );
}

function hexToColorInt(hex: string): number {
  const h = hex.replace(/^#/, "");
  if (h.length !== 6 || !/^[0-9a-fA-F]+$/.test(h)) return 0x5b8def;
  return parseInt(h.slice(0, 6), 16);
}

function colorIntToHex(n: number): string {
  const u = Math.max(0, Math.min(0xffffff, Number(n) || 0));
  return `#${u.toString(16).padStart(6, "0")}`;
}

function isMissingColumnError(error: { message?: string; code?: string }): boolean {
  return (
    error.code === "PGRST204" ||
    Boolean(error.message?.match(/duration_minutes|end_date|column/i))
  );
}

function isDuplicateKeyError(error: { message?: string; code?: string }): boolean {
  return (
    error.code === "23505" ||
    Boolean(error.message?.includes("duplicate key"))
  );
}

function isNullIdError(error: { message?: string; code?: string }): boolean {
  return (
    error.code === "23502" ||
    Boolean(error.message?.match(/null value.*\bid\b/i))
  );
}

/** Postgres identity/sequence: app must not send `id`. */
function isGeneratedIdColumnError(error: { message?: string }): boolean {
  return Boolean(
    error.message?.includes("cannot insert a non-DEFAULT value into column") &&
    error.message?.includes('"id"')
  );
}

function sequenceResyncHint(table: "tasks" | "events"): string {
  return (
    `In Supabase → SQL Editor, run:\n` +
    `select setval(pg_get_serial_sequence('public.${table}','id'), ` +
    `coalesce((select max(id) from public.${table}), 0) + 1, false);`
  );
}

/**
 * Insert without `id` when the DB uses a sequence/identity (recommended).
 * Legacy DBs without a default on `id` fall back to manual ids + duplicate retry.
 */
async function insertWithUniqueIntegerId<T>(
  table: "tasks" | "events",
  nextId: () => Promise<number>,
  buildRow: (id?: number) => Record<string, unknown>,
  select: string,
  mapRow: (row: unknown) => T
): Promise<T> {
  const auto = await supabase
    .from(table)
    .insert(buildRow())
    .select(select)
    .single();

  if (!auto.error && auto.data) return mapRow(auto.data);

  if (auto.error && !isNullIdError(auto.error)) {
    if (isDuplicateKeyError(auto.error)) {
      throw new Error(
        `Could not create ${table} (duplicate id). ${sequenceResyncHint(table)}`
      );
    }
    throw auto.error;
  }

  // Legacy: table has no default on id — assign ids manually (RLS-safe retry)
  let id = await nextId();
  for (let attempt = 0; attempt < 30; attempt++) {
    const { data, error } = await supabase
      .from(table)
      .insert(buildRow(id))
      .select(select)
      .single();

    if (!error && data) return mapRow(data);
    if (error && isGeneratedIdColumnError(error)) {
      throw new Error(
        `This project uses auto-generated ${table} ids. Do not set id manually. ` +
          `If saves fail, ${sequenceResyncHint(table)}`
      );
    }
    if (error && isDuplicateKeyError(error)) {
      id++;
      continue;
    }
    throw error;
  }

  throw new Error(
    `Could not create ${table} row (id conflict). ${sequenceResyncHint(table)}`
  );
}

function taskPriorityToInt(p: Task["priority"]): number {
  if (p === "low") return 0;
  if (p === "medium") return 1;
  return 2;
}

function intToTaskPriority(n: number): Task["priority"] {
  if (n <= 0) return "low";
  if (n === 1) return "medium";
  return "high";
}

type EventsRow = {
  id: number;
  user_id: string;
  event_name: string;
  date: string | null;
  color: number;
  end_date?: string | null;
  duration_minutes?: number | null;
};

const EVENT_COLUMNS_FULL =
  "id,user_id,event_name,date,end_date,color,duration_minutes";
const EVENT_COLUMNS_LEGACY = "id,user_id,event_name,date,color";

function eventTimesFromRow(row: EventsRow): { start: Date; end: Date } {
  const start = row.date ? new Date(row.date) : new Date();
  if (row.end_date) {
    const end = new Date(row.end_date);
    if (end.getTime() > start.getTime()) return { start, end };
  }
  const mins =
    typeof row.duration_minutes === "number" && row.duration_minutes > 0
      ? row.duration_minutes
      : 60;
  return { start, end: addMinutes(start, mins) };
}

function buildEventWritePayloads(event: CalendarEvent) {
  const start = event.start;
  const end = event.end;
  const base = {
    event_name: event.title,
    date: start.toISOString(),
    color: hexToColorInt(event.color),
  };
  return [
    {
      ...base,
      end_date: end.toISOString(),
      duration_minutes: eventDurationMinutesForDb(start, end),
    },
    { ...base, end_date: end.toISOString() },
    {
      ...base,
      duration_minutes: eventDurationMinutesForDb(start, end),
    },
    base,
  ];
}

type TasksRow = {
  id: number;
  user_id: string;
  task_name: string;
  due_date: string | null;
  priority: number | null;
  status: string | null;
  color: number;
};

async function nextEventsTableId(): Promise<number> {
  const { data, error } = await supabase
    .from("events")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const max = data && typeof data.id === "number" ? data.id : 0;
  return max + 1;
}

async function nextTasksTableId(): Promise<number> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const max = data && typeof data.id === "number" ? data.id : 0;
  return max + 1;
}

export function calendarEventFromRow(row: EventsRow): CalendarEvent {
  const { start, end } = eventTimesFromRow(row);
  const color = colorIntToHex(row.color);
  return {
    id: String(row.id),
    title: row.event_name,
    start,
    end,
    category: "work",
    color,
    calendarId: calendarIdFromColor(color),
  };
}

async function writeEventRow(
  mode: "insert" | "update",
  event: CalendarEvent,
  userId: string,
  eventId?: number
): Promise<CalendarEvent | void> {
  if (mode === "insert") {
    const payloads = buildEventWritePayloads(event);
    let lastError: Error | null = null;

    for (const payload of payloads) {
      const row = { user_id: userId, ...payload };

      const { data, error } = await supabase
        .from("events")
        .insert(row)
        .select(EVENT_COLUMNS_FULL)
        .single();

      if (!error && data) return calendarEventFromRow(data as EventsRow);

      if (error && isDuplicateKeyError(error)) {
        throw new Error(
          `Could not create event (duplicate id). ${sequenceResyncHint("events")}`
        );
      }

      if (error && isMissingColumnError(error)) {
        const { data: d2, error: e2 } = await supabase
          .from("events")
          .insert(row)
          .select(EVENT_COLUMNS_LEGACY)
          .single();
        if (!e2 && d2) return calendarEventFromRow(d2 as EventsRow);
        if (e2 && isDuplicateKeyError(e2)) {
          throw new Error(
            `Could not create event (duplicate id). ${sequenceResyncHint("events")}`
          );
        }
        lastError = e2 ?? error;
        continue;
      }

      if (error && isNullIdError(error)) {
        lastError = error;
        break;
      }

      if (error) throw error;
    }

    if (lastError && isNullIdError(lastError)) {
      let id = await nextEventsTableId();
      for (let attempt = 0; attempt < 30; attempt++) {
        for (const payload of payloads) {
          const row = { id, user_id: userId, ...payload };
          const { data, error } = await supabase
            .from("events")
            .insert(row)
            .select(EVENT_COLUMNS_FULL)
            .single();

          if (!error && data) return calendarEventFromRow(data as EventsRow);

          if (error && isGeneratedIdColumnError(error)) {
            throw new Error(
              `Events use auto-generated ids. ${sequenceResyncHint("events")}`
            );
          }
          if (error && isDuplicateKeyError(error)) {
            id++;
            break;
          }
          if (error) throw error;
        }
      }
    }

    throw new Error(
      lastError
        ? `Could not create event (${lastError.message})`
        : "Could not create event."
    );
  }

  const payloads = buildEventWritePayloads(event);
  let lastError: Error | null = null;
  const id = eventId!;

  for (const payload of payloads) {
    const { data, error } = await supabase
      .from("events")
      .update(payload)
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (!error && data) return;
    if (error && isMissingColumnError(error)) {
      lastError = error;
      continue;
    }
    if (error) throw error;
  }

  throw new Error(
    lastError
      ? `Could not save event. Run starter-backend/supabase/events_duration.sql in Supabase, then reload the API schema. (${lastError.message})`
      : "Could not save event."
  );
}

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  let { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS_FULL)
    .order("date", { ascending: true });

  if (error && isMissingColumnError(error)) {
    const legacy = await supabase
      .from("events")
      .select(EVENT_COLUMNS_LEGACY)
      .order("date", { ascending: true });
    if (legacy.error) throw legacy.error;
    return ((legacy.data || []) as EventsRow[]).map(calendarEventFromRow);
  }

  if (error) throw error;
  return ((data || []) as EventsRow[]).map(calendarEventFromRow);
}

export async function insertCalendarEvent(
  event: CalendarEvent,
  userId: string
) {
  const saved = await writeEventRow("insert", event, userId);
  if (!saved) throw new Error("Failed to insert event");
  return saved;
}

export async function insertCalendarEvents(
  events: CalendarEvent[],
  userId: string
) {
  for (const event of events) {
    await insertCalendarEvent(event, userId);
  }
}

export async function updateCalendarEventRow(merged: CalendarEvent) {
  const id = Number(merged.id);
  if (!Number.isFinite(id)) {
    throw new Error(
      "Event is not saved yet. Wait a moment after creating it, then try again."
    );
  }

  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  if (!userId) throw new Error("You must be signed in to save changes.");

  await writeEventRow("update", merged, userId, id);
}

export async function deleteCalendarEvent(id: string) {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error("Invalid event id");
  const { error } = await supabase.from("events").delete().eq("id", n);
  if (error) throw error;
}

export function taskFromRow(row: TasksRow): Task {
  const st = (row.status || "pending").toLowerCase();
  const completed = st === "completed";
  return {
    id: String(row.id),
    title: row.task_name,
    completed,
    priority: intToTaskPriority(row.priority ?? 0),
    tags: [],
    duration: 30,
    dueDate: row.due_date ? new Date(row.due_date) : null,
    category: "work",
  };
}

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id,user_id,task_name,due_date,priority,status,color,created_at,updated_at"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data || []) as TasksRow[]).map(taskFromRow);
}

const TASK_COLUMNS =
  "id,user_id,task_name,due_date,priority,status,color,created_at,updated_at";

export async function insertTask(task: Task, userId: string) {
  return insertWithUniqueIntegerId(
    "tasks",
    nextTasksTableId,
    (id) => {
      const base = {
        user_id: userId,
        task_name: task.title,
        due_date: task.dueDate ? task.dueDate.toISOString() : null,
        priority: taskPriorityToInt(task.priority),
        status: task.completed ? "completed" : "pending",
        color: hexToColorInt("#5B8DEF"),
      };
      return id === undefined ? base : { id, ...base };
    },
    TASK_COLUMNS,
    (row) => taskFromRow(row as TasksRow)
  );
}

export async function updateTaskRow(merged: Task) {
  const id = Number(merged.id);
  if (!Number.isFinite(id)) throw new Error("Invalid task id");
  const { data, error } = await supabase
    .from("tasks")
    .update({
      task_name: merged.title,
      due_date: merged.dueDate ? merged.dueDate.toISOString() : null,
      priority: taskPriorityToInt(merged.priority),
      status: merged.completed ? "completed" : "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id,status")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      "Task update affected 0 rows (wrong id, RLS, or missing profile for user_id)"
    );
  }
}

export async function deleteTaskRow(id: string) {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error("Invalid task id");
  const { error } = await supabase.from("tasks").delete().eq("id", n);
  if (error) throw error;
}
