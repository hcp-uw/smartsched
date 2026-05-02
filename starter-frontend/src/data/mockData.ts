// ============================================================================
// MOCK DATA - TEMPORARY
// ============================================================================
// This file contains temporary mock data for development and testing.
// In production, this data should be replaced with API calls to a backend.
// 
// TO REPLACE WITH BACKEND:
// 1. Remove all mock data arrays below
// 2. Fetch data from API endpoints in AppContext initialization
// 3. Use the same TypeScript interfaces defined here
// ============================================================================

// ============================================================================
// TYPE DEFINITIONS (PRODUCTION-READY)
// ============================================================================
// These interfaces represent the data structure for the application.
// They should match the backend API schema.

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  category: "work" | "personal" | "meeting" | "focus" | "break";
  color: string;
  calendarId?: string; // Links event to a specific calendar source
  isAIGenerated?: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  tags: string[];
  duration: number; // in minutes (also known as estimatedDuration)
  dueDate: Date | null;
  category: "work" | "personal" | "meeting" | "focus" | "break";
}

export interface CalendarSource {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

export interface Deadline {
  id: string;
  title: string;
  date: Date;
  priority: "low" | "medium" | "high";
}

// ============================================================================
// MOCK DATA - CALENDAR EVENTS
// ============================================================================
// Replace with: GET /api/events

export const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Team Standup",
    start: new Date(2026, 2, 24, 9, 0),
    end: new Date(2026, 2, 24, 9, 30),
    category: "meeting",
    color: "#EC4899",
    calendarId: "cal3",
  },
  {
    id: "2",
    title: "Deep Work - Design Review",
    start: new Date(2026, 2, 24, 10, 0),
    end: new Date(2026, 2, 24, 12, 0),
    category: "focus",
    color: "#10B981",
    calendarId: "cal4",
  },
  {
    id: "3",
    title: "Lunch Break",
    start: new Date(2026, 2, 24, 12, 0),
    end: new Date(2026, 2, 24, 13, 0),
    category: "break",
    color: "#F59E0B",
    calendarId: "cal2",
  },
  {
    id: "4",
    title: "Client Meeting",
    start: new Date(2026, 2, 24, 14, 0),
    end: new Date(2026, 2, 24, 15, 0),
    category: "meeting",
    color: "#EC4899",
    calendarId: "cal3",
  },
  {
    id: "5",
    title: "Code Review",
    start: new Date(2026, 2, 24, 15, 30),
    end: new Date(2026, 2, 24, 16, 30),
    category: "work",
    color: "#5B8DEF",
    calendarId: "cal1",
  },
  {
    id: "6",
    title: "Gym Session",
    start: new Date(2026, 2, 24, 18, 0),
    end: new Date(2026, 2, 24, 19, 0),
    category: "personal",
    color: "#8B5CF6",
    calendarId: "cal2",
  },
  // Tuesday
  {
    id: "7",
    title: "Morning Planning",
    start: new Date(2026, 2, 25, 9, 0),
    end: new Date(2026, 2, 25, 9, 30),
    category: "focus",
    color: "#10B981",
    calendarId: "cal4",
  },
  {
    id: "8",
    title: "Product Strategy Meeting",
    start: new Date(2026, 2, 25, 11, 0),
    end: new Date(2026, 2, 25, 12, 30),
    category: "meeting",
    color: "#EC4899",
    calendarId: "cal3",
  },
  {
    id: "9",
    title: "Development Sprint",
    start: new Date(2026, 2, 25, 14, 0),
    end: new Date(2026, 2, 25, 17, 0),
    category: "work",
    color: "#5B8DEF",
    calendarId: "cal1",
  },
];

// ============================================================================
// MOCK DATA - TASKS
// ============================================================================
// Replace with: GET /api/tasks

export const mockTasks: Task[] = [
  {
    id: "t1",
    title: "Review Q1 performance metrics",
    completed: false,
    priority: "high",
    tags: ["analytics", "review"],
    duration: 60,
    dueDate: new Date(2026, 2, 24),
    category: "work",
  },
  {
    id: "t2",
    title: "Update design system documentation",
    completed: false,
    priority: "medium",
    tags: ["design", "docs"],
    duration: 90,
    dueDate: new Date(2026, 2, 25),
    category: "work",
  },
  {
    id: "t3",
    title: "Prepare presentation slides",
    completed: true,
    priority: "high",
    tags: ["presentation"],
    duration: 120,
    dueDate: new Date(2026, 2, 23),
    category: "work",
  },
  {
    id: "t4",
    title: "Schedule dentist appointment",
    completed: false,
    priority: "low",
    tags: ["health", "personal"],
    duration: 15,
    dueDate: null,
    category: "personal",
  },
  {
    id: "t5",
    title: "Write blog post on AI scheduling",
    completed: false,
    priority: "medium",
    tags: ["writing", "content"],
    duration: 120,
    dueDate: new Date(2026, 2, 26),
    category: "personal",
  },
  {
    id: "t6",
    title: "Review pull requests",
    completed: false,
    priority: "high",
    tags: ["code", "review"],
    duration: 45,
    dueDate: new Date(2026, 2, 24),
    category: "work",
  },
  {
    id: "t7",
    title: "Plan team building activity",
    completed: false,
    priority: "low",
    tags: ["team", "planning"],
    duration: 30,
    dueDate: new Date(2026, 2, 28),
    category: "work",
  },
];

// ============================================================================
// MOCK DATA - CALENDAR SOURCES
// ============================================================================
// Replace with: GET /api/calendars

export const mockCalendarSources: CalendarSource[] = [
  {
    id: "cal1",
    name: "Work Calendar",
    color: "#5B8DEF",
    visible: true,
  },
  {
    id: "cal2",
    name: "Personal",
    color: "#8B5CF6",
    visible: true,
  },
  {
    id: "cal3",
    name: "Meetings",
    color: "#EC4899",
    visible: true,
  },
  {
    id: "cal4",
    name: "Focus Time",
    color: "#10B981",
    visible: true,
  },
];

// ============================================================================
// MOCK DATA - UPCOMING DEADLINES
// ============================================================================
// Replace with: GET /api/deadlines

export const mockDeadlines: Deadline[] = [
  {
    id: "d1",
    title: "Project Proposal Due",
    date: new Date(2026, 2, 25),
    priority: "high",
  },
  {
    id: "d2",
    title: "Client Presentation",
    date: new Date(2026, 2, 26),
    priority: "high",
  },
  {
    id: "d3",
    title: "Budget Review",
    date: new Date(2026, 2, 28),
    priority: "medium",
  },
  {
    id: "d4",
    title: "Team Offsite Planning",
    date: new Date(2026, 2, 30),
    priority: "low",
  },
];