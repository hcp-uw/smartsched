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
  };
}

export interface TimeSlot {
  start: Date;
  end: Date;
  duration: number; // in minutes
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

  // Get unscheduled tasks (incomplete, with duration)
  const unscheduledTasks = tasks.filter(
    (task) => !task.completed && task.duration > 0
  );

  // Sort tasks by priority and due date
  const sortedTasks = prioritizeTasks(unscheduledTasks);

  // Find available time slots
  const availableSlots = findAvailableTimeSlots(
    existingEvents,
    workStart,
    workEnd,
    7 // Look ahead 7 days
  );

  // Schedule tasks into available slots
  const scheduledEvents = scheduleTasksIntoSlots(sortedTasks, availableSlots, maxTasksPerDay);

  return scheduledEvents;
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
  daysAhead: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const today = startOfDay(new Date());

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const currentDay = addDays(today, dayOffset);
    
    // Create work day boundaries
    const dayStart = new Date(currentDay);
    dayStart.setHours(workStart, 0, 0, 0);
    
    const dayEnd = new Date(currentDay);
    dayEnd.setHours(workEnd, 0, 0, 0);

    // Get events for this day
    const dayEvents = existingEvents.filter((event) =>
      isWithinInterval(event.start, { start: dayStart, end: dayEnd })
    );

    // Sort events by start time
    const sortedEvents = dayEvents.sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    );

    // Find gaps between events
    let currentTime = dayStart;

    for (const event of sortedEvents) {
      // Check if there's a gap before this event
      const gapDuration =
        (event.start.getTime() - currentTime.getTime()) / (1000 * 60);

      if (gapDuration >= 30) {
        // At least 30 minutes free
        slots.push({
          start: new Date(currentTime),
          end: new Date(event.start),
          duration: gapDuration,
        });
      }

      // Move current time to after this event
      currentTime = event.end > currentTime ? event.end : currentTime;
    }

    // Check for gap at end of day
    const endGapDuration =
      (dayEnd.getTime() - currentTime.getTime()) / (1000 * 60);
    if (endGapDuration >= 30) {
      slots.push({
        start: new Date(currentTime),
        end: new Date(dayEnd),
        duration: endGapDuration,
      });
    }
  }

  return slots;
}

/**
 * AI LOGIC: Schedule tasks into available time slots
 * This is where optimization algorithms could be applied
 */
function scheduleTasksIntoSlots(
  tasks: Task[],
  slots: TimeSlot[],
  maxTasksPerDay: number
): CalendarEvent[] {
  const scheduledEvents: CalendarEvent[] = [];
  const tasksPerDay = new Map<string, number>();

  for (const task of tasks) {
    // Find a suitable slot for this task
    const suitableSlot = slots.find((slot) => {
      const slotDay = slot.start.toDateString();
      const tasksOnDay = tasksPerDay.get(slotDay) ?? 0;
      
      return (
        slot.duration >= task.duration &&
        tasksOnDay < maxTasksPerDay &&
        !isSlotUsed(slot, scheduledEvents)
      );
    });

    if (suitableSlot) {
      // Create event from task
      const event: CalendarEvent = {
        id: `ai-${task.id}-${Date.now()}`,
        title: task.title,
        start: new Date(suitableSlot.start),
        end: addMinutes(suitableSlot.start, task.duration),
        category: task.category,
        color: getCategoryColor(task.category),
        isAIGenerated: true,
      };

      scheduledEvents.push(event);

      // Track tasks per day
      const eventDay = event.start.toDateString();
      tasksPerDay.set(eventDay, (tasksPerDay.get(eventDay) ?? 0) + 1);
    }
  }

  return scheduledEvents;
}

/**
 * Helper: Check if a time slot overlaps with any scheduled events
 */
function isSlotUsed(slot: TimeSlot, events: CalendarEvent[]): boolean {
  return events.some((event) => {
    const eventInterval = { start: event.start, end: event.end };
    return (
      isWithinInterval(slot.start, eventInterval) ||
      isWithinInterval(slot.end, eventInterval) ||
      (slot.start <= event.start && slot.end >= event.end)
    );
  });
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
