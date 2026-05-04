// ============================================================================
// STATE MANAGEMENT - PRODUCTION-READY
// ============================================================================
// This context provides centralized state management for the entire app.
// All state updates go through this context, making it easy to:
// 1. Replace other state management libraries
// 2. Add API integration by replacing state setters with API calls
// 3. Add optimistic updates and error handling
//
// TO INTEGRATE WITH BACKEND:
// 1. Replace initial state with API fetches (useEffect in provider)
// 2. Replace setter functions with API calls (POST, PUT, DELETE)
// 3. Add loading states and error handling
// ============================================================================

import { createContext, useContext, useState, ReactNode } from "react";
import {
  CalendarEvent,
  Task,
  CalendarSource,
  Deadline,
  mockEvents,
  mockTasks,
  mockCalendarSources,
  mockDeadlines,
} from "../data/mockData";

// ============================================================================
// CONTEXT TYPES (PRODUCTION-READY)
// ============================================================================

interface AppState {
  // Data State
  events: CalendarEvent[];
  tasks: Task[];
  calendars: CalendarSource[];
  deadlines: Deadline[];
  
  // AI State
  aiGeneratedEvents: CalendarEvent[];
  
  // Actions - Events
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  
  // Actions - Tasks
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  
  // Actions - Calendars
  addCalendar: (calendar: CalendarSource) => void;
  updateCalendar: (id: string, updates: Partial<CalendarSource>) => void;
  toggleCalendarVisibility: (id: string) => void;
  
  // Actions - AI
  setAIGeneratedEvents: (events: CalendarEvent[]) => void;
  acceptAISchedule: () => void;
  clearAISchedule: () => void;
  
  // Computed/Filtered Data
  getVisibleEvents: () => CalendarEvent[];
  getTasksByFilter: (filter: {
    completed?: boolean;
    priority?: string;
    tags?: string[];
  }) => Task[];
}

