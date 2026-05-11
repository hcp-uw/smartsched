import express from "express";
import { generateResponse } from "../api/actions.js";
import { authMiddleware } from "../middleware.js";

const router = express.Router();

router.post("/chat", authMiddleware, async (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const response = await generateResponse(prompt);
        res.json({ response });
    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).json({ error: error.message});
    }
});

export default router;
