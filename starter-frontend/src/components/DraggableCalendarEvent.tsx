import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { format, addMinutes, parseISO, startOfDay } from "date-fns";
import { motion } from "motion/react";
import type { CalendarEvent } from "../data/mockData";
import {
  topToMinutes,
  minutesToTop,
  combineDayAndMinutes,
  eventDurationMinutes,
  MIN_EVENT_MINUTES,
} from "../utils/calendarDrag";

type DragMode = "move" | "resize-start" | "resize-end";

interface DraggableCalendarEventProps {
  event: CalendarEvent;
  top: number;
  height: number;
  hourHeight: number;
  onScheduleChange: (id: string, start: Date, end: Date) => void;
  onOpen: (event: CalendarEvent) => void;
  compact?: boolean;
}

type GhostState = {
  x: number;
  y: number;
  width: number;
  height: number;
  start: Date;
  end: Date;
};

function snapDeltaY(deltaY: number, hourHeight: number): number {
  const raw = (deltaY / hourHeight) * 60;
  return Math.round(raw / 15) * 15;
}

function resolveDropTarget(
  clientX: number,
  clientY: number,
  hourHeight: number,
  durationMinutes: number
): { start: Date; end: Date } | null {
  const gridEl = document
    .elementFromPoint(clientX, clientY)
    ?.closest("[data-calendar-time-grid]") as HTMLElement | null;
  if (!gridEl) return null;

  const dayIso = gridEl.getAttribute("data-day");
  if (!dayIso) return null;

  const rect = gridEl.getBoundingClientRect();
  const minutes = topToMinutes(clientY - rect.top, hourHeight);
  const start = combineDayAndMinutes(startOfDay(parseISO(dayIso)), minutes);
  const end = addMinutes(start, durationMinutes);
  return { start, end };
}

