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
    Schedule Preferences: ${JSON.stringify(context.schedulePreferences || {})}

    Your goal is to help the user manage and optimize their schedule. 
    You may reference and explain the user's Schedule Preferences when they ask about routines, work hours, lunch, break preferences, available days, or why a schedule was generated a certain way.
    Before proposing any action that changes, reschedules, completes, or deletes something, first verify it exists in the provided Tasks or Events context.
    Never invent ids. For update_event and delete_event, use an id from Events. For update_task, use an id from Tasks.
    If the user refers to an item that is not present, ambiguous, or only loosely matches existing items, ask a concise clarification question and do not include JSON actions.
    If rescheduling an existing item, update that existing event id; do not create a replacement event unless the user explicitly asks to create a new event.
    When building or revising a full schedule, do not create generic "Work Time" or "Personal Time" events. Use explicit scheduled tasks plus any needed "Morning Routine" and "Lunch Time" events.
    If a task needs to be split across multiple calendar blocks, create separate calendar events for the chunks, but do not update the task duration in the to-do list.
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
        console.log("AI Response:", responseText);
        return responseText;
    } catch (error) {
        console.error("CRITICAL: Error generating AI response:", {
            error: error.message,
            stack: error.stack,
            prompt: prompt,
            contextHistoryLength: context.history?.length
        });
        throw new Error(`AI Service Error: ${error.message}`);
    }
}
