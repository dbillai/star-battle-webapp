import { Board, Cell } from '@/types/game';
import { PUZZLE_1 } from '@/data/puzzles';

export function initializeBoard(pzl = PUZZLE_1): Board {
  const puzzle = pzl;
  const size = puzzle.size;
  const cells: Cell[][] = [];

  for (let row = 0; row < size; row++) {
    cells[row] = [];
    for (let col = 0; col < size; col++) {
      cells[row][col] = {
        row,
        col,
        value: 0,
        regionId: puzzle.regionMap[row][col],
      };
    }
  }

  return { cells, regions: [], size };
}