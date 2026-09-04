import { useState, useCallback, useRef, useEffect } from 'react';
import { WINDOW_SIZE } from '@/lib/constants';

const STORAGE_KEY = 'paroksh-window-size';

export const RESIZE_DIRECTIONS = {
  NORTH: 'n',
  SOUTH: 's',
  EAST: 'e',
  WEST: 'w',
  NORTH_EAST: 'ne',
  NORTH_WEST: 'nw',
  SOUTH_EAST: 'se',
  SOUTH_WEST: 'sw',
};

export function useResizable(initialSize = null) {
  const [size, setSize] = useState(() => {
    if (typeof window !== 'undefined' && !initialSize) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            width: Math.max(WINDOW_SIZE.MIN.W, Math.min(WINDOW_SIZE.MAX.W, parsed.width || WINDOW_SIZE.DEFAULT.W)),
            height: Math.max(WINDOW_SIZE.MIN.H, Math.min(WINDOW_SIZE.MAX.H, parsed.height || WINDOW_SIZE.DEFAULT.H)),
          };
        }
      } catch (e) {
        console.error('Error reading window size:', e);
      }
    }
    return initialSize || { width: WINDOW_SIZE.DEFAULT.W, height: WINDOW_SIZE.DEFAULT.H };
  });

  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [positionAdjust, setPositionAdjust] = useState({ x: 0, y: 0 });

  const startSizeRef = useRef({ width: 0, height: 0 });
  const startCursorRef = useRef({ x: 0, y: 0 });

  const startResize = useCallback((e, direction) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    startSizeRef.current = { width: size.width, height: size.height };
    startCursorRef.current = { x: e.clientX, y: e.clientY };

    setResizeDirection(direction);
    setIsResizing(true);
  }, [size]);

  const stopResize = useCallback(() => {
    setIsResizing(false);
    setResizeDirection(null);
  }, []);

  useEffect(() => {
    if (!isResizing) {
      setPositionAdjust({ x: 0, y: 0 });
      return;
    }

    const handleMouseMove = (e) => {
      const dx = e.clientX - startCursorRef.current.x;
      const dy = e.clientY - startCursorRef.current.y;

      const startW = startSizeRef.current.width;
      const startH = startSizeRef.current.height;

      let newWidth = startW;
      let newHeight = startH;
      let adjX = 0;
      let adjY = 0;

      const minW = WINDOW_SIZE.MIN.W;
      const minH = WINDOW_SIZE.MIN.H;
      const maxW = WINDOW_SIZE.MAX.W;
      const maxH = WINDOW_SIZE.MAX.H;

      if (resizeDirection.includes('e')) {
        newWidth = Math.max(minW, Math.min(maxW, startW + dx));
      } else if (resizeDirection.includes('w')) {
        newWidth = Math.max(minW, Math.min(maxW, startW - dx));
        adjX = startW - newWidth;
      }

      if (resizeDirection.includes('s')) {
        newHeight = Math.max(minH, Math.min(maxH, startH + dy));
      } else if (resizeDirection.includes('n')) {
        newHeight = Math.max(minH, Math.min(maxH, startH - dy));
        adjY = startH - newHeight;
      }

      setSize({ width: newWidth, height: newHeight });
      setPositionAdjust({ x: adjX, y: adjY });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection]);

  // Persist size to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(size));
    } catch (e) {
      console.error('Error saving window size:', e);
    }
  }, [size]);

  return {
    size,
    setSize,
    isResizing,
    resizeDirection,
    startResize,
    stopResize,
    positionAdjust,
  };
}
