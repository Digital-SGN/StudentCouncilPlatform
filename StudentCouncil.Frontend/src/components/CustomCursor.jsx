import { useEffect, useRef } from 'react';
import cursorImg from '../assets/cursor.png';
import '../css/CustomCursor.css';

export default function CustomCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
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
  }, []);

  return (
    <div className="custom-cursor" ref={cursorRef}>
      <img src={cursorImg} alt="cursor" />
    </div>
  );
}