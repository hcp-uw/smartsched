const express = require("express");
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
    res.status(204).send();
});

module.exports = router;