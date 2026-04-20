import express from "express"
import { authMiddleware } from "../middleware.js"

//const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
    const events = db.prepare("SELECT * FROM events").all();
    res.json({ events });
});

router.get("/:id", (req, res) => {
    const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
});

router.post("/", (req, res) => {
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
        return res.status(400).json({ error: "Missing required fields" });
    }
    const result = db.prepare("INSERT INTO events (title, start, end) VALUES (?, ?, ?)").run(title, start, end);
    res.status(201).json({ event: { id: result.lastInsertRowid, title, start, end } });
});

router.delete("/:id", (req, res) => {
    const result = db.prepare("DELETE FROM events WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: "Event not found" });
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