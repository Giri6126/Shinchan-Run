import { create } from 'zustand'

interface GameState {
  score: number;
  highScore: number;
  gameState: 'start' | 'playing' | 'gameover';
  speed: number; // world speed units per second
  startGame: () => void;
  endGame: () => void;
  incrementScore: (points: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  highScore: parseInt(localStorage.getItem('shinchan_highscore') || '0', 10),
  gameState: 'start',
  speed: 15, // initial speed
  startGame: () => set({ gameState: 'playing', score: 0, speed: 15 }),
  endGame: () => set((state) => {
    const newHighScore = Math.max(Math.floor(state.score), state.highScore);
    localStorage.setItem('shinchan_highscore', newHighScore.toString());
    return { gameState: 'gameover', highScore: newHighScore };
  }),
  incrementScore: (points) => set((state) => ({ score: state.score + points, speed: state.speed + 0.05 })),
}));
