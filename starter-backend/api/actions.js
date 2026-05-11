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

export async function generateResponse(prompt) {
    const systemInstructions = "You are a scheduling and producitvity assistant to the user. Based on the user's prompt, " +
        "make help them optimize a schedule based on their free time and tasks, " +
        "and limit it to 50 words."
    // In addition, you must crucially generate clear system flags for choices in the story" +
        //"and eventually the ending. These flags must adhere to the given JSON schema."
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            generationConfig: {
                temperature: 0.7,
                /*
                responseMime: "@/responseTypes.json",
                responseSchema: "@/responseTypes.json",
                 */
            },
            safetySettings: safetySettings,
            systemInstruction: systemInstructions,
        });
        const result = await model.generateContent(prompt);
        const text = (await result.response)
        console.log(text.text());
        if (text.candidates && text.candidates.length > 0) {
            const finishReason = text.candidates[0].finishReason;
            console.log("Finish Reason:", finishReason);

            if (finishReason === "MAX_TOKENS") {
                console.error("Response stopped due to maxOutputTokens being too low.");
            } else if (finishReason === "SAFETY") {
                console.error("Response was blocked by safety settings.");
            }
        }
        return text.text();
    } catch (error) {
        console.error("Error generating story:", error);
        throw new Error("Failed to generate story");
    }
}
