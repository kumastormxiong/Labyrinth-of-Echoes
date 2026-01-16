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

export interface GameStats {
  playerName: string;
  totalScore: number;
  totalTime: number; // in seconds
  totalKeyPresses: number;
  trackHistory: string[];
}

export interface SessionStats {
  score: number;
  startTime: number;
  elapsedTime: number;
  currentTrackId?: string;
  nextTrackAId?: string;
  nextTrackBId?: string;
}