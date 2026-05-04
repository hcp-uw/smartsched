import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Calendar, CheckSquare, Clock, Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { motion } from "motion/react";
import { format, isSameDay } from "date-fns";
import { useApp } from "../context/AppContext";
import { useRef, useEffect, useState } from "react";

const hours = Array.from({ length: 24 }, (_, i) => i);

export function Home() {
  const { events, tasks, deadlines } = useApp();
  const todayScrollRef = useRef<HTMLDivElement>(null);

  const [firstName, setFirstName] = useState("User");

  useEffect(() => {
    const loadUser = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      if (profile?.display_name) {
        const name = profile.display_name.split(" ")[0]; // 👈 first name only
        setFirstName(name);
      }
    };

    loadUser();
  }, []);

  const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};
  
  const today = new Date();
  const todayEvents = events.filter((event) => isSameDay(event.start, today));
  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const completionRate = Math.round((completedTasks.length / tasks.length) * 100);

  // Scroll to 9 AM on load
  useEffect(() => {
    if (todayScrollRef.current) {
      const hourHeight = 48; // Compact view for home
      const scrollTo = 9 * hourHeight;
      todayScrollRef.current.scrollTop = scrollTo;
    }
  }, []);

  const getEventPosition = (event: any) => {
    const hourHeight = 48;
    const startHour = event.start.getHours();
    const startMinute = event.start.getMinutes();
    const endHour = event.end.getHours();
    const endMinute = event.end.getMinutes();

    const topMinutes = startHour * 60 + startMinute;
    const durationMinutes = (endHour * 60 + endMinute) - topMinutes;

    return {
      top: (topMinutes / 60) * hourHeight,
      height: (durationMinutes / 60) * hourHeight,
    };
  };

  // Current time position
  const now = new Date();
  const currentTimeTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * 48;

  return (
    <div className="h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-muted-foreground">
            {format(today, "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#5B8DEF]" />
              </div>
              <span className="text-2xl font-semibold">{todayEvents.length}</span>
            </div>
            <h3 className="font-medium mb-1">Events Today</h3>
            <p className="text-sm text-muted-foreground">Across all calendars</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-[#8B5CF6]" />
              </div>
              <span className="text-2xl font-semibold">{incompleteTasks.length}</span>
            </div>
            <h3 className="font-medium mb-1">Pending Tasks</h3>
            <p className="text-sm text-muted-foreground">Need attention</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#10B981]" />
              </div>
              <span className="text-2xl font-semibold">{completionRate}%</span>
            </div>
            <h3 className="font-medium mb-1">Completion Rate</h3>
            <p className="text-sm text-muted-foreground">This week</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Today's Schedule</h2>
              <Link to="/calendar">
                <Button variant="ghost" size="sm" className="gap-2">
                  View Calendar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {todayEvents.length > 0 ? (
                todayEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-accent/50 hover:bg-accent transition-colors"
                  >
                    <div
                      className="w-1 h-12 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{event.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-card text-xs font-medium capitalize">
                      {event.category}
                    </span>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No events scheduled for today</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* AI Suggestion Card & Progress */}
          <div className="space-y-6">
            {/* AI Suggestion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-[#5B8DEF]/10 to-[#8B5CF6]/10 border border-[#5B8DEF]/20 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#5B8DEF]/20 to-[#8B5CF6]/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5B8DEF] to-[#8B5CF6] flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">AI Suggestion</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You have 2 hours of free time today. Want me to schedule your pending tasks?
                </p>
                <Link to="/ai-planner">
                  <Button
                    className="w-full bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] hover:opacity-90"
                    size="sm"
                  >
                    Generate Plan
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Progress Indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h3 className="font-semibold mb-4">Task Progress</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="text-sm font-medium">
                      {completedTasks.length} / {tasks.length}
                    </span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </div>
                <div className="pt-3 border-t border-border">
                  <Link to="/tasks">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      View All Tasks
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Upcoming Deadlines */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h3 className="font-semibold mb-4">Upcoming Deadlines</h3>
              <div className="space-y-3">
                {deadlines.slice(0, 3).map((deadline) => (
                  <div
                    key={deadline.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{deadline.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(deadline.date, "MMM d")}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        deadline.priority === "high"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : deadline.priority === "medium"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                      }`}
                    >
                      {deadline.priority}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}