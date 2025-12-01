export type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER';

export interface Character {
  id: string;
  name: string;
  color: string;
  shadowColor: string;
  face: string; // Keeping for fallback/icons
  imageUrl: string;
  description: string;
}

export interface FallingItem {
  id: number;
  x: number;
  y: number;
  type: 'food' | 'bomb';
  icon: string;
  speed: number;
}

export interface GameStats {
  score: number;
  character: Character;
}