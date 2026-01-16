export type Direction = 'N' | 'S' | 'E' | 'W';

export interface Cell {
  x: number;
  y: number;
  walls: {
    N: boolean;
    S: boolean;
    E: boolean;
    W: boolean;
  };
  visited: boolean;
  type: 'path' | 'start' | 'exitA' | 'exitB';
}

export interface MazeData {
  grid: Cell[][];
  width: number;
  height: number;
  start: { x: number; y: number };
  exitA: { x: number; y: number };
  exitB: { x: number; y: number };
}

export interface PlayerState {
  x: number;
  y: number;
  direction: Direction; // N, S, E, W
  rotation: number; // in radians
}

export interface MusicHistoryEntry {
  trackId: string;
  mazeSize: number;
  exitType: 'A' | 'B';
  timestamp: number;
}

export interface GameStats {
  playerName: string;
  totalScore: number;
  totalTime: number; // in seconds
  totalKeyPresses: number;
  trackHistory: MusicHistoryEntry[];
}

export interface SessionStats {
  score: number;
  startTime: number;
  elapsedTime: number;
  currentTrackId?: string;
  nextTrackAId?: string;
  nextTrackBId?: string;
}

export interface HighScoreRecord {
  playerName: string;
  score: number;
  time: number;
  keyPresses: number;
  timestamp: number;
}