import express from "express"
import { authMiddleware } from "../middleware.js"

//const express = require("express");
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

// GET all events
router.get("/", authMiddleware, (req, res) => {
    res.json({ events });
});

// GET single event
router.get("/:id", authMiddleware, (req, res) => {
    const event = events.find(e => e.id === req.params.id);

    if (!event) {
        return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
});

// POST create event
router.post("/", authMiddleware, (req, res) => {
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

// DELETE event
router.delete("/:id", authMiddleware, (req, res) => {
    const index = events.findIndex(e => e.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({ error: "Event not found" });
    }

    events.splice(index, 1);

    res.status(204).send();
});

//module.exports = router;
export default router