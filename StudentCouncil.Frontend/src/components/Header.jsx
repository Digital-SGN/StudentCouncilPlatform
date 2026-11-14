import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHome, faFish, faUser, faUsers, 
    faCalendarAlt, faChartLine, faSignOutAlt, 
    faQuestionCircle, faSignInAlt 
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import MusicButton from './MusicButton';

export default function Header({ onLogout }) { 
    const { user, loading } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const meowAudioRef = useRef(null);

    useEffect(() => {
        meowAudioRef.current = new Audio('/music/meow.mp3');
    }, []);

    if (loading) return null; 

    const closeMenu = () => setIsMenuOpen(false);

    const playMeow = () => {
        if (meowAudioRef.current) {
            meowAudioRef.current.currentTime = 0;
            meowAudioRef.current.play().catch(e => console.error("Ошибка воспроизведения:", e));
        }
    };

    return (
        <header className="custom-header">
            <div className="header-container">
                <Link className="header-brand" to="/" onClick={closeMenu}>
                    Студсовет СГН
                </Link>

                <button 
                    className={`header-toggler ${isMenuOpen ? 'open' : ''}`}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Открыть меню"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <div className={`header-collapse ${isMenuOpen ? 'show' : ''}`}>
                    <ul className="header-nav">
                        {user && (
                            <li className="nav-item">
                                <span className="nav-text">
                                    <img src="/cat.gif" alt="кот" onClick={playMeow} className="cat-in-header" />
                                    Привет, {user.firstName || 'участник'}!
                                </span>
                            </li>
                        )}

                        <li className="nav-item">
                            <Link className="nav-link" to="/" onClick={closeMenu}>
                                <FontAwesomeIcon icon={faHome} /> <span>Главная</span>
                            </Link>
                        </li>

                        <li className="nav-item">
                            <Link className="nav-link" to="/fishing" onClick={closeMenu}>
                                <FontAwesomeIcon icon={faFish} /> <span>Рыбалка</span>
                            </Link>
                        </li>

                        {user && (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to={`/users/${user.id}`} onClick={closeMenu}>
                                        <FontAwesomeIcon icon={faUser} /> <span>Мой профиль</span>
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/users" onClick={closeMenu}>
                                        <FontAwesomeIcon icon={faUsers} /> <span>Участники</span>
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/events" onClick={closeMenu}>
                                        <FontAwesomeIcon icon={faCalendarAlt} /> <span>Мероприятия</span>
                                    </Link>
                                </li>

                                {(user.role === "Admin" || user.role === "Leader") && (
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/analytics" onClick={closeMenu}>
                                            <FontAwesomeIcon icon={faChartLine} /> <span>Аналитика</span>
                                        </Link>
                                    </li>
                                )}

                                <li className="nav-item">
                                    <button className="nav-link logout-btn" onClick={() => { closeMenu(); onLogout(); }}>
                                        <FontAwesomeIcon icon={faSignOutAlt} /> <span>Выйти</span>
                                    </button>
                                </li>
                            </>
                        )}

                        {!user && (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/help" onClick={closeMenu}>
                                        <FontAwesomeIcon icon={faQuestionCircle} /> <span>Помощь</span>
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/login" onClick={closeMenu}>
                                        <FontAwesomeIcon icon={faSignInAlt} /> <span>Войти</span>
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                    <div className="header-actions">
                        <MusicButton />
                    </div>
                </div>
            </div>
        </header>
    );
}