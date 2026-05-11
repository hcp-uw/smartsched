import express from 'express'

const router = express.Router()

// In-memory store until database is sorted
let assignments = []

router.get("/", (req, res) => {
    const active = assignments.filter(a => a.status !== 'completed')
    res.json({ assignments: active })
})

router.post("/", (req, res) => {
    const { title, due_date, time_estimate_minutes, priority } = req.body
    if (!title || !due_date) {
        return res.status(400).json({ error: "title and due_date are required" })
    }
    const assignment = {
        id: String(Date.now()),
        title,
        due_date,
        time_estimate_minutes: time_estimate_minutes ?? null,
        priority: priority ?? 1,
        status: 'pending'
    }
    assignments.push(assignment)
    res.status(201).json({ assignment })
})

router.put("/:id", (req, res) => {
    const index = assignments.findIndex(a => a.id === req.params.id)
    if (index === -1) return res.status(404).json({ error: "Assignment not found" })
    assignments[index] = { ...assignments[index], ...req.body }
    res.json({ message: "Updated" })
})

router.delete("/:id", (req, res) => {
    const index = assignments.findIndex(a => a.id === req.params.id)
    if (index === -1) return res.status(404).json({ error: "Assignment not found" })
    assignments.splice(index, 1)
    res.status(204).send()
})

export default router