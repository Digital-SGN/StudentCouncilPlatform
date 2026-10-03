import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import catImage from '../assets/cat.gif';
import MusicButton from './MusicButton';

export default function Header({ onLogout }) { 
    const { user, loading } = useAuth();
    const collapseRef = useRef(null);
    const meowAudioRef = useRef(null);

    useEffect(() => {
        meowAudioRef.current = new Audio('/music/meow.mp3');
    }, []);

    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Загрузка...</p></div>;

    const closeMenu = () => {
        if (!collapseRef.current) return;
        const bsCollapse = window.bootstrap?.Collapse?.getInstance(collapseRef.current);
        if (bsCollapse) {
            bsCollapse.hide();
        }
    };

    const playMeow = () => {
        if (meowAudioRef.current) {
            meowAudioRef.current.currentTime = 0;
            meowAudioRef.current.play().then(() => console.log("Мяу!")).catch(e => console.error("Ошибка воспроизведения:", e));
        }
    };

    const displayEmail = user?.email && user.email.length > 25 ? user.email.substring(0, 17) + '...' : user?.email;

    return (
        <header>
            <nav className="navbar navbar-expand-md navbar-light">
                <div className="container-fluid">
                    <Link className="navbar-brand" to="/" onClick={closeMenu}>
                        Студсовет
                    </Link>
                    <button 
                        className="navbar-toggler" 
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#navbarNav"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarNav" ref={collapseRef}>
                        <ul className="navbar-nav">
                            {user && (
                                <li className="nav-item">
                                    <span className="nav-text">
                                        <img src={catImage} alt="кот" onClick={playMeow} className="cat-in-header" />
                                        Привет, {displayEmail}!
                                    </span>
                                </li>
                            )}

                            <li className="nav-item">
                                <Link className="nav-link" to="/" onClick={closeMenu}>Главная</Link>
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
                                        <button className="nav-link" onClick={() => { closeMenu(); onLogout(); }}>Выйти</button>
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
                        <MusicButton />
                    </div>
                </div>
            </nav>
        </header>
    );
}