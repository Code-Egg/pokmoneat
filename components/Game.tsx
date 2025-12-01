import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Character, FallingItem } from '../types';
import { FOOD_ITEMS, BOMB_ITEM, SPAWN_RATE_MS, PLAYER_SIZE, ITEM_SIZE } from '../constants';
import { Pause, RotateCcw } from 'lucide-react';

interface Props {
  character: Character;
  onGameOver: (score: number) => void;
  onBack: () => void;
}

export const Game: React.FC<Props> = ({ character, onGameOver, onBack }) => {
  const [score, setScore] = useState(0);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [playerX, setPlayerX] = useState(50); // Percentage 0-100
  const [isPaused, setIsPaused] = useState(false);
  const [isChomping, setIsChomping] = useState(false);
  
  // Refs for game loop state to avoid closure staleness
  const playerXRef = useRef(50);
  const itemsRef = useRef<FallingItem[]>([]);
  const scoreRef = useRef(0);
  const requestRef = useRef<number>(0);
  const lastSpawnTime = useRef<number>(0);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  
  // Movement Logic
  const movePlayer = useCallback((direction: 'left' | 'right') => {
    const speed = 1.5; // Movement speed per frame (percentage)
    setPlayerX((prev) => {
      let next = prev;
      if (direction === 'left') next -= speed;
      if (direction === 'right') next += speed;
      
      // Clamp
      if (next < 0) next = 0;
      if (next > 100 - PLAYER_SIZE) next = 100 - PLAYER_SIZE;
      
      playerXRef.current = next;
      return next;
    });
  }, []);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Game Loop
  const animate = useCallback((time: number) => {
    if (isPaused) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    // 1. Handle Input
    if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) movePlayer('left');
    if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) movePlayer('right');

    // 2. Spawn Items
    if (time - lastSpawnTime.current > SPAWN_RATE_MS) {
      const isBomb = Math.random() < 0.2; // 20% chance of bomb
      const newItem: FallingItem = {
        id: Date.now() + Math.random(),
        x: Math.random() * (100 - ITEM_SIZE),
        y: -10, // Start slightly above screen
        type: isBomb ? 'bomb' : 'food',
        icon: isBomb ? BOMB_ITEM : FOOD_ITEMS[Math.floor(Math.random() * FOOD_ITEMS.length)],
        speed: 0.4 + (Math.min(scoreRef.current, 50) * 0.02) + (Math.random() * 0.2), // Speed increases with score
      };
      
      itemsRef.current.push(newItem);
      lastSpawnTime.current = time;
    }

    // 3. Update Items & Check Collisions
    const playerRect = {
      x: playerXRef.current,
      y: 80, // Player image top is roughly at 80% (since bottom is 15% and height is variable)
      width: PLAYER_SIZE,
      height: 15,
    };

    let nearbyFood = false;

    // Filter items: Remove if off screen or collided
    itemsRef.current = itemsRef.current.filter((item) => {
      // Move item down
      item.y += item.speed;

      // Check for proximity for animation (simple range check)
      if (item.type === 'food' && item.y > 60 && item.y < 90 && Math.abs(item.x - playerRect.x) < 20) {
        nearbyFood = true;
      }

      // Check Collision
      const itemRect = { x: item.x, y: item.y, width: ITEM_SIZE, height: ITEM_SIZE };
      
      const isColliding = 
        playerRect.x < itemRect.x + itemRect.width &&
        playerRect.x + playerRect.width > itemRect.x &&
        playerRect.y < itemRect.y + itemRect.height &&
        playerRect.height + playerRect.y > itemRect.y;

      if (isColliding) {
        if (item.type === 'bomb') {
          // Game Over logic triggers immediately
          onGameOver(scoreRef.current);
          return false; 
        } else {
          // Score up
          scoreRef.current += 1;
          setScore(scoreRef.current);
          return false; // Remove item
        }
      }

      // Remove if falls off bottom
      return item.y < 110;
    });

    setIsChomping(nearbyFood);
    setItems([...itemsRef.current]);

    requestRef.current = requestAnimationFrame(animate);
  }, [isPaused, movePlayer, onGameOver]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);


  // Touch Controls
  const [touchInterval, setTouchInterval] = useState<NodeJS.Timeout | null>(null);

  const startTouch = (dir: 'left' | 'right') => {
    movePlayer(dir); // Initial move
    const interval = setInterval(() => movePlayer(dir), 16);
    setTouchInterval(interval);
  };

  const endTouch = () => {
    if (touchInterval) clearInterval(touchInterval);
    setTouchInterval(null);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-sky-200 select-none">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 pointer-events-none" />
      
      {/* UI HUD */}
      <div className="absolute top-4 left-4 z-20 flex gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100">
          <RotateCcw size={20} className="text-gray-700"/>
        </button>
        <button onClick={() => setIsPaused(!isPaused)} className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100">
          <Pause size={20} className="text-gray-700"/>
        </button>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <div className="bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-lg border-2 border-orange-400">
          <span className="text-orange-600 font-black text-2xl">Score: {score}</span>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative w-full h-full max-w-md mx-auto bg-gradient-to-b from-sky-200 to-sky-100 shadow-2xl overflow-hidden border-x-4 border-white/50">
        
        {/* Falling Items */}
        {items.map(item => (
          <div
            key={item.id}
            className="absolute text-4xl select-none transition-none will-change-transform z-10"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `${ITEM_SIZE}%`
            }}
          >
            {item.icon}
          </div>
        ))}

        {/* Player Character */}
        <div
          className="absolute bottom-[13%] transition-none will-change-transform flex flex-col items-center z-20"
          style={{
            left: `${playerX}%`,
            width: `${PLAYER_SIZE}%`,
          }}
        >
           {/* Image container with bounce/chomp animations */}
           <div className={`
             relative w-full aspect-square flex items-center justify-center 
             transition-transform duration-75
             ${isChomping ? 'animate-bite' : 'animate-bounce'}
           `}>
             <img 
               src={character.imageUrl} 
               alt={character.name} 
               className="w-full h-full object-contain drop-shadow-xl"
             />
           </div>
           
           {/* Shadow */}
           <div className="w-16 h-3 bg-black/20 rounded-full blur-sm mt-[-5px]" />
        </div>
        
        {/* Floor */}
        <div className="absolute bottom-0 w-full h-[15%] bg-green-500 border-t-8 border-green-600 bg-[url('https://www.transparenttextures.com/patterns/grass.png')] z-10"></div>

      </div>

      {/* Touch Controls (Mobile) */}
      <div className="absolute bottom-0 w-full h-32 z-30 flex md:hidden">
        <div 
          className="flex-1 active:bg-white/20 transition-colors"
          onTouchStart={() => startTouch('left')}
          onTouchEnd={endTouch}
        />
        <div 
          className="flex-1 active:bg-white/20 transition-colors"
          onTouchStart={() => startTouch('right')}
          onTouchEnd={endTouch}
        />
      </div>

      {/* Desktop Hints */}
      <div className="hidden md:flex absolute bottom-8 w-full justify-center gap-8 text-sky-800/50 font-bold z-10 pointer-events-none">
        <span>← LEFT</span>
        <span>RIGHT →</span>
      </div>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center">
            <h2 className="text-4xl font-bold mb-4 text-sky-600">Paused</h2>
            <button 
              onClick={() => setIsPaused(false)}
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
};