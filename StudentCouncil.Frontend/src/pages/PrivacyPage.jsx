import { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import Bubbles from '../components/Bubbles';
import '../css/HelpPage.css'; 

export default function PrivacyPage() {
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
        <div className="help-construction-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 12px 28px rgba(59, 130, 246, 0.35)' }}>
          <FontAwesomeIcon icon={faShieldHalved} />
        </div>
        
        <h1 className="help-construction-title">Политика конфиденциальности</h1>
        
        <p className="help-construction-text">
          Мы готовим этот раздел. Скоро здесь появится подробная информация о том, 
          как мы собираем, используем и защищаем ваши данные.
        </p>
        
        <div className="help-construction-progress">
          <div className="help-construction-bar" style={{ background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)' }} />
        </div>
        
        <span className="help-construction-hint">Скоро…</span>
      </div>
    </div>
  );
}