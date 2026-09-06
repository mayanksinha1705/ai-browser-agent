'use client';

import { cn } from '@/lib/utils';
import { RESIZE_DIRECTIONS } from '@/hooks/useResizable';

const HANDLE_CONFIG = {
  [RESIZE_DIRECTIONS.NORTH]: {
    className: 'absolute top-0 left-2 right-2 h-1.5 cursor-ns-resize',
    visibleClass: 'bg-gradient-to-r from-transparent via-blue-500/30 to-transparent hover:via-blue-500/60',
  },
  [RESIZE_DIRECTIONS.SOUTH]: {
    className: 'absolute bottom-0 left-2 right-2 h-1.5 cursor-ns-resize',
    visibleClass: 'bg-gradient-to-r from-transparent via-blue-500/30 to-transparent hover:via-blue-500/60',
  },
  [RESIZE_DIRECTIONS.EAST]: {
    className: 'absolute top-2 bottom-2 right-0 w-1.5 cursor-ew-resize',
    visibleClass: 'bg-gradient-to-b from-transparent via-blue-500/30 to-transparent hover:via-blue-500/60',
  },
  [RESIZE_DIRECTIONS.WEST]: {
    className: 'absolute top-2 bottom-2 left-0 w-1.5 cursor-ew-resize',
    visibleClass: 'bg-gradient-to-b from-transparent via-blue-500/30 to-transparent hover:via-blue-500/60',
  },
  [RESIZE_DIRECTIONS.NORTH_EAST]: {
    className: 'absolute top-0 right-0 h-3 w-3 cursor-nesw-resize rounded-bl-lg',
    visibleClass: 'bg-blue-500/40 hover:bg-blue-500/70 border-l border-b border-blue-400/50',
  },
  [RESIZE_DIRECTIONS.NORTH_WEST]: {
    className: 'absolute top-0 left-0 h-3 w-3 cursor-nwse-resize rounded-br-lg',
    visibleClass: 'bg-blue-500/40 hover:bg-blue-500/70 border-r border-b border-blue-400/50',
  },
  [RESIZE_DIRECTIONS.SOUTH_EAST]: {
    className: 'absolute bottom-0 right-0 h-3 w-3 cursor-nwse-resize rounded-tl-lg',
    visibleClass: 'bg-blue-500/40 hover:bg-blue-500/70 border-l border-t border-blue-400/50',
  },
  [RESIZE_DIRECTIONS.SOUTH_WEST]: {
    className: 'absolute bottom-0 left-0 h-3 w-3 cursor-nesw-resize rounded-tr-lg',
    visibleClass: 'bg-blue-500/40 hover:bg-blue-500/70 border-r border-t border-blue-400/50',
  },
};

export function ResizeHandle({ direction, onMouseDown, isResizing }) {
  const config = HANDLE_CONFIG[direction];
  if (!config) return null;

  const isCorner = [RESIZE_DIRECTIONS.NORTH_EAST, RESIZE_DIRECTIONS.NORTH_WEST, RESIZE_DIRECTIONS.SOUTH_EAST, RESIZE_DIRECTIONS.SOUTH_WEST].includes(direction);

  return (
    <div
      className={cn(
        config.className,
        'z-[1000] pointer-events-auto transition-colors duration-150',
        config.visibleClass,
        isResizing && 'bg-blue-500/70 via-blue-500/80',
        isCorner && 'transition-transform duration-150 hover:scale-110'
      )}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onMouseDown) onMouseDown(e, direction);
      }}
      style={{ touchAction: 'none' }}
    />
  );
}

export function ResizeHandles({ onResizeStart, isResizing }) {
  const directions = Object.values(RESIZE_DIRECTIONS);

  return (
    <>
      {directions.map((dir) => (
        <ResizeHandle
          key={dir}
          direction={dir}
          onMouseDown={onResizeStart}
          isResizing={isResizing}
        />
      ))}
    </>
  );
}
