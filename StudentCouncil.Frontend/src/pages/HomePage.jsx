import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.svg';
import Bubbles from '../components/Bubbles'; 
import LeadershipCard from '../components/LeadershipCard';
import '../css/HomePage.css'; 

const leadershipData = [
  { name: 'Савин Иван', position: 'Председатель', photoUrl: 'src/assets/images/39186005c70975d20596305f13b1ca3c5beb0b39.jpg', bgColor: '#FFE8D9', rotateAngle: -2 },
  { name: 'Кулькова Анна', position: 'Старостат', photoUrl: 'src/assets/images/d050eeec9bcfe2419e4b0100b921c6cdd58e05db.jpg', bgColor: '#D9E8FF', rotateAngle: 1.5 },
  { name: 'Ананьев Дмитрий', position: 'Цифровое развитие', photoUrl: 'src/assets/images/256faba4e678509c364feb68f8c98469be792dcc.jpg', bgColor: '#E0FFD9', rotateAngle: -1 },
  { name: 'Бирюков Александр', position: 'Медиа отдел', photoUrl: 'src/assets/images/2196c77377bbe98659f8aa8faf8ab17310d7ea6e.jpg', bgColor: '#FFF2D9', rotateAngle: 2 },
  { name: 'Комардин Максим', position: 'Научный отдел', photoUrl: 'src/assets/images/b356b0ae5c9a9094ef1339edf00d3e5ce671709c.jpg', bgColor: '#F0D9FF', rotateAngle: -1.5 },
  { name: 'Владимир Николаев', position: 'Координаторы', photoUrl: 'src/assets/images/2c2b1e5ecebc1b06a9fd7e55dbe34cdbae51922a.jpg', bgColor: '#FFD9E5', rotateAngle: 1 }
];

export default function HomePage() {
  const { user } = useAuth();
  const heroRef = useRef(null);
  const aboutRef = useRef(null);
  const leadershipRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.2 }
    );

    if (heroRef.current) observer.observe(heroRef.current);
    if (aboutRef.current) observer.observe(aboutRef.current);
    if (leadershipRef.current) observer.observe(leadershipRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-page">
      <Bubbles />
      <section className="hero-section" ref={heroRef}>
        <div className="hero-overlay">
          <div className="container">
            <h1>Студенческий совет СГН</h1>
            <p className="hero-subtitle">
              Развиваем студенческую жизнь, организуем мероприятия, поддерживаем инициативы
            </p>
          </div>
        </div>
      </section>

      <section className="about-section" ref={aboutRef}>
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

      <section className="leadership-section" ref={leadershipRef}>
      <div className="container">
        <div className="leadership-header">
          <div className="oval-bg"></div>
          <h2>Наше руководство</h2>
        </div>
        <div className="leadership-grid">
          {leadershipData.map((member, idx) => (
            <LeadershipCard key={idx} {...member} />
          ))}
        </div>
      </div>
    </section>
    </div>
  );
}