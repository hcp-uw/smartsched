const express = require("express");
const router = express.Router();

// temporary in-memory events list
let events = [
    {
        id: "1",
        title: "Sample Event",
        start: "2026-01-29T10:00:00",
        end: "2026-01-29T11:00:00",
    },
];

// GET /api/events
router.get("/", (req, res) => {
    res.json({ events });
});

// POST /api/events
router.post("/", (req, res) => {
    const { title, start, end } = req.body;

    if (!title || !start || !end) {
        return res.status(400).json({
            error: "Missing required fields: title, start, end",
        });
    }

    const newEvent = {
        id: String(Date.now()),
        title,
        start,
        end,
    };

    events.push(newEvent);
    res.status(201).json({ event: newEvent });
});

module.exports = router;
