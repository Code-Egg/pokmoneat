import { Character } from "../types";

// Replaced AI generation with local logic to run without API Key
export const generateTrainerFeedback = async (character: Character, score: number): Promise<string> => {
  // Simulate a brief "thinking" delay for the UI effect
  await new Promise(resolve => setTimeout(resolve, 600));

  if (score === 0) {
    return `Oh no! ${character.name} didn't get to eat anything. Watch out for those bombs!`;
  }
  
  if (score <= 5) {
    return `${character.name} had a light snack. Good warm-up, but I know you can eat more!`;
  }
  
  if (score <= 15) {
    return `Tasty! ${character.name} is feeling good. That was a solid meal!`;
  }
  
  if (score <= 30) {
    return `Wow! ${character.name} has a serious appetite today! Great reflexes!`;
  }
  
  if (score <= 50) {
    return `Incredible! ${character.name} is basically a vacuum cleaner! Amazing score!`;
  }
  
  return `Legendary! You and ${character.name} are the ultimate eating champions! Unbeatable!`;
};