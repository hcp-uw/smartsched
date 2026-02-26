import React, { useState } from "react";
import "./Calendar.css";
import CalendarHeader from "./CalendarHeader";
import Sidebar from "./Sidebar";
import WeekView from "./WeekView";
import EventCard from "./EventCard";

// -----------------------------
// DUMMY DATA (REMOVE WHEN CONNECTING BACKEND)
// -----------------------------
const dummyEvents = [
  {
    id: 1,
    title: "CS101 Lecture",
    startTime: new Date("2026-02-16T09:00"),
    endTime: new Date("2026-02-16T10:30"),
    location: "Room 101",
    color: "bg-pastel-blue",
    group: "class",
    notes: "Bring laptop",
  },
  {
    id: 2,
    title: "AI Study Block",
    startTime: new Date("2026-02-16T11:00"),
    endTime: new Date("2026-02-16T12:30"),
    location: "",
    color: "bg-pastel-green",
    group: "work",
    notes: "Focus on schedule generator",
  },
];

export default function Calendar() {
  const [view, setView] = useState("week"); // day, week, month, year
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState(dummyEvents); // TODO: replace with API fetch
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Called when user clicks on an event block
  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const closeEventModal = () => {
    setSelectedEvent(null);
  };

  return (
    <div className={`calendar-container ${darkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      <Sidebar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        events={events}
        darkMode={darkMode}
      />

      {/* Main Panel */}
      <div className="main-panel">
        <CalendarHeader
        view={view}
        setView={setView}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

        {view === "week" && (
          <WeekView
            selectedDate={selectedDate}
            events={events}
            onEventClick={handleEventClick}
          />
        )}
        {/* TODO: Add DayView / MonthView later */}
      </div>

      {/* Event Modal */}
      {selectedEvent && (
        <EventCard event={selectedEvent} onClose={closeEventModal} />
      )}
    </div>
  );
}
