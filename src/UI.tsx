import { useGameStore } from './store'

export function UI() {
  const { gameState, score, highScore, coins, totalCoins, startGame } = useGameStore()

  if (gameState === 'start') {
    return (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-sky-300/80 backdrop-blur-sm" style={{ pointerEvents: 'auto' }}>
        <h1 className="text-6xl md:text-8xl text-white font-extrabold drop-shadow-xl mb-4 text-center tracking-wider" style={{ fontFamily: 'comic sans ms, cursive', textShadow: '4px 4px 0 #ef4444, -4px -4px 0 #ef4444, 4px -4px 0 #ef4444, -4px 4px 0 #ef4444' }}>
          SHINCHAN<br/>RUNNER
        </h1>
        {totalCoins > 0 && (
          <p className="text-yellow-300 font-black text-xl mb-6">🪙 Total Coins: {totalCoins}</p>
        )}
        <button
          onClick={startGame}
          className="px-12 py-6 bg-yellow-400 hover:bg-yellow-300 transform hover:scale-105 transition-all outline-none rounded-full text-red-600 font-black text-4xl shadow-[0_10px_20px_rgba(234,179,8,0.5)] border-4 border-red-500 cursor-pointer"
        >
          TAP TO PLAY
        </button>
      </div>
    )
  }

  if (gameState === 'gameover') {
    return (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md" style={{ pointerEvents: 'auto' }}>
        <h1 className="text-7xl text-red-500 font-extrabold drop-shadow-2xl mb-6 uppercase tracking-widest" style={{ fontFamily: 'comic sans ms, cursive' }}>Oops!</h1>
        <div className="bg-white/10 p-8 rounded-3xl border-4 border-white/20 mb-10 text-center min-w-[300px]">
          <p className="text-2xl text-blue-200 mb-1 uppercase font-bold tracking-wider">Score</p>
          <p className="text-6xl text-white mb-4 font-black">{Math.floor(score)}</p>
          <p className="text-xl text-yellow-500/80 uppercase font-bold tracking-wider mb-1">High Score</p>
          <p className="text-4xl text-yellow-400 font-black mb-4">{highScore}</p>
          <div className="border-t border-white/20 pt-4">
            <p className="text-xl text-yellow-300 font-bold mb-1">🪙 Coins this run</p>
            <p className="text-4xl text-yellow-400 font-black">{coins}</p>
            <p className="text-sm text-white/60 mt-1">Total collected: {totalCoins}</p>
          </div>
        </div>
        <button
          onClick={startGame}
          className="px-12 py-6 bg-yellow-400 hover:bg-yellow-300 transform hover:scale-105 transition-all outline-none rounded-full text-red-600 font-black text-3xl shadow-[0_10px_20px_rgba(234,179,8,0.5)] border-4 border-red-500 cursor-pointer"
        >
          PLAY AGAIN
        </button>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="bg-white/90 px-8 py-3 rounded-full shadow-xl border-4 border-yellow-400 animate-bounce">
          <p className="text-3xl font-black text-blue-600 tracking-wider font-mono">{Math.floor(score)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {highScore > 0 && (
            <div className="bg-slate-800/80 px-6 py-2 rounded-full shadow-lg border-2 border-slate-600">
              <p className="text-lg font-bold text-yellow-400 tracking-widest">BEST: {highScore}</p>
            </div>
          )}
          <div className="bg-yellow-400/90 px-5 py-2 rounded-full shadow-lg border-2 border-yellow-600 flex items-center gap-2">
            <span className="text-lg">🪙</span>
            <p className="text-lg font-black text-yellow-900">{coins}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
