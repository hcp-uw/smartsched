import React, { useState } from "react";
import "./Calendar.css";
import CalendarHeader from "./CalendarHeader";
import Sidebar from "./Sidebar";
import WeekView from "./WeekView";

export default function Calendar() {
  const [view, setView] = useState("week"); // day, week, month, year
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="calendar-container">
      <Sidebar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
      <div className="main-panel">
        <CalendarHeader view={view} setView={setView} />
        {view === "week" && <WeekView selectedDate={selectedDate} />}
        {/* You can add DayView, MonthView later */}
      </div>
    </div>
  );
}
