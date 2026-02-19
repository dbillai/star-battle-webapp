import { useState } from 'react';
import { Board, CellValue, Position } from '@/types/game';
import { initializeBoard } from '@/lib/board/initializeBoard';
import { solveBoard } from '@/lib/board/solver';
import { generateUniquePuzzle } from '@/lib/board/generator';
import { PUZZLE_1 } from '@/data/puzzles';
import { getWrongCells } from '@/lib/board/checkSolution';

export function useStarBattle() {
  const [board, setBoard] = useState<Board>(initializeBoard());
  // puzzleBoard holds the original clue board (default or generated). Reset will restore this.
  const [puzzleBoard, setPuzzleBoard] = useState<Board>(initializeBoard());
  const [solution, setSolution] = useState<number[][]>(PUZZLE_1.solution);
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
    // restore the original puzzle board (preserve generated puzzle if present)
    setBoard(puzzleBoard);
    setWrongCells(new Set());
  };

  const checkSolution = () => {
    const wrong = getWrongCells(board, solution);
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

  const generatePuzzle = () => {
    const res = generateUniquePuzzle();
    if (!res) {
      console.log('Failed to generate puzzle');
      return;
    }
  // show cleared board to the player, but keep the clue board for resets
  setBoard(res.emptyBoard);
  setPuzzleBoard(res.emptyBoard);
  setSolution(res.solution);
  setWrongCells(new Set());
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
    generatePuzzle,
  };
}
