import { Cell, CellValue } from '@/types/game';

interface Props {
  cell: Cell;
  onMouseDown: () => void;
  onMouseEnter: () => void;
  rightNeighborRegionId?: number;
  bottomNeighborRegionId?: number;
}

export default function GameCell({
  cell,
  onMouseDown,
  onMouseEnter,
  rightNeighborRegionId,
  bottomNeighborRegionId,
}: Props) {
  const getCellContent = (value: CellValue) => {
    switch (value) {
      case 0: return null;
      case 1: return '✕';
      case 2: return '★';
    }
  };

  const getContentColor = (value: CellValue) => {
    switch (value) {
      case 0: return '';
      case 1: return 'text-gray-400';
      case 2: return 'text-yellow-400';
    }
  };

  const rightBorder =
    rightNeighborRegionId !== undefined &&
    rightNeighborRegionId !== cell.regionId
      ? 'border-r-2 border-r-black'
      : 'border-r border-r-gray-300';

  const bottomBorder =
    bottomNeighborRegionId !== undefined &&
    bottomNeighborRegionId !== cell.regionId
      ? 'border-b-2 border-b-black'
      : 'border-b border-b-gray-300';

  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown();
      }}
      onMouseEnter={onMouseEnter}
      className={`w-12 h-12 flex items-center justify-center text-xl font-bold
        hover:bg-gray-100 transition-colors cursor-pointer box-border
        border-l border-t border-gray-300
        ${rightBorder} ${bottomBorder}
        ${getContentColor(cell.value)}`}
    >
      {getCellContent(cell.value)}
    </button>
  );
}
