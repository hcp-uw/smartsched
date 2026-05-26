// This file contains the AI scheduling algorithm placeholder which acts as just a
//placeholder algorithm to estimate the ideal blocks without the AI adjustments
// While the implementation is simulated, the structure is ready
// and can be replaced with actual ML/AI backend calls.
//
// TODO - Integrate WITH REAL AI:
// 1. Replace simulation logic with API calls to AI service
// 2. Keep the same function signatures and return types
// 3. Add error handling and loading states?

import { CalendarEvent, Task, CalendarSource } from "../data/mockData";
import { startOfDay, addMinutes, isWithinInterval, addDays } from "date-fns";
import {
  SchedulePreferences,
  dayIndexToDayName,
} from "../lib/schedulePreferences";

/**
 * Placholder function
 * Represents the core scheduling logic structure.
 * Currently simulated, but structured for easy backend integration.
 */
export interface AIScheduleRequest {
  tasks: Task[];
  existingEvents: CalendarEvent[];
  calendars: CalendarSource[];
  preferences?: {
    workHoursStart?: number; // e.g., 9 for 9 AM
    workHoursEnd?: number; // e.g., 17 for 5 PM
    breakDuration?: number; // in minutes
    maxTasksPerDay?: number;
    workDays?: number[]; // [1, 2, 3, 4, 5] for Mon-Fri
    busySlots?: { start: Date; end: Date }[];
    freeSlots?: { start: Date; end: Date }[];
    schedulePreferences?: SchedulePreferences;
    startDate?: Date;
    daysAhead?: number;
    includeRoutineEvents?: boolean;
  };
}

export interface TimeSlot {
  start: Date;
  end: Date;
  duration: number; // in minutes
}

function applyDecimalHour(date: Date, hour: number) {
  const wholeHours = Math.floor(hour);
  const minutes = Math.round((hour - wholeHours) * 60);
  date.setHours(wholeHours, minutes, 0, 0);
}

/**
 * Generates an "AI-powered schedule" by finding optimal time slots for tasks
 */
export function generateAISchedule(request: AIScheduleRequest): CalendarEvent[] {
  const { tasks, existingEvents, preferences = {} } = request;
  
  // Default preferences
  const workStart = preferences.workHoursStart ?? 9;
  const workEnd = preferences.workHoursEnd ?? 17;
  const maxTasksPerDay = preferences.maxTasksPerDay ?? 5;
  const workDays = preferences.workDays;
  const busySlots = preferences.busySlots || [];
  const freeSlots = preferences.freeSlots || [];
  const schedulePreferences = preferences.schedulePreferences;
  const planStartDate = preferences.startDate ?? new Date();
  const daysAhead = Math.max(1, Math.min(preferences.daysAhead ?? 7, 31));
  const regularBreakMinutes = schedulePreferences
    ? 10
    : preferences.breakDuration ?? 0;

  // Get unscheduled tasks (incomplete, with duration)
  const unscheduledTasks = tasks.filter(
    (task) => !task.completed && (task.duration > 0 || task.priority === 'high')
  );

  // Sort tasks by priority and due date
  const sortedTasks = prioritizeTasks(unscheduledTasks);

  // Find available time slots
  const availableSlots = findAvailableTimeSlots(
    existingEvents,
    workStart,
    workEnd,
    daysAhead,
    workDays,
    busySlots,
    freeSlots,
    schedulePreferences,
    planStartDate
  );

  // Schedule tasks into available slots
  const scheduledEvents = scheduleTasksIntoSlots(
    sortedTasks,
    availableSlots,
    maxTasksPerDay,
    regularBreakMinutes,
    schedulePreferences
  );

  if (!preferences.includeRoutineEvents || !schedulePreferences) {
    return scheduledEvents;
  }

  return [
    ...generateRoutineEvents(schedulePreferences, planStartDate, daysAhead),
    ...scheduledEvents,
  ];
}

/**
 * AI LOGIC: Prioritize tasks based on multiple factors
 * This is where ML models could be integrated
 */
function prioritizeTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Priority weights
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    
    // Sort by priority first
    const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by due date (earlier due dates first)
    if (a.dueDate && b.dueDate) {
      return a.dueDate.getTime() - b.dueDate.getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    
    // Finally by duration (shorter tasks first)
    return a.duration - b.duration;
  });
}

/**
 * AI LOGIC placeholder: Find available time slots in the schedule
 * This considers existing events and work hours
 */
