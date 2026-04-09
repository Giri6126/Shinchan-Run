import { useGameStore } from './store'

export function UI() {
  const { gameState, score, highScore, startGame } = useGameStore()

  if (gameState === 'start') {
    return (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-sky-300/80 backdrop-blur-sm">
        <h1 className="text-6xl md:text-8xl text-white font-extrabold drop-shadow-xl mb-12 text-center tracking-wider" style={{ fontFamily: 'comic sans ms, cursive', textShadow: '4px 4px 0 #ef4444, -4px -4px 0 #ef4444, 4px -4px 0 #ef4444, -4px 4px 0 #ef4444' }}>
          SHINCHAN<br/>RUNNER
        </h1>
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
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md">
        <h1 className="text-7xl text-red-500 font-extrabold drop-shadow-2xl mb-6 uppercase tracking-widest" style={{ fontFamily: 'comic sans ms, cursive' }}>Oops!</h1>
        <div className="bg-white/10 p-8 rounded-3xl border-4 border-white/20 mb-10 text-center min-w-[300px]">
          <p className="text-2xl text-blue-200 mb-2 uppercase font-bold tracking-wider">Score</p>
          <p className="text-6xl text-white mb-6 font-black">{Math.floor(score)}</p>
          <p className="text-xl text-yellow-500/80 uppercase font-bold tracking-wider mb-1">High Score</p>
          <p className="text-4xl text-yellow-400 font-black">{highScore}</p>
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
    <div className="absolute inset-0 z-10 pointer-events-none p-6 flex justify-between items-start">
      <div className="bg-white/90 px-8 py-3 rounded-full shadow-xl border-4 border-yellow-400 animate-bounce">
        <p className="text-3xl font-black text-blue-600 tracking-wider font-mono">{Math.floor(score)}</p>
      </div>
      {highScore > 0 && (
        <div className="bg-slate-800/80 px-6 py-2 rounded-full shadow-lg border-2 border-slate-600">
          <p className="text-lg font-bold text-yellow-400 tracking-widest">BEST: {highScore}</p>
        </div>
      )}
    </div>
  )
}
