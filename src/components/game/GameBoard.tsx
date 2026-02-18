'use client';

import { useRef } from 'react';
import { useStarBattle } from '@/hooks/useStarBattle';
import GameCell from './GameCell';

export default function GameBoard() {
  const {
    board,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleMouseUp,
    resetBoard,
  } = useStarBattle();

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div
        ref={containerRef}
        className="inline-block border-2 border-black select-none"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {board.cells.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => (
              <GameCell
                key={`${rowIndex}-${colIndex}`}
                cell={cell}
                onMouseDown={() =>
                  handleCellMouseDown(rowIndex, colIndex)
                }
                onMouseEnter={() =>
                  handleCellMouseEnter(rowIndex, colIndex)
                }
                rightNeighborRegionId={
                  colIndex < board.size - 1
                    ? board.cells[rowIndex][colIndex + 1].regionId
                    : undefined
                }
                bottomNeighborRegionId={
                  rowIndex < board.size - 1
                    ? board.cells[rowIndex + 1][colIndex].regionId
                    : undefined
                }
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={resetBoard}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded transition-colors"
        >
          Clear Board
        </button>
      </div>
    </>
  );
}
