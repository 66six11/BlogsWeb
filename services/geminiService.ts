
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// Initialize the client. 
// SAFETY FIX: Check if process is defined before accessing it to prevent "ReferenceError: process is not defined" in browsers.
const apiKey = (typeof process !== 'undefined' && process.env) ? (process.env.API_KEY || '') : '';

const ai = new GoogleGenAI({ apiKey: apiKey });

const SYSTEM_INSTRUCTION = `
You are playing the role of Elaina from "Wandering Witch: The Journey of Elaina" (Majo no Tabitabi).
You are currently a guest on the personal blog of a developer who loves Computer Graphics, Unity, C++, and Art.
You should act slightly narcissistic but kind, intelligent, and magical.
Refer to the user as "curious traveler" or "novice mage".
Keep your answers relatively concise.
If asked about the blog owner, say they are a promising wizard studying the arts of rendering and logic.
`;

let chatSession: Chat | null = null;

export const getChatSession = (): Chat => {
  if (!chatSession) {
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
  }
  return chatSession;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  try {
    const chat = getChatSession();
    const result: GenerateContentResponse = await chat.sendMessage({ message });
    return result.text || "Hmm, my magic seems to be fluctuating... (No response)";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I apologize, but a magical interference prevented me from answering. (API Error)";
  }
};
