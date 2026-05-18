import express from "express";
import { generateResponse } from "../api/actions.js";
import { authMiddleware } from "../middleware.js";

const router = express.Router();

router.post("/chat", authMiddleware, async (req, res) => {
    const { prompt, context } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const response = await generateResponse(prompt, context);
        res.json({ response });
    } catch (error) {
        console.error("AI Route Error:", {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        res.status(500).json({ 
            error: "Failed to process AI request", 
            details: error.message 
        });
    }
});

export default router;
