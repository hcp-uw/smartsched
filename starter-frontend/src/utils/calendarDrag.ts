import { addMinutes, differenceInMinutes, startOfDay } from "date-fns";

export const SNAP_MINUTES = 15;
export const MIN_EVENT_MINUTES = 15;

export function snapMinutes(totalMinutes: number): number {
  return Math.round(totalMinutes / SNAP_MINUTES) * SNAP_MINUTES;
}

export function clampMinutes(m: number): number {
  return Math.max(0, Math.min(24 * 60 - SNAP_MINUTES, m));
}

export function topToMinutes(top: number, hourHeight: number): number {
  return snapMinutes(clampMinutes((top / hourHeight) * 60));
}

export function minutesToTop(minutes: number, hourHeight: number): number {
  return (minutes / 60) * hourHeight;
}

export function combineDayAndMinutes(day: Date, minutes: number): Date {
  return addMinutes(startOfDay(day), minutes);
}

export function eventDurationMinutes(start: Date, end: Date): number {
  return Math.max(MIN_EVENT_MINUTES, differenceInMinutes(end, start));
}
