import { GoogleGenAI } from "@google/genai";
import { Character } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTrainerFeedback = async (character: Character, score: number): Promise<string> => {
  try {
    const prompt = `
      You are a Pokémon Trainer evaluating a mini-game performance.
      The Pokémon "${character.name}" just finished an eating contest.
      They scored ${score} points (1 point per food item) before hitting a bomb.
      
      Write a short, witty, and encouraging 1-sentence comment about their performance.
      Mention the specific Pokémon name.
      If the score is low (< 5), be sympathetic but funny.
      If the score is high (> 20), be amazed.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating feedback:", error);
    return `Great job training with ${character.name}! Try again to beat your high score!`;
  }
};
