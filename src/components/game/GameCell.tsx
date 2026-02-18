import { Cell, CellValue } from '@/types/game';

interface Props {
    cell: Cell;
    onMouseDown: () => void;
    onMouseEnter: () => void;
    rightNeighborRegionId?: number;
    bottomNeighborRegionId?: number;
    leftNeighborRegionId?: number;
    topNeighborRegionId?: number;
    isWrong?: boolean;
}

export default function GameCell({
    cell,
    onMouseDown,
    onMouseEnter,
    rightNeighborRegionId,
    bottomNeighborRegionId,
    leftNeighborRegionId,
    topNeighborRegionId,
    isWrong,
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

    const borderTop    = topNeighborRegionId    !== undefined && topNeighborRegionId    !== cell.regionId ? '2px solid black' : '1px solid #d1d5db';
    const borderBottom = bottomNeighborRegionId !== undefined && bottomNeighborRegionId !== cell.regionId ? '2px solid black' : '1px solid #d1d5db';
    const borderLeft   = leftNeighborRegionId   !== undefined && leftNeighborRegionId   !== cell.regionId ? '2px solid black' : '1px solid #d1d5db';
    const borderRight  = rightNeighborRegionId  !== undefined && rightNeighborRegionId  !== cell.regionId ? '2px solid black' : '1px solid #d1d5db';

    return (
        <button
            onMouseDown={(e) => {
                e.preventDefault();
                onMouseDown();
            }}
            onMouseEnter={onMouseEnter}
            className={[
                'w-12 h-12 flex items-center justify-center text-xl font-bold',
                'hover:bg-gray-100 transition-colors cursor-pointer',
                isWrong ? 'bg-red-400' : '',
                getContentColor(cell.value),
            ].join(' ')}
            style={{
                boxSizing: 'border-box',
                borderTop,
                borderBottom,
                borderLeft,
                borderRight,
                // Inline background for debugging/visibility. This will override Tailwind
                // classes and show a red background when `isWrong` is true. If you
                // see the red background after clicking "Check Solution", the prop
                // is being passed correctly.
                backgroundColor: isWrong ? '#f87171' : undefined,
            }}
        >
            {getCellContent(cell.value)}
        </button>
    );
}
