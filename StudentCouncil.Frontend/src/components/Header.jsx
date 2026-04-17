import { Link } from 'react-router-dom';
import logo from '../assets/logo.svg';
import MusicButton from './MusicButton';

export default function Header({ user, onLogout }) {
    return (
        <header>
            <nav className="navbar navbar-expand-sm navbar-light">
                <div className="container">
                    <Link className="navbar-brand" to="/">
                        <img src={logo} alt="Лого" style={{ height: '35px' }} /> Студсовет
                    </Link>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav ms-auto">
                            {user && (
                                <>
                                    <li className="nav-item">
                                        <span className="nav-text"> Привет, {user.email}! </span>
                                    </li>
                                    <li className="nav-item"><Link className="nav-link" to="/"> Главная </Link></li>
                                    <li className="nav-item"><Link className="nav-link" to="/users"> Участники </Link></li>
                                    <li className="nav-item"><Link className="nav-link" to="/events"> Мероприятия </Link></li>
                                    <Link className="nav-link" to={`/users/${user.id}`}> Мой профиль </Link>
                                    <li className="nav-item">
                                        <button className="nav-link" onClick={onLogout}> Выйти </button>
                                    </li>
                                </>
                            )}
                            {!user && (
                                <>
                                    <li className="nav-item"><Link className="nav-link" to="/help"> Помощь </Link></li>
                                    <li className="nav-item"><Link className="nav-link" to="/login"> Войти </Link></li>
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