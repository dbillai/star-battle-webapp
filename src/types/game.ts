export type CellValue = 0 | 1 | 2; // 0 = empty, 1 = crossed out, 2 = starred

export type Solution = number[][];

export interface Position {
  row: number;
  col: number;
}

export interface Cell extends Position {
  value: CellValue;
  regionId: number;
}

export interface Region {
  id: number;
  cells: Position[];
}

export interface Board {
  cells: Cell[][];
  regions: Region[];
  size: number;
}

