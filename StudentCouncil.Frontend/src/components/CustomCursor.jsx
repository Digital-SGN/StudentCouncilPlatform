import { useEffect, useRef, useState } from 'react';
import '../css/CustomCursor.css';

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
    <div 
      className="custom-cursor" 
      ref={cursorRef}
      // ЖЕСТКО ЗАДАЕМ РАЗМЕР ЗДЕСЬ, CSS больше не сможет это сломать
      style={{ width: '40px', height: '40px', position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 99999 }}
    >
      <img 
        src='/cursor.png' 
        alt="cursor" 
        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
      />
    </div>
  );
}