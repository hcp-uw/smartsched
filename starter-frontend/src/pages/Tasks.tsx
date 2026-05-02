import { useState } from "react";
import { Plus, Filter, Calendar, Clock, Tag, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { Task } from "../data/mockData";
import { TaskModal } from "../components/TaskModal";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";

type FilterType = "all" | "high" | "medium" | "low";

export function Tasks() {
  // ============================================================================
  // STATE MANAGEMENT - Using Centralized Context
  // ============================================================================
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask: deleteTaskFromContext,
    toggleTask: toggleTaskInContext,
  } = useApp();

  // ============================================================================
  // LOCAL UI STATE (Not persisted, view-specific)
  // ============================================================================
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  
  // Modal states
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  const openCreateModal = () => {
    setSelectedTask(null);
    setTaskModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const handleSaveTask = (task: Task) => {
    if (selectedTask) {
      // Update existing task through context
      updateTask(task.id, task);
      toast.success("Task updated!");
    } else {
      // Add new task through context
      addTask(task);
      toast.success("Task created!");
    }
  };

  const handleToggleTask = (id: string) => {
    toggleTaskInContext(id);
  };

  const handleDeleteTask = (id: string) => {
    deleteTaskFromContext(id);
    toast.success("Task deleted!");
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.priority === filter;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 dark:text-red-400";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400";
      case "low":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const incompleteTasks = filteredTasks.filter((t) => !t.completed);
  const completedTasks = filteredTasks.filter((t) => t.completed);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Main Task List */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-8 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold">Tasks</h1>
            <Button
              onClick={openCreateModal}
              className="gap-2 bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-2">
              {(["all", "high", "medium", "low"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                    filter === f
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  {f}
                  {f !== "all" && (
                    <span className="ml-2 text-xs">
                      ({tasks.filter((t) => t.priority === f && !t.completed).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Task Lists */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Incomplete Tasks */}
          {incompleteTasks.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-4">
                To Do ({incompleteTasks.length})
              </h2>
              <div className="space-y-2">
                {incompleteTasks.map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    index={index}
                    expanded={expandedTask === task.id}
                    onToggle={() => handleToggleTask(task.id)}
                    onDelete={() => handleDeleteTask(task.id)}
                    onExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    onEdit={() => openEditModal(task)}
                    getPriorityColor={getPriorityColor}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-4">
                Completed ({completedTasks.length})
              </h2>
              <div className="space-y-2 opacity-60">
                {completedTasks.map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    index={index}
                    expanded={expandedTask === task.id}
                    onToggle={() => handleToggleTask(task.id)}
                    onDelete={() => handleDeleteTask(task.id)}
                    onExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    onEdit={() => openEditModal(task)}
                    getPriorityColor={getPriorityColor}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium mb-2">No tasks found</p>
              <p className="text-muted-foreground mb-4">
                {filter === "all" ? "Add a task to get started" : `No ${filter} priority tasks`}
              </p>
              <Button
                onClick={openCreateModal}
                className="gap-2 bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                Add Your First Task
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Task Stats */}
      <div className="w-80 bg-card border-l border-border p-6 flex-shrink-0 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-6">Overview</h2>

        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="p-4 rounded-xl bg-accent/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Tasks</span>
              <span className="text-2xl font-semibold">{tasks.length}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-100 dark:bg-red-900/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-red-700 dark:text-red-400">High Priority</span>
              <span className="text-2xl font-semibold text-red-700 dark:text-red-400">
                {tasks.filter((t) => t.priority === "high" && !t.completed).length}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-yellow-100 dark:bg-yellow-900/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-yellow-700 dark:text-yellow-400">Medium Priority</span>
              <span className="text-2xl font-semibold text-yellow-700 dark:text-yellow-400">
                {tasks.filter((t) => t.priority === "medium" && !t.completed).length}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-green-100 dark:bg-green-900/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-700 dark:text-green-400">Completed</span>
              <span className="text-2xl font-semibold text-green-700 dark:text-green-400">
                {completedTasks.length}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="pt-6">
            <h3 className="text-sm font-semibold mb-3">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(tasks.flatMap((t) => t.tags)))
                .slice(0, 10)
                .map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-lg bg-accent text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        open={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
  getPriorityColor: (priority: string) => string;
}

function TaskItem({ task, index, expanded, onToggle, onDelete, onExpand, onEdit, getPriorityColor }: TaskItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <div
        onDoubleClick={onEdit}
        onClick={onExpand}
        className={`p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all cursor-pointer ${
          expanded ? "shadow-md" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="mt-1"
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3
              className={`font-medium mb-2 ${
                task.completed ? "line-through text-muted-foreground" : ""
              }`}
            >
              {task.title}
            </h3>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className={`flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                <div className="w-2 h-2 rounded-full bg-current" />
                {task.priority}
              </span>

              {task.duration && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {task.duration}m
                </span>
              )}

              {task.dueDate && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {format(task.dueDate, "MMM d")}
                </span>
              )}

              {task.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-muted-foreground" />
                  <div className="flex gap-1">
                    {task.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded bg-accent text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 pt-4 border-t border-border space-y-2"
                >
                  <div className="text-sm">
                    <span className="text-muted-foreground">Category: </span>
                    <span className="capitalize">{task.category}</span>
                  </div>
                  {task.tags.length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Tags: </span>
                      {task.tags.join(", ")}
                    </div>
                  )}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Edit Task
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 rounded-lg"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}