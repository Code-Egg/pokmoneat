import React, { useEffect, useState } from 'react';
import { Character } from '../types';
import { generateTrainerFeedback } from '../services/geminiService';
import { RefreshCcw, Home, Sparkles } from 'lucide-react';

interface Props {
  score: number;
  character: Character;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOver: React.FC<Props> = ({ score, character, onRestart, onHome }) => {
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchFeedback = async () => {
      const text = await generateTrainerFeedback(character, score);
      if (isMounted) {
        setFeedback(text);
        setLoading(false);
      }
    };

    fetchFeedback();

    return () => { isMounted = false; };
  }, [character, score]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6 relative overflow-hidden">
       {/* Background Effects */}
       <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${character.color.replace('bg-', 'from-')} to-black`} />
       
      <div className="relative z-10 max-w-lg w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl text-center">
        
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500 text-white px-8 py-2 rounded-full shadow-red-900/50 shadow-lg border-b-4 border-red-700">
           <h2 className="text-3xl font-black uppercase tracking-widest">Game Over</h2>
        </div>

        <div className="mt-8 mb-6">
            <div className={`w-40 h-40 mx-auto rounded-full ${character.color} flex items-center justify-center shadow-xl mb-4 border-4 border-white p-4`}>
                <img src={character.imageUrl} alt={character.name} className="w-full h-full object-contain drop-shadow-lg" />
            </div>
            <h3 className="text-xl font-bold opacity-80">You played as {character.name}</h3>
        </div>

        <div className="bg-black/30 rounded-xl p-6 mb-8">
            <p className="text-sm uppercase tracking-widest opacity-60 mb-1">Final Score</p>
            <p className="text-6xl font-black text-white drop-shadow-lg">{score}</p>
        </div>

        {/* AI Feedback Section */}
        <div className="min-h-[100px] mb-8 relative">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full animate-pulse">
                    <Sparkles className="mb-2 text-yellow-400 animate-spin" />
                    <p className="text-sm font-medium text-yellow-200">Asking Trainer for feedback...</p>
                </div>
            ) : (
                <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-4 rounded-lg border border-white/10">
                    <div className="flex items-center justify-center gap-2 mb-2 text-yellow-400 font-bold text-xs uppercase tracking-wider">
                        <Sparkles size={14} /> Trainer's Log
                    </div>
                    <p className="italic text-lg font-medium leading-relaxed">"{feedback}"</p>
                </div>
            )}
        </div>

        <div className="grid grid-cols-2 gap-4">
            <button 
                onClick={onRestart}
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
                <RefreshCcw size={20} /> Play Again
            </button>
            <button 
                onClick={onHome}
                className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
                <Home size={20} /> Menu
            </button>
        </div>

      </div>
    </div>
  );
};