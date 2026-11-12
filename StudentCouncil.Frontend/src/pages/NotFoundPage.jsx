import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFish, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Bubbles from '../components/Bubbles';
import '../css/NotFoundPage.css';

export default function NotFoundPage() {
    return (
        <div className="not-found-page fade-in">
            <Bubbles />
            <div className="not-found-container">
                <div className="error-code">4<span>0</span>4</div>
                <div className="error-icon">
                    <FontAwesomeIcon icon={faFish} />
                </div>
                <h1>Страница уплыла...</h1>
                <p>Кажется, рыба сорвалась с крючка, а страница не найдена. Возможно, она была удалена или вы ошиблись адресом.</p>
                <Link to="/" className="btn-home">
                    <FontAwesomeIcon icon={faArrowLeft} /> На главную
                </Link>
            </div>
        </div>
    );
}