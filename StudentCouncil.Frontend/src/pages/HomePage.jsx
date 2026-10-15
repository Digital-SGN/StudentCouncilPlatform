import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb, faRocket, faUsers } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import Bubbles from '../components/Bubbles';
import LeadershipCard from '../components/LeadershipCard';
import '../css/HomePage.css';

const leadershipData = [
  { name: 'Савин Иван', position: 'Председатель', photoUrl: '/images/39186005c70975d20596305f13b1ca3c5beb0b39.jpg', bgColor: '#FFE8D9' },
  { name: 'Кулькова Анна', position: 'Старостат', photoUrl: '/images/d050eeec9bcfe2419e4b0100b921c6cdd58e05db.jpg', bgColor: '#D9E8FF' },
  { name: 'Ананьев Дмитрий', position: 'Цифровое развитие', photoUrl: '/images/256faba4e678509c364feb68f8c98469be792dcc.jpg', bgColor: '#E0FFD9' },
  { name: 'Бирюков Александр', position: 'Медиа отдел', photoUrl: '/images/2196c77377bbe98659f8aa8faf8ab17310d7ea6e.jpg', bgColor: '#FFF2D9' },
  { name: 'Комардин Максим', position: 'Научный отдел', photoUrl: '/images/b356b0ae5c9a9094ef1339edf00d3e5ce671709c.jpg', bgColor: '#F0D9FF' },
  { name: 'Владимир Николаев', position: 'Координаторы', photoUrl: '/images/2c2b1e5ecebc1b06a9fd7e55dbe34cdbae51922a.jpg', bgColor: '#FFD9E5' }
];

export default function HomePage() {
  const { user } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const autoPlayRef = useRef(null);
  const heroRef = useRef(null);

  const total = leadershipData.length;
  const prevIndex = (currentIndex - 1 + total) % total;
  const nextIndex = (currentIndex + 1) % total;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % total);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + total) % total);
  const goToSlide = (index) => setCurrentIndex(index);

  useEffect(() => {
    autoPlayRef.current = setInterval(nextSlide, 5000);
    return () => clearInterval(autoPlayRef.current);
  }, []);

  const pauseAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  };

  const resumeAutoPlay = () => {
    pauseAutoPlay();
    autoPlayRef.current = setInterval(nextSlide, 5000);
  };

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
          <div className="container">
            <h1 className="hero-title">Студенческий совет СГН</h1>
            <p className="hero-subtitle">
              Развиваем студенческую жизнь, организуем мероприятия, поддерживаем инициативы
            </p>
            <div className="hero-cta">
              <a href="#leadership" className="hero-cta-btn">
                Наше руководство
              </a>
            </div>
          </div>
        </div>
        <a href="#about" className="hero-scroll-hint" aria-label="Прокрутить вниз">
          <span className="hero-scroll-dot" />
        </a>
      </section>

      <section className="about-section" id="about">
        <div className="about-blob about-blob-1" aria-hidden="true" />
        <div className="about-blob about-blob-2" aria-hidden="true" />

        <div className="container">
          <div className="about-text">
            <h2>О нас</h2>
            <p>
              Студенческий совет факультета СГН – это место, где рождаются идеи и реализуются проекты. Мы создаём пространство для развития лидерских качеств, организуем мероприятия и поддерживаем инициативы студентов.
            </p>
            <p>
              В студсовете СГН не просто состоят, здесь создают самые яркие воспоминания о студенческой жизни
            </p>

            <div className="about-features">
              <div className="about-feature">
                <span className="about-feature-icon">
                  <FontAwesomeIcon icon={faLightbulb} />
                </span>
                <div className="about-feature-body">
                  <span className="about-feature-title">Идеи</span>
                  <span className="about-feature-text">Свои проекты и инициативы</span>
                </div>
              </div>

              <div className="about-feature">
                <span className="about-feature-icon">
                  <FontAwesomeIcon icon={faRocket} />
                </span>
                <div className="about-feature-body">
                  <span className="about-feature-title">Развитие</span>
                  <span className="about-feature-text">Лидерские и рабочие навыки</span>
                </div>
              </div>

              <div className="about-feature">
                <span className="about-feature-icon">
                  <FontAwesomeIcon icon={faUsers} />
                </span>
                <div className="about-feature-body">
                  <span className="about-feature-title">Команда</span>
                  <span className="about-feature-text">Люди, с которыми интересно</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="leadership-section" id="leadership">
        <div className="leadership-dots" aria-hidden="true" />

        <div className="container">
          <h2>Наше руководство</h2>

          <div
            className="carousel-wrapper"
            onMouseEnter={pauseAutoPlay}
            onMouseLeave={resumeAutoPlay}
          >
            <button className="carousel-btn prev" onClick={prevSlide} aria-label="Предыдущий">‹</button>
            <div className="carousel-container">
              <div key={prevIndex} className="carousel-card side">
                <LeadershipCard {...leadershipData[prevIndex]} />
              </div>
              <div key={currentIndex} className="carousel-card active">
                <LeadershipCard {...leadershipData[currentIndex]} />
              </div>
              <div key={nextIndex} className="carousel-card side">
                <LeadershipCard {...leadershipData[nextIndex]} />
              </div>
            </div>
            <button className="carousel-btn next" onClick={nextSlide} aria-label="Следующий">›</button>
          </div>

          <div className="carousel-indicators">
            {leadershipData.map((_, idx) => (
              <span
                key={idx}
                className={`indicator ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(idx)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}