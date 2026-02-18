'use client';

import GameBoard from '@/components/game/GameBoard';

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-8 text-center">Star Battle</h1>
        <GameBoard />
      </div>
    </main>
  );
}
