import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Character, FallingItem } from '../types';
import { FOOD_ITEMS, BOMB_ITEM, SPAWN_RATE_MS, PLAYER_SIZE, ITEM_SIZE, MAX_LIVES } from '../constants';
import { Pause, RotateCcw, Heart } from 'lucide-react';

interface Props {
  character: Character;
  onGameOver: (score: number) => void;
  onBack: () => void;
}

export const Game: React.FC<Props> = ({ character, onGameOver, onBack }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [playerX, setPlayerX] = useState(50); // Percentage 0-100
  const [isPaused, setIsPaused] = useState(false);
  const [isChomping, setIsChomping] = useState(false);
  const [isHurt, setIsHurt] = useState(false);
  
  // Refs for game loop state to avoid closure staleness
  const playerXRef = useRef(50);
  const itemsRef = useRef<FallingItem[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const requestRef = useRef<number>(0);
  const lastSpawnTime = useRef<number>(0);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  
  // Audio Context Ref for synthesized sounds
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context on mount/interaction
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtxRef.current = new AudioContextClass();
    }
    return () => {
      audioCtxRef.current?.close();
    };
  }, []);

  const playEatSound = useCallback(() => {
    // 1. Voice for Pikachu
    if (character.id === 'pikachu') {
      window.speechSynthesis.cancel(); // Stop previous overlap
      const utterance = new SpeechSynthesisUtterance("Pika Pika!");
      utterance.pitch = 1.4; // Make it sound cute
      utterance.rate = 1.3;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    } 
    
    // 2. Synthesized Chime/Bloop for everyone (or specifically others)
    if (audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      // Simple "coin" like sound: high pitch slide
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.1);
    }
  }, [character.id]);

  const playHurtSound = useCallback(() => {
    if (audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(150, ctx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.2);
    }
  }, []);

  // Movement Logic
  const movePlayer = useCallback((direction: 'left' | 'right') => {
    const currentSize = scoreRef.current >= 10 ? PLAYER_SIZE * 1.3 : PLAYER_SIZE;
    const speed = 1.5; // Movement speed per frame (percentage)
    
    setPlayerX((prev) => {
      let next = prev;
      if (direction === 'left') next -= speed;
      if (direction === 'right') next += speed;
      
      // Clamp
      if (next < 0) next = 0;
      if (next > 100 - currentSize) next = 100 - currentSize;
      
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
    
    // Dynamic Player Size based on Score
    const currentSize = scoreRef.current >= 10 ? PLAYER_SIZE * 1.3 : PLAYER_SIZE;

    const playerRect = {
      x: playerXRef.current,
      y: 80, // Player image top is roughly at 80% (since bottom is 15% and height is variable)
      width: currentSize,
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
          // Bomb Hit Logic
          playHurtSound();
          livesRef.current -= 1;
          setLives(livesRef.current);
          setIsHurt(true);
          setTimeout(() => setIsHurt(false), 400); // Visual shake feedback

          if (livesRef.current <= 0) {
            onGameOver(scoreRef.current);
          }
          return false; // Remove bomb immediately
        } else {
          // Food Hit Logic
          scoreRef.current += 1;
          setScore(scoreRef.current);
          playEatSound();
          return false; // Remove item
        }
      }

      // Remove if falls off bottom
      return item.y < 110;
    });

    setIsChomping(nearbyFood);
    setItems([...itemsRef.current]);

    requestRef.current = requestAnimationFrame(animate);
  }, [isPaused, movePlayer, onGameOver, playEatSound, playHurtSound]);

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

  // Determine current display size (for React render)
  const currentRenderSize = score >= 10 ? PLAYER_SIZE * 1.3 : PLAYER_SIZE;

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

      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
         {/* Lives Display */}
        <div className="flex gap-1">
          {[...Array(MAX_LIVES)].map((_, i) => (
             <Heart 
              key={i} 
              size={24} 
              className={`${i < lives ? 'fill-red-500 text-red-600' : 'fill-gray-300 text-gray-400'} drop-shadow-md transition-colors duration-300`} 
            />
          ))}
        </div>
        <div className="bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-lg border-2 border-orange-400">
          <span className="text-orange-600 font-black text-2xl">Score: {score}</span>
        </div>
      </div>

      {/* Game Area */}
      <div className={`
          relative w-full h-full max-w-md mx-auto bg-gradient-to-b from-sky-200 to-sky-100 shadow-2xl overflow-hidden border-x-4 border-white/50
          ${isHurt ? 'animate-shake bg-red-100' : ''}
      `}>
        
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
          className="absolute bottom-[13%] transition-all duration-300 ease-out flex flex-col items-center z-20"
          style={{
            left: `${playerX}%`,
            width: `${currentRenderSize}%`, // Use dynamic size
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