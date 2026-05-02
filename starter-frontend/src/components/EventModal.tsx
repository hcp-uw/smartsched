import { useState, useEffect } from "react";
import { X, Trash2, Calendar as CalendarIcon, Clock, Tag as TagIcon, Palette } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CalendarEvent, mockCalendarSources } from "../data/mockData";
import { format } from "date-fns";

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
  defaultDate?: Date;
  defaultStartTime?: string;
}

const colorOptions = [
  { name: "Work", value: "#5B8DEF" },
  { name: "Personal", value: "#8B5CF6" },
  { name: "Meeting", value: "#EC4899" },
  { name: "Focus", value: "#10B981" },
  { name: "Break", value: "#F59E0B" },
];

export function EventModal({ open, onClose, event, onSave, onDelete, defaultDate, defaultStartTime }: EventModalProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedCalendar, setSelectedCalendar] = useState("cal1");
  const [color, setColor] = useState("#5B8DEF");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setStartDate(format(event.start, "yyyy-MM-dd"));
      setStartTime(format(event.start, "HH:mm"));
      setEndDate(format(event.end, "yyyy-MM-dd"));
      setEndTime(format(event.end, "HH:mm"));
      setColor(event.color);
    } else if (defaultDate) {
      setStartDate(format(defaultDate, "yyyy-MM-dd"));
      setEndDate(format(defaultDate, "yyyy-MM-dd"));
      if (defaultStartTime) {
        setStartTime(defaultStartTime);
        // Default to 1 hour duration
        const [hours, minutes] = defaultStartTime.split(":").map(Number);
        const endHour = hours + 1;
        setEndTime(`${endHour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`);
      }
    } else {
      // Reset form
      setTitle("");
      setStartDate(format(new Date(), "yyyy-MM-dd"));
      setEndDate(format(new Date(), "yyyy-MM-dd"));
      setStartTime("09:00");
      setEndTime("10:00");
      setColor("#5B8DEF");
      setTags("");
      setDescription("");
    }
  }, [event, defaultDate, defaultStartTime, open]);

  const handleSave = () => {
    if (!title.trim()) return;

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    const newEvent: CalendarEvent = {
      id: event?.id || `evt-${Date.now()}`,
      title,
      start: startDateTime,
      end: endDateTime,
      category: "work",
      color,
    };

    onSave(newEvent);
    onClose();
  };

  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            {event ? "Edit Event" : "Create Event"}
          </DialogTitle>
          <DialogDescription>
            {event ? "Update event details and save your changes." : "Create a new event on your calendar."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Team meeting, Focus time, etc."
              className="mt-2"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Start Date & Time
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-28"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="end-date">End Date & Time</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-28"
                />
              </div>
            </div>
          </div>

          {/* Calendar Selection */}
          <div>
            <Label htmlFor="calendar">Calendar</Label>
            <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockCalendarSources.map((cal) => (
                  <SelectItem key={cal.id} value={cal.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cal.color }} />
                      {cal.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color Picker */}
          <div>
            <Label className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Color
            </Label>
            <div className="flex gap-2 mt-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setColor(option.value)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    color === option.value
                      ? "ring-2 ring-primary ring-offset-2 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: option.value }}
                  title={option.name}
                />
              ))}
            </div>
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
              placeholder="meeting, important, client (comma separated)"
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes or details about this event..."
              className="mt-2 resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {event && onDelete && (
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
              Save Event
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}