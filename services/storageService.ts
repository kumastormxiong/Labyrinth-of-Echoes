import { GameStats } from '../types';
import { STORAGE_KEY } from '../constants';

const DEFAULT_STATS: GameStats = {
  playerName: '',
  totalScore: 0,
  totalTime: 0,
  totalKeyPresses: 0,
};

export const loadStats = (): GameStats => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Merge with default to handle potential schema updates (like adding playerName)
      return { ...DEFAULT_STATS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load stats', e);
  }
  return DEFAULT_STATS;
};

export const saveStats = (stats: GameStats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats', e);
  }
};