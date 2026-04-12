import { Link } from 'react-router-dom';
import logo from '../assets/logo.svg';

export default function Header({ user, onLogout }) {
    return (
        <header>
            <nav className="navbar navbar-expand-sm navbar-light">
                <div className="container">
                    <Link className="navbar-brand" to="/">
                        <img src={logo} alt="Лого" style={{ height: '35px' }} />
                        Студсовет
                    </Link>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav ms-auto">
                            <li className="nav-item"><Link className="nav-link" to="/">Главная</Link></li>
                            {user && (
                                <>
                                    <li className="nav-item"><Link className="nav-link" to="/users">Участники</Link></li>
                                    <li className="nav-item"><Link className="nav-link" to="/events">Мероприятия</Link></li>
                                    <li className="nav-item"><Link className="nav-link" to={`/users/${user.id}`}>Мой профиль</Link></li>
                                    <li className="nav-item"><span className="nav-link">Привет, {user.email}!</span></li>
                                    <li className="nav-item">
                                        <button className="nav-link" onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                            Выйти
                                        </button>
                                    </li>
                                </>
                            )}
                            {!user && (
                                <>
                                    <li className="nav-item"><Link className="nav-link" to="/help">Помощь</Link></li>
                                    <li className="nav-item"><Link className="nav-link" to="/login">Войти</Link></li>
                                </>
                            )}
                        </ul>
                        <button id="global-music-btn" className="music-control" onClick={() => window.toggleGlobalMusic?.()}>
                            🔊
                        </button>
                    </div>
                </div>
            </nav>
        </header>
    );
}