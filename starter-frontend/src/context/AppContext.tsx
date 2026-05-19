// App-wide state. Events and tasks load/persist via Supabase when signed in
// (see lib/supabaseCalendarTask.ts). Calendars and deadlines stay local (mock).

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { supabase } from "../supabaseClient";
import {
  CalendarEvent,
  Task,
  CalendarSource,
  Deadline,
  mockCalendarSources,
  mockDeadlines,
} from "../data/mockData";
import {
  ensureUuid,
  fetchCalendarEvents,
  fetchTasks,
  insertCalendarEvent,
  insertCalendarEvents,
  insertTask,
  updateCalendarEventRow,
  updateTaskRow,
  deleteCalendarEvent,
  deleteTaskRow,
  isPersistedEventId,
} from "../lib/supabaseCalendarTask";
import { formatErrorMessage } from "../lib/formatError";

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

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendars, setCalendars] = useState<CalendarSource[]>(mockCalendarSources);
  const [deadlines] = useState<Deadline[]>(mockDeadlines);
  const [aiGeneratedEvents, setAIGeneratedEvents] = useState<CalendarEvent[]>([]);

  const tasksRef = useRef<Task[]>([]);
  const eventsRef = useRef<CalendarEvent[]>([]);
  tasksRef.current = tasks;
  eventsRef.current = events;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setEvents([]);
      setTasks([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [ev, ta] = await Promise.all([
          fetchCalendarEvents(),
          fetchTasks(),
        ]);
        if (!cancelled) {
          setEvents(ev);
          setTasks(ta);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          toast.error(
            `Could not load events or tasks. ${formatErrorMessage(err)}`
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`user-data-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void fetchCalendarEvents()
            .then(setEvents)
            .catch(console.error);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void fetchTasks().then(setTasks).catch(console.error);
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const addEvent = (event: CalendarEvent) => {
    const normalized = { ...event, id: ensureUuid(event.id) };
    setEvents((prev) => [...prev, normalized]);
    if (!userId) return;
    void (async () => {
      try {
        const saved = await insertCalendarEvent(normalized, userId);
        setEvents((prev) =>
          prev.map((e) => (e.id === normalized.id ? saved : e))
        );
      } catch (err) {
        console.error(err);
        toast.error(`Could not save event. ${formatErrorMessage(err)}`);
        setEvents((prev) => prev.filter((e) => e.id !== normalized.id));
      }
    })();
  };

  const updateEvent = (id: string, updates: Partial<CalendarEvent>) => {
    const existing = eventsRef.current.find((e) => e.id === id);
    if (!existing) return;
    const merged = { ...existing, ...updates };
    setEvents((prev) =>
      prev.map((event) => (event.id === id ? merged : event))
    );
    if (!userId) return;
    if (!isPersistedEventId(id)) {
      toast.error("Event is still saving. Wait a moment, then drag again.");
      return;
    }
    void updateCalendarEventRow(merged).catch((err) => {
      console.error(err);
      toast.error(`Could not update event. ${formatErrorMessage(err)}`);
      void fetchCalendarEvents().then(setEvents).catch(console.error);
    });
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
    if (!userId) return;
    void deleteCalendarEvent(id).catch((err) => {
      console.error(err);
      toast.error(`Could not delete event. ${formatErrorMessage(err)}`);
      void fetchCalendarEvents().then(setEvents).catch(console.error);
    });
  };

  const addTask = (task: Task) => {
    const normalized = { ...task, id: ensureUuid(task.id) };
    setTasks((prev) => [normalized, ...prev]);
    if (!userId) return;
    void (async () => {
      try {
        const saved = await insertTask(normalized, userId);
        setTasks((prev) =>
          prev.map((t) => (t.id === normalized.id ? saved : t))
        );
      } catch (err) {
        console.error(err);
        toast.error(`Could not save task. ${formatErrorMessage(err)}`);
        setTasks((prev) => prev.filter((t) => t.id !== normalized.id));
      }
    })();
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const existing = tasksRef.current.find((t) => t.id === id);
    if (!existing) return;
    const merged = { ...existing, ...updates };
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? merged : task))
    );
    if (!userId) return;
    void updateTaskRow(merged).catch((err) => {
      console.error(err);
      toast.error(`Could not update task. ${formatErrorMessage(err)}`);
      void fetchTasks().then(setTasks).catch(console.error);
    });
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    if (!userId) return;
    void deleteTaskRow(id).catch((err) => {
      console.error(err);
      toast.error(`Could not delete task. ${formatErrorMessage(err)}`);
      void fetchTasks().then(setTasks).catch(console.error);
    });
  };

  const toggleTask = (id: string) => {
    const task = tasksRef.current.find((t) => t.id === id);
    if (!task) return;
    const merged = { ...task, completed: !task.completed };
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? merged : t))
    );
    if (!userId) return;
    void updateTaskRow(merged).catch((err) => {
      console.error(err);
      toast.error(`Could not update task. ${formatErrorMessage(err)}`);
      void fetchTasks().then(setTasks).catch(console.error);
    });
  };

  const addCalendar = (calendar: CalendarSource) => {
    setCalendars((prev) => [...prev, calendar]);
  };

  const updateCalendar = (id: string, updates: Partial<CalendarSource>) => {
    setCalendars((prev) =>
      prev.map((cal) => (cal.id === id ? { ...cal, ...updates } : cal))
    );
  };

  const toggleCalendarVisibility = (id: string) => {
    setCalendars((prev) =>
      prev.map((cal) => (cal.id === id ? { ...cal, visible: !cal.visible } : cal))
    );
  };

  const acceptAISchedule = () => {
    const batch = aiGeneratedEvents.map((e) => ({
      ...e,
      id: ensureUuid(e.id),
      isAIGenerated: true,
    }));

    setEvents((prev) => [...prev, ...batch]);

    const hasAICalendar = calendars.some((cal) =>
      cal.name.includes("AI Generated")
    );
    if (!hasAICalendar) {
      const aiCalendar: CalendarSource = {
        id: `ai-cal-${Date.now()}`,
        name: "AI Generated Schedule",
        color: "#5B8DEF",
        visible: true,
      };
      setCalendars((prev) => [...prev, aiCalendar]);
    }

    setAIGeneratedEvents([]);

    if (!userId || batch.length === 0) return;
    void insertCalendarEvents(batch, userId).catch((err) => {
      console.error(err);
      toast.error(
        `Could not save AI schedule. ${formatErrorMessage(err)}`
      );
      void fetchCalendarEvents().then(setEvents).catch(console.error);
    });
  };

  const clearAISchedule = () => {
    setAIGeneratedEvents([]);
  };

  const resolveEventCalendarId = (event: CalendarEvent): string => {
    if (event.calendarId) return event.calendarId;
    const byColor = calendars.find(
      (c) => c.color.toLowerCase() === event.color.toLowerCase()
    );
    return byColor?.id ?? calendars[0]?.id ?? "cal1";
  };

  const getVisibleEvents = (): CalendarEvent[] => {
    const visibleCalendarIds = calendars
      .filter((cal) => cal.visible)
      .map((cal) => cal.id);

    return events.filter((event) =>
      visibleCalendarIds.includes(resolveEventCalendarId(event))
    );
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

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
