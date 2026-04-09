import { create } from 'zustand'

interface GameState {
  score: number;
  highScore: number;
  coins: number;
  totalCoins: number;
  gameState: 'start' | 'playing' | 'gameover';
  speed: number;
  startGame: () => void;
  endGame: () => void;
  incrementScore: (points: number) => void;
  collectCoin: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  highScore: parseInt(localStorage.getItem('shinchan_highscore') || '0', 10),
  coins: 0,
  totalCoins: parseInt(localStorage.getItem('shinchan_totalcoins') || '0', 10),
  gameState: 'start',
  speed: 15,
  startGame: () => set({ gameState: 'playing', score: 0, speed: 15, coins: 0 }),
  endGame: () => set((state) => {
    const newHighScore = Math.max(Math.floor(state.score), state.highScore)
    const newTotalCoins = state.totalCoins + state.coins
    localStorage.setItem('shinchan_highscore', newHighScore.toString())
    localStorage.setItem('shinchan_totalcoins', newTotalCoins.toString())
    return { gameState: 'gameover', highScore: newHighScore, totalCoins: newTotalCoins }
  }),
  incrementScore: (points) => set((state) => ({ score: state.score + points, speed: state.speed + 0.003 })),
  collectCoin: () => set((state) => ({ coins: state.coins + 1 })),
}))
