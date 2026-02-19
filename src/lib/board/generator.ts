import * as Logic from 'logic-solver';
import { Board, Position, Cell } from '@/types/game';
import { PUZZLE_1 } from '@/data/puzzles';
import { deterministicSolve } from '@/lib/board/logicSolver';

const varName = (r: number, c: number) => `cell_${r}_${c}`;

function buildBoardFromRegionMap(regionMap: number[][]): Board {
    console.log('Building board from region map:', regionMap);
    const size = regionMap.length;
    const cells: Cell[][] = [];
    for (let r = 0; r < size; r++) {
        cells[r] = [];
        for (let c = 0; c < size; c++) {
        cells[r][c] = { row: r, col: c, value: 0, regionId: regionMap[r][c] };
        }
    }
    // Build regions array from map
    const map = new Map<number, Position[]>();
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
        const id = regionMap[r][c];
        if (!map.has(id)) map.set(id, []);
        map.get(id)!.push({ row: r, col: c });
        }
    }
    const regions = Array.from(map.entries()).map(([id, pos]) => ({ id, cells: pos }));
    return { cells, regions, size };
    }

    function buildSolverForBoard(board: Board, starsPerUnit = 2): any {
    const { size, cells, regions } = board;
    const solver = new Logic.Solver();

    // exactly N helper
    const assertExactlyN = (n: number, vars: string[]) => {
        solver.require(Logic.equalBits(Logic.sum(vars), Logic.constantBits(n)));
    };

    // rows
    for (let r = 0; r < size; r++) {
        const vars = Array.from({ length: size }, (_, c) => varName(r, c));
        assertExactlyN(starsPerUnit, vars);
    }

    // cols
    for (let c = 0; c < size; c++) {
        const vars = Array.from({ length: size }, (_, r) => varName(r, c));
        assertExactlyN(starsPerUnit, vars);
    }

    // regions
    const regList = regions && regions.length ? regions : (() => {
        const m = new Map<number, Position[]>();
        for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
        const id = cells[r][c].regionId;
        if (!m.has(id)) m.set(id, []);
        m.get(id)!.push({ row: r, col: c });
        }
        return Array.from(m.entries()).map(([id, pos]) => ({ id, cells: pos }));
    })();

    for (const region of regList) {
        const vars = region.cells.map(({ row, col }) => varName(row, col));
        assertExactlyN(starsPerUnit, vars);
    }

    // adjacency at most one
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

    return solver;
    }

    export function solveWithSolver(board: Board, starsPerUnit = 2): Position[] | null {
    const solver = buildSolverForBoard(board, starsPerUnit);
    // no clues added here: pre-placed stars/crosses not considered
    const sol = solver.solve();
    if (!sol) return null;
    const stars: Position[] = [];
    for (let r = 0; r < board.size; r++) for (let c = 0; c < board.size; c++) {
        if (sol.evaluate(varName(r, c))) stars.push({ row: r, col: c });
    }
    return stars;
    }

    // Main generator: given a regionMap (or default), produce a Board with clues such that
    // the puzzle has a unique solution. The generator will place clues (stars or crosses)
    // derived from a chosen root solution until uniqueness is achieved.
    export function generateUniquePuzzle(
        regionMap?: number[][],
        starsPerUnit = 2,
        maxIterations = 200,
        size = 10,
        difficultyTarget: 'easy' | 'medium' | 'hard' | 'any' = 'any'
    ): { board: Board; emptyBoard: Board; solution: number[][] } | null {
        const map = regionMap ?? generateRandomRegionMap(size);
        const baseBoard = buildBoardFromRegionMap(map);

    // Get an initial solution for the region map
    const initialSolver = buildSolverForBoard(baseBoard, starsPerUnit);
    let sol = initialSolver.solve();
    if (!sol) return null;

    const solutionPositions: Position[] = [];
    for (let r = 0; r < baseBoard.size; r++) for (let c = 0; c < baseBoard.size; c++) {
        if (sol.evaluate(varName(r, c))) solutionPositions.push({ row: r, col: c });
    }

        // Build solution grid (0/1)
    const solutionGrid: number[][] = Array.from({ length: baseBoard.size }, () => Array(baseBoard.size).fill(0));
    for (const p of solutionPositions) solutionGrid[p.row][p.col] = 1;

        // helper to build an "empty" board (same regions, all values cleared)
        const makeEmptyBoard = (b: Board): Board => ({
            ...b,
            cells: b.cells.map(row => row.map(cell => ({ ...cell, value: 0 })))
        });

    // Keep track of clues (0 empty, 1 cross, 2 star) starting empty
    const clues = baseBoard.cells.map(row => row.map(cell => ({ ...cell, value: 0 } as Cell)));

    // Helper to check uniqueness: returns null if unique, otherwise returns another solution
    const findAlternative = () => {
        const solver = buildSolverForBoard(baseBoard, starsPerUnit);
        // apply clues as unit constraints
        for (let r = 0; r < baseBoard.size; r++) for (let c = 0; c < baseBoard.size; c++) {
        const val = clues[r][c].value;
        if (val === 2) solver.require(varName(r, c));
        if (val === 1) solver.require(Logic.not(varName(r, c)));
        }
        // forbid the root solution
        const assignTerms: any[] = [];
        for (let r = 0; r < baseBoard.size; r++) for (let c = 0; c < baseBoard.size; c++) {
        const isStar = solutionPositions.some(p => p.row === r && p.col === c);
        assignTerms.push(isStar ? varName(r, c) : Logic.not(varName(r, c)));
        }
        solver.require(Logic.not(Logic.and(assignTerms)));

        const alt = solver.solve();
        if (!alt) return null;
        const altPositions: Position[] = [];
        for (let r = 0; r < baseBoard.size; r++) for (let c = 0; c < baseBoard.size; c++) {
        if (alt.evaluate(varName(r, c))) altPositions.push({ row: r, col: c });
        }
        return altPositions;
    };

    // Iteratively add clues until unique AND deterministically solvable or reach maxIterations
    for (let iter = 0; iter < maxIterations; iter++) {
        const alt = findAlternative();
        if (!alt) {
        // unique — check deterministic solvability
        const candidateBoard: Board = { ...baseBoard, cells: clues };
        const det = deterministicSolve(candidateBoard, starsPerUnit);
        if (det.solved) {
            // classify difficulty
            const steps = det.steps;
            const rules = Object.keys(det.ruleHistogram);
            const classify = (stepsNum: number, rulesUsed: string[]): 'easy'|'medium'|'hard' => {
            if (stepsNum < 40 && !rulesUsed.some(r => r === 'local_impossible' || r === 'count_exceed_block')) return 'easy';
            if (stepsNum < 200) return 'medium';
            return 'hard';
            };
            const found = classify(steps, rules);
            if (difficultyTarget === 'any' || found === difficultyTarget) {
            return { board: candidateBoard, emptyBoard: makeEmptyBoard(candidateBoard), solution: solutionGrid };
            }
            // otherwise, try to add extra clues from the true solution to lower ambiguity / increase logic chain
        }
        // not deterministically solved — add another clue from the true solution and continue
        }

    if (!alt) continue;
    // find differing positions between solutionPositions and alt
        const diff: Position[] = [];
        for (let r = 0; r < baseBoard.size; r++) for (let c = 0; c < baseBoard.size; c++) {
        const inS = solutionPositions.some(p => p.row === r && p.col === c);
        const inA = alt.some(p => p.row === r && p.col === c);
        if (inS !== inA) diff.push({ row: r, col: c });
        }

        if (diff.length === 0) {
        // unexpected: alternative equals solution
        continue;
        }

        // pick a random differing cell and add a clue equal to the true solution value
        const pick = diff[Math.floor(Math.random() * diff.length)];
        const isStar = solutionPositions.some(p => p.row === pick.row && p.col === pick.col);
        clues[pick.row][pick.col].value = isStar ? 2 : 1;
    }

    // if we exit loop without returning, try to force deterministic solvability by adding more true-solution clues
    for (let extra = 0; extra < maxIterations; extra++) {
        // find an empty cell and set to true solution value
        const empties: Position[] = [];
        for (let r = 0; r < baseBoard.size; r++) for (let c = 0; c < baseBoard.size; c++) if (clues[r][c].value === 0) empties.push({ row: r, col: c });
        if (empties.length === 0) break;
        const pick = empties[Math.floor(Math.random() * empties.length)];
        const isStar = solutionPositions.some(p => p.row === pick.row && p.col === pick.col);
        clues[pick.row][pick.col].value = isStar ? 2 : 1;
        const candidateBoard: Board = { ...baseBoard, cells: clues };
        const det = deterministicSolve(candidateBoard, starsPerUnit);
        if (det.solved) {
        const steps = det.steps;
        const rules = Object.keys(det.ruleHistogram);
        const classify = (stepsNum: number, rulesUsed: string[]): 'easy'|'medium'|'hard' => {
            if (stepsNum < 40 && !rulesUsed.some(r => r === 'local_impossible' || r === 'count_exceed_block')) return 'easy';
            if (stepsNum < 200) return 'medium';
            return 'hard';
        };
        const found = classify(steps, rules);
    if (difficultyTarget === 'any' || found === difficultyTarget) return { board: { ...baseBoard, cells: clues }, emptyBoard: makeEmptyBoard({ ...baseBoard, cells: clues }), solution: solutionGrid };
        }
    }

    // failed to converge to a deterministic puzzle with desired difficulty
    return null;
}

