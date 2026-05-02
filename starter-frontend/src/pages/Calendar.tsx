import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Download, Sparkles, Calendar as CalendarIcon, CheckSquare, ZoomIn, ZoomOut, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { ScrollArea } from "../components/ui/scroll-area";
import { Slider } from "../components/ui/slider";
import { motion, AnimatePresence } from "motion/react";
import { format, addDays, startOfWeek, isSameDay, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth } from "date-fns";
import { CalendarEvent } from "../data/mockData";
import { EventModal } from "../components/EventModal";
import { ImportCalendarModal } from "../components/ImportCalendarModal";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { generateAISchedule } from "../utils/aiScheduler";
import { Link } from "react-router-dom";

const hours = Array.from({ length: 24 }, (_, i) => i);

type ViewMode = "day" | "week" | "month";
type TimeScale = "compact" | "comfortable" | "expanded";

const TIME_SCALE_CONFIG = {
  compact: { height: 48, label: "Compact" },      // 48px per hour
  comfortable: { height: 72, label: "Standard" }, // 72px per hour (default)
  expanded: { height: 96, label: "Expanded" },    // 96px per hour
};

export function Calendar() {
  // ============================================================================
  // STATE MANAGEMENT - Using Centralized Context
  // ============================================================================
  const {
    events,
    tasks,
    calendars,
    deadlines,
    aiGeneratedEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    addCalendar,
    toggleCalendarVisibility,
    setAIGeneratedEvents,
    acceptAISchedule,
    clearAISchedule,
    getVisibleEvents,
  } = useApp();

  // ============================================================================
  // LOCAL UI STATE (Not persisted, view-specific)
  // ============================================================================
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [timeScale, setTimeScale] = useState<TimeScale>("comfortable");
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  
  // Modal states
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [clickedSlot, setClickedSlot] = useState<{ date: Date; time: string } | null>(null);

  // Scroll ref for auto-scrolling to 9 AM
  const calendarScrollRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Get visible events (respects calendar visibility filters)
  const visibleEvents = getVisibleEvents();
  
  // Get incomplete tasks for sidebar - limit to 10, show 3-4 initially
  const incompleteTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => {
      // Sort by due date first, then priority
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 10);

  // Combine tasks and deadlines into "Upcoming Tasks"
  const upcomingItems = [
    ...incompleteTasks.map((task) => ({
      id: task.id,
      title: task.title,
      date: task.dueDate,
      priority: task.priority,
      type: "task" as const,
    })),
    ...deadlines.slice(0, 10).map((deadline) => ({
      id: deadline.id,
      title: deadline.title,
      date: deadline.date,
      priority: deadline.priority,
      type: "deadline" as const,
    })),
  ]
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.getTime() - b.date.getTime();
    })
    .slice(0, 10);

  // Get month view data
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Pad to start on Monday
  const firstDayOfMonth = getDay(monthStart);
  const startPadding = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const paddedMonthDays = [
    ...Array(startPadding).fill(null),
    ...monthDays,
  ];

  // Current time scale height
  const hourHeight = TIME_SCALE_CONFIG[timeScale].height;

  // ============================================================================
  // SCROLL TO 9 AM ON LOAD
  // ============================================================================
  useEffect(() => {
    if (calendarScrollRef.current && (viewMode === "week" || viewMode === "day")) {
      // Scroll to 9 AM (9 hours * hourHeight)
      const scrollTo = 9 * hourHeight;
      calendarScrollRef.current.scrollTop = scrollTo;
    }
  }, [viewMode, hourHeight]);

  // ============================================================================
  // AI SCHEDULING LOGIC
  // ============================================================================
  const handleGenerateAIPlan = () => {
    // Use AI scheduler utility to generate schedule
    const aiSchedule = generateAISchedule({
      tasks: tasks.filter((t) => !t.completed),
      existingEvents: events,
      calendars,
      preferences: {
        workHoursStart: 9,
        workHoursEnd: 17,
        maxTasksPerDay: 5,
      },
    });

    // Update state through context
    setAIGeneratedEvents(aiSchedule);
    setShowAIPanel(true);
    setShowAISuggestions(true);
    toast.success("AI schedule generated!");
  };

  const handleAcceptAIPlan = () => {
    acceptAISchedule();
    setShowAISuggestions(false);
    setShowAIPanel(false);
    toast.success("AI schedule added to your calendar!");
  };

  const handleRegenerateAIPlan = () => {
    handleGenerateAIPlan();
    toast.success("Schedule regenerated!");
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  const getEventsForDay = (day: Date) => {
    const baseEvents = visibleEvents;
    const allEvents = showAISuggestions ? [...baseEvents, ...aiGeneratedEvents] : baseEvents;
    return allEvents.filter((event) => isSameDay(event.start, day));
  };

  const getEventPosition = (event: CalendarEvent) => {
    const startHour = event.start.getHours();
    const startMinute = event.start.getMinutes();
    const endHour = event.end.getHours();
    const endMinute = event.end.getMinutes();

    const topMinutes = startHour * 60 + startMinute;
    const durationMinutes = (endHour * 60 + endMinute) - topMinutes;

    return { 
      top: (topMinutes / 60) * hourHeight, 
      height: (durationMinutes / 60) * hourHeight 
    };
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (!event.isAIGenerated) {
      setSelectedEvent(event);
      setEventModalOpen(true);
    }
  };

  const handleSlotClick = (day: Date, hour: number) => {
    const time = `${hour.toString().padStart(2, "0")}:00`;
    setClickedSlot({ date: day, time });
    setSelectedEvent(null);
    setEventModalOpen(true);
  };

  const handleDayClick = (day: Date) => {
    setCurrentDate(day);
    setViewMode("day");
  };

  const handleSaveEvent = (event: CalendarEvent) => {
    if (selectedEvent) {
      // Update existing event through context
      updateEvent(event.id, event);
      toast.success("Event updated!");
    } else {
      // Add new event through context
      addEvent(event);
      toast.success("Event created!");
    }
    setClickedSlot(null);
  };

  const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
    toast.success("Event deleted!");
  };

  const handleImportCalendar = (name: string, color: string) => {
    addCalendar({
      id: `cal-${Date.now()}`,
      name,
      color,
      visible: true,
    });
    toast.success("Calendar imported!");
  };

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, direction === "next" ? 7 : -7));
    } else if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, direction === "next" ? 1 : -1));
    } else {
      setCurrentDate(addDays(currentDate, direction === "next" ? 1 : -1));
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  // Get current time position for the indicator
  const now = new Date();
  const currentTimeTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * hourHeight;

  const getPriorityColor = (priority: string) => {
    return priority === "high" ? "bg-red-500" : priority === "medium" ? "bg-yellow-500" : "bg-blue-500";
  };

  return (
    // <div className="p-10 text-white bg-black">
    // CALENDAR IS RENDERING
    // </div>


    //TODO MUST FIX XANDER


    <div className="flex h-screen overflow-hidden">
      {/* Left Panel - Calendar Controls */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        {/* HEADER - Fixed */}
        <div className="p-6 border-b border-border flex-shrink-0">
          <Button
            onClick={() => {
              setSelectedEvent(null);
              setClickedSlot(null);
              setEventModalOpen(true);
            }}
            className="w-full gap-2 bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] hover:opacity-90 mb-3"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
          <Button
            onClick={() => setImportModalOpen(true)}
            variant="outline"
            className="w-full gap-2"
          >
            <Download className="w-4 h-4" />
            Import Calendar
          </Button>
        </div>

        {/* SCROLLABLE CONTENT SECTIONS - Flex container */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* My Calendars Section */}
          <div className="flex flex-col border-b border-border" style={{ maxHeight: "40%" }}>
            {/* Section Header - Fixed */}
            <div className="px-6 py-4 flex-shrink-0">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">My Calendars</h3>
            </div>
            
            {/* Section Content - Scrollable */}
            <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
              <div className="px-6 pb-4 space-y-2">
                {calendars.map((cal) => (
                  <div key={cal.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cal.color }}
                      />
                      <span className="text-sm font-medium truncate">{cal.name}</span>
                    </div>
                    <Switch
                      checked={cal.visible}
                      onCheckedChange={() => toggleCalendarVisibility(cal.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Tasks Section */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Section Header - Fixed */}
            <div className="px-6 py-4 border-b border-border flex-shrink-0">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Upcoming Tasks</h3>
            </div>
            
            {/* Section Content - Scrollable */}
            <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
              <div className="px-6 py-4 space-y-2">
                {upcomingItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-accent/50 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getPriorityColor(item.priority)}`} />
                      <p className="text-sm font-medium flex-1 leading-tight">{item.title}</p>
                    </div>
                    {item.date && (
                      <p className="text-xs text-muted-foreground ml-4">
                        {format(item.date, "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Section Footer - Sticky "View All Tasks" Button */}
            <div className="p-6 border-t border-border bg-card flex-shrink-0">
              <Link to="/tasks">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  View All Tasks
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Center Panel - Calendar View */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Calendar Header */}
        <div className="p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold">
                {format(currentDate, "MMMM yyyy")}
              </h1>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate("prev")}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate("next")}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Time Scale Control (only in day/week view) */}
              {(viewMode === "day" || viewMode === "week") && (
                <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-xl">
                  <ZoomOut className="w-4 h-4 text-muted-foreground" />
                  <div className="w-24">
                    <Slider
                      value={[timeScale === "compact" ? 0 : timeScale === "comfortable" ? 1 : 2]}
                      onValueChange={(value) => {
                        const scales: TimeScale[] = ["compact", "comfortable", "expanded"];
                        setTimeScale(scales[value[0]]);
                      }}
                      max={2}
                      step={1}
                      className="cursor-pointer"
                    />
                  </div>
                  <ZoomIn className="w-4 h-4 text-muted-foreground" />
                </div>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-accent rounded-xl">
                {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                      viewMode === mode
                        ? "bg-card shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleGenerateAIPlan}
                className="gap-2 bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] hover:opacity-90"
              >
                <Sparkles className="w-4 h-4" />
                Generate Plan
              </Button>
            </div>
          </div>
        </div>

        {/* Week View Grid */}
        {viewMode === "week" && (
          <div className="flex-1 flex overflow-hidden">
            <div 
              ref={calendarScrollRef}
              className="flex-1 overflow-y-auto overflow-x-hidden"
              style={{ scrollbarGutter: "stable" }}
            >
              <div className="flex min-w-0">
                {/* Time Column - Scrolls with content */}
                <div className="w-20 border-r border-border bg-card flex-shrink-0 sticky left-0 z-20">
                  <div className="h-16 border-b border-border bg-card" /> {/* Header spacer */}
                  <div className="relative">
                    {hours.map((hour) => (
                      <div 
                        key={hour} 
                        className="border-t border-border flex items-start justify-end pr-3 pt-1"
                        style={{ height: `${hourHeight}px` }}
                      >
                        <span className="text-xs text-muted-foreground">
                          {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Days Grid */}
                <div className="flex-1 grid grid-cols-7 min-w-0">
                  {/* Day Headers - Sticky */}
                  {weekDays.map((day) => {
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div key={day.toISOString()} className="border-r border-border min-w-0">
                        <div className={`h-16 flex flex-col items-center justify-center border-b border-border sticky top-0 z-10 bg-card ${
                          isToday ? "bg-accent/30" : ""
                        }`}>
                          <span className="text-xs text-muted-foreground uppercase">
                            {format(day, "EEE")}
                          </span>
                          <span
                            className={`text-lg font-semibold mt-1 ${
                              isToday
                                ? "w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-[#5B8DEF] to-[#8B5CF6] text-white"
                                : ""
                            }`}
                          >
                            {format(day, "d")}
                          </span>
                        </div>

                        {/* Time Grid with current day highlight */}
                        <div className={`relative ${isToday ? "bg-accent/5" : ""}`}>
                          {hours.map((hour) => (
                            <div
                              key={hour}
                              onClick={() => handleSlotClick(day, hour)}
                              className="border-t border-border hover:bg-accent/30 transition-colors cursor-pointer"
                              style={{ height: `${hourHeight}px` }}
                            />
                          ))}

                          {/* Current Time Indicator */}
                          {isToday && (
                            <div
                              className="absolute left-0 right-0 flex items-center z-30 pointer-events-none"
                              style={{ top: `${currentTimeTop}px` }}
                            >
                              <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                              <div className="flex-1 h-0.5 bg-red-500" />
                            </div>
                          )}

                          {/* Events */}
                          {getEventsForDay(day).map((event) => {
                            const { top, height } = getEventPosition(event);
                            return (
                              <motion.div
                                key={event.id}
                                initial={event.isAIGenerated ? { opacity: 0, scale: 0.9 } : false}
                                animate={{ opacity: event.isAIGenerated ? 0.6 : 1, scale: 1 }}
                                onDoubleClick={() => handleEventClick(event)}
                                className={`absolute left-1 right-1 rounded-lg p-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg overflow-hidden ${
                                  event.isAIGenerated ? "border-2 border-dashed border-[#5B8DEF]" : ""
                                }`}
                                style={{
                                  top: `${top}px`,
                                  height: `${height}px`,
                                  backgroundColor: event.color + (event.isAIGenerated ? "40" : ""),
                                  zIndex: event.isAIGenerated ? 5 : 10,
                                  minHeight: "20px",
                                }}
                              >
                                <p className="text-xs font-medium text-white line-clamp-1">
                                  {event.title}
                                </p>
                                {height > 30 && (
                                  <p className="text-xs text-white/80">
                                    {format(event.start, "h:mm a")}
                                  </p>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Day View */}
        {viewMode === "day" && (
          <div className="flex-1 flex overflow-hidden">
            <div 
              ref={calendarScrollRef}
              className="flex-1 overflow-y-auto"
              style={{ scrollbarGutter: "stable" }}
            >
              <div className="flex">
                {/* Time Column */}
                <div className="w-20 border-r border-border bg-card flex-shrink-0 sticky left-0 z-20">
                  <div className="h-16 border-b border-border bg-card" />
                  <div className="relative">
                    {hours.map((hour) => (
                      <div 
                        key={hour} 
                        className="border-t border-border flex items-start justify-end pr-3 pt-1"
                        style={{ height: `${hourHeight}px` }}
                      >
                        <span className="text-xs text-muted-foreground">
                          {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Day Grid */}
                <div className="flex-1">
                  <div className={`h-16 border-b border-border flex items-center justify-center sticky top-0 z-10 bg-card ${
                    isSameDay(currentDate, new Date()) ? "bg-accent/30" : ""
                  }`}>
                    <span className="text-2xl font-semibold">{format(currentDate, "EEEE, MMMM d")}</span>
                  </div>
                  <div className={`relative ${isSameDay(currentDate, new Date()) ? "bg-accent/5" : ""}`}>
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        onClick={() => handleSlotClick(currentDate, hour)}
                        className="border-t border-border hover:bg-accent/30 transition-colors cursor-pointer"
                        style={{ height: `${hourHeight}px` }}
                      />
                    ))}

                    {/* Current Time Indicator */}
                    {isSameDay(currentDate, new Date()) && (
                      <div
                        className="absolute left-0 right-0 flex items-center z-30 pointer-events-none"
                        style={{ top: `${currentTimeTop}px` }}
                      >
                        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                        <div className="flex-1 h-0.5 bg-red-500" />
                      </div>
                    )}

                    {/* Events */}
                    {getEventsForDay(currentDate).map((event) => {
                      const { top, height } = getEventPosition(event);
                      return (
                        <motion.div
                          key={event.id}
                          initial={event.isAIGenerated ? { opacity: 0, scale: 0.9 } : false}
                          animate={{ opacity: event.isAIGenerated ? 0.6 : 1, scale: 1 }}
                          onDoubleClick={() => handleEventClick(event)}
                          className={`absolute left-4 right-4 rounded-lg p-4 cursor-pointer hover:shadow-lg ${
                            event.isAIGenerated ? "border-2 border-dashed border-[#5B8DEF]" : ""
                          }`}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            backgroundColor: event.color + (event.isAIGenerated ? "40" : ""),
                            zIndex: event.isAIGenerated ? 5 : 10,
                          }}
                        >
                          <p className="font-medium text-white">{event.title}</p>
                          <p className="text-sm text-white/80">
                            {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Month View */}
        {viewMode === "month" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {paddedMonthDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentDate);
                const dayEvents = getEventsForDay(day);

                return (
                  <motion.div
                    key={day.toISOString()}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => handleDayClick(day)}
                    className={`aspect-square border border-border rounded-xl p-2 cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
                      isToday ? "bg-gradient-to-br from-[#5B8DEF]/10 to-[#8B5CF6]/10 border-[#5B8DEF]" : "bg-card"
                    } ${!isCurrentMonth ? "opacity-40" : ""}`}
                  >
                    <div className="flex flex-col h-full">
                      <div className={`text-sm font-semibold mb-1 ${
                        isToday ? "text-[#5B8DEF]" : isCurrentMonth ? "" : "text-muted-foreground"
                      }`}>
                        {format(day, "d")}
                      </div>
                      <div className="flex-1 space-y-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className="w-full h-1.5 rounded-full"
                            style={{ backgroundColor: event.color }}
                            title={event.title}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - AI Suggestions */}
      <AnimatePresence>
        {showAIPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 384, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-card border-l border-border overflow-hidden flex-shrink-0"
          >
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">AI Plan</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIPanel(false)}
                >
                  Close
                </Button>
              </div>

              {showAISuggestions ? (
                <div className="space-y-6 flex-1 overflow-y-auto">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[#5B8DEF]/10 to-[#8B5CF6]/10 border border-[#5B8DEF]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-[#5B8DEF]" />
                      <span className="text-sm font-medium">AI Generated Schedule</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      I've scheduled your pending tasks in your free time slots while respecting your preferences.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Scheduled Tasks</h3>
                    {aiGeneratedEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-4 rounded-xl bg-accent/50 border border-border"
                      >
                        <h4 className="font-medium mb-1">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(event.start, "EEE, MMM d • h:mm a")} - {format(event.end, "h:mm a")}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 mt-auto pt-6">
                    <Button
                      onClick={handleAcceptAIPlan}
                      className="w-full bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] hover:opacity-90"
                    >
                      Accept Plan
                    </Button>
                    <Button
                      onClick={handleRegenerateAIPlan}
                      variant="outline"
                      className="w-full"
                    >
                      Regenerate
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      AI suggestions will appear here
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <EventModal
        open={eventModalOpen}
        onClose={() => {
          setEventModalOpen(false);
          setSelectedEvent(null);
          setClickedSlot(null);
        }}
        event={selectedEvent}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        defaultDate={clickedSlot?.date}
        defaultStartTime={clickedSlot?.time}
      />

      <ImportCalendarModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportCalendar}
      />
    </div>

);
}