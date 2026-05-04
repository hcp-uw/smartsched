import { useState } from "react";
import { Download, Link as LinkIcon, Upload, Palette } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";

interface ImportCalendarModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (name: string, color: string) => void;
}

const colorOptions = [
  "#5B8DEF",
  "#8B5CF6",
  "#EC4899",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#8B5A3C",
];

export function ImportCalendarModal({ open, onClose, onImport }: ImportCalendarModalProps) {
  const [calendarName, setCalendarName] = useState("");
  const [calendarUrl, setCalendarUrl] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [importMethod, setImportMethod] = useState<"url" | "file">("url");

  const handleImport = () => {
    if (!calendarName.trim()) {
      toast.error("Please enter a calendar name");
      return;
    }

    if (importMethod === "url" && !calendarUrl.trim()) {
      toast.error("Please enter a calendar URL");
      return;
    }

    onImport(calendarName, selectedColor);
    toast.success(`Calendar "${calendarName}" imported successfully!`);
    
    // Reset form
    setCalendarName("");
    setCalendarUrl("");
    setSelectedColor(colorOptions[0]);
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Auto-fill calendar name from file name
      const name = file.name.replace(/\.[^/.]+$/, "");
      setCalendarName(name);
      toast.success(`File "${file.name}" selected`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Import Calendar
          </DialogTitle>
          <DialogDescription>
            Import a calendar from a URL or upload an .ics file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Calendar Name */}
          <div>
            <Label htmlFor="calendar-name">Calendar Name *</Label>
            <Input
              id="calendar-name"
              value={calendarName}
              onChange={(e) => setCalendarName(e.target.value)}
              placeholder="Work Calendar, Personal, etc."
              className="mt-2"
            />
          </div>

          {/* Import Method */}
          <Tabs value={importMethod} onValueChange={(v) => setImportMethod(v as "url" | "file")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url" className="gap-2">
                <LinkIcon className="w-4 h-4" />
                URL
              </TabsTrigger>
              <TabsTrigger value="file" className="gap-2">
                <Upload className="w-4 h-4" />
                File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-2 mt-4">
              <Label htmlFor="calendar-url">Calendar URL</Label>
              <Input
                id="calendar-url"
                type="url"
                value={calendarUrl}
                onChange={(e) => setCalendarUrl(e.target.value)}
                placeholder="https://calendar.example.com/ical"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                Enter an iCal (.ics) or CalDAV URL
              </p>
            </TabsContent>

            <TabsContent value="file" className="space-y-2 mt-4">
              <Label htmlFor="calendar-file">Upload File</Label>
              <div className="mt-2">
                <label
                  htmlFor="calendar-file"
                  className="flex items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-border rounded-xl hover:border-primary transition-colors cursor-pointer bg-accent/30 hover:bg-accent/50"
                >
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Click to upload</p>
                    <p className="text-xs text-muted-foreground">
                      .ics, .ical files supported
                    </p>
                  </div>
                </label>
                <input
                  id="calendar-file"
                  type="file"
                  accept=".ics,.ical"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Color Selection */}
          <div>
            <Label className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Calendar Color
            </Label>
            <div className="flex gap-2 mt-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    selectedColor === color
                      ? "ring-2 ring-primary ring-offset-2 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!calendarName.trim()}
            className="flex-1 bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] hover:opacity-90"
          >
            Import Calendar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}