function findAvailableTimeSlots(
  existingEvents: CalendarEvent[],
  workStart: number,
  workEnd: number,
  daysAhead: number,
  workDays?: number[],
  busySlots: { start: Date; end: Date }[] = [],
  freeSlots: { start: Date; end: Date }[] = [],
  schedulePreferences?: SchedulePreferences,
  startDate: Date = new Date()
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const today = startOfDay(startDate);

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const currentDay = addDays(today, dayOffset);
    const dayOfWeek = currentDay.getDay();
    const dayPreference = schedulePreferences?.[dayIndexToDayName(dayOfWeek)];

    if (dayPreference && !dayPreference.enabled) {
      continue;
    }

    // Check if it's a work day (if workDays provided)
    if (workDays && workDays.length > 0 && !workDays.includes(dayOfWeek)) {
      continue;
    }
    
    // Create work day boundaries
    const dayStart = new Date(currentDay);
    applyDecimalHour(dayStart, dayPreference?.workStart ?? workStart);
    
    const dayEnd = new Date(currentDay);
    applyDecimalHour(dayEnd, dayPreference?.workEnd ?? workEnd);

    const preferenceBusySlots: { start: Date; end: Date }[] = [];
    if (
      dayPreference &&
      dayPreference.lunchStart < dayPreference.lunchEnd &&
      dayPreference.lunchStart < dayPreference.workEnd &&
      dayPreference.lunchEnd > dayPreference.workStart
    ) {
      const lunchStart = new Date(currentDay);
      applyDecimalHour(lunchStart, Math.max(dayPreference.lunchStart, dayPreference.workStart));
      const lunchEnd = new Date(currentDay);
      applyDecimalHour(lunchEnd, Math.min(dayPreference.lunchEnd, dayPreference.workEnd));
      preferenceBusySlots.push({ start: lunchStart, end: lunchEnd });
    }

    // Combine existing events with custom busy slots
    const allBusySlots = [
      ...existingEvents.map(e => ({ start: e.start, end: e.end })),
      ...busySlots,
      ...preferenceBusySlots,
    ];

    // Get busy slots for this day
    const dayBusySlots = allBusySlots.filter((slot) =>
      isWithinInterval(slot.start, { start: dayStart, end: dayEnd }) ||
      isWithinInterval(slot.end, { start: dayStart, end: dayEnd }) ||
      (slot.start <= dayStart && slot.end >= dayEnd)
    );

    // Sort busy slots by start time
    const sortedBusy = dayBusySlots.sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    );

    // Find gaps between busy slots
    let currentTime = dayStart;

    for (const busy of sortedBusy) {
      // Check if there's a gap before this busy slot
      if (busy.start > currentTime) {
        const gapDuration =
          (busy.start.getTime() - currentTime.getTime()) / (1000 * 60);

        if (gapDuration >= 15) {
          slots.push({
            start: new Date(currentTime),
            end: new Date(busy.start),
            duration: gapDuration,
          });
        }
      }

      // Move current time to after this busy slot
      currentTime = busy.end > currentTime ? busy.end : currentTime;
    }

    // Check for gap at end of day
    if (dayEnd > currentTime) {
      const endGapDuration =
        (dayEnd.getTime() - currentTime.getTime()) / (1000 * 60);
      if (endGapDuration >= 15) {
        slots.push({
          start: new Date(currentTime),
          end: new Date(dayEnd),
          duration: endGapDuration,
        });
      }
    }
  }

  // Also add free slots if they are not already covered
  for (const free of freeSlots) {
    const duration = (free.end.getTime() - free.start.getTime()) / (1000 * 60);
    // Only add if not overlapping with existing slots (simplified)
    if (!slots.some(s => 
      (free.start >= s.start && free.end <= s.end)
    )) {
      slots.push({
        start: free.start,
        end: free.end,
        duration: duration
      });
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * AI LOGIC: Schedule tasks into available time slots
 * This is where optimization algorithms could be applied
 */
function scheduleTasksIntoSlots(
  tasks: Task[],
  slots: TimeSlot[],
  maxTasksPerDay: number,
  regularBreakMinutes = 0,
  schedulePreferences?: SchedulePreferences
): CalendarEvent[] {
  const scheduledEvents: CalendarEvent[] = [];
  const tasksPerDay = new Map<string, number>();
  const remainingSlots = [...slots].sort((a, b) => a.start.getTime() - b.start.getTime());

  for (const task of tasks) {
    let remainingTaskMinutes = task.duration > 0 ? task.duration : 30;
    const taskEvents: CalendarEvent[] = [];

    while (remainingTaskMinutes > 0) {
      const minimumChunkMinutes = Math.min(15, remainingTaskMinutes);
      const slotIndex = remainingSlots.findIndex((slot) => {
        const slotDay = slot.start.toDateString();
        const tasksOnDay = tasksPerDay.get(slotDay) ?? 0;

        return (
          slot.duration >= minimumChunkMinutes &&
          tasksOnDay < maxTasksPerDay
        );
      });

      if (slotIndex < 0) break;

      const suitableSlot = remainingSlots[slotIndex];
      const chunkDuration = Math.min(remainingTaskMinutes, suitableSlot.duration);
      const eventStart = new Date(suitableSlot.start);
      const eventEnd = addMinutes(eventStart, chunkDuration);
      
      const event: CalendarEvent = {
        id: `ai-${task.id}-${eventStart.getTime()}-${taskEvents.length}`,
        title: task.title,
        start: eventStart,
        end: eventEnd,
        category: task.category,
        color: getCategoryColor(task.category),
        isAIGenerated: true,
      };

      taskEvents.push(event);

      const eventDay = event.start.toDateString();
      tasksPerDay.set(eventDay, (tasksPerDay.get(eventDay) ?? 0) + 1);
      remainingTaskMinutes -= chunkDuration;

      const dayPreference = schedulePreferences?.[dayIndexToDayName(event.start.getDay())];
      const breakMinutes = dayPreference?.breakPreference === false ? 0 : regularBreakMinutes;
      const nextSlotStart = addMinutes(eventEnd, breakMinutes);
      if (nextSlotStart < suitableSlot.end) {
        remainingSlots[slotIndex] = {
          start: nextSlotStart,
          end: suitableSlot.end,
          duration: (suitableSlot.end.getTime() - nextSlotStart.getTime()) / (1000 * 60),
        };
      } else {
        remainingSlots.splice(slotIndex, 1);
      }
    }

    scheduledEvents.push(
      ...taskEvents.map((event, index) => ({
        ...event,
        title:
          taskEvents.length > 1
            ? `${task.title} (Part ${index + 1})`
            : task.title,
      }))
    );
  }

  return scheduledEvents;
}

function createEventForHours(
  idPrefix: string,
  title: string,
  date: Date,
  startHour: number,
  endHour: number,
  category: CalendarEvent["category"],
  color: string
): CalendarEvent | null {
  if (endHour <= startHour) return null;

  const start = new Date(date);
  applyDecimalHour(start, startHour);
  const end = new Date(date);
  applyDecimalHour(end, endHour);

  return {
    id: `ai-routine-${idPrefix}-${date.toISOString()}-${startHour}-${endHour}`,
    title,
    start,
    end,
    category,
    color,
    isAIGenerated: true,
  };
}

function generateRoutineEvents(
  preferences: SchedulePreferences,
  startDate: Date,
  daysAhead: number
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const firstDay = startOfDay(startDate);

  for (let offset = 0; offset < daysAhead; offset++) {
    const day = addDays(firstDay, offset);
    const dayPreference = preferences[dayIndexToDayName(day.getDay())];
    if (!dayPreference?.enabled) continue;

    const routineEvents = [
      createEventForHours(
        "morning",
        "Morning Routine",
        day,
        dayPreference.wakeTime,
        dayPreference.workStart,
        "personal",
        "#8B5CF6"
      ),
      createEventForHours(
        "lunch",
        "Lunch Time",
        day,
        Math.max(dayPreference.lunchStart, dayPreference.workStart),
        Math.min(dayPreference.lunchEnd, dayPreference.workEnd),
        "break",
        "#F59E0B"
      ),
    ];

    for (const event of routineEvents) {
      if (event) events.push(event);
    }
  }

  return events;
}

/**
 * Helper: Get color based on category
 */
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    work: "#5B8DEF",
    personal: "#8B5CF6",
    meeting: "#EC4899",
    focus: "#10B981",
    break: "#F59E0B",
  };
  return colors[category] ?? "#5B8DEF";
}

/**
 * Filter tasks based on criteria (for AI Planner filters)
 */
export function filterTasksForScheduling(
  tasks: Task[],
  options: {
    priorities?: string[];
    tags?: string[];
    includeCompleted?: boolean;
  }
): Task[] {
  return tasks.filter((task) => {
    // Filter by completion status
    if (!options.includeCompleted && task.completed) return false;

    // Filter by priority
    if (
      options.priorities &&
      options.priorities.length > 0 &&
      !options.priorities.includes(task.priority)
    ) {
      return false;
    }

    // Filter by tags
    if (
      options.tags &&
      options.tags.length > 0 &&
      !task.tags.some((tag) => options.tags!.includes(tag))
    ) {
      return false;
    }

    return true;
  });
}
