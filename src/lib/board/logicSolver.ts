import { Board, Cell, Position } from '@/types/game';

export type DeterministicResult = {
  solved: boolean;
  steps: number;
  ruleHistogram: Record<string, number>;
  board: Board;
};

// Deep copy board cells
function cloneCells(cells: Cell[][]): Cell[][] {
  return cells.map(row => row.map(cell => ({ ...cell })));
}

// Helper to get neighbours including diagonals
function neighbours(row: number, col: number, size: number): Position[] {
  const out: Position[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) out.push({ row: nr, col: nc });
    }
  }
  return out;
}

export function deterministicSolve(inputBoard: Board, starsPerUnit: number): DeterministicResult {
  const size = inputBoard.size;
  const cells = cloneCells(inputBoard.cells);

  // derive regions list
  const regionMap = new Map<number, Position[]>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const id = cells[r][c].regionId;
      if (!regionMap.has(id)) regionMap.set(id, []);
      regionMap.get(id)!.push({ row: r, col: c });
    }
  }
  const regions = Array.from(regionMap.entries()).map(([id, pos]) => ({ id, cells: pos }));

  // counts
  const rowCount = new Array<number>(size).fill(0);
  const colCount = new Array<number>(size).fill(0);
  const regionCount = new Map<number, number>();
  for (const r of regions) regionCount.set(r.id, 0);

  // initialize counts from pre-placed stars
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (cells[r][c].value === 2) {
      rowCount[r]++;
      colCount[c]++;
      regionCount.set(cells[r][c].regionId, (regionCount.get(cells[r][c].regionId) || 0) + 1);
    }
  }

  const ruleHistogram: Record<string, number> = {};
  let changed = true;
  let steps = 0;

  function incRule(name: string) { ruleHistogram[name] = (ruleHistogram[name] || 0) + 1; }

  // Helpers to set cell to star or cross
  function setStar(r: number, c: number) {
    const cur = cells[r][c].value;
    if (cur === 2) return false;
    cells[r][c].value = 2;
    rowCount[r]++;
    colCount[c]++;
    regionCount.set(cells[r][c].regionId, (regionCount.get(cells[r][c].regionId) || 0) + 1);
    return true;
  }
  function setCross(r: number, c: number) {
    const cur = cells[r][c].value;
    if (cur === 1) return false;
    // if it's a star already, shouldn't convert
    if (cur === 2) return false;
    cells[r][c].value = 1;
    return true;
  }

  // main loop
  while (changed) {
    changed = false;

    // Rule A: if row/col/region already has required stars, mark all empties as crosses
    for (let r = 0; r < size; r++) {
      if (rowCount[r] === starsPerUnit) {
        for (let c = 0; c < size; c++) {
          if (cells[r][c].value === 0) {
            if (setCross(r, c)) {
              changed = true; incRule('row_full_cross'); steps++;
            }
          }
        }
      }
    }
    for (let c = 0; c < size; c++) {
      if (colCount[c] === starsPerUnit) {
        for (let r = 0; r < size; r++) {
          if (cells[r][c].value === 0) {
            if (setCross(r, c)) { changed = true; incRule('col_full_cross'); steps++; }
          }
        }
      }
    }
    for (const reg of regions) {
      const rid = reg.id;
      const cnt = regionCount.get(rid) || 0;
      if (cnt === starsPerUnit) {
        for (const p of reg.cells) {
          if (cells[p.row][p.col].value === 0) {
            if (setCross(p.row, p.col)) { changed = true; incRule('region_full_cross'); steps++; }
          }
        }
      }
    }

    // Rule B: if remaining empty candidates equal remaining stars -> mark them stars
    for (let r = 0; r < size; r++) {
      const need = starsPerUnit - rowCount[r];
      if (need > 0) {
        const empties: Position[] = [];
        for (let c = 0; c < size; c++) if (cells[r][c].value === 0) empties.push({ row: r, col: c });
        if (empties.length === need && empties.length > 0) {
          for (const p of empties) {
            if (setStar(p.row, p.col)) { changed = true; incRule('row_fill_star'); steps++; }
          }
        }
      }
    }
    for (let c = 0; c < size; c++) {
      const need = starsPerUnit - colCount[c];
      if (need > 0) {
        const empties: Position[] = [];
        for (let r = 0; r < size; r++) if (cells[r][c].value === 0) empties.push({ row: r, col: c });
        if (empties.length === need && empties.length > 0) {
          for (const p of empties) {
            if (setStar(p.row, p.col)) { changed = true; incRule('col_fill_star'); steps++; }
          }
        }
      }
    }
    for (const reg of regions) {
      const rid = reg.id;
      const cnt = regionCount.get(rid) || 0;
      const need = starsPerUnit - cnt;
      if (need > 0) {
        const empties = reg.cells.filter(p => cells[p.row][p.col].value === 0);
        if (empties.length === need && empties.length > 0) {
          for (const p of empties) {
            if (setStar(p.row, p.col)) { changed = true; incRule('region_fill_star'); steps++; }
          }
        }
      }
    }

    // Rule C: if a cell is star, mark all neighbors as crosses
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      if (cells[r][c].value === 2) {
        const neigh = neighbours(r, c, size);
        for (const n of neigh) {
          if (cells[n.row][n.col].value === 0) {
            if (setCross(n.row, n.col)) { changed = true; incRule('neighbor_cross'); steps++; }
          }
        }
      }
    }

    // Rule D: eliminate candidates that would immediately violate counts or adjacency
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      if (cells[r][c].value !== 0) continue;
      // can't place because neighbor star
      const neigh = neighbours(r, c, size);
      if (neigh.some(n => cells[n.row][n.col].value === 2)) {
        if (setCross(r, c)) { changed = true; incRule('adjacent_block'); steps++; continue; }
      }
      // can't place because would exceed row/col/region
      const rid = cells[r][c].regionId;
      if (rowCount[r] + 1 > starsPerUnit || colCount[c] + 1 > starsPerUnit || (regionCount.get(rid) || 0) + 1 > starsPerUnit) {
        if (setCross(r, c)) { changed = true; incRule('count_exceed_block'); steps++; continue; }
      }

      // Advanced local check: if placing here would make any neighbor's row/col/region impossible
      // e.g., if placing star reduces available candidates elsewhere below needed number
      // We'll perform a conservative check: for each affected line/region, compute empties remaining if we place here
      let makesImpossible = false;
      // simulate
      // row
      const needRow = starsPerUnit - rowCount[r] - 1;
      const emptiesRow = (() => { let e = 0; for (let cc = 0; cc < size; cc++) if (cells[r][cc].value === 0 && !(r === r && cc === c)) e++; return e; })();
      if (needRow > emptiesRow) makesImpossible = true;
      // col
      const needCol = starsPerUnit - colCount[c] - 1;
      const emptiesCol = (() => { let e = 0; for (let rr = 0; rr < size; rr++) if (cells[rr][c].value === 0 && !(rr === r && c === c)) e++; return e; })();
      if (needCol > emptiesCol) makesImpossible = true;
      // region
      const regCells = regions.find(reg => reg.id === rid)!.cells;
      const needReg = starsPerUnit - (regionCount.get(rid) || 0) - 1;
      const emptiesReg = regCells.filter(p => cells[p.row][p.col].value === 0 && !(p.row === r && p.col === c)).length;
      if (needReg > emptiesReg) makesImpossible = true;

      if (makesImpossible) {
        if (setCross(r, c)) { changed = true; incRule('local_impossible'); steps++; continue; }
      }
    }

    // loop end
  }

  const solved = (() => {
    // check row/col/region counts
    for (let r = 0; r < size; r++) if (rowCount[r] !== starsPerUnit) return false;
    for (let c = 0; c < size; c++) if (colCount[c] !== starsPerUnit) return false;
    for (const reg of regions) {
      if ((regionCount.get(reg.id) || 0) !== starsPerUnit) return false;
    }
    // also ensure no empties remaining
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (cells[r][c].value === 0) return false;
    return true;
  })();

  const outBoard: Board = { ...inputBoard, cells };
  return { solved, steps, ruleHistogram, board: outBoard };
}
