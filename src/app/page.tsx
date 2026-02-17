'use client';

import { useState, useRef } from 'react';
import { Board, CellValue } from './types';

export default function Home() {
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCellMouseDown = (row: number, col: number) => {
    setIsMouseDown(true);
    setVisitedCells(new Set([`${row}-${col}`]));
    
    setBoard((prevBoard) => {
      const newBoard = { ...prevBoard };
      const currentValue = newBoard.cells[row][col].value;
      // If empty (0), go to marked out (1). Otherwise cycle normally.
      const nextValue = currentValue === 0 ? 1 : ((currentValue + 1) % 3) as CellValue;
      // console.log("incremented the value of the cell")
      newBoard.cells[row][col].value = nextValue;
      return newBoard;
    });
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isMouseDown) return;

    const cellKey = `${row}-${col}`;
    if (!visitedCells.has(cellKey)) {
      setVisitedCells((prev) => new Set([...prev, cellKey]));
      
      // Only increase if the cell is empty
      setBoard((prevBoard) => {
        const newBoard = { ...prevBoard };
        if (newBoard.cells[row][col].value === 0) {
          newBoard.cells[row][col].value = 1;
        }
        return newBoard;
      });
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setVisitedCells(new Set());
  };

  return (
    <main 
      className="flex items-center justify-center min-h-screen bg-slate-100"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-8 text-center">Star Battle</h1>
        
        <div 
          ref={containerRef}
          className="inline-block border-2 border-black select-none"
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
                  rightNeighborRegionId={colIndex < board.size - 1 ? board.cells[rowIndex][colIndex + 1].regionId : undefined}
                  bottomNeighborRegionId={rowIndex < board.size - 1 ? board.cells[rowIndex + 1][colIndex].regionId : undefined}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setBoard(initializeBoard())}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded transition-colors"
          >
            Clear Board
          </button>
        </div>
      </div>
    </main>
  );
}

function GameCell({ 
  cell, 
  onMouseDown, 
  onMouseEnter,
  rightNeighborRegionId,
  bottomNeighborRegionId
}: { 
  cell: Cell; 
  onMouseDown: () => void;
  onMouseEnter: () => void;
  rightNeighborRegionId?: number;
  bottomNeighborRegionId?: number;
}) {
  const getCellContent = (value: CellValue) => {
    switch (value) {
      case 0:
        return null;
      case 1:
        return '✕';
      case 2:
        return '★';
    }
  };

  const getContentColor = (value: CellValue) => {
    switch (value) {
      case 0:
        return '';
      case 1:
        return 'text-gray-400';
      case 2:
        return 'text-yellow-400';
    }
  };

  const rightBorder = rightNeighborRegionId !== undefined && rightNeighborRegionId !== cell.regionId 
    ? 'border-r-2 border-r-black' : 'border-r border-r-gray-300';

  const bottomBorder = bottomNeighborRegionId !== undefined && bottomNeighborRegionId !== cell.regionId 
  ? 'border-b-2 border-b-black' : 'border-b border-b-gray-300';

  return (
    <button
      onMouseDown={(e) => {
          e.preventDefault();
          onMouseDown();
        }}
      // onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      className={`w-12 h-12 border-l border-t border-gray-300 flex items-center justify-center text-xl font-bold hover:bg-gray-100 transition-colors cursor-pointer ${rightBorder} ${bottomBorder} ${getContentColor(cell.value)}`}
    >
      {getCellContent(cell.value)}
    </button>
  );
}

function initializeBoard(): Board {
  const size = 10;
  const regionMap = [
    "AAABCCCDDD",
    "AABBCCCDDD",
    "AAABCCCCDD",
    "AAABBCCCDD",
    "AAAEECCCCF",
    "HHHIEEEEFF",
    "HHIIJKKFFF",
    "HHIJJKKFKF",
    "HHIJJJKKKK",
    "HHJJJKKKKK",
  ];

  const letterToRegionId: { [key: string]: number } = {
    'A': 0,
    'B': 1,
    'C': 2,
    'D': 3,
    'E': 4,
    'F': 5,
    'H': 6,
    'I': 7,
    'J': 8,
    'K': 9,
  };

  const cells: Cell[][] = [];

  for (let row = 0; row < size; row++) {
    cells[row] = [];
    for (let col = 0; col < size; col++) {
      const letter = regionMap[row][col];
      
      cells[row][col] = {
        row,
        col,
        value: 0,
        regionId: letterToRegionId[letter],
      };
    }
  }

  return {
    cells,
    regions: [],
    size,
  };
}