const AppContext = createContext<AppState | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT (PRODUCTION-READY)
// ============================================================================

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // ============================================================================
  // STATE INITIALIZATION
  // ============================================================================
  // Currently initialized with mock data.
  // In production, replace with API calls in useEffect:
  //
  // useEffect(() => {
  //   async function fetchData() {
  //     const [events, tasks, calendars] = await Promise.all([
  //       fetch('/api/events').then(r => r.json()),
  //       fetch('/api/tasks').then(r => r.json()),
  //       fetch('/api/calendars').then(r => r.json()),
  //     ]);
  //     setEvents(events);
  //     setTasks(tasks);
  //     setCalendars(calendars);
  //   }
  //   fetchData();
  // }, []);
  // ============================================================================

  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [calendars, setCalendars] = useState<CalendarSource[]>(mockCalendarSources);
  const [deadlines] = useState<Deadline[]>(mockDeadlines);
  const [aiGeneratedEvents, setAIGeneratedEvents] = useState<CalendarEvent[]>([]);

  // ============================================================================
  // EVENT ACTIONS (PRODUCTION-READY)
  // ============================================================================
  // In production, each action should make an API call:
  // - addEvent: POST /api/events
  // - updateEvent: PUT /api/events/:id
  // - deleteEvent: DELETE /api/events/:id
  // ============================================================================

  const addEvent = (event: CalendarEvent) => {
    // Production: await fetch('/api/events', { method: 'POST', body: JSON.stringify(event) })
    setEvents((prev) => [...prev, event]);
  };

  const updateEvent = (id: string, updates: Partial<CalendarEvent>) => {
    // Production: await fetch(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify(updates) })
    setEvents((prev) =>
      prev.map((event) => (event.id === id ? { ...event, ...updates } : event))
    );
  };

  const deleteEvent = (id: string) => {
    // Production: await fetch(`/api/events/${id}`, { method: 'DELETE' })
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  // ============================================================================
  // TASK ACTIONS (PRODUCTION-READY)
  // ============================================================================
  // In production:
  // - addTask: POST /api/tasks
  // - updateTask: PUT /api/tasks/:id
  // - deleteTask: DELETE /api/tasks/:id
  // - toggleTask: PATCH /api/tasks/:id/toggle
  // ============================================================================

  const addTask = (task: Task) => {
    // Production: await fetch('/api/tasks', { method: 'POST', body: JSON.stringify(task) })
    setTasks((prev) => [task, ...prev]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    // Production: await fetch(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updates) })
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task))
    );
  };

  const deleteTask = (id: string) => {
    // Production: await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const toggleTask = (id: string) => {
    // Production: await fetch(`/api/tasks/${id}/toggle`, { method: 'PATCH' })
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // ============================================================================
  // CALENDAR ACTIONS (PRODUCTION-READY)
  // ============================================================================
  // In production:
  // - addCalendar: POST /api/calendars
  // - updateCalendar: PUT /api/calendars/:id
  // - toggleCalendarVisibility: PATCH /api/calendars/:id/visibility
  // ============================================================================

  const addCalendar = (calendar: CalendarSource) => {
    // Production: await fetch('/api/calendars', { method: 'POST', body: JSON.stringify(calendar) })
    setCalendars((prev) => [...prev, calendar]);
  };

  const updateCalendar = (id: string, updates: Partial<CalendarSource>) => {
    // Production: await fetch(`/api/calendars/${id}`, { method: 'PUT', body: JSON.stringify(updates) })
    setCalendars((prev) =>
      prev.map((cal) => (cal.id === id ? { ...cal, ...updates } : cal))
    );
  };

  const toggleCalendarVisibility = (id: string) => {
    // Production: await fetch(`/api/calendars/${id}/visibility`, { method: 'PATCH' })
    setCalendars((prev) =>
      prev.map((cal) => (cal.id === id ? { ...cal, visible: !cal.visible } : cal))
    );
  };

  // ============================================================================
  // AI SCHEDULE ACTIONS (PRODUCTION-READY)
  // ============================================================================
  // In production:
  // - setAIGeneratedEvents: Result from POST /api/ai/generate-schedule
  // - acceptAISchedule: POST /api/events/bulk (add all AI events)
  // - clearAISchedule: Just clear local state
  // ============================================================================

  const acceptAISchedule = () => {
    // Production: await fetch('/api/events/bulk', { method: 'POST', body: JSON.stringify(aiGeneratedEvents) })
    
    // Add AI events to main calendar
    setEvents((prev) => [...prev, ...aiGeneratedEvents]);
    
    // Optionally create a new calendar source for AI events
    const hasAICalendar = calendars.some((cal) => cal.name.includes("AI Generated"));
    if (!hasAICalendar) {
      const aiCalendar: CalendarSource = {
        id: `ai-cal-${Date.now()}`,
        name: "AI Generated Schedule",
        color: "#5B8DEF",
        visible: true,
      };
      setCalendars((prev) => [...prev, aiCalendar]);
    }
    
    // Clear AI suggestions
    setAIGeneratedEvents([]);
  };

  const clearAISchedule = () => {
    setAIGeneratedEvents([]);
  };

  // ============================================================================
  // COMPUTED DATA / FILTERS (PRODUCTION-READY)
  // ============================================================================
  // These functions compute derived state from the base state.
  // They don't make API calls - just filter existing data.
  // ============================================================================

  const getVisibleEvents = (): CalendarEvent[] => {
    const visibleCalendarIds = calendars
      .filter((cal) => cal.visible)
      .map((cal) => cal.id);
    
    return events.filter((event) => {
      // If event has no calendarId, show it by default
      if (!event.calendarId) return true;
      
      // Otherwise, only show if its calendar is visible
      return visibleCalendarIds.includes(event.calendarId);
    });
  };

  const getTasksByFilter = (filter: {
    completed?: boolean;
    priority?: string;
    tags?: string[];
  }): Task[] => {
    return tasks.filter((task) => {
      // Filter by completion
      if (filter.completed !== undefined && task.completed !== filter.completed) {
        return false;
      }
      
      // Filter by priority
      if (filter.priority && task.priority !== filter.priority) {
        return false;
      }
      
      // Filter by tags
      if (filter.tags && filter.tags.length > 0) {
        const hasMatchingTag = task.tags.some((tag) => filter.tags!.includes(tag));
        if (!hasMatchingTag) return false;
      }
      
      return true;
    });
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: AppState = {
    // Data
    events,
    tasks,
    calendars,
    deadlines,
    aiGeneratedEvents,
    
    // Event Actions
    addEvent,
    updateEvent,
    deleteEvent,
    
    // Task Actions
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    
    // Calendar Actions
    addCalendar,
    updateCalendar,
    toggleCalendarVisibility,
    
    // AI Actions
    setAIGeneratedEvents,
    acceptAISchedule,
    clearAISchedule,
    
    // Computed
    getVisibleEvents,
    getTasksByFilter,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ============================================================================
// CUSTOM HOOK (PRODUCTION-READY)
// ============================================================================

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
