import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Briefcase, Coffee, Ban, Trash2, Info } from 'lucide-react';

export type SlotType = 'work' | 'free' | 'busy';

export interface VisualBlock {
  id: string;
  day: number; // 0 (Sun) to 6 (Sat)
  startHour: number;
  endHour: number;
  type: SlotType;
}

interface VisualWeekSchedulerProps {
  blocks: VisualBlock[];
  onChange: (blocks: VisualBlock[]) => void;
}

const COLORS = {
  work: 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300',
  free: 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300',
  busy: 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300',
};

const TIME_STEP_MINUTES = 15;
const HOUR_HEIGHT_REM = 3;

const timeOptions = Array.from(
  { length: (24 * 60) / TIME_STEP_MINUTES + 1 },
  (_, index) => {
    const totalMinutes = index * TIME_STEP_MINUTES;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return {
      value: totalMinutes / 60,
      label: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
    };
  }
);

const formatHour = (hour: number) => {
  const totalMinutes = Math.round(hour * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const getOverlappingBlocks = (blocks: VisualBlock[], day: number, startHour: number, endHour: number, exceptId?: string) =>
  blocks.filter((block) => {
    if (block.id === exceptId || block.day !== day) return false;
    return !(endHour <= block.startHour || startHour >= block.endHour);
  });

export function VisualWeekScheduler({ blocks, onChange }: VisualWeekSchedulerProps) {
  const [selectedType, setSelectedType] = useState<SlotType>('work');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: number; hour: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ day: number; hour: number } | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ type: SlotType; startHour: number; endHour: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayIndices = [1, 2, 3, 4, 5, 6, 0]; // Monday-Sunday
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handleMouseDown = (day: number, hour: number) => {
    setIsDragging(true);
    setDragStart({ day, hour });
    setDragEnd({ day, hour });
  };

  const handleMouseEnter = (day: number, hour: number) => {
    if (isDragging) {
      setDragEnd({ day, hour });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      const day = dragStart.day;
      const startHour = Math.min(dragStart.hour, dragEnd.hour);
      const endHour = Math.max(dragStart.hour, dragEnd.hour) + 1;

      // Remove overlapping blocks of the same type or all types? 
      // User intent usually means "this area is now X"
      const newBlock: VisualBlock = {
        id: Math.random().toString(36).substr(2, 9),
        day,
        startHour,
        endHour,
        type: selectedType,
      };

      // Filter out existing blocks that are completely covered or overlap
      const filteredBlocks = blocks.filter(
        (block) => !getOverlappingBlocks(blocks, day, startHour, endHour).some((overlap) => overlap.id === block.id)
      );

      onChange([...filteredBlocks, newBlock]);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const cancelDrag = () => {
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const deleteBlock = (id: string) => {
    cancelDrag();
    if (editingBlockId === id) {
      setEditingBlockId(null);
      setEditDraft(null);
    }
    onChange(blocks.filter(b => b.id !== id));
  };

  const clearAll = () => {
    setEditingBlockId(null);
    setEditDraft(null);
    onChange([]);
  };

  const openEditor = (block: VisualBlock) => {
    cancelDrag();
    setEditingBlockId(block.id);
    setEditDraft({
      type: block.type,
      startHour: block.startHour,
      endHour: block.endHour,
    });
  };

  const updateDraftStart = (startHour: number) => {
    if (!editDraft) return;
    setEditDraft({
      ...editDraft,
      startHour,
      endHour: Math.max(editDraft.endHour, startHour + TIME_STEP_MINUTES / 60),
    });
  };

  const updateDraftEnd = (endHour: number) => {
    if (!editDraft) return;
    setEditDraft({
      ...editDraft,
      endHour,
      startHour: Math.min(editDraft.startHour, endHour - TIME_STEP_MINUTES / 60),
    });
  };

  const saveEditedBlock = () => {
    if (!editingBlockId || !editDraft) return;

    const existingBlock = blocks.find((block) => block.id === editingBlockId);
    if (!existingBlock) return;

    const editedBlock = {
      ...existingBlock,
      type: editDraft.type,
      startHour: editDraft.startHour,
      endHour: editDraft.endHour,
    };

    const overlaps = getOverlappingBlocks(
      blocks,
      editedBlock.day,
      editedBlock.startHour,
      editedBlock.endHour,
      editedBlock.id
    );

    onChange([
      ...blocks.filter((block) => block.id !== editingBlockId && !overlaps.some((overlap) => overlap.id === block.id)),
      editedBlock,
    ]);
    setEditingBlockId(null);
    setEditDraft(null);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between bg-accent/30 p-3 rounded-xl border border-border">
        <div className="flex gap-2">
          <Button
            variant={selectedType === 'work' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('work')}
            className="gap-2"
          >
            <Briefcase className="w-4 h-4" />
            Work
          </Button>
          <Button
            variant={selectedType === 'free' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('free')}
            className="gap-2"
          >
            <Coffee className="w-4 h-4" />
            Free
          </Button>
          <Button
            variant={selectedType === 'busy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('busy')}
            className="gap-2"
          >
            <Ban className="w-4 h-4" />
            Busy
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </div>

      <div className="flex items-start gap-2 text-[10px] text-muted-foreground px-2">
        <Info className="w-3 h-3" />
        <span>Click and drag vertically on a day to plot time. Click a block to fine tune exact start and end times.</span>
      </div>

      {editingBlockId && editDraft && (
        <div className="rounded-xl border border-border bg-accent/20 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold">Edit Block</h3>
              <p className="text-xs text-muted-foreground">
                Set exact start and end times in 15-minute increments.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:min-w-[460px]">
              <label className="text-xs font-medium text-muted-foreground">
                Type
                <select
                  value={editDraft.type}
                  onChange={(event) => setEditDraft({ ...editDraft, type: event.target.value as SlotType })}
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  <option value="work">Work</option>
                  <option value="free">Free</option>
                  <option value="busy">Busy</option>
                </select>
              </label>

              <label className="text-xs font-medium text-muted-foreground">
                Start
                <select
                  value={editDraft.startHour}
                  onChange={(event) => updateDraftStart(Number(event.target.value))}
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  {timeOptions
                    .filter((option) => option.value < editDraft.endHour)
                    .map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>

              <label className="text-xs font-medium text-muted-foreground">
                End
                <select
                  value={editDraft.endHour}
                  onChange={(event) => updateDraftEnd(Number(event.target.value))}
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  {timeOptions
                    .filter((option) => option.value > editDraft.startHour)
                    .map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingBlockId(null);
                  setEditDraft(null);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={saveEditedBlock}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto border border-border rounded-xl bg-card relative select-none" ref={containerRef}>
        <div className="grid grid-cols-[60px_repeat(7,1fr)] min-w-[700px]">
          {/* Header */}
          <div className="h-10 border-b border-r border-border bg-muted/50 sticky top-0 z-20"></div>
          {days.map((day, i) => (
            <div key={day} className="h-10 border-b border-r border-border bg-muted/50 flex items-center justify-center font-semibold sticky top-0 z-20">
              {day}
            </div>
          ))}

          {/* Time Rows */}
          {hours.map((hour) => (
            <React.Fragment key={hour}>
              <div className="h-12 border-b border-r border-border flex items-center justify-center text-xs text-muted-foreground bg-muted/20">
                {hour}:00
              </div>
              {dayIndices.map((dayIdx) => {
                const isBeingDragged = isDragging && dragStart?.day === dayIdx && 
                  hour >= Math.min(dragStart.hour, dragEnd?.hour || 0) && 
                  hour <= Math.max(dragStart.hour, dragEnd?.hour || 0);

                return (
                  <div
                    key={`${dayIdx}-${hour}`}
                    className={`h-12 border-b border-r border-border relative group transition-colors ${
                      isBeingDragged ? COLORS[selectedType] : 'hover:bg-accent/50'
                    }`}
                    onMouseDown={() => handleMouseDown(dayIdx, hour)}
                    onMouseEnter={() => handleMouseEnter(dayIdx, hour)}
                    onMouseUp={handleMouseUp}
                  >
                    {/* Render existing blocks */}
                    {blocks
                      .filter(b => b.day === dayIdx && Math.floor(b.startHour) === hour)
                      .map(b => {
                        const topOffset = b.startHour - Math.floor(b.startHour);
                        const duration = b.endHour - b.startHour;

                        return (
                        <div
                          key={b.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`Edit ${b.type} block from ${formatHour(b.startHour)} to ${formatHour(b.endHour)}`}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          onMouseUp={(e) => {
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditor(b);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openEditor(b);
                            }
                          }}
                          className={`absolute inset-x-1 z-10 cursor-pointer rounded-md border-l-4 p-1 text-[10px] font-medium flex flex-col justify-between overflow-hidden ${COLORS[b.type]}`}
                          style={{
                            top: `calc(${topOffset} * ${HOUR_HEIGHT_REM}rem + 2px)`,
                            height: `calc(${duration} * ${HOUR_HEIGHT_REM}rem - 4px)`,
                            minHeight: '1.5rem',
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <span className="capitalize">{b.type}</span>
                            <button
                              type="button"
                              aria-label={`Delete ${b.type} block from ${formatHour(b.startHour)} to ${formatHour(b.endHour)}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onMouseUp={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteBlock(b.id);
                              }}
                              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-destructive transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <span>{formatHour(b.startHour)} - {formatHour(b.endHour)}</span>
                        </div>
                      )})}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
