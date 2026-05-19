import { useState, useRef, useEffect } from "react";
import { Sparkles, Wand2, Calendar, CheckSquare, Zap, RefreshCw, MessageSquare, Send, Bot, User as UserIcon, Loader2, Check, Trash2, Edit3, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { motion, AnimatePresence } from "motion/react";
import { startOfDay, addDays, startOfWeek, format } from "date-fns";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { generateAISchedule, filterTasksForScheduling } from "../utils/aiScheduler";
import { chat } from "../services/ai";
import { VisualWeekScheduler, VisualBlock } from "../components/VisualWeekScheduler";

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
    addEvent,
    updateEvent,
    deleteEvent,
    updateTask,
  } = useApp();

  // ============================================================================
  // LOCAL UI STATE (Not persisted, view-specific)
  // ============================================================================
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState("optimizer");
  
  const [visualBlocks, setVisualBlocks] = useState<VisualBlock[]>([]);
  
  // Filter states
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(["high", "medium", "low"]);
  const [includeCompleted, setIncludeCompleted] = useState(false);

  // Chat states
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string, actions?: any[]}[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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
  const handleGenerateSchedule = async () => {
    if (filteredTasks.length === 0) {
      toast.error("No tasks match your filters. Adjust filters to include more tasks.");
      return;
    }

    setIsGenerating(true);
    
    try {
      // 1. Prepare data for the program (local utility)
      // Extract preferences from visual blocks
      const workBlocks = visualBlocks.filter(b => b.type === 'work');
      const freeBlocks = visualBlocks.filter(b => b.type === 'free');
      const busyBlocks = visualBlocks.filter(b => b.type === 'busy');

      const applyBlockTime = (date: Date, hour: number) => {
        const wholeHours = Math.floor(hour);
        const minutes = Math.round((hour - wholeHours) * 60);
        date.setHours(wholeHours, minutes, 0, 0);
      };

      // Helper to convert visual block to Date slots for current week
      const blockToSlots = (blocks: VisualBlock[]) => {
        const today = startOfDay(new Date());
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday

        return blocks.map(b => {
          // b.day is 0-6 (Sun-Sat)
          // Adjust for Monday start if necessary, but startOfWeek(..., {weekStartsOn: 1}) gives Monday.
          // If b.day is 1 (Mon), it should be weekStart + 0 days.
          // If b.day is 0 (Sun), it should be weekStart + 6 days.
          let dayOffset = b.day === 0 ? 6 : b.day - 1;
          const blockDate = addDays(weekStart, dayOffset);
          
          const start = new Date(blockDate);
          applyBlockTime(start, b.startHour);
          
          const end = new Date(blockDate);
          applyBlockTime(end, b.endHour);
          
          return { start, end };
        });
      };

      // For programmatic scheduler, we still need workDays and workHours
      // We can derive them from work blocks or adapt the scheduler
      const workDays = Array.from(new Set(workBlocks.map(b => b.day)));
      
      const preferences = {
        // Fallback work hours if no work blocks defined
        workHoursStart: workBlocks.length > 0 ? Math.min(...workBlocks.map(b => b.startHour)) : 9,
        workHoursEnd: workBlocks.length > 0 ? Math.max(...workBlocks.map(b => b.endHour)) : 17,
        workDays: workDays.length > 0 ? workDays : [1, 2, 3, 4, 5],
        busySlots: blockToSlots(busyBlocks),
        freeSlots: blockToSlots(freeBlocks),
        maxTasksPerDay: 5,
      };

      // 2. Initial programmatic generation
      const aiSchedule = generateAISchedule({
        tasks: filteredTasks,
        existingEvents: events,
        calendars,
        preferences,
      });

      // 3. Optional: LLM Overhaul/Analysis
      // We can ask the LLM to review the generated schedule
      const llmPrompt = `I have generated an initial schedule for the user based on these tasks:
      ${JSON.stringify(filteredTasks.map(t => ({ title: t.title, priority: t.priority, duration: t.duration })))}
      
      And these constraints (Visual Blocks):
      Work Blocks: ${JSON.stringify(workBlocks.map(b => ({ day: b.day, start: b.startHour, end: b.endHour })))}
      Free Blocks: ${JSON.stringify(freeBlocks.map(b => ({ day: b.day, start: b.startHour, end: b.endHour })))}
      Busy Blocks: ${JSON.stringify(busyBlocks.map(b => ({ day: b.day, start: b.startHour, end: b.endHour })))}
      
      Initial generated events:
      ${JSON.stringify(aiSchedule.map(e => ({ title: e.title, start: e.start, end: e.end })))}
      
      Does this schedule look optimal? If you have suggestions for improvement, please let me know.
      Respond with "The schedule looks good" or provide suggestions. 
      Limit your response to 50 words.`;

      const llmResponse = await chat(llmPrompt, { history: [] });

      // Update state through context
      setAIGeneratedEvents(aiSchedule);
      setIsGenerating(false);
      setHasGenerated(true);
      toast.success("AI schedule generated successfully!");

      // 4. Redirect to AI Chat for tweaks
      setActiveTab("chat");
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: `I've generated an optimized schedule based on your work hours and preferences! \n\n**Expert Analysis:** ${llmResponse.response}\n\nYou can see the preview in the Optimizer tab. Would you like to tweak anything here?` 
        }
      ]);

    } catch (error) {
      console.error("Optimization error:", error);
      toast.error("Failed to generate optimized schedule.");
      setIsGenerating(false);
    }
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const context = {
        tasks: tasks.map(t => ({ id: t.id, title: t.title, completed: t.completed, priority: t.priority, duration: t.duration, dueDate: t.dueDate })),
        events: events.map(e => ({ id: e.id, title: e.title, start: e.start, end: e.end })),
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content.replace(/```json-actions[\s\S]*?```/g, "").trim() }))
      };
      
      const data = await chat(userMessage, context);
      
      // Parse for actions
      let content = data.response;
      let actions = undefined;
      
      const jsonMatch = content.match(/```json-actions\n([\s\S]*?)\n```/) || content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          actions = JSON.parse(jsonMatch[1]);
          // Clean content from json block for cleaner display if desired, 
          // or just leave it. The prompt asked to include them.
        } catch (e) {
          console.error("Failed to parse AI actions", e);
        }
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content, actions }]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get AI response. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Conversation context cleared.");
  };

  const handleApproveAction = (action: any, messageIdx: number, actionIdx: number) => {
    try {
      switch (action.type) {
        case 'add_event':
          addEvent({
            id: crypto.randomUUID(),
            ...action.payload,
            start: new Date(action.payload.start),
            end: new Date(action.payload.end),
            calendarId: calendars[0]?.id
          });
          break;
        case 'update_event':
          updateEvent(action.payload.id, {
            ...action.payload.updates,
            ...(action.payload.updates.start && { start: new Date(action.payload.updates.start) }),
            ...(action.payload.updates.end && { end: new Date(action.payload.updates.end) }),
          });
          break;
        case 'delete_event':
          deleteEvent(action.payload.id);
          break;
        case 'update_task':
          updateTask(action.payload.id, action.payload.updates);
          break;
        default:
          console.warn("Unknown action type", action.type);
      }
      
      // Mark as approved in local state to disable button
      setMessages(prev => {
        const newMessages = [...prev];
        const msg = { ...newMessages[messageIdx] };
        const newActions = [...(msg.actions || [])];
        newActions[actionIdx] = { ...newActions[actionIdx], approved: true };
        msg.actions = newActions;
        newMessages[messageIdx] = msg;
        return newMessages;
      });
      
      toast.success(`Action approved: ${action.description || action.type}`);
    } catch (e) {
      console.error("Failed to apply action", e);
      toast.error("Failed to apply action.");
    }
  };

  return (
    <div className="h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-3">
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

            <TabsList className="grid w-full grid-cols-2 md:w-[300px]">
              <TabsTrigger value="optimizer" className="gap-2">
                <Wand2 className="w-4 h-4" />
                Optimizer
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                AI Chat
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="optimizer" className="mt-0">
            {!hasGenerated ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-800 dark:bg-blue-950/30"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold leading-tight">Smart Scheduling</h3>
                      <p className="text-sm text-muted-foreground">Finds space in your week</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50/80 p-4 dark:border-purple-800 dark:bg-purple-950/30"
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-600 dark:bg-purple-500 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold leading-tight">Priority Aware</h3>
                      <p className="text-sm text-muted-foreground">Weights important work first</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50/80 p-4 dark:border-green-800 dark:bg-green-950/30"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-600 dark:bg-green-500 flex items-center justify-center shrink-0">
                      <CheckSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold leading-tight">Preference Based</h3>
                      <p className="text-sm text-muted-foreground">Uses your weekly blocks</p>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-card border border-border rounded-2xl p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
                    <div>
                      <h2 className="text-2xl font-semibold">Week View</h2>
                      <p className="text-sm text-muted-foreground">
                        Draw work, free, and busy blocks, then generate a plan from the matching task set.
                      </p>
                    </div>
                    <Button
                      onClick={handleGenerateSchedule}
                      disabled={isGenerating || filteredTasks.length === 0}
                      className="h-12 gap-2 bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] hover:opacity-90"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5" />
                          Generate AI Schedule
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="h-[680px] min-h-[560px] rounded-xl bg-background">
                    <VisualWeekScheduler blocks={visualBlocks} onChange={setVisualBlocks} />
                  </div>

                  <div className="mt-5 rounded-xl border border-border bg-accent/20 p-4">
                    <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs mb-2 block font-semibold uppercase text-muted-foreground">
                            Priorities
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {["high", "medium", "low"].map((priority) => (
                              <Button
                                key={priority}
                                size="sm"
                                variant={selectedPriorities.includes(priority) ? "default" : "outline"}
                                onClick={() => togglePriority(priority)}
                                className="h-8 capitalize"
                              >
                                {priority}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {allTags.length > 0 && (
                          <div>
                            <Label className="text-xs mb-2 block font-semibold uppercase text-muted-foreground">
                              Tags
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {allTags.map((tag) => (
                                <Button
                                  key={tag}
                                  size="sm"
                                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                                  onClick={() => toggleTag(tag)}
                                  className="h-8"
                                >
                                  {tag}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row xl:flex-col items-start sm:items-center xl:items-end gap-3">
                        <div className="flex items-center gap-3">
                          <Label className="text-sm">Include Completed</Label>
                          <Switch checked={includeCompleted} onCheckedChange={setIncludeCompleted} />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{filteredTasks.length} matching tasks</span>
                          <Button onClick={resetFilters} variant="ghost" size="sm">
                            Reset
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

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
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <div className="bg-card border border-border rounded-2xl flex flex-col h-[600px] overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-accent/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B8DEF] to-[#8B5CF6] flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Smart Assistant</h2>
                    <p className="text-xs text-muted-foreground">Always active to help you plan</p>
                  </div>
                </div>

                {messages.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearChat}
                    className="text-muted-foreground hover:text-destructive gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Chat
                  </Button>
                )}
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4 pr-4" ref={scrollRef}>
                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-1">Welcome to AI Chat</h3>
                      <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                        Ask me anything about your schedule, tasks, or productivity tips.
                      </p>
                    </div>
                  )}
                  
                  <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            msg.role === 'user' ? 'bg-primary' : 'bg-gradient-to-br from-[#5B8DEF] to-[#8B5CF6]'
                          }`}>
                            {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                          </div>
                          <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                            msg.role === 'user' 
                              ? 'bg-primary text-primary-foreground rounded-tr-none' 
                              : 'bg-accent text-accent-foreground rounded-tl-none shadow-sm border border-border/50'
                          }`}>
                            {msg.content.replace(/```json-actions\n[\s\S]*?\n```/g, '').trim()}
                          </div>
                        </div>

                        {/* Suggested Actions */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="ml-11 mt-1 space-y-3 w-[85%]">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Proposed Changes</p>
                            {msg.actions.map((action, actionIdx) => (
                              <motion.div 
                                key={actionIdx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: actionIdx * 0.1 }}
                                className="bg-card border border-border/50 rounded-xl p-3 shadow-sm hover:border-primary/50 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                      action.type === 'add_event' ? 'bg-green-100 text-green-600 dark:bg-green-950/30' :
                                      action.type === 'update_event' ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/30' :
                                      action.type === 'delete_event' ? 'bg-red-100 text-red-600 dark:bg-red-950/30' :
                                      'bg-purple-100 text-purple-600 dark:bg-purple-950/30'
                                    }`}>
                                      {action.type === 'add_event' && <Plus className="w-4 h-4" />}
                                      {action.type === 'update_event' && <Edit3 className="w-4 h-4" />}
                                      {action.type === 'delete_event' && <Trash2 className="w-4 h-4" />}
                                      {action.type === 'update_task' && <CheckSquare className="w-4 h-4" />}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium leading-tight mb-1">{action.description || action.type}</p>
                                      {action.type === 'add_event' && (
                                        <p className="text-xs text-muted-foreground">
                                          {format(new Date(action.payload.start), 'MMM d, h:mm a')} - {format(new Date(action.payload.end), 'h:mm a')}
                                        </p>
                                      )}
                                      {action.type === 'update_event' && action.payload.updates.start && (
                                        <p className="text-xs text-muted-foreground">
                                          New time: {format(new Date(action.payload.updates.start), 'h:mm a')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={action.approved ? "ghost" : "outline"}
                                    disabled={action.approved}
                                    onClick={() => handleApproveAction(action, idx, actionIdx)}
                                    className={`h-8 px-3 gap-1.5 transition-all ${
                                      action.approved 
                                        ? "text-green-600 bg-green-50 dark:bg-green-950/20" 
                                        : "hover:bg-primary hover:text-white"
                                    }`}
                                  >
                                    {action.approved ? (
                                      <>
                                        <Check className="w-3.5 h-3.5" />
                                        Approved
                                      </>
                                    ) : (
                                      <>Approve</>
                                    )}
                                  </Button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5B8DEF] to-[#8B5CF6] flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-accent text-accent-foreground p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs font-medium">Assistant is thinking...</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t border-border bg-accent/10">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask AI about your schedule..."
                    className="flex-1 h-11"
                    disabled={isTyping}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="h-11 w-11 shrink-0 bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6]"
                    disabled={!input.trim() || isTyping}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
