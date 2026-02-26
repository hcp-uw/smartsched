// WeekView.jsx
import React, { useRef, useEffect, useState } from "react";
import "./Calendar.css";

const generateHours = () => Array.from({ length: 24 }, (_, i) => i);

const formatHour = (hour) => {
  const suffix = hour >= 12 ? "pm" : "am";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${suffix}`;
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getStartOfWeek = (date) => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
};

const getTopOffset = (date, pxPerHour = 64) =>
  date.getHours() * pxPerHour + (date.getMinutes() / 60) * pxPerHour;

const getEventHeight = (ms, pxPerHour = 64) => (ms / (1000 * 60 * 60)) * pxPerHour;

// Temporary placeholder events
const placeholderEvents = [
  {
    id: 1,
    title: "CS101 Lecture",
    startTime: new Date("2026-02-16T09:00"),
    endTime: new Date("2026-02-16T10:30"),
    location: "Room 101",
    color: "bg-pastel-blue",
  },
  {
    id: 2,
    title: "AI Study Block",
    startTime: new Date("2026-02-17T13:00"),
    endTime: new Date("2026-02-17T14:30"),
    location: "",
    color: "bg-pastel-green",
  },
  {
    id: 3,
    title: "Team Meeting",
    startTime: new Date("2026-02-18T11:00"),
    endTime: new Date("2026-02-18T12:00"),
    location: "Zoom",
    color: "bg-pastel-yellow",
  },
];

const WeekView = ({ selectedDate, events = placeholderEvents, onEventClick }) => {
  const scrollRef = useRef(null);
  const [pxPerHour] = useState(64);
  const hours = generateHours();
  const startOfWeek = getStartOfWeek(selectedDate);
  const today = new Date();

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  // Scroll to 9am on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = pxPerHour * 9;
    }
  }, [pxPerHour]);

  return (
    <div className="week-view-container">
      {/* Top row with day labels */}
      <div className="week-view-header">
        <div className="header-corner" />
        {days.map((day) => {
          const isToday =
            day.getDate() === today.getDate() &&
            day.getMonth() === today.getMonth() &&
            day.getFullYear() === today.getFullYear();

          return (
            <div key={day} className={`day-header ${isToday ? "current-day" : ""}`}>
              <div className="day-name">{WEEK_DAYS[day.getDay()]}</div>
              <div className="day-number">{day.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* Scrollable body */}
      <div className="week-view-body" ref={scrollRef}>
        {/* Hour labels column */}
        <div className="hours-column">
          {hours.map((hour) => (
            <div key={hour} className="hour-label">
              {formatHour(hour)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="days-grid">
          {days.map((day) => {
            const isToday =
              day.getDate() === today.getDate() &&
              day.getMonth() === today.getMonth() &&
              day.getFullYear() === today.getFullYear();

            return (
              <div
                key={day}
                className={`day-column ${isToday ? "current-day-bg" : ""}`}
                style={{ position: "relative" }} // Important for event positioning
              >
                {hours.map((hour, idx) => (
                  <div
                    key={hour}
                    className={`hour-block ${idx % 2 === 0 ? "hour-even" : "hour-odd"}`}
                  />
                ))}

                {/* Render events */}
                {events
                  .filter(
                    (e) =>
                      e.startTime.getDate() === day.getDate() &&
                      e.startTime.getMonth() === day.getMonth() &&
                      e.startTime.getFullYear() === day.getFullYear()
                  )
                  .map((event) => {
                    const top = getTopOffset(event.startTime, pxPerHour);
                    const height = getEventHeight(event.endTime - event.startTime, pxPerHour);

                    return (
                      <div
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={`event-card ${event.color}`}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          position: "absolute",
                          left: "2px",
                          right: "2px",
                          zIndex: 10,
                        }}
                      >
                        <div className="event-title">{event.title}</div>
                        {event.location && (
                          <div className="event-location">{event.location}</div>
                        )}
                        <div className="event-time">
                          {event.startTime.getHours().toString().padStart(2, "0")}:
                          {event.startTime.getMinutes().toString().padStart(2, "0")} -{" "}
                          {event.endTime.getHours().toString().padStart(2, "0")}:
                          {event.endTime.getMinutes().toString().padStart(2, "0")}
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekView;