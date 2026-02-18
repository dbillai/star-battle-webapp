import { Board, Cell } from '@/types/game';

export function initializeBoard(): Board {
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

  const letterToRegionId: Record<string, number> = {
    A: 0, B: 1, C: 2, D: 3, E: 4,
    F: 5, H: 6, I: 7, J: 8, K: 9,
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
