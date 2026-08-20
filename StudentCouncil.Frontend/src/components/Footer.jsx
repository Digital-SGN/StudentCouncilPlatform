import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVk, faTelegram } from '@fortawesome/free-brands-svg-icons';

export default function Footer() {
    return (
        <footer>
            <div className="container">
                <p>&copy; {new Date().getFullYear()} Студенческий совет СГН МГТУ им. Н.Э. Баумана</p>
                <div className="footer-links">
                    <span className="social-label">Наши соцсети</span>
                    <div className="social-icons">
                        <a 
                            href="https://vk.ru/studsovetsgn" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            aria-label="ВКонтакте"
                        >
                            <FontAwesomeIcon icon={faVk} />
                        </a>
                        <a 
                            href="https://t.me/studsovetsgn" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            aria-label="Telegram"
                        >
                            <FontAwesomeIcon icon={faTelegram} />
                        </a>
                    </div>
                    <Link to="/help" className="help-link">Помощь</Link>
                </div>
            </div>
        </footer>
    );
}