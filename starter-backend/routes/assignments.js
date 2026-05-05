// routes/assignments.js
const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
    const assignments = db.prepare("SELECT * FROM assignments WHERE status != 'completed'").all();
    res.json({ assignments });
});

router.post("/", (req, res) => {
    const { title, due_date, time_estimate_minutes, priority } = req.body;
    if (!title || !due_date) {
        return res.status(400).json({ error: "title and due_date are required" });
    }
    const result = db.prepare(
        "INSERT INTO assignments (title, due_date, time_estimate_minutes, priority) VALUES (?, ?, ?, ?)"
    ).run(title, due_date, time_estimate_minutes ?? null, priority ?? 1);
    res.status(201).json({ assignment: { id: result.lastInsertRowid, title, due_date, time_estimate_minutes, priority, status: 'pending' } });
});

router.put("/:id", (req, res) => {
    const { title, due_date, time_estimate_minutes, priority, status } = req.body;
    const result = db.prepare(`
        UPDATE assignments SET
            title = COALESCE(?, title),
            due_date = COALESCE(?, due_date),
            time_estimate_minutes = COALESCE(?, time_estimate_minutes),
            priority = COALESCE(?, priority),
            status = COALESCE(?, status)
        WHERE id = ?
    `).run(title, due_date, time_estimate_minutes, priority, status, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: "Assignment not found" });
    res.json({ message: "Updated" });
});

router.delete("/:id", (req, res) => {
    const result = db.prepare("DELETE FROM assignments WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: "Assignment not found" });
    res.status(204).send();
});

module.exports = router;