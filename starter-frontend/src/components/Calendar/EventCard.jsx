// EventCard.jsx
import React, { useState } from "react";

const EventCard = ({ event, onClose }) => {
  const [title, setTitle] = useState(event.title);
  const [startTime, setStartTime] = useState(
    event.startTime.toISOString().slice(0, 16)
  );
  const [endTime, setEndTime] = useState(event.endTime.toISOString().slice(0, 16));
  const [notes, setNotes] = useState(event.notes || "");

  // TODO: handle color / group tag editing
  const handleSave = () => {
    // TODO: Call API to save changes
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black opacity-50" />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 p-4 rounded shadow-lg w-96">
        <h2 className="text-lg font-bold mb-2 dark:text-white">Edit Event</h2>
        <div className="mb-2">
          <label className="block text-sm dark:text-white">Title</label>
          <input
            type="text"
            className="w-full border rounded p-1 text-sm dark:bg-gray-700 dark:text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="mb-2 flex gap-2">
          <div className="flex-1">
            <label className="block text-sm dark:text-white">Start</label>
            <input
              type="datetime-local"
              className="w-full border rounded p-1 text-sm dark:bg-gray-700 dark:text-white"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm dark:text-white">End</label>
            <input
              type="datetime-local"
              className="w-full border rounded p-1 text-sm dark:bg-gray-700 dark:text-white"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
        <div className="mb-2">
          <label className="block text-sm dark:text-white">Notes</label>
          <textarea
            className="w-full border rounded p-1 text-sm dark:bg-gray-700 dark:text-white"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 rounded bg-pastel-blue hover:bg-pastel-green text-white text-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
