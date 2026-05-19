import { supabase } from "../supabaseClient";
import type { CalendarEvent, Task } from "../data/mockData";

/**
 * Supabase: public.events + public.tasks (team schema).
 * FK: user_id → profiles(id); use auth session user id.
 * Events: only `date` is stored; UI end time defaults to start + 1h on load.
 * Tasks: tags/duration/category are UI-only (not persisted).
 */

export function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id
  );
}

export function ensureUuid(id: string): string {
  return isUuid(id) ? id : crypto.randomUUID();
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
};

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
  const start = row.date ? new Date(row.date) : new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    id: String(row.id),
    title: row.event_name,
    start,
    end,
    category: "work",
    color: colorIntToHex(row.color),
  };
}

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("id,user_id,event_name,date,color")
    .order("date", { ascending: true });
  if (error) throw error;
  return ((data || []) as EventsRow[]).map(calendarEventFromRow);
}

export async function insertCalendarEvent(
  event: CalendarEvent,
  userId: string
) {
  const nextId = await nextEventsTableId();
  const row = {
    id: nextId,
    user_id: userId,
    event_name: event.title,
    date: event.start.toISOString(),
    color: hexToColorInt(event.color),
  };
  const { data, error } = await supabase
    .from("events")
    .insert(row)
    .select("id,user_id,event_name,date,color")
    .single();
  if (error) throw error;
  return calendarEventFromRow(data as EventsRow);
}

export async function insertCalendarEvents(
  events: CalendarEvent[],
  userId: string
) {
  if (events.length === 0) return;
  const baseId = await nextEventsTableId();
  const rows = events.map((event, i) => ({
    id: baseId + i,
    user_id: userId,
    event_name: event.title,
    date: event.start.toISOString(),
    color: hexToColorInt(event.color),
  }));
  const { error } = await supabase.from("events").insert(rows);
  if (error) throw error;
}

export async function updateCalendarEventRow(merged: CalendarEvent) {
  const id = Number(merged.id);
  if (!Number.isFinite(id)) throw new Error("Invalid event id");
  const { data, error } = await supabase
    .from("events")
    .update({
      event_name: merged.title,
      date: merged.start.toISOString(),
      color: hexToColorInt(merged.color),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      "Event update affected 0 rows (wrong id, RLS, or missing profile for user_id)"
    );
  }
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

export async function insertTask(task: Task, userId: string) {
  const nextId = await nextTasksTableId();
  const row = {
    id: nextId,
    user_id: userId,
    task_name: task.title,
    due_date: task.dueDate ? task.dueDate.toISOString() : null,
    priority: taskPriorityToInt(task.priority),
    status: task.completed ? "completed" : "pending",
    color: hexToColorInt("#5B8DEF"),
  };
  const { data, error } = await supabase
    .from("tasks")
    .insert(row)
    .select(
      "id,user_id,task_name,due_date,priority,status,color,created_at,updated_at"
    )
    .single();
  if (error) throw error;
  return taskFromRow(data as TasksRow);
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
