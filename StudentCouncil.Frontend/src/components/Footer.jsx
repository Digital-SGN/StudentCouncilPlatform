import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVk, faTelegram } from '@fortawesome/free-brands-svg-icons';

export default function Footer() {
    return (
        <footer>
            <div className="container">
                <p>&copy; {new Date().getFullYear()} ССФ СГН МГТУ им. Н.Э. Баумана</p>
                <div className="footer-links">
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
                    
                    <div className="footer-bottom-links">
                        <Link to="/help" className="help-link">Помощь</Link>
                        <span className="footer-dot">•</span>
                        <Link to="/privacy" className="help-link">Конфиденциальность</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}