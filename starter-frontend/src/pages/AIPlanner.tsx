import { useState } from "react";
import { Sparkles, Wand2, Calendar, CheckSquare, Zap, RefreshCw, Filter, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { motion } from "motion/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { generateAISchedule, filterTasksForScheduling } from "../utils/aiScheduler";

export function AIPlanner() {
  // ============================================================================
  // STATE MANAGEMENT - Using Centralized Context
  // ============================================================================
  const {
    tasks,
    events,
    calendars,
    aiGeneratedEvents,
    setAIGeneratedEvents,
    acceptAISchedule,
  } = useApp();

  // ============================================================================
  // LOCAL UI STATE (Not persisted, view-specific)
  // ============================================================================
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  
  // Filter states
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(["high", "medium", "low"]);
  const [includeCompleted, setIncludeCompleted] = useState(false);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags)));

  // Use AI scheduler utility to filter tasks
  const filteredTasks = filterTasksForScheduling(tasks, {
    priorities: selectedPriorities,
    tags: selectedTags,
    includeCompleted,
  });

  // ============================================================================
  // FILTER HANDLERS
  // ============================================================================
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const togglePriority = (priority: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );
  };

  const resetFilters = () => {
    setSelectedTags([]);
    setSelectedPriorities(["high", "medium", "low"]);
    setIncludeCompleted(false);
  };

  // ============================================================================
  // AI SCHEDULING LOGIC
  // ============================================================================
  const handleGenerateSchedule = () => {
    if (filteredTasks.length === 0) {
      toast.error("No tasks match your filters. Adjust filters to include more tasks.");
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      // Use AI scheduler utility to generate schedule
      const aiSchedule = generateAISchedule({
        tasks: filteredTasks,
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
      setIsGenerating(false);
      setHasGenerated(true);
      toast.success("AI schedule generated successfully!");
    }, 2000);
  };

  const handleAcceptSchedule = () => {
    acceptAISchedule();
    toast.success("Schedule added to your calendar!");
    setHasGenerated(false);
  };

  const handleRegenerate = () => {
    setHasGenerated(false);
    handleGenerateSchedule();
  };

  return (
    <div className="h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5B8DEF] to-[#8B5CF6] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">AI Planner</h1>
              <p className="text-muted-foreground">
                Let AI optimize your schedule based on your preferences
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Filter Controls */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Reset
                </Button>
              </div>

              <div className="space-y-6">
                {/* Include Completed */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-accent/30">
                  <Label htmlFor="include-completed" className="cursor-pointer">
                    Include Completed
                  </Label>
                  <Switch
                    id="include-completed"
                    checked={includeCompleted}
                    onCheckedChange={setIncludeCompleted}
                  />
                </div>

                {/* Priority Filter */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Priority</h3>
                  <div className="space-y-2">
                    {(["high", "medium", "low"] as const).map((priority) => (
                      <button
                        key={priority}
                        onClick={() => togglePriority(priority)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                          selectedPriorities.includes(priority)
                            ? priority === "high"
                              ? "bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800"
                              : priority === "medium"
                              ? "bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800"
                              : "bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-800"
                            : "bg-accent/30 hover:bg-accent/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              priority === "high"
                                ? "bg-red-500"
                                : priority === "medium"
                                ? "bg-yellow-500"
                                : "bg-blue-500"
                            }`}
                          />
                          <span className="capitalize text-sm font-medium">{priority}</span>
                        </div>
                        {selectedPriorities.includes(priority) && (
                          <CheckSquare className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags Filter */}
                {allTags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            selectedTags.includes(tag)
                              ? "bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] text-white"
                              : "bg-accent hover:bg-accent/70"
                          }`}
                        >
                          {tag}
                          {selectedTags.includes(tag) && (
                            <X className="w-3 h-3 inline ml-1" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filtered Count */}
                <div className="pt-4 border-t border-border">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#5B8DEF]/10 to-[#8B5CF6]/10">
                    <p className="text-sm text-muted-foreground">Tasks to schedule</p>
                    <p className="text-2xl font-semibold">{filteredTasks.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Main Content */}
          <div className="lg:col-span-2">
            {!hasGenerated ? (
              /* Initial State */
              <div className="space-y-8">
                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center mb-4">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">Smart Scheduling</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatically schedules tasks in your free time slots
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800"
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-600 dark:bg-purple-500 flex items-center justify-center mb-4">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">Priority Aware</h3>
                    <p className="text-sm text-muted-foreground">
                      Prioritizes high-importance tasks in your best focus hours
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border border-green-200 dark:border-green-800"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-600 dark:bg-green-500 flex items-center justify-center mb-4">
                      <CheckSquare className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">Respects Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      Honors your work hours, breaks, and personal time
                    </p>
                  </motion.div>
                </div>

                {/* Pending Tasks */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-card border border-border rounded-2xl p-6"
                >
                  <h2 className="text-xl font-semibold mb-4">
                    Tasks to Schedule ({filteredTasks.length})
                  </h2>
                  
                  {filteredTasks.length > 0 ? (
                    <>
                      <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                        {filteredTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-accent/50"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  task.priority === "high"
                                    ? "bg-red-500"
                                    : task.priority === "medium"
                                    ? "bg-yellow-500"
                                    : "bg-blue-500"
                                }`}
                              />
                              <span className="font-medium">{task.title}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{task.duration}m</span>
                              {task.dueDate && (
                                <span className="px-2 py-1 rounded bg-card">
                                  Due {format(task.dueDate, "MMM d")}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={handleGenerateSchedule}
                        disabled={isGenerating}
                        className="w-full h-14 gap-2 bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] hover:opacity-90 text-lg"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Generating your perfect schedule...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-5 h-5" />
                            Generate AI Schedule
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Filter className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-lg font-medium mb-2">No tasks match your filters</p>
                      <p className="text-muted-foreground mb-4">
                        Adjust your filters to include more tasks
                      </p>
                      <Button onClick={resetFilters} variant="outline">
                        Reset Filters
                      </Button>
                    </div>
                  )}
                </motion.div>

                {/* Info Box */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="p-6 rounded-2xl bg-gradient-to-br from-[#5B8DEF]/10 to-[#8B5CF6]/10 border border-[#5B8DEF]/20"
                >
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#5B8DEF]" />
                    How AI Planning Works
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Analyzes your calendar for available time slots</li>
                    <li>• Considers task priorities, durations, and deadlines</li>
                    <li>• Respects your schedule preferences from your profile</li>
                    <li>• Optimizes for your peak productivity hours</li>
                    <li>• Leaves buffer time between tasks for flexibility</li>
                  </ul>
                </motion.div>
              </div>
            ) : (
              /* Generated Schedule */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Success Message */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100/50 dark:from-green-950/30 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-green-600 dark:bg-green-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Schedule Generated!</h2>
                      <p className="text-sm text-muted-foreground">
                        I've optimized {filteredTasks.length} tasks based on your preferences
                      </p>
                    </div>
                  </div>
                </div>

                {/* Generated Schedule Preview */}
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4">Your AI-Optimized Schedule</h3>
                  <div className="space-y-3">
                    {aiGeneratedEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl border-2 border-dashed border-[#5B8DEF] bg-gradient-to-r from-[#5B8DEF]/5 to-[#8B5CF6]/5 hover:from-[#5B8DEF]/10 hover:to-[#8B5CF6]/10 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{event.title}</h4>
                          <span className="px-3 py-1 rounded-lg bg-card text-xs font-medium">
                            {Math.round((event.end.getTime() - event.start.getTime()) / 60000)}m
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(event.start, "EEE, MMM d")}
                          </span>
                          <span>
                            {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={handleAcceptSchedule}
                    className="h-12 bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] hover:opacity-90"
                  >
                    Accept & Add to Calendar
                  </Button>
                  <Button
                    onClick={handleRegenerate}
                    variant="outline"
                    className="h-12"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </div>

                {/* Insights */}
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">AI Insights</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-[#5B8DEF] mt-0.5" />
                      <p className="text-muted-foreground">
                        Scheduled high-priority tasks during your peak focus hours (9-11 AM)
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-[#5B8DEF] mt-0.5" />
                      <p className="text-muted-foreground">
                        Added 15-minute buffers between tasks for mental breaks
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-[#5B8DEF] mt-0.5" />
                      <p className="text-muted-foreground">
                        Grouped similar tasks together to minimize context switching
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-[#5B8DEF] mt-0.5" />
                      <p className="text-muted-foreground">
                        Respected your lunch break and no-meeting zones
                      </p>
                    </div>
                  </div>
                </div>

                {/* Back Button */}
                <Button
                  onClick={() => setHasGenerated(false)}
                  variant="outline"
                  className="w-full"
                >
                  Generate New Schedule
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}