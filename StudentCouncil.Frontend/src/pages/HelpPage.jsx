import { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTools } from '@fortawesome/free-solid-svg-icons';
import Bubbles from '../components/Bubbles';
import '../css/HelpPage.css';

export default function HelpPage() {
  const pageRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1 }
    );
    if (pageRef.current) observer.observe(pageRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="help-page" ref={pageRef}>
      <Bubbles />
      <div className="help-construction">
        <div className="help-construction-icon">
          <FontAwesomeIcon icon={faTools} />
        </div>
        <h1 className="help-construction-title">Страница в разработке</h1>
        <div className="help-construction-note">
          А пока — если у вас есть вопрос или нашли ошибку, напишите нам:{' '}
          <a href="https://t.me/skebob_gg" target="_blank" rel="noopener noreferrer">
            @skebob_gg
          </a>
        </div>
        <div className="help-construction-progress">
          <div className="help-construction-bar" />
        </div>
        <span className="help-construction-hint">Скоро…</span>
      </div>
    </div>
  );
}