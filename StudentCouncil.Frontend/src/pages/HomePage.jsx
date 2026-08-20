import { useState, useEffect, useRef } from 'react';
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

  const total = leadershipData.length;
  const prevIndex = (currentIndex - 1 + total) % total;
  const nextIndex = (currentIndex + 1) % total;

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  useEffect(() => {
    autoPlayRef.current = setInterval(nextSlide, 5000);
    return () => clearInterval(autoPlayRef.current);
  }, []);

  const pauseAutoPlay = () => clearInterval(autoPlayRef.current);
  const resumeAutoPlay = () => {
    autoPlayRef.current = setInterval(nextSlide, 5000);
  };

  return (
    <div className="home-page fade-in">
      <Bubbles />
      <section className="hero-section">
        <div className="hero-overlay">
          <div className="container">
            <h1>Студенческий совет СГН</h1>
            <p className="hero-subtitle">
              Развиваем студенческую жизнь, организуем мероприятия, поддерживаем инициативы
            </p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <div className="about-grid">
            <div className="about-text">
              <h2>О нас</h2>
              <p>
                Студенческий совет факультета СГН объединяет активных и неравнодушных ребят, которым интересно делать студенческую жизнь ярче. Здесь помогают первокурсникам освоиться, поддерживают в учёбе и просто создают пространство, где можно найти друзей и заняться тем, что действительно нравится. Ребята организуют мастер-классы, развлекательные и образовательные мероприятия. Но главное – рядом всегда есть те, кто поймёт и подставит плечо
              </p>
              <p>
                В студсовете СГН не просто состоят, здесь создают самые яркие воспоминания о студенческой жизни
              </p>
            </div>
          </div>
          <div className="about-stats">
            <div className="stat-item">
              <span className="stat-number">10+</span>
              <span className="stat-label">Мероприятий в год</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Активных участников</span>
            </div>
          </div>
        </div>
      </section>

      <section className="leadership-section">
        <div className="container">
          <h2>Наше руководство</h2>
          <div 
            className="carousel-wrapper"
            onMouseEnter={pauseAutoPlay}
            onMouseLeave={resumeAutoPlay}
          >
            <button className="carousel-btn prev" onClick={prevSlide}>‹</button>
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
            <button className="carousel-btn next" onClick={nextSlide}>›</button>
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