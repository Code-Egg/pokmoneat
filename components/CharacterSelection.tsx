import React from 'react';
import { CHARACTERS } from '../constants';
import { Character } from '../types';
import { Play } from 'lucide-react';

interface Props {
  onSelect: (char: Character) => void;
}

export const CharacterSelection: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-400 to-indigo-600 p-6 text-white overflow-y-auto">
      <h1 className="text-5xl font-bold mb-2 drop-shadow-md text-center tracking-wider mt-8 md:mt-0">PokéNoms</h1>
      <p className="text-lg mb-8 opacity-90 text-center">Choose your partner!</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-8">
        {CHARACTERS.map((char) => (
          <button
            key={char.id}
            onClick={() => onSelect(char)}
            className={`
              relative group overflow-hidden rounded-3xl p-6 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2
              ${char.color} shadow-xl ${char.shadowColor} border-b-8 border-black/20
            `}
          >
             {/* Background Icon Opacity */}
            <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl rotate-12 group-hover:rotate-0 transition-transform">
              {char.face}
            </div>
            
            <div className="flex flex-col items-center relative z-10">
              <div className="w-32 h-32 mb-4 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner p-2">
                <img src={char.imageUrl} alt={char.name} className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-wide text-white drop-shadow-sm">{char.name}</h3>
              <p className="text-sm font-medium opacity-90 mt-1">{char.description}</p>
              
              <div className="mt-6 flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full font-bold text-sm uppercase group-hover:bg-white group-hover:text-black transition-colors">
                <Play size={16} fill="currentColor" /> Select
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-4 text-sm opacity-70 text-center max-w-md pb-8">
        Instructions: Tap Left/Right or use Arrow Keys to move. Eat food, avoid bombs!
      </div>
    </div>
  );
};