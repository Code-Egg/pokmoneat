import { Character } from './types';

export const GAME_WIDTH = 100; // Percentage
export const GAME_HEIGHT = 100; // Percentage
export const PLAYER_SIZE = 18; // Increased slightly for images
export const ITEM_SIZE = 10; // Percentage width
export const SPAWN_RATE_MS = 600;

export const CHARACTERS: Character[] = [
  {
    id: 'pikachu',
    name: 'Pikachu',
    color: 'bg-yellow-400',
    shadowColor: 'shadow-yellow-600',
    face: '⚡️',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
    description: 'Electric speed!',
  },
  {
    id: 'grookey',
    name: 'Grookey',
    color: 'bg-green-500',
    shadowColor: 'shadow-green-700',
    face: '🍃',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/810.png',
    description: 'Rhythmic beats!',
  },
  {
    id: 'dream',
    name: 'Dream',
    color: 'bg-pink-400',
    shadowColor: 'shadow-pink-600',
    face: '✨',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/151.png', // Mew
    description: 'Mystical floating!',
  },
];

export const FOOD_ITEMS = ['🍎', '🍇', '🍌', '🍑', '🍒', '🧀', '🍩', '🍪'];
export const BOMB_ITEM = '💣';