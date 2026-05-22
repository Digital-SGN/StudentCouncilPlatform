import { useRef } from 'react'; 
import { Link } from 'react-router-dom';
import logo from '../assets/logo.svg';
import MusicButton from './MusicButton';

export default function Header({ user, onLogout }) {
    const collapseRef = useRef(null);

    const closeMenu = () => {
        if (collapseRef.current && collapseRef.current.classList.contains('show')) {
            collapseRef.current.classList.remove('show');
        }
    };

    const displayEmail = user?.email && user.email.length > 25 ? user.email.substring(0, 17) + '...' : user?.email;

    return (
        <header>
            <nav className="navbar navbar-expand-sm navbar-light">
                <div className="container-fluid">
                    <Link className="navbar-brand" to="/" onClick={closeMenu}>
                        <img src={logo} alt="Лого" style={{ height: '35px' }} /> Студсовет
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
                        <ul className="navbar-nav mx-auto">
                            {user && (
                                <>
                                    <li className="nav-item">
                                        <span className="nav-text"> Привет, {displayEmail}! </span>
                                    </li>
                                       <li className="nav-item">
                                        <Link className="nav-link" to="/" onClick={closeMenu}>Главная</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="" onClick={closeMenu}>Альбом</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/users" onClick={closeMenu}>Участники</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/events" onClick={closeMenu}>Мероприятия</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/analytics" onClick={closeMenu}>Аналитика</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to={`/users/${user.id}`} onClick={closeMenu}>Мой профиль</Link>
                                    </li>
                                    <li className="nav-item">
                                        <button className="nav-link" onClick={() => { closeMenu(); onLogout(); }}>Выйти</button>
                                    </li>
                                </>
                            )}
                            {!user && (
                                <>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/" onClick={closeMenu}>Главная</Link>
                                    </li>
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