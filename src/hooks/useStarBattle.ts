import { useState } from 'react';
import { Board, CellValue } from '@/types/game';
import { initializeBoard } from '@/lib/board/initializeBoard';

export function useStarBattle() {
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set());

  const handleCellMouseDown = (row: number, col: number) => {
    setIsMouseDown(true);
    setVisitedCells(new Set([`${row}-${col}`]));

    setBoard(prev => {
      const newBoard = { ...prev };
      const currentValue = newBoard.cells[row][col].value;

      const nextValue =
        currentValue === 0
          ? 1
          : ((currentValue + 1) % 3) as CellValue;

      newBoard.cells[row][col].value = nextValue;
      return newBoard;
    });
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isMouseDown) return;

    const key = `${row}-${col}`;
    if (visitedCells.has(key)) return;

    setVisitedCells(prev => new Set([...prev, key]));

    setBoard(prev => {
      const newBoard = { ...prev };
      if (newBoard.cells[row][col].value === 0) {
        newBoard.cells[row][col].value = 1;
      }
      return newBoard;
    });
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setVisitedCells(new Set());
  };

  const resetBoard = () => {
    setBoard(initializeBoard());
  };

  return {
    board,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleMouseUp,
    resetBoard,
  };
}
