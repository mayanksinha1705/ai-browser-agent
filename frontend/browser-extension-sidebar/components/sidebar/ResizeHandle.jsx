'use client';

import { cn } from '@/lib/utils';
import { RESIZE_DIRECTIONS } from '@/hooks/useResizable';

const HANDLE_CONFIG = {
  [RESIZE_DIRECTIONS.NORTH]: {
    className: 'absolute top-0 left-0 w-full h-2 cursor-ns-resize',
  },
  [RESIZE_DIRECTIONS.SOUTH]: {
    className: 'absolute bottom-0 left-0 w-full h-2 cursor-ns-resize',
  },
  [RESIZE_DIRECTIONS.EAST]: {
    className: 'absolute top-0 right-0 h-full w-2 cursor-ew-resize',
  },
  [RESIZE_DIRECTIONS.WEST]: {
    className: 'absolute top-0 left-0 h-full w-2 cursor-ew-resize',
  },
  [RESIZE_DIRECTIONS.NORTH_EAST]: {
    className: 'absolute top-0 right-0 h-4 w-4 cursor-nesw-resize',
  },
  [RESIZE_DIRECTIONS.NORTH_WEST]: {
    className: 'absolute top-0 left-0 h-4 w-4 cursor-nwse-resize',
  },
  [RESIZE_DIRECTIONS.SOUTH_EAST]: {
    className: 'absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize',
  },
  [RESIZE_DIRECTIONS.SOUTH_WEST]: {
    className: 'absolute bottom-0 left-0 h-4 w-4 cursor-nesw-resize',
  },
};

export function ResizeHandle({ direction, onMouseDown, isResizing }) {
  const config = HANDLE_CONFIG[direction];
  if (!config) return null;

  return (
    <div
      className={cn(
        config.className,
        'z-[1000] pointer-events-auto',
        isResizing && 'bg-primary/40'
      )}
      onMouseDown={(e) => {
        e.preventDefault();
        if (onMouseDown) onMouseDown(e, direction);
      }}
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
