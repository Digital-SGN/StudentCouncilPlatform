import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faArrowLeft, faLock, faGhost, faServer, faFish, faUserLock 
} from '@fortawesome/free-solid-svg-icons';
import Bubbles from './Bubbles';
import '../css/ErrorState.css';

// Здесь мы задаем дефолтные значения для каждого кода
const DEFAULT_CONFIGS = {
    401: {
        title: "Стой, кто идёт!",
        message: "Чтобы попасть на эту страницу, нужно представиться. Войдите в систему, и мы всё покажем.",
        icon: faUserLock,
        linkTo: "/login",
        linkText: "Войти в систему"
    },
    403: {
        title: "Доступ запрещён",
        message: "Сюда вход только по пропускам. Студсовет хранит свои секреты.",
        icon: faLock,
        linkTo: "/",
        linkText: "На главную"
    },
    404: {
        title: "Страница уплыла...",
        message: "Кажется, рыба сорвалась с крючка, а страница не найдена.",
        icon: faFish,
        linkTo: "/",
        linkText: "На главную"
    },
    500: {
        title: "Сервер ушёл на обед",
        message: "Мы не смогли загрузить данные. Попробуйте обновить страницу через пару минут.",
        icon: faServer,
        linkTo: "/",
        linkText: "На главную"
    }
};

export default function ErrorState({ 
    code = 404, 
    title, 
    message, 
    icon, 
    linkTo, 
    linkText 
}) {
    const config = DEFAULT_CONFIGS[code] || DEFAULT_CONFIGS[500];

    const finalTitle = title || config.title;
    const finalMessage = message || config.message;
    const finalIcon = icon || config.icon;
    const finalLinkTo = linkTo || config.linkTo;
    const finalLinkText = linkText || config.linkText;

    return (
        <div className="error-state-page fade-in">
            <Bubbles />
            <div className="error-state-container">
                <div className="error-code">
                    {String(code).split('').map((char, i) => (
                        <span key={i} style={{ animationDelay: `${i * 0.1}s` }}>{char}</span>
                    ))}
                </div>
                <div className="error-icon">
                    <FontAwesomeIcon icon={finalIcon} />
                </div>
                <h1>{finalTitle}</h1>
                <p>{finalMessage}</p>
                
                <Link to={finalLinkTo} className="btn-home">
                    <FontAwesomeIcon 
                        icon={faArrowLeft} 
                        style={{ transform: finalLinkTo === '/login' ? 'rotate(180deg)' : 'none' }} 
                    /> 
                    {finalLinkText}
                </Link>
            </div>
        </div>
    );
}