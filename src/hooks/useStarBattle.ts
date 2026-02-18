import { useState } from 'react';
import { Board, CellValue, Position } from '@/types/game';
import { initializeBoard } from '@/lib/board/initializeBoard';
import { solveBoard } from '@/lib/board/solver';
import { PUZZLE_1 } from '@/data/puzzles';
import { getWrongCells } from '@/lib/board/checkSolution';

export function useStarBattle() {
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set());
  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set());

  const isCellWrong = (row: number, col: number) => 
    wrongCells.has(`${row}-${col}`);


  const handleCellMouseDown = (row: number, col: number) => {
    setWrongCells(new Set());
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
    setWrongCells(new Set());
  };

  const checkSolution = () => {
    const wrong = getWrongCells(board, PUZZLE_1.solution);
    const wrongSet = new Set(
      wrong.map(pos => `${pos.row}-${pos.col}`)
    );

  setWrongCells(wrongSet);
  console.log(wrongSet);
  };

  const solvePuzzle = () => {
    // Run solver on an empty board (same puzzle regions) so we don't modify the UI board
    const emptyBoard = initializeBoard();
    const result = solveBoard(emptyBoard);
    if (!result) {
      console.log('No solution found');
      return;
    }
    // Build a new board with the solution applied, but do not set it as the UI board.
    const starKeys = new Set(result.map(p => `${p.row}-${p.col}`));
    const solvedBoard: Board = {
      ...emptyBoard,
      cells: emptyBoard.cells.map((row, r) =>
        row.map((cell, c) => ({ ...cell, value: starKeys.has(`${r}-${c}`) ? 2 : 0 }))
      ),
    };

    // Log the solved board for inspection (UI board remains unchanged)
    console.log('Solved board (not applied to UI):', solvedBoard);
  };


  return {
    board,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleMouseUp,
    resetBoard,
    wrongCells,
    isCellWrong,
    checkSolution,
    solvePuzzle,
  };
}
