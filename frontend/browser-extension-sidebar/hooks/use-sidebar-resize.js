import { useState, useCallback, useRef, useEffect } from 'react';
import { SIDEBAR_WIDTH } from '@/lib/constants';

export function useSidebarResize(initialWidth = SIDEBAR_WIDTH.DEFAULT) {
  const [width, setWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(initialWidth);

  const startResize = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  }, [width]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const deltaX = startXRef.current - e.clientX; // Inverted because we're resizing from the left
      const newWidth = Math.min(
        Math.max(startWidthRef.current + deltaX, SIDEBAR_WIDTH.MIN),
        SIDEBAR_WIDTH.MAX
      );
      setWidth(newWidth);
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

  return {
    width,
    setWidth,
    isDragging,
    startResize,
  };
}
