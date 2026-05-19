import { supabase } from "../supabaseClient";
import {
  mockCalendarSources,
  type CalendarSource,
} from "../data/mockData";

type CalendarSourceRow = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
};

function isCalendarSourceRow(v: unknown): v is CalendarSourceRow {
  if (!v || typeof v !== "object") return false;
  const o = v as CalendarSourceRow;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.color === "string" &&
    typeof o.visible === "boolean"
  );
}

/** Merge saved preferences onto app defaults (keeps default colors/ids). */
export function mergeCalendarSources(
  saved: unknown,
  defaults: CalendarSource[] = mockCalendarSources
): CalendarSource[] {
  const list = Array.isArray(saved)
    ? saved.filter(isCalendarSourceRow)
    : [];

  if (list.length === 0) {
    return defaults.map((d) => ({ ...d }));
  }

  const byId = new Map(list.map((s) => [s.id, s]));

  const merged = defaults.map((def) => {
    const s = byId.get(def.id);
    let name = s?.name?.trim() || def.name;
    if (def.id === "cal5" && name === "Break") name = "Classes";
    return {
      ...def,
      name,
      visible: s?.visible ?? def.visible,
    };
  });

  for (const s of list) {
    if (!defaults.some((d) => d.id === s.id)) {
      merged.push({ ...s });
    }
  }

  return merged;
}

export async function fetchUserCalendars(
  userId: string
): Promise<CalendarSource[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("calendar_sources")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (
      error.code === "PGRST204" ||
      error.message?.includes("calendar_sources")
    ) {
      return mockCalendarSources.map((d) => ({ ...d }));
    }
    throw error;
  }

  return mergeCalendarSources(data?.calendar_sources);
}

export async function saveUserCalendars(
  userId: string,
  calendars: CalendarSource[]
): Promise<void> {
  const payload: CalendarSourceRow[] = calendars.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    visible: c.visible,
  }));

  const { data, error } = await supabase
    .from("profiles")
    .update({ calendar_sources: payload })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    if (
      error.code === "PGRST204" ||
      error.message?.includes("calendar_sources")
    ) {
      throw new Error(
        "Missing calendar_sources column. Run starter-backend/supabase/profiles_calendar_sources.sql in Supabase."
      );
    }
    throw error;
  }

  if (!data) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: userId,
      display_name: "User",
      calendar_sources: payload,
    });
    if (insertError) throw insertError;
  }
}
