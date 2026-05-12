"use server";

import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const safetySettings = [
    {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT" ,
        threshold: "BLOCK_LOW_AND_ABOVE",
    },
    {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" ,
        threshold: "BLOCK_LOW_AND_ABOVE",
    },
    {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_LOW_AND_ABOVE",
    }
]

export async function generateResponse(prompt, context = {}) {
    const history = (context.history || []).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
    }));

    const systemInstructions = `You are a scheduling and productivity assistant. 
    The user's current schedule is provided in the context:
    Tasks: ${JSON.stringify(context.tasks || [])}
    Events: ${JSON.stringify(context.events || [])}

    Your goal is to help the user manage and optimize their schedule. 
    IMPORTANT: Only suggest "actions" (modifications) if:
    a) The user explicitly asks for suggestions or optimization.
    b) The user describes a specific change they want to make (e.g., "Move my meeting", "Mark task as done").
    
    If the user is just chatting or asking general questions, respond naturally without including any JSON actions.

    An action can be:
    1. "add_event": Create a new calendar event.
    2. "update_event": Modify an existing event.
    3. "delete_event": Remove an event.
    4. "update_task": Modify a task (e.g., mark as completed).

    Respond in a mix of natural language and structured JSON.
    The JSON part must be an array of actions, each with a type and payload.
    Example JSON in response:
    [
      { "type": "add_event", "payload": { "title": "Focus Session", "start": "2026-05-11T14:00:00", "end": "2026-05-11T15:00:00" }, "description": "Add a focus session at 2 PM" },
      { "type": "update_task", "payload": { "id": "t1", "updates": { "completed": true } }, "description": "Mark 'Finish report' as completed" }
    ]

    Always keep your natural language response helpful and concise (under 100 words).
    If you suggest actions, include them at the end of your response inside a code block tagged with 'json-actions'.
    `;

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            generationConfig: {
                temperature: 0.7,
            },
            safetySettings: safetySettings,
            systemInstruction: systemInstructions,
        });

        const chatSession = model.startChat({
            history: history,
        });

        const result = await chatSession.sendMessage(prompt);
        const responseText = result.response.text();
        console.log(responseText);
        return responseText;
    } catch (error) {
        console.error("Error generating AI response:", error);
        throw new Error("Failed to generate AI response");
    }
}
