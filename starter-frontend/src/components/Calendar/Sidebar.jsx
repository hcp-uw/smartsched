// Sidebar.jsx
import React, { useState } from "react";

// Dummy upcoming deadlines (REMOVE WHEN CONNECTING BACKEND)
const dummyDeadlines = [
  { id: 1, title: "CS101 Homework 1", dueDate: "2026-02-17" },
  { id: 2, title: "AI Project Proposal", dueDate: "2026-02-18" },
  { id: 3, title: "Club Meeting Prep", dueDate: "2026-02-19" },
  { id: 4, title: "Math Quiz", dueDate: "2026-02-20" },
];

const Sidebar = ({ selectedDate, setSelectedDate, events, darkMode }) => {
  const [visibleGroups, setVisibleGroups] = useState({
    class: true,
    work: true,
    club: true,
  });

  const toggleGroup = (group) => {
    setVisibleGroups({ ...visibleGroups, [group]: !visibleGroups[group] });
  };

  return (
    <div className="sidebar w-64 p-2 border-r dark:border-gray-700">
      {/* Mini Month Calendar (placeholder) */}
      <div className="mb-4">
        <p className="font-semibold dark:text-white">Mini Calendar</p>
        <div className="border rounded p-2 text-sm dark:text-white">
          {/* TODO: Implement clickable mini calendar */}
          <p>Month view placeholder</p>
        </div>
      </div>

      {/* Calendar Group Visibility */}
      <div className="mb-4">
        <p className="font-semibold dark:text-white">Event Groups</p>
        {Object.keys(visibleGroups).map((group) => (
          <button
            key={group}
            className={`flex items-center gap-2 p-1 mb-1 rounded ${
              visibleGroups[group]
                ? "bg-pastel-blue text-white"
                : "bg-gray-200 dark:bg-gray-600 dark:text-white"
            }`}
            onClick={() => toggleGroup(group)}
          >
            👁 {group.charAt(0).toUpperCase() + group.slice(1)}
          </button>
        ))}
      </div>

      {/* Add / Generate buttons (placeholders) */}
      <div className="mb-4">
        <button className="w-full p-2 mb-2 rounded bg-pastel-green hover:bg-pastel-blue text-white text-sm">
          + Import Calendar
        </button>
        <button className="w-full p-2 rounded bg-pastel-yellow hover:bg-pastel-orange text-white text-sm">
          Generate AI Calendar
        </button>
      </div>

      {/* Upcoming Deadlines */}
      <div>
        <p className="font-semibold dark:text-white">Upcoming Deadlines</p>
        <div className="max-h-48 overflow-y-auto border rounded p-2 dark:border-gray-600">
          {dummyDeadlines.slice(0, 10).map((d) => (
            <div key={d.id} className="mb-1 text-sm dark:text-white">
              <div className="font-bold">{d.title}</div>
              <div className="text-[10px]">{d.dueDate}</div>
            </div>
          ))}
          {dummyDeadlines.length > 10 && (
            <button className="text-xs text-blue-500 hover:underline">See all</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
