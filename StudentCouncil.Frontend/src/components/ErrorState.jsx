import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFish, faLock, faGhost, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Bubbles from './Bubbles';
import '../css/ErrorState.css';

export default function ErrorState({ 
    code = 404, 
    title = 'Страница не найдена', 
    message = 'Кажется, рыба сорвалась с крючка...', 
    icon = faFish 
}) {
    return (
        <div className="error-state-page fade-in">
            <Bubbles />
            <div className="error-state-container">
                <div className="error-code">{String(code).split('').map((char, i) => (
                    <span key={i} style={{ animationDelay: `${i * 0.1}s` }}>{char}</span>
                ))}</div>
                <div className="error-icon">
                    <FontAwesomeIcon icon={icon} />
                </div>
                <h1>{title}</h1>
                <p>{message}</p>
                <Link to="/" className="btn-home">
                    <FontAwesomeIcon icon={faArrowLeft} /> На главную
                </Link>
            </div>
        </div>
    );
}