export function DraggableCalendarEvent({
  event,
  top,
  height,
  hourHeight,
  onScheduleChange,
  onOpen,
  compact = false,
}: DraggableCalendarEventProps) {
  const [preview, setPreview] = useState<{
    top: number;
    height: number;
    start: Date;
    end: Date;
  } | null>(null);
  const [ghost, setGhost] = useState<GhostState | null>(null);

  const dragState = useRef<{
    mode: DragMode;
    pointerId: number;
    startY: number;
    grabOffsetX: number;
    grabOffsetY: number;
    ghostWidth: number;
    origStart: Date;
    origEnd: Date;
    pendingStart: Date;
    pendingEnd: Date;
  } | null>(null);

  const disabled = Boolean(event.isAIGenerated);
  const isDragging = preview !== null || ghost !== null;
  const displayTop = preview?.top ?? top;
  const displayHeight = Math.max(preview?.height ?? height, 20);

  const commitChange = useCallback(
    (start: Date, end: Date) => {
      let safeEnd = end;
      if (safeEnd.getTime() <= start.getTime()) {
        safeEnd = addMinutes(start, MIN_EVENT_MINUTES);
      }
      onScheduleChange(event.id, start, safeEnd);
    },
    [event.id, onScheduleChange]
  );

  const renderEventBody = (start: Date, end: Date, boxHeight: number) => (
    <>
      <p
        className={`font-medium text-white line-clamp-1 pointer-events-none ${
          compact ? "text-xs" : ""
        }`}
      >
        {event.title}
      </p>
      {boxHeight > (compact ? 30 : 40) && (
        <p
          className={`text-white/80 pointer-events-none ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {format(start, "h:mm a")}
          {!compact && ` – ${format(end, "h:mm a")}`}
        </p>
      )}
    </>
  );

  const beginDrag = useCallback(
    (e: React.PointerEvent, mode: DragMode) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();

      const root = (e.currentTarget as HTMLElement).closest(
        "[data-event-root]"
      ) as HTMLElement | null;
      const rect = root?.getBoundingClientRect();
      if (!rect) return;

      const origStart = new Date(event.start);
      const origEnd = new Date(event.end);
      dragState.current = {
        mode,
        pointerId: e.pointerId,
        startY: e.clientY,
        grabOffsetX: e.clientX - rect.left,
        grabOffsetY: e.clientY - rect.top,
        ghostWidth: rect.width,
        origStart,
        origEnd,
        pendingStart: origStart,
        pendingEnd: origEnd,
      };

      const onPointerMove = (ev: PointerEvent) => {
        const d = dragState.current;
        if (!d || ev.pointerId !== d.pointerId) return;

        if (d.mode === "move") {
          const duration = eventDurationMinutes(d.origStart, d.origEnd);
          const drop = resolveDropTarget(
            ev.clientX,
            ev.clientY,
            hourHeight,
            duration
          );

          setGhost({
            x: ev.clientX - d.grabOffsetX,
            y: ev.clientY - d.grabOffsetY,
            width: d.ghostWidth,
            height: minutesToTop(duration, hourHeight),
            start: drop?.start ?? d.pendingStart,
            end: drop?.end ?? d.pendingEnd,
          });

          if (drop) {
            d.pendingStart = drop.start;
            d.pendingEnd = drop.end;
            setPreview(null);
          }
          return;
        }

        setGhost(null);
        const deltaMinutes = snapDeltaY(ev.clientY - d.startY, hourHeight);

        if (d.mode === "resize-start") {
          const newStart = addMinutes(d.origStart, deltaMinutes);
          const maxStart = addMinutes(d.origEnd, -MIN_EVENT_MINUTES);
          const clampedStart =
            newStart.getTime() > maxStart.getTime() ? maxStart : newStart;
          d.pendingStart = clampedStart;
          d.pendingEnd = d.origEnd;
          const startMin =
            clampedStart.getHours() * 60 + clampedStart.getMinutes();
          const endMin = d.origEnd.getHours() * 60 + d.origEnd.getMinutes();
          setPreview({
            top: minutesToTop(startMin, hourHeight),
            height: minutesToTop(endMin - startMin, hourHeight),
            start: clampedStart,
            end: d.origEnd,
          });
        } else {
          const newEnd = addMinutes(d.origEnd, deltaMinutes);
          const minEnd = addMinutes(d.origStart, MIN_EVENT_MINUTES);
          const clampedEnd =
            newEnd.getTime() < minEnd.getTime() ? minEnd : newEnd;
          d.pendingStart = d.origStart;
          d.pendingEnd = clampedEnd;
          const startMin =
            d.origStart.getHours() * 60 + d.origStart.getMinutes();
          const endMin =
            clampedEnd.getHours() * 60 + clampedEnd.getMinutes();
          setPreview({
            top: minutesToTop(startMin, hourHeight),
            height: minutesToTop(endMin - startMin, hourHeight),
            start: d.origStart,
            end: clampedEnd,
          });
        }
      };

      const onPointerUp = (ev: PointerEvent) => {
        const d = dragState.current;
        if (!d || ev.pointerId !== d.pointerId) return;

        commitChange(d.pendingStart, d.pendingEnd);
        dragState.current = null;
        setPreview(null);
        setGhost(null);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    },
    [commitChange, disabled, event.end, event.start, hourHeight]
  );

  const ghostPortal =
    ghost &&
    createPortal(
      <motion.div
        data-drag-ghost
        className={`fixed rounded-lg overflow-hidden shadow-2xl ring-2 ring-white/40 pointer-events-none z-[100] ${
          compact ? "p-2" : "p-4"
        }`}
        style={{
          left: ghost.x,
          top: ghost.y,
          width: ghost.width,
          height: Math.max(ghost.height, 20),
          backgroundColor: event.color,
        }}
      >
        {renderEventBody(ghost.start, ghost.end, ghost.height)}
      </motion.div>,
      document.body
    );

  return (
    <>
      <motion.div
        data-event-root
        initial={event.isAIGenerated ? { opacity: 0, scale: 0.9 } : false}
        animate={{
          opacity: event.isAIGenerated ? 0.6 : ghost ? 0.2 : isDragging ? 0.35 : 1,
          scale: isDragging && !ghost ? 1.02 : 1,
        }}
        onDoubleClick={() => onOpen(event)}
        className={`absolute rounded-lg overflow-hidden group touch-none select-none ${
          compact ? "left-1 right-1 p-2" : "left-4 right-4 p-4"
        } ${
          event.isAIGenerated
            ? "border-2 border-dashed border-[#5B8DEF] cursor-default"
            : "cursor-grab active:cursor-grabbing shadow-sm hover:shadow-lg"
        }`}
        style={{
          top: `${displayTop}px`,
          height: `${displayHeight}px`,
          backgroundColor: event.color + (event.isAIGenerated ? "40" : ""),
          zIndex: ghost ? 5 : isDragging ? 40 : event.isAIGenerated ? 5 : 10,
          minHeight: "20px",
        }}
      >
        {!disabled && (
          <>
            <div
              role="separator"
              aria-label="Resize start time"
              onPointerDown={(e) => beginDrag(e, "resize-start")}
              className="absolute left-0 right-0 top-0 h-2 cursor-ns-resize z-20 bg-white/20 opacity-0 group-hover:opacity-100"
            />
            <motion.div
              role="separator"
              aria-label="Resize end time"
              onPointerDown={(e) => beginDrag(e, "resize-end")}
              className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize z-20 bg-white/20 opacity-0 group-hover:opacity-100"
            />
          </>
        )}

        <motion.div
          onPointerDown={(e) => beginDrag(e, "move")}
          className={`h-full ${disabled ? "cursor-pointer" : ""}`}
        >
          {renderEventBody(
            preview?.start ?? event.start,
            preview?.end ?? event.end,
            displayHeight
          )}
        </motion.div>
      </motion.div>
      {ghostPortal}
    </>
  );
}
