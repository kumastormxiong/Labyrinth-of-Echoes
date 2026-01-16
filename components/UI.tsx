import React, { useState } from 'react';
import { GameStats, SessionStats, MazeData, Direction } from '../types';
import { Clock, Trophy, Play, Keyboard, RotateCcw, User, Map as MapIcon, Grid3X3 } from 'lucide-react';

interface HUDProps {
  stats: GameStats;
  sessionStats: SessionStats;
  mazeSize: number;
}

export const HUD: React.FC<HUDProps> = ({ stats, sessionStats, mazeSize }) => {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10">
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

          <div className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-green-500/30 text-white w-full shadow-lg shadow-green-900/20">
            <h2 className="text-xs text-green-300 uppercase tracking-widest mb-1">Session</h2>
             <div className="flex items-center gap-3 mb-1">
              <span className="text-green-400 text-sm">Score:</span>
              <span className="font-mono text-lg font-bold">+{sessionStats.score}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-blue-400 text-sm">Time:</span>
              <span className="font-mono text-lg">{formatTime(sessionStats.elapsedTime)}</span>
            </div>
          </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-xs text-center space-y-1">
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
  const padding = 24;
  
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="relative bg-gray-900/80 border-2 border-cyan-500 rounded-xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
        <div className="flex items-center justify-center gap-2 mb-6">
            <MapIcon className="text-cyan-400 w-5 h-5" />
            <h2 className="text-center text-cyan-400 font-bold text-xl uppercase tracking-[0.2em] text-shadow-glow">Tactical Map</h2>
        </div>
        
        <div style={{ width: maze.width * cellSize, height: maze.height * cellSize }} className="relative mx-auto bg-black border border-gray-800 shadow-inner">
           {/* Grid Generation */}
           {maze.grid.map((row) => row.map((cell) => {
               const isStart = cell.type === 'start';
               const isExitA = cell.type === 'exitA';
               const isExitB = cell.type === 'exitB';
               
               let bgColor = 'transparent';
               if (isStart) bgColor = 'rgba(255, 255, 255, 0.1)';
               if (isExitA) bgColor = 'rgba(34, 197, 94, 0.2)'; // Green
               if (isExitB) bgColor = 'rgba(59, 130, 246, 0.2)'; // Blue

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
                        boxSizing: 'border-box',
                        // Walls
                        borderTop: cell.walls.N ? '2px solid #666' : '1px solid #222',
                        borderBottom: cell.walls.S ? '2px solid #666' : '1px solid #222',
                        borderLeft: cell.walls.W ? '2px solid #666' : '1px solid #222',
                        borderRight: cell.walls.E ? '2px solid #666' : '1px solid #222',
                    }}
                   >
                    {isStart && <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white/50">START</div>}
                    {isExitA && <div className="absolute inset-0 flex items-center justify-center text-xs text-green-400 font-bold">A</div>}
                    {isExitB && <div className="absolute inset-0 flex items-center justify-center text-xs text-blue-400 font-bold">B</div>}
                   </div>
               );
           }))}
           
           {/* Player Marker */}
           <div 
             style={{
                 position: 'absolute',
                 left: playerX * cellSize,
                 top: playerY * cellSize,
                 width: cellSize,
                 height: cellSize,
                 transform: `rotate(${playerDir === 'N' ? 0 : playerDir === 'E' ? 90 : playerDir === 'S' ? 180 : 270}deg)`,
                 transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
             }}
             className="flex items-center justify-center z-10"
           >
                <div className="relative">
                     <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[12px] border-b-cyan-400 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                </div>
           </div>
        </div>
        <div className="mt-6 text-center text-cyan-600/60 text-xs font-mono">
            <p>PRESS [TAB] TO CLOSE</p>
        </div>
      </div>
    </div>
  )
}

interface MenuProps {
  stats: GameStats;
  sessionStats: SessionStats;
  onResume: () => void;
  onSetName: (name: string) => void;
  onReset: () => void;
  isInitial: boolean;
}

export const Menu: React.FC<MenuProps> = ({ stats, sessionStats, onResume, onSetName, onReset, isInitial }) => {
  const [nameInput, setNameInput] = useState(stats.playerName);

  const handleStart = () => {
    if (isInitial && !stats.playerName && nameInput.trim()) {
        onSetName(nameInput.trim());
    } else {
        onResume();
    }
  };

  const showNameInput = isInitial && !stats.playerName;

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-gray-900 border border-purple-500 p-8 rounded-2xl max-w-md w-full shadow-2xl shadow-purple-900/50 text-center relative">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
          {showNameInput ? 'WHO ARE YOU?' : 'PSYCHEDELIC MAZE'}
        </h1>
        
        {stats.playerName && !showNameInput && (
             <p className="text-gray-400 mb-6 flex items-center justify-center gap-2">
                <User className="w-4 h-4"/> {stats.playerName}
             </p>
        )}

        {!isInitial && (
          <div className="mb-6 bg-gray-800 p-4 rounded-lg">
             <h3 className="text-gray-400 text-sm uppercase mb-2">Session Progress</h3>
             <div className="flex justify-around">
                <div className="flex flex-col">
                    <span className="text-2xl font-bold text-white">{sessionStats.score}</span>
                    <span className="text-xs text-gray-500">Points</span>
                </div>
                 <div className="flex flex-col">
                    <span className="text-2xl font-bold text-white">{Math.floor(sessionStats.elapsedTime)}s</span>
                    <span className="text-xs text-gray-500">Time</span>
                </div>
             </div>
          </div>
        )}

        {showNameInput ? (
            <div className="mb-6 space-y-4">
                <input 
                    type="text" 
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 text-center text-lg"
                    maxLength={15}
                />
            </div>
        ) : null}

        <div className="space-y-3">
          <button 
            onClick={handleStart}
            disabled={showNameInput && !nameInput.trim()}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 group"
          >
            <Play className="w-5 h-5 group-hover:scale-110 transition-transform"/>
            {showNameInput ? 'ENTER MAZE' : (isInitial ? 'START JOURNEY' : 'RESUME')}
          </button>
          
          {!isInitial && (
            <button 
                onClick={() => {
                    if (confirm('Are you sure you want to reset all progress and identity?')) {
                        onReset();
                    }
                }}
                className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-400 font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
                <RotateCcw className="w-4 h-4"/> RESET ALL DATA
            </button>
          )}
        </div>
        
        <div className="mt-8 text-xs text-gray-500">
            <p>Exit A: +1 Point | Exit B: +3 Points</p>
            <p className="mt-1">Press ENTER on Exit to Advance</p>
            <p className="mt-1">Maze expands every 10 points</p>
        </div>
      </div>
    </div>
  );
};