// Generate a random contiguous region map for a given size.
// Each region will have size between minRegionSize and maxRegionSize (best-effort).
export function generateRandomRegionMap(size: number): number[][] {
    const numRegions = size;

    const neighbors = (r: number, c: number): [number, number][] => {
        const out: [number, number][] = [];
        if (r > 0) out.push([r - 1, c]);
        if (r < size - 1) out.push([r + 1, c]);
        if (c > 0) out.push([r, c - 1]);
        if (c < size - 1) out.push([r, c + 1]);
        return out;
    };

    const map: number[][] = Array.from({ length: size }, () => Array<number>(size).fill(-1));

    // Shuffle all cells and use first numRegions as seeds
    const allCells: [number, number][] = [];
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) allCells.push([r, c]);
    for (let i = allCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
    }

    const regionSizes = Array<number>(numRegions).fill(0);
    const frontiers: [number, number][][] = [];
    for (let id = 0; id < numRegions; id++) {
        const [r, c] = allCells[id];
        map[r][c] = id;
        regionSizes[id]++;
        frontiers.push([[r, c]]);
    }

    const unassigned = new Set<string>(allCells.slice(numRegions).map(([r, c]) => `${r},${c}`));

    while (unassigned.size > 0) {
        // Expand smallest regions first for balance
        const order = Array.from({ length: numRegions }, (_, i) => i)
        .sort((a, b) => regionSizes[a] - regionSizes[b]);

        let anyExpanded = false;
        for (const id of order) {
        const frontier = frontiers[id];
        if (frontier.length === 0) continue;
        let tries = Math.min(frontier.length, 5);
        while (tries-- > 0) {
            const idx = Math.floor(Math.random() * frontier.length);
            const [r, c] = frontier[idx];
            const neigh = neighbors(r, c).filter(([nr, nc]) => map[nr][nc] === -1);
            if (neigh.length === 0) { frontier.splice(idx, 1); continue; }
            const [nr, nc] = neigh[Math.floor(Math.random() * neigh.length)];
            map[nr][nc] = id;
            unassigned.delete(`${nr},${nc}`);
            regionSizes[id]++;
            frontier.push([nr, nc]);
            anyExpanded = true;
            break;
        }
        }

        if (!anyExpanded) {
        // Fallback: assign orphaned cell to an adjacent region
        for (const key of unassigned) {
            const [r, c] = key.split(',').map(Number);
            const neigh = neighbors(r, c).filter(([nr, nc]) => map[nr][nc] !== -1);
            if (neigh.length > 0) {
            const [nr, nc] = neigh[0];
            map[r][c] = map[nr][nc];
            regionSizes[map[nr][nc]]++;
            unassigned.delete(key);
            break;
            }
        }
        }
    }

    return map;
}
