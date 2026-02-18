'use client';

import { useRef } from 'react';
import { useStarBattle } from '@/hooks/useStarBattle';
import GameCell from './GameCell';
import { COMPILER_INDEXES } from 'next/dist/shared/lib/constants';

export default function GameBoard() {
    const {
        board,
        handleCellMouseDown,
        handleCellMouseEnter,
        handleMouseUp,
        resetBoard,
        wrongCells,
        checkSolution,
        solvePuzzle,
        isCellWrong,
    } = useStarBattle();

    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <div className="flex flex-col items-center justify-center min-h-screen">
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
                                    onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                                    onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
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
                                    leftNeighborRegionId={
                                        colIndex > 0
                                            ? board.cells[rowIndex][colIndex - 1].regionId
                                            : undefined
                                    }
                                    topNeighborRegionId={
                                        rowIndex > 0
                                            ? board.cells[rowIndex - 1][colIndex].regionId
                                            : undefined
                                    }
                                    isWrong={isCellWrong(rowIndex, colIndex)}
                                />
                            ))}
                        </div>
                    ))}
                </div>
                <div className="flex flex-col items-center justify-start pt-8 gap-6 min-h-screen">
                    <button
                        onClick={resetBoard}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded transition-colors"
                    >
                        Clear Board
                    </button>
                    <button
                        onClick={solvePuzzle}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded transition-colors"
                    >
                        Solve
                    </button>
                    <button
                        onClick={checkSolution}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded transition-colors"
                    >
                        Check Solution
                    </button>
                </div>
            </div>
        </>
    );
}
