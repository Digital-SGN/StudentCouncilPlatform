import Bubbles from './Bubbles';
import '../css/Loader.css';

export default function Loader({ text = "Загрузка..." }) {
    return (
        <div className="loader-page fade-in">
            <Bubbles />
            <div className="loader-card">
                <div className="loader-animation">
                    <div className="loader-ring"></div>
                    <div className="loader-ring-inner"></div>
                    <div className="loader-dot"></div>
                </div>
                <p className="loader-text">{text}</p>
            </div>
        </div>
    );
}