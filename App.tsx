import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Maze3D } from './components/Maze3D';
import { HUD, Menu, Minimap } from './components/UI';
import { MazeData, GameStats, SessionStats, Direction, HighScoreRecord } from './types';
import { generateMaze } from './services/mazeGenerator';
import { loadStats, saveStats, loadHighScore, checkAndUpdateHighScore } from './services/storageService';
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
  const [highScore, setHighScore] = useState<HighScoreRecord | null>(null);

  // Music State Tracking
  const [isCrossing, setIsCrossing] = useState(false);

  // Timers and Persistence
  const lastTimeRef = useRef<number>(Date.now());
  const requestRef = useRef<number>(0);
  const pendingTimeRef = useRef<number>(0); // Time accumulated since last stats sync

  const getMazeSize = (score: number) => {
    // 0-9分 → 6x6, 10-19分 → 7x7, 20-29分 → 8x8, ...
    return 6 + Math.floor(score / 10);
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
    // Load high score
    const savedHighScore = loadHighScore();
    setHighScore(savedHighScore);
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
          // 只在打开小地图时扣分（从关闭变为打开）
          if (!showMap) {
            // 当前是关闭状态，即将打开，扣5分
            setStats(current => {
              const newScore = Math.max(0, current.totalScore - 5);
              const updated = { ...current, totalScore: newScore };
              saveStats(updated);
              const updatedHighScore = checkAndUpdateHighScore(updated);
              if (updatedHighScore) setHighScore(updatedHighScore);
              return updated;
            });
            setSessionStats(prev => ({
              ...prev,
              score: Math.max(0, prev.score - 5)
            }));
          }
          // 切换小地图状态
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

    // Add current track to history with context (only if a track is playing)
    let history = stats.trackHistory;
    if (sessionStats.currentTrackId) {
      const historyEntry = {
        trackId: sessionStats.currentTrackId,
        mazeSize: maze.width,
        exitType: type,
        timestamp: Date.now()
      };
      history = [...stats.trackHistory, historyEntry];
    }

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
      // Check and update high score
      const updatedHighScore = checkAndUpdateHighScore(updated);
      if (updatedHighScore) setHighScore(updatedHighScore);
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
    // 确保入口坐标在新迷宫尺寸范围内
    const safeEntryX = Math.min(exitNode.x, newSize - 1);
    const safeEntryY = Math.min(exitNode.y, newSize - 1);
    const newMaze = generateMaze(newSize, safeEntryX, safeEntryY);

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
          highScore={highScore}
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