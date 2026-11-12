import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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

    const displayEmail = user?.email && user.email.length > 25 ? user.email.substring(0, 17) + '...' : user?.email;

    return (
        <header className="custom-header">
            <div className="header-container">
                <Link className="header-brand" to="/" onClick={closeMenu}>
                    Студсовет
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

                {/* Меню */}
                <div className={`header-collapse ${isMenuOpen ? 'show' : ''}`}>
                    <ul className="header-nav">
                        {user && (
                            <li className="nav-item">
                                <span className="nav-text">
                                    <img src="/cat.gif" alt="кот" onClick={playMeow} className="cat-in-header" />
                                    Привет, {displayEmail}!
                                </span>
                            </li>
                        )}

                        <li className="nav-item">
                            <Link className="nav-link" to="/" onClick={closeMenu}>Главная</Link>
                        </li>

                        <li className="nav-item">
                            <Link className="nav-link" to="/fishing" onClick={closeMenu}>Рыбалка</Link>
                        </li>

                        {user && (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to={`/users/${user.id}`} onClick={closeMenu}>Мой профиль</Link>
                                </li>
                                {(user.role === "Admin" || user.role === "Leader") && (
                                    <>
                                        <li className="nav-item">
                                            <Link className="nav-link" to="/users" onClick={closeMenu}>Участники</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link className="nav-link" to="/events" onClick={closeMenu}>Мероприятия</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link className="nav-link" to="/analytics" onClick={closeMenu}>Аналитика</Link>
                                        </li>
                                    </>
                                )}
                                <li className="nav-item">
                                    <button className="nav-link logout-btn" onClick={() => { closeMenu(); onLogout(); }}>Выйти</button>
                                </li>
                            </>
                        )}

                        {!user && (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/help" onClick={closeMenu}>Помощь</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/login" onClick={closeMenu}>Войти</Link>
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