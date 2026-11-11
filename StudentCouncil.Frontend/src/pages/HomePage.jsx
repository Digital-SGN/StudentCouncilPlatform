import { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowRight, 
  faLightbulb, 
  faRocket, 
  faThumbtack, 
  faStar, 
  faHeart, 
  faCrown
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import '../css/HomePage.css';
import Bubbles from '../components/Bubbles';

const leadershipData = [
  { name: 'Савин Иван', position: 'Председатель', photoUrl: '/images/leaders/39186005c70975d20596305f13b1ca3c5beb0b39.webp', bgColor: '#FFE8D9' },
  { name: 'Кулькова Анна', position: 'Старостат', photoUrl: '/images/leaders/d050eeec9bcfe2419e4b0100b921c6cdd58e05db.webp', bgColor: '#D9E8FF' },
  { name: 'Ананьев Дмитрий', position: 'Цифровое развитие', photoUrl: '/images/leaders/256faba4e678509c364feb68f8c98469be792dcc.webp', bgColor: '#E0FFD9' },
  { name: 'Бирюков Александр', position: 'Медиа отдел', photoUrl: '/images/leaders/2196c77377bbe98659f8aa8faf8ab17310d7ea6e.webp', bgColor: '#FFF2D9' },
  { name: 'Комардин Максим', position: 'Научный отдел', photoUrl: '/images/leaders/b356b0ae5c9a9094ef1339edf00d3e5ce671709c.webp', bgColor: '#F0D9FF' },
  { name: 'Владимир Николаев', position: 'Координаторы', photoUrl: '/images/leaders/2c2b1e5ecebc1b06a9fd7e55dbe34cdbae51922a.webp', bgColor: '#FFD9E5' }
];

const marqueeWords = ['Идеи', 'Развитие', 'Команда', 'События', 'Проекты', 'Инициативы', 'Творчество', 'Дружба'];

function Marquee() {
  const items = [...marqueeWords, ...marqueeWords, ...marqueeWords];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {items.map((w, i) => (
          <span className="marquee-item" key={i}>
            {w}
            <span className="marquee-star">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const heroRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight) {
          hero.style.setProperty('--parallax-y', `${y * 0.35}px`);
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="home-page fade-in">
      <Bubbles />

      <section className="hero-section" ref={heroRef}>
        <div className="hero-parallax-bg" />
        <div className="hero-overlay">
          <div className="container hero-container">
            
            <h1 className="hero-title">
              <span className="hero-line">
                <span className="hero-word" style={{ animationDelay: '0.1s' }}>Создаём</span>
              </span>
              <span className="hero-line">
                <span className="hero-word" style={{ animationDelay: '0.25s' }}>студенческую</span>
              </span>
              <span className="hero-line">
                <span className="hero-word" style={{ animationDelay: '0.4s' }}>
                  <span className="hero-accent">жизнь</span>
                </span>
              </span>
            </h1>
            
            <p className="hero-subtitle">
              Идеи, проекты и команда факультета СГН. Мы делаем студенчество
              ярче — от первых инициатив до больших событий.
            </p>
            
            <div className="hero-cta">
              <a href="#leadership" className="hero-cta-btn">
                Наше руководство
                <FontAwesomeIcon icon={faArrowRight} />
              </a>
            </div>

          </div>
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-blob about-blob-1" aria-hidden="true" />
        <div className="about-blob about-blob-2" aria-hidden="true" />

        <div className="container">
          
          <div className="about-header">
            <img src="/logo.svg" alt="Логотип СГН" className="about-logo" />
            
            <div className="about-title-wrapper">
              <div className="about-flourish left" aria-hidden="true"></div>
              <h2>О нас</h2>
              <div className="about-flourish right" aria-hidden="true"></div>
            </div>
          </div>

          <div className="about-text">
            <p>
              Студенческий совет факультета СГН – это место, где рождаются идеи и реализуются проекты. Мы создаём пространство для развития лидерских качеств, организуем мероприятия и поддерживаем инициативы студентов.
            </p>
            <p>
              В студсовете СГН не просто состоят, здесь создают самые яркие воспоминания о студенческой жизни. Мы всегда открыты новым идеям и рады каждому, кто хочет сделать наш факультет лучше.
            </p>
          </div>
        </div>
        
        <Marquee />
      </section>

      <section className="leadership-section" id="leadership">
        <div className="leadership-section-container">
          <div className="pin-board">
            
            <div className="board-sticker sticker-main">
              <FontAwesomeIcon icon={faCrown} />
              <span>Наше руководство</span>
            </div>

            <div className="board-sticker sticker-1">
              <FontAwesomeIcon icon={faLightbulb} />
              <span>Идеи</span>
            </div>
            <div className="board-sticker sticker-2">
              <FontAwesomeIcon icon={faRocket} />
              <span>Космос</span>
            </div>
            <div className="board-sticker sticker-3">
              <FontAwesomeIcon icon={faThumbtack} />
              <span>Важно!</span>
            </div>
            <div className="board-sticker sticker-4">
              <FontAwesomeIcon icon={faStar} />
              <span>Звезды</span>
            </div>
            <div className="board-sticker sticker-5">
              <FontAwesomeIcon icon={faHeart} />
              <span>СГН</span>
            </div>

            <svg className="board-strings" viewBox="0 0 1200 700" preserveAspectRatio="none">
              <path d="M 200 200 Q 400 250 600 200" stroke="#ef4444" strokeWidth="3" fill="none" opacity="0.7" />
              <path d="M 200 200 Q 150 350 200 500" stroke="#3b82f6" strokeWidth="3" fill="none" opacity="0.7" />
              <path d="M 600 200 Q 650 350 600 500" stroke="#eab308" strokeWidth="3" fill="none" opacity="0.7" />
              <path d="M 1000 200 Q 1050 350 1000 500" stroke="#10b981" strokeWidth="3" fill="none" opacity="0.7" />
              <path d="M 1000 200 Q 800 350 600 500" stroke="#a855f7" strokeWidth="3" fill="none" opacity="0.7" />
            </svg>

            <div className="board-grid">
              {leadershipData.map((person, i) => (
                <div 
                  key={person.name} 
                  className={`team-card pin-card-${i + 1}`}
                  style={{ '--card-bg': person.bgColor }}
                >
                  <div className="push-pin" aria-hidden="true">
                    <div className="pin-shadow"></div>
                  </div>
                  
                  <div className="team-photo-wrapper">
                    <img src={person.photoUrl} alt={person.name} loading="lazy" />
                  </div>
                  <div className="team-info">
                    <h3>{person.name}</h3>
                    <p>{person.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
