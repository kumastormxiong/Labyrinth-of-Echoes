import { GameStats, HighScoreRecord } from '../types';
import { STORAGE_KEY } from '../constants';

const DEFAULT_STATS: GameStats = {
  playerName: '',
  totalScore: 0,
  totalTime: 0,
  totalKeyPresses: 0,
  trackHistory: [],
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

const HIGH_SCORE_KEY = 'labyrinth_high_score';

export const loadHighScore = (): HighScoreRecord | null => {
  try {
    const data = localStorage.getItem(HIGH_SCORE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load high score', e);
  }
  return null;
};

export const saveHighScore = (record: HighScoreRecord) => {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(record));
  } catch (e) {
    console.error('Failed to save high score', e);
  }
};

export const checkAndUpdateHighScore = (stats: GameStats): HighScoreRecord | null => {
  const currentHighScore = loadHighScore();

  if (!currentHighScore || stats.totalScore > currentHighScore.score) {
    const newRecord: HighScoreRecord = {
      playerName: stats.playerName,
      score: stats.totalScore,
      time: stats.totalTime,
      keyPresses: stats.totalKeyPresses,
      timestamp: Date.now()
    };
    saveHighScore(newRecord);
    return newRecord;
  }

  return currentHighScore;
};