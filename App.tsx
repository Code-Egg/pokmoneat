import React, { useState } from 'react';
import { CharacterSelection } from './components/CharacterSelection';
import { Game } from './components/Game';
import { GameOver } from './components/GameOver';
import { GameState, Character } from './types';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [finalScore, setFinalScore] = useState(0);

  const handleCharacterSelect = (char: Character) => {
    setSelectedChar(char);
    setGameState('PLAYING');
  };

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setGameState('GAME_OVER');
  };

  const handleRestart = () => {
    setGameState('PLAYING');
  };

  const handleBackToMenu = () => {
    setGameState('MENU');
    setSelectedChar(null);
  };

  return (
    <main className="w-full h-screen overflow-hidden text-slate-800 font-sans">
      {gameState === 'MENU' && (
        <CharacterSelection onSelect={handleCharacterSelect} />
      )}
      
      {gameState === 'PLAYING' && selectedChar && (
        <Game 
          character={selectedChar} 
          onGameOver={handleGameOver}
          onBack={handleBackToMenu}
        />
      )}

      {gameState === 'GAME_OVER' && selectedChar && (
        <GameOver 
          score={finalScore} 
          character={selectedChar} 
          onRestart={handleRestart}
          onHome={handleBackToMenu}
        />
      )}
    </main>
  );
}
