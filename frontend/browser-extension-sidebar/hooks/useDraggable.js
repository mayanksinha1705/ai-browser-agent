import { useState, useCallback, useRef, useEffect } from 'react';

const STORAGE_KEY = 'paroksh-window-position';
const DEFAULT_POSITION = { x: 32, y: 32 };

export function useDraggable(initialPosition = null) {
  const [position, setPosition] = useState(() => {
    if (typeof window !== 'undefined' && !initialPosition) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Error reading window position:', e);
      }
    }
    return initialPosition || DEFAULT_POSITION;
  });
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startClientRef = useRef({ x: 0, y: 0 });

  const startDrag = useCallback((e, dragHandleRef) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    startPosRef.current = { x: position.x, y: position.y };
    startClientRef.current = { x: e.clientX, y: e.clientY };

    setIsDragging(true);
  }, [position]);

  const stopDrag = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startClientRef.current.x;
      const deltaY = e.clientY - startClientRef.current.y;

      const newX = startPosRef.current.x + deltaX;
      const newY = startPosRef.current.y + deltaY;

      // Keep within viewport bounds
      const maxX = window.innerWidth - 240;
      const maxY = window.innerHeight - 200;
      const clampedX = Math.max(16, Math.min(newX, maxX));
      const clampedY = Math.max(16, Math.min(newY, maxY));

      setPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Persist position to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    } catch (e) {
      console.error('Error saving window position:', e);
    }
  }, [position]);

  return {
    position,
    setPosition,
    isDragging,
    startDrag,
    stopDrag,
  };
}
