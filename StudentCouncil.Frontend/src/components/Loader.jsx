import '../css/Loader.css';

export default function Loader({ text = "Загрузка..." }) {
    return (
        <div className="loader-container">
            <div className="loader-spinner">
                <div></div><div></div><div></div><div></div>
            </div>
            <p className="loader-text">{text}</p>
        </div>
    );
}