import * as Logic from 'logic-solver';
import { Board, Position } from '@/types/game';

export function solveBoard(board: Board, starsPerUnit = 2): Position[] | null {
  const { size, cells } = board;
  // Derive regions from board.regions if provided, otherwise build from cells
  let regions = board.regions && board.regions.length ? board.regions : [];
  if (!regions || regions.length === 0) {
    const map = new Map<number, Position[]>();
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const id = cells[r][c].regionId;
        if (!map.has(id)) map.set(id, []);
        map.get(id)!.push({ row: r, col: c });
      }
    }
    regions = Array.from(map.entries()).map(([id, pos]) => ({ id, cells: pos }));
  }

  const solver = new Logic.Solver();

  // One boolean variable per cell: "cell_r_c" is true if it has a star
  const varName = (r: number, c: number) => `cell_${r}_${c}`;

  // Helper to assert exactly N true among variables using sum + equalBits
  const assertExactlyN = (n: number, vars: string[]) => {
    // Logic.sum accepts formulas/terms and returns Bits; compare to constantBits(n)
    solver.require(Logic.equalBits(Logic.sum(vars), Logic.constantBits(n)));
  };

  // Constraint: exactly N stars per row
  for (let r = 0; r < size; r++) {
    const vars = Array.from({ length: size }, (_, c) => varName(r, c));
    assertExactlyN(starsPerUnit, vars);
  }

  // Constraint: exactly N stars per column
  for (let c = 0; c < size; c++) {
    const vars = Array.from({ length: size }, (_, r) => varName(r, c));
    assertExactlyN(starsPerUnit, vars);
  }

  // Constraint: exactly N stars per region
  for (const region of regions) {
    const vars = region.cells.map(({ row, col }) => varName(row, col));
    assertExactlyN(starsPerUnit, vars);
  }

  // Constraint: no two stars touch (including diagonals) -> at most one of each adjacent pair
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          solver.require(Logic.atMostOne([varName(r, c), varName(nr, nc)]));
        }
      }
    }
  }

  // Constraint: pre-placed stars must be stars, crossed cells cannot be
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = cells[r][c].value;
      const v = varName(r, c);
      if (val === 2) solver.require(v); // require variable true
      if (val === 1) solver.require(Logic.not(v)); // require variable false
    }
  }

  const solution = solver.solve();
  if (!solution) return null;

  const stars: Position[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (solution.evaluate(varName(r, c))) {
        stars.push({ row: r, col: c });
      }
    }
  }
  return stars;
}