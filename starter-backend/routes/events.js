import express from 'express'
import { authMiddleware } from '../middleware.js'

const router = express.Router()

let events = [
    {
        id: "1",
        title: "Sample Event",
        start: "2026-01-29T10:00:00",
        end: "2026-01-29T11:00:00",
    },
]

router.get("/", authMiddleware, (req, res) => {
    res.json({ events })
})

router.get("/:id", authMiddleware, (req, res) => {
    const event = events.find(e => e.id === req.params.id)
    if (!event) return res.status(404).json({ error: "Event not found" })
    res.json(event)
})

router.post("/", authMiddleware, (req, res) => {
    const { title, start, end } = req.body
    if (!title || !start || !end) {
        return res.status(400).json({ error: "Missing required fields" })
    }
    const event = { id: String(Date.now()), title, start, end }
    events.push(event)
    res.status(201).json({ event })
})

router.delete("/:id", authMiddleware, (req, res) => {
    const index = events.findIndex(e => e.id === req.params.id)
    if (index === -1) return res.status(404).json({ error: "Event not found" })
    events.splice(index, 1)
    res.status(204).send()
})

export default router
