import { Board, Position } from '@/types/game';

export function getWrongCells(
  board: Board,
  solution: number[][]
): Position[] {
  const wrongCells: Position[] = [];

  board.cells.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const playerHasStar = cell.value === 2;
      const playerHasCross = cell.value === 1;
      const solutionHasStar = solution[rowIndex][colIndex] === 1;

      const isWrong =
        (playerHasStar && !solutionHasStar) ||   // wrong star
        (playerHasCross && solutionHasStar);    // wrong cross

      if (isWrong) {
        wrongCells.push({ row: rowIndex, col: colIndex });
      }
    });
  });

  return wrongCells;
}
