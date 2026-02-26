// CalendarHeader.jsx
import React, { useState } from "react";

// Utility function to format date nicely
const formatDate = (date) => {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const CalendarHeader = ({
  view,
  setView,
  selectedDate,
  setSelectedDate,
  darkMode,
  setDarkMode,
}) => {
  const [miniDayPicker, setMiniDayPicker] = useState(false);

  // Navigation helpers
  const goToday = () => {
    setSelectedDate(new Date());
  };

  const goPrevious = () => {
    const newDate = new Date(selectedDate);
    switch (view) {
      case "day":
        newDate.setDate(newDate.getDate() - 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() - 7);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case "year":
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
      default:
        break;
    }
    setSelectedDate(newDate);
  };

  const goNext = () => {
    const newDate = new Date(selectedDate);
    switch (view) {
      case "day":
        newDate.setDate(newDate.getDate() + 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() + 7);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case "year":
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
      default:
        break;
    }
    setSelectedDate(newDate);
  };

  return (
    <div className="flex items-center justify-between mb-4 px-2">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <button
          className="p-2 rounded bg-pastel-yellow hover:bg-pastel-orange text-sm"
          onClick={() => setMiniDayPicker(!miniDayPicker)}
        >
          Today
        </button>

        <button
          className="p-2 rounded bg-pastel-green hover:bg-pastel-blue text-sm"
          onClick={goPrevious}
        >
          &lt;
        </button>
        <button
          className="p-2 rounded bg-pastel-green hover:bg-pastel-blue text-sm"
          onClick={goNext}
        >
          &gt;
        </button>

        {/* View mode buttons */}
        {["day", "week", "month", "year"].map((mode) => (
          <button
            key={mode}
            className={`p-2 rounded text-sm ${
              view === mode
                ? "bg-pastel-blue text-white"
                : "bg-pastel-green hover:bg-pastel-yellow"
            }`}
            onClick={() => setView(mode)}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Center: Current selected date */}
      <div className="text-lg font-semibold">{formatDate(selectedDate)}</div>

      {/* Right: Search + Dark Mode */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search by title..."
          className="border rounded p-1 text-sm"
        />
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded bg-pastel-purple hover:bg-pastel-pink text-sm"
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Mini Day Picker Popover */}
      {miniDayPicker && (
        <div className="absolute bg-white dark:bg-gray-800 border rounded shadow-lg mt-2 p-4 z-50">
          <p className="text-sm mb-2">Select a date:</p>
          <input
            type="date"
            className="border rounded p-1 text-sm"
            value={selectedDate.toISOString().split("T")[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
          />
          <div className="flex justify-end mt-2 gap-2">
            <button
              className="p-1 rounded bg-pastel-green hover:bg-pastel-blue text-sm"
              onClick={goToday}
            >
              Return to Today
            </button>
            <button
              className="p-1 rounded bg-pastel-red hover:bg-red-400 text-sm"
              onClick={() => setMiniDayPicker(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarHeader;
