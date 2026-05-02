import { useState, useEffect } from "react";
import { X, Trash2, Clock, Calendar as CalendarIcon, Tag as TagIcon, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Task } from "../data/mockData";
import { format } from "date-fns";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  onSave: (task: Task) => void;
  onDelete?: (id: string) => void;
}

export function TaskModal({ open, onClose, task, onSave, onDelete }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [duration, setDuration] = useState("30");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setPriority(task.priority);
      setDuration(task.duration.toString());
      setDueDate(task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : "");
      setTags(task.tags.join(", "));
    } else {
      // Reset form
      setTitle("");
      setPriority("medium");
      setDuration("30");
      setDueDate("");
      setTags("");
      setNotes("");
    }
  }, [task, open]);

  const handleSave = () => {
    if (!title.trim()) return;

    const newTask: Task = {
      id: task?.id || `task-${Date.now()}`,
      title,
      completed: task?.completed || false,
      priority,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      duration: parseInt(duration) || 30,
      dueDate: dueDate ? new Date(dueDate) : null,
      category: "work",
    };

    onSave(newTask);
    onClose();
  };

  const handleDelete = () => {
    if (task && onDelete) {
      onDelete(task.id);
      onClose();
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "high":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20";
      case "low":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            {task ? "Edit Task" : "Add Task"}
          </DialogTitle>
          <DialogDescription>
            {task ? "Update task details and save your changes." : "Create a new task with priority, duration, and tags."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div>
            <Label htmlFor="task-title">Task Title *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="mt-2"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <Label htmlFor="priority" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Priority
              </Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      High
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div>
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Estimated Duration (minutes)
              </Label>
              <Input
                id="duration"
                type="number"
                min="5"
                step="5"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="due-date" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Due Date
            </Label>
            <Input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags" className="flex items-center gap-2">
              <TagIcon className="w-4 h-4" />
              Tags
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="work, urgent, design (comma separated)"
              className="mt-2"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              className="mt-2 resize-none"
              rows={3}
            />
          </div>

          {/* Priority Preview */}
          {priority && (
            <div className={`p-3 rounded-lg ${getPriorityColor(priority)}`}>
              <p className="text-sm font-medium capitalize">
                {priority} Priority Task
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {task && onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim()}
              className="bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] hover:opacity-90"
            >
              {task ? "Save Changes" : "Add Task"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}