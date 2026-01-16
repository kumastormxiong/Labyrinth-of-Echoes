import React, { useState, useEffect } from 'react';
import { GameStats, SessionStats, MazeData, Direction, HighScoreRecord } from '../types';
import { Clock, Trophy, Play, Keyboard, RotateCcw, User, Map as MapIcon, Grid3X3, Music } from 'lucide-react';
import { MUSIC_TRACKS } from '../constants';
import { musicService } from '../services/musicService';

interface HUDProps {
  stats: GameStats;
  sessionStats: SessionStats;
  mazeSize: number;
}

export const HUD: React.FC<HUDProps> = ({ stats, sessionStats, mazeSize }) => {
  const [showMusicTitle, setShowMusicTitle] = useState(false);
  const currentTrack = MUSIC_TRACKS.find(t => t.id === sessionStats.currentTrackId);

  useEffect(() => {
    if (sessionStats.currentTrackId) {
      setShowMusicTitle(true);
      const timer = setTimeout(() => setShowMusicTitle(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [sessionStats.currentTrackId]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 p-4">
      {/* HUD Content */}
      <div className="flex justify-between items-start w-full">
        <div className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-purple-500/30 text-white shadow-lg shadow-purple-900/20">
          <h2 className="text-xs text-purple-300 uppercase tracking-widest mb-1">
            {stats.playerName || 'Traveler'}
          </h2>
          <div className="flex items-center gap-3 mb-1">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="font-mono text-lg font-bold">{stats.totalScore}</span>
          </div>
          <div className="flex items-center gap-3 mb-1">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="font-mono text-lg">{formatTime(stats.totalTime)}</span>
          </div>
          <div className="flex items-center gap-3">
            <Keyboard className="w-4 h-4 text-gray-400" />
            <span className="font-mono text-lg">{stats.totalKeyPresses}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-cyan-500/30 text-white flex items-center gap-3 shadow-lg shadow-cyan-900/20">
            <Grid3X3 className="w-5 h-5 text-cyan-400" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-cyan-300 uppercase tracking-widest">Sector Size</span>
              <span className="font-mono text-xl font-bold">{mazeSize}x{mazeSize}</span>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-green-500/30 text-white min-w-[120px] shadow-lg shadow-green-900/20">
            <h2 className="text-xs text-green-300 uppercase tracking-widest mb-1">Session</h2>
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-green-400 text-[10px]">SCORE</span>
              <span className="font-mono text-lg font-bold">+{sessionStats.score}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-blue-400 text-[10px]">TIME</span>
              <span className="font-mono text-lg">{formatTime(sessionStats.elapsedTime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Music Title Overlay */}
      <div className={`absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center transition-all duration-1000 ${showMusicTitle ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-2 mb-1">
          <Music className="w-4 h-4 text-pink-400 animate-pulse" />
          <span className="text-pink-300 text-xs font-mono tracking-widest uppercase">Now Playing</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-widest">{currentTrack?.nameCN}</h2>
        <h3 className="text-lg text-white/70 italic font-mono">{currentTrack?.nameEN}</h3>
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-[10px] text-center space-y-1">
        <p>Use Arrow Keys to Move • Press <span className="font-bold text-white">ENTER</span> at Exit A/B</p>
        <p><span className="font-bold text-white">TAB</span> for Map • <span className="font-bold text-white">ESC</span> to Menu</p>
      </div>
    </div>
  );
};

interface MinimapProps {
  maze: MazeData;
  playerX: number;
  playerY: number;
  playerDir: Direction;
}

export const Minimap: React.FC<MinimapProps> = ({ maze, playerX, playerY, playerDir }) => {
  const cellSize = 24;
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/95 backdrop-blur-xl">
      <div className="relative bg-gray-900/80 border-2 border-cyan-500 rounded-xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
        <div className="flex items-center justify-center gap-2 mb-6">
          <MapIcon className="text-cyan-400 w-5 h-5" />
          <h2 className="text-center text-cyan-400 font-bold text-xl uppercase tracking-[0.2em]">Tactical Map</h2>
        </div>

        <div style={{ width: maze.width * cellSize, height: maze.height * cellSize }} className="relative mx-auto bg-black border border-gray-800 shadow-inner overflow-hidden">
          {maze.grid.map((row) => row.map((cell) => {
            const isStart = cell.type === 'start';
            const isExitA = cell.type === 'exitA';
            const isExitB = cell.type === 'exitB';

            let bgColor = 'transparent';
            if (isStart) bgColor = 'rgba(255, 255, 255, 0.1)';
            if (isExitA) bgColor = 'rgba(34, 197, 94, 0.2)';
            if (isExitB) bgColor = 'rgba(59, 130, 246, 0.2)';

            return (
              <div
                key={`${cell.x}-${cell.y}`}
                style={{
                  position: 'absolute',
                  left: cell.x * cellSize,
                  top: cell.y * cellSize,
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: bgColor,
                  borderTop: cell.walls.N ? '2px solid #555' : '1px solid #111',
                  borderBottom: cell.walls.S ? '2px solid #555' : '1px solid #111',
                  borderLeft: cell.walls.W ? '2px solid #555' : '1px solid #111',
                  borderRight: cell.walls.E ? '2px solid #555' : '1px solid #111',
                }}
              >
                {isExitA && <div className="absolute inset-0 flex items-center justify-center text-[10px] text-green-400 font-bold">A</div>}
                {isExitB && <div className="absolute inset-0 flex items-center justify-center text-[10px] text-blue-400 font-bold">B</div>}
              </div>
            );
          }))}

          <div
            style={{
              position: 'absolute',
              left: playerX * cellSize,
              top: playerY * cellSize,
              width: cellSize,
              height: cellSize,
              transform: `rotate(${playerDir === 'N' ? 0 : playerDir === 'E' ? 90 : playerDir === 'S' ? 180 : 270}deg)`,
              transition: 'all 0.15s linear'
            }}
            className="flex items-center justify-center z-10"
          >
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[10px] border-b-cyan-400 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
          </div>
        </div>
        <div className="mt-6 text-center text-cyan-600/40 text-[10px] font-mono tracking-widest">
          <p>PRESS [TAB] TO CLOSE</p>
        </div>
      </div>
    </div>
  );
};

interface MenuProps {
  stats: GameStats;
  sessionStats: SessionStats;
  highScore: HighScoreRecord | null;
  onResume: () => void;
  onSetName: (name: string) => void;
  onReset: () => void;
  isInitial: boolean;
}

export const Menu: React.FC<MenuProps> = ({ stats, sessionStats, highScore, onResume, onSetName, onReset, isInitial }) => {
  const [nameInput, setNameInput] = useState(stats.playerName);

  const handleStart = () => {
    musicService.stopMenuPreview();
    if (isInitial && !stats.playerName && nameInput.trim()) {
      onSetName(nameInput.trim());
    } else {
      onResume();
    }
  };

  const showNameInput = isInitial && !stats.playerName;

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center overflow-y-auto pt-10 pb-10">
      <div className="bg-gray-900 border border-purple-500/30 p-8 rounded-2xl max-w-lg w-full shadow-[0_0_100px_rgba(168,85,247,0.15)] text-center relative mx-4">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 mb-1 italic tracking-tighter">
          幻径迷宫
        </h1>
        <p className="text-lg text-gray-400 mb-2 font-light italic tracking-wide">
          Labyrinth of Echoes
        </p>

        {/* High Score Display */}
        {highScore && (
          <div className="mb-4 p-4 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border border-yellow-500/30 rounded-lg">
            <div className="text-base text-yellow-500/70 uppercase tracking-widest mb-2">🏆 历史最高分</div>
            <div className="flex items-center justify-between text-2xl">
              <span className="text-yellow-300 font-bold">{highScore.playerName}</span>
              <span className="text-yellow-100 font-bold">{highScore.score}分</span>
            </div>
            <div className="text-base text-yellow-500/50 mt-2">
              {Math.floor(highScore.time)}s · {highScore.keyPresses}步
            </div>
          </div>
        )}

        {!showNameInput && (
          <p className="text-gray-500 mb-6 font-mono text-sm tracking-widest">
            PLAYER: <span className="text-purple-400">{stats.playerName || 'GUEST'}</span>
          </p>
        )}

        {!isInitial && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800/50 p-3 rounded-lg border border-white/5">
              <span className="text-[10px] text-gray-500 block mb-1">SCORE</span>
              <span className="text-2xl font-bold text-white">{sessionStats.score}</span>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg border border-white/5">
              <span className="text-[10px] text-gray-500 block mb-1">TIME</span>
              <span className="text-2xl font-bold text-white">{Math.floor(sessionStats.elapsedTime)}s</span>
            </div>
          </div>
        )}

        {/* Music History List */}
        {!isInitial && (stats.trackHistory?.length > 0 || sessionStats.currentTrackId) && (
          <div className="mb-6 text-left">
            <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Music className="w-3 h-3" /> Exploration Log (Music)
            </h3>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {stats.trackHistory.map((entry, index) => {
                const track = MUSIC_TRACKS.find(t => t.id === entry.trackId);
                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (track) {
                        musicService.playMenuPreview(track);
                      }
                    }}
                    className="flex items-start gap-2 bg-white/5 p-2 rounded border border-white/5 hover:bg-white/10 hover:border-purple-500/30 cursor-pointer transition-all group"
                  >
                    <span className="text-[9px] text-gray-600 font-mono mt-0.5">#{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] text-cyan-400 font-mono">
                          {entry.mazeSize}x{entry.mazeSize}
                        </span>
                        <span className={`text-[9px] font-bold ${entry.exitType === 'A' ? 'text-green-400' : 'text-blue-400'}`}>
                          Exit {entry.exitType}
                        </span>
                      </div>
                      <div className="truncate text-xs text-gray-300 font-bold group-hover:text-white">
                        {track?.nameCN}
                      </div>
                      <div className="truncate text-[10px] text-gray-500 italic group-hover:text-gray-400">
                        {track?.nameEN}
                      </div>
                    </div>
                    <Play className="w-3 h-3 text-gray-600 group-hover:text-purple-400 flex-shrink-0 mt-1" />
                  </div>
                );
              })}
              {/* Current Track */}
              {sessionStats.currentTrackId && (
                <div className="flex items-start gap-2 bg-purple-500/20 p-2 rounded border border-purple-500/30">
                  <span className="text-[9px] text-purple-400 font-mono animate-pulse mt-0.5">LIVE</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-xs text-purple-100 font-bold">
                      {MUSIC_TRACKS.find(t => t.id === sessionStats.currentTrackId)?.nameCN}
                    </div>
                    <div className="truncate text-[10px] text-purple-300 italic">
                      {MUSIC_TRACKS.find(t => t.id === sessionStats.currentTrackId)?.nameEN}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showNameInput && (
          <div className="mb-8">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="ENTER YOUR NAME"
              className="w-full bg-black border-b-2 border-purple-500 py-4 text-white focus:outline-none text-center text-2xl font-light tracking-[0.3em] uppercase"
              maxLength={15}
              autoFocus
            />
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleStart}
            disabled={showNameInput && !nameInput.trim()}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.02] active:scale-[0.98] disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-black rounded-lg transition-all shadow-xl shadow-purple-900/40 tracking-[0.2em]"
          >
            {showNameInput ? 'INITIALIZE' : (isInitial ? 'START' : 'RESUME')}
          </button>

          {!isInitial && (
            <button
              onClick={() => {
                if (confirm('TERMINATE ALL DATA?')) {
                  onReset();
                }
              }}
              className="w-full py-2 text-gray-600 hover:text-red-500 text-[10px] tracking-[0.3em] uppercase transition-colors"
            >
              [ RESET PROGRESS ]
            </button>
          )}
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>
    </div>
  );
};