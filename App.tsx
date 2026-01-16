import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Maze3D } from './components/Maze3D';
import { HUD, Menu, Minimap } from './components/UI';
import { MazeData, GameStats, SessionStats, Direction } from './types';
import { generateMaze } from './services/mazeGenerator';
import { loadStats, saveStats } from './services/storageService';
import { BASE_GRID_SIZE } from './constants';

const App: React.FC = () => {
  // Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [maze, setMaze] = useState<MazeData | null>(null);
  
  // Player state for Minimap
  const [playerState, setPlayerState] = useState<{x: number, y: number, dir: Direction}>({x: 0, y: 0, dir: 'N'});
  const [showMap, setShowMap] = useState(false);
  
  // Stats State
  const [stats, setStats] = useState<GameStats>({ playerName: '', totalScore: 0, totalTime: 0, totalKeyPresses: 0 });
  const [sessionStats, setSessionStats] = useState<SessionStats>({ score: 0, startTime: 0, elapsedTime: 0 });

  // Timers
  const lastTimeRef = useRef<number>(Date.now());
  const requestRef = useRef<number>(0);

  const getMazeSize = (score: number) => {
      return BASE_GRID_SIZE + Math.floor(score / 10);
  };

  // Initialize
  useEffect(() => {
    const saved = loadStats();
    setStats(saved);
    // Initial maze based on saved score
    setMaze(generateMaze(getMazeSize(saved.totalScore), 0, 0));
  }, []);

  // Timer Loop
  const updateTime = useCallback(() => {
    if (isPlaying && !isMenuOpen) {
      const now = Date.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setStats(prev => {
        const newStats = { ...prev, totalTime: prev.totalTime + delta };
        return newStats;
      });
      
      setSessionStats(prev => ({ ...prev, elapsedTime: prev.elapsedTime + delta }));
    } else {
      lastTimeRef.current = Date.now();
    }
    requestRef.current = requestAnimationFrame(updateTime);
  }, [isPlaying, isMenuOpen]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [updateTime]);

  // Persist Stats occasionally or on change
  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  // Keyboard controls for Menu and Map
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showMap) setShowMap(false); // Close map first if open
        else setIsMenuOpen(prev => !prev);
      }
      if (e.key === 'Tab') {
        e.preventDefault(); // Prevent tab focus change
        if (isPlaying && !isMenuOpen) {
             setShowMap(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMenuOpen, showMap]);

  const handleStartResume = () => {
    // Only allow start if name is set
    if (!stats.playerName) return;
    
    setIsMenuOpen(false);
    setIsPlaying(true);
    lastTimeRef.current = Date.now();
  };

  const handleSetName = (name: string) => {
      setStats(prev => ({...prev, playerName: name}));
      // Auto start after name set
      setTimeout(() => {
          setIsMenuOpen(false);
          setIsPlaying(true);
          lastTimeRef.current = Date.now();
      }, 100);
  };

  const handleReset = () => {
      const resetStats = { playerName: '', totalScore: 0, totalTime: 0, totalKeyPresses: 0 };
      setStats(resetStats);
      setSessionStats({ score: 0, startTime: 0, elapsedTime: 0 });
      saveStats(resetStats);
      setMaze(generateMaze(BASE_GRID_SIZE, 0, 0));
      // Keep menu open to ask for name again
      setIsPlaying(false);
      setIsMenuOpen(true);
      setShowMap(false);
  };

  const handleInput = () => {
      setStats(prev => ({ ...prev, totalKeyPresses: prev.totalKeyPresses + 1 }));
  };

  const handlePlayerUpdate = (x: number, y: number, dir: Direction) => {
      setPlayerState({x, y, dir});
  };

  const handleExitLevel = (type: 'A' | 'B') => {
    if (!maze) return;

    // Calculate score
    const points = type === 'A' ? 1 : 3;
    const newTotalScore = stats.totalScore + points;
    
    // Update Stats
    setStats(prev => ({ ...prev, totalScore: newTotalScore }));
    setSessionStats(prev => ({ ...prev, score: prev.score + points }));

    const exitNode = type === 'A' ? maze.exitA : maze.exitB;
    
    // Determine new size
    const newSize = getMazeSize(newTotalScore);

    // Generate new maze starting at the coordinates of the previous exit
    // Since maze grows, old coords are valid in new larger maze
    const newMaze = generateMaze(newSize, exitNode.x, exitNode.y);
    setMaze(newMaze);
    
    // Reset player position happens in Maze3D via prop change
  };

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {maze && (
        <Maze3D 
          maze={maze} 
          onExit={handleExitLevel} 
          onInput={handleInput}
          onPlayerUpdate={handlePlayerUpdate}
          active={isPlaying && !isMenuOpen && !showMap} 
        />
      )}
      
      <HUD 
        stats={stats} 
        sessionStats={sessionStats} 
        mazeSize={maze ? maze.width : BASE_GRID_SIZE} 
      />

      {showMap && maze && (
          <Minimap 
            maze={maze} 
            playerX={playerState.x} 
            playerY={playerState.y} 
            playerDir={playerState.dir} 
          />
      )}

      {isMenuOpen && (
        <Menu 
          stats={stats} 
          sessionStats={sessionStats} 
          onResume={handleStartResume}
          onSetName={handleSetName}
          onReset={handleReset}
          isInitial={!isPlaying || !stats.playerName}
        />
      )}
    </div>
  );
};

export default App;