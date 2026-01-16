import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Maze3D } from './components/Maze3D';
import { HUD, Menu, Minimap } from './components/UI';
import { MazeData, GameStats, SessionStats, Direction } from './types';
import { generateMaze } from './services/mazeGenerator';
import { loadStats, saveStats } from './services/storageService';
import { BASE_GRID_SIZE, MUSIC_TRACKS } from './constants';
import { musicService } from './services/musicService';

const App: React.FC = () => {
  // Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [maze, setMaze] = useState<MazeData | null>(null);

  // Player state for Minimap
  const [playerState, setPlayerState] = useState<{ x: number, y: number, dir: Direction }>({ x: 0, y: 0, dir: 'N' });
  const [showMap, setShowMap] = useState(false);

  // Stats State
  const [stats, setStats] = useState<GameStats>({ playerName: '', totalScore: 0, totalTime: 0, totalKeyPresses: 0, trackHistory: [] });
  const [sessionStats, setSessionStats] = useState<SessionStats>({ score: 0, startTime: 0, elapsedTime: 0 });

  // Music State Tracking
  const [isCrossing, setIsCrossing] = useState(false);

  // Timers and Persistence
  const lastTimeRef = useRef<number>(Date.now());
  const requestRef = useRef<number>(0);
  const pendingTimeRef = useRef<number>(0); // Time accumulated since last stats sync

  const getMazeSize = (score: number) => {
    return BASE_GRID_SIZE + Math.floor(score / 10);
  };

  // Helper to pick next tracks
  const pickNextTracks = useCallback(() => {
    const trackA = musicService.getRandomTrack();
    const trackB = musicService.getRandomTrack([trackA.id]);
    return { trackA, trackB };
  }, []);

  // Sync current pending time to persistent stats and save
  const syncAndSave = useCallback((currentStats: GameStats, currentSession: SessionStats) => {
    const updatedStats = {
      ...currentStats,
      totalTime: currentStats.totalTime + pendingTimeRef.current
    };
    saveStats(updatedStats);
    pendingTimeRef.current = 0;
    return updatedStats;
  }, []);

  // Initialize
  useEffect(() => {
    const saved = loadStats();
    setStats(saved);
    // Initial maze based on saved score
    const newMaze = generateMaze(getMazeSize(saved.totalScore), 0, 0);
    setMaze(newMaze);

    // Pick first track
    const firstTrack = musicService.getRandomTrack();
    const { trackA, trackB } = pickNextTracks();

    setSessionStats(prev => ({
      ...prev,
      currentTrackId: firstTrack.id,
      nextTrackAId: trackA.id,
      nextTrackBId: trackB.id
    }));

    // Before unload listener for saving
    const handleUnload = () => {
      // Functional state updates might not work here, use refs or current state if available
      // In this case, we'll try to sync what we have
      setStats(prev => {
        const updated = { ...prev, totalTime: prev.totalTime + pendingTimeRef.current };
        saveStats(updated);
        return updated;
      });
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [pickNextTracks]);

  // Handle Music Playback on Start
  useEffect(() => {
    if (isPlaying && !isMenuOpen && sessionStats.currentTrackId && !isCrossing) {
      const track = musicService.getTrackById(sessionStats.currentTrackId);
      if (track) musicService.playTrack(track, false);
    }
  }, [isPlaying, isMenuOpen, sessionStats.currentTrackId, isCrossing]);

  // Timer Loop - Decoupled from localStorage writes
  const updateTime = useCallback(() => {
    if (isPlaying && !isMenuOpen) {
      const now = Date.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Accumulate pending time instead of updating stats state (which triggers save)
      pendingTimeRef.current += delta;

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

  // Keyboard controls for Menu and Map
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showMap) setShowMap(false); // Close map first if open
        else {
          setIsMenuOpen(prev => {
            const newState = !prev;
            if (newState) {
              // Sync time when opening menu
              setStats(current => syncAndSave(current, sessionStats));
            }
            return newState;
          });
        }
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
  }, [isPlaying, isMenuOpen, showMap, sessionStats, syncAndSave]);

  const handleStartResume = () => {
    if (!stats.playerName) return;
    setIsMenuOpen(false);
    setIsPlaying(true);
    lastTimeRef.current = Date.now();
  };

  const handleSetName = (name: string) => {
    setStats(prev => {
      const updated = { ...prev, playerName: name };
      saveStats(updated);
      return updated;
    });
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsPlaying(true);
      lastTimeRef.current = Date.now();
    }, 100);
  };

  const handleReset = () => {
    const resetStats = { playerName: '', totalScore: 0, totalTime: 0, totalKeyPresses: 0, trackHistory: [] };
    setStats(resetStats);
    musicService.stopAll();
    const firstTrack = musicService.getRandomTrack();
    const { trackA, trackB } = pickNextTracks();

    setSessionStats({
      score: 0,
      startTime: 0,
      elapsedTime: 0,
      currentTrackId: firstTrack.id,
      nextTrackAId: trackA.id,
      nextTrackBId: trackB.id
    });
    saveStats(resetStats);
    pendingTimeRef.current = 0;
    setMaze(generateMaze(BASE_GRID_SIZE, 0, 0));
    setIsPlaying(false);
    setIsMenuOpen(true);
    setShowMap(false);
    setIsCrossing(false);
    // 强制页面刷新以完全重置状态
    window.location.reload();
  };

  const handleInput = () => {
    setStats(prev => ({ ...prev, totalKeyPresses: prev.totalKeyPresses + 1 }));
  };

  const handlePlayerUpdate = (x: number, y: number, dir: Direction) => {
    setPlayerState({ x, y, dir });
    if (!maze || isCrossing) return;

    const cell = maze.grid[y][x];
    if (cell.type === 'exitA' || cell.type === 'exitB') {
      const nextId = cell.type === 'exitA' ? sessionStats.nextTrackAId : sessionStats.nextTrackBId;
      const track = musicService.getTrackById(nextId!);
      if (track) {
        setIsCrossing(true);
        // Set currentTrackId here to trigger the HUD notification during crossfade
        setSessionStats(prev => ({ ...prev, currentTrackId: nextId }));
        musicService.playTrack(track, true);
      }
    }
  };

  const handleExitLevel = (type: 'A' | 'B') => {
    if (!maze) return;

    const points = type === 'A' ? 1 : 3;
    const newTotalScore = stats.totalScore + points;

    // Add current track to history
    const history = [...stats.trackHistory, sessionStats.currentTrackId!];

    // Pick next tracks for the NEXT level's exits
    const { trackA, trackB } = pickNextTracks();

    // Explicitly sync time, update score/history and SAVE
    setStats(prev => {
      const updated = {
        ...prev,
        totalScore: newTotalScore,
        trackHistory: history,
        totalTime: prev.totalTime + pendingTimeRef.current
      };
      saveStats(updated);
      pendingTimeRef.current = 0;
      return updated;
    });

    setSessionStats(prev => ({
      ...prev,
      score: prev.score + points,
      // Current track remains the same as it was already updated and is playing
      nextTrackAId: trackA.id,
      nextTrackBId: trackB.id
    }));

    const exitNode = type === 'A' ? maze.exitA : maze.exitB;
    const newSize = getMazeSize(newTotalScore);
    const newMaze = generateMaze(newSize, exitNode.x, exitNode.y);

    setMaze(newMaze);
    setIsCrossing(false);
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