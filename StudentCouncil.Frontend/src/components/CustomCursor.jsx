import { useEffect, useRef, useState } from 'react';
export default function CustomCursor() {
  const cursorRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    setIsDesktop(hasFinePointer);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    const moveCursor = (e) => {
      requestAnimationFrame(() => {
        cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      });
    };

    const handleMouseDown = () => cursor.classList.add('clicking');
    const handleMouseUp = () => cursor.classList.remove('clicking');

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDesktop]);

  if (!isDesktop) return null;

  return (
    <div className="custom-cursor" ref={cursorRef}>
      <img src='/cursor.png' alt="cursor" />
    </div>
  );
}