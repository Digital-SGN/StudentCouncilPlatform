import Bubbles from '../components/Bubbles';

export default function HelpPage() {
    return (
        <div className="help-page">
            <Bubbles />
            <div className="help-container">
                <div className="help-header">
                    <h1>Помощь</h1>
                    <p>Всё, что нужно знать о платформе студсовета СГН</p>
                </div>
                <div className="help-content">
                    <div className="help-block">
                        <div className="help-icon">🔐</div>
                        <div className="help-text">
                            <h3>Доступ к платформе</h3>
                            <p>Платформа предназначена <strong>только для участников студенческого совета СГН</strong>. Данные для входа выдаются при вступлении в совет.</p>
                        </div>
                    </div>
                    <div className="help-block">
                        <div className="help-icon">📜</div>
                        <div className="help-text">
                            <h3>Политика использования</h3>
                            <ul>
                                <li>Платформа является внутренним инструментом студенческого совета СГН.</li>
                                <li>Данные участников используются исключительно для организации деятельности совета.</li>
                                <li>Запрещена передача учётных данных третьим лицам.</li>
                                <li>Администрация оставляет за собой право блокировать аккаунты при нарушении правил.</li>
                            </ul>
                        </div>
                    </div>
                    <div className="help-block">
                        <div className="help-icon">📞</div>
                        <div className="help-text">
                            <h3>Контакты</h3>
                            <p>По всем вопросам обращайтесь к администратору:</p>
                            <p className="help-contacts">📧 <strong>studsovet@sgn.ru</strong> &nbsp;|&nbsp; 📱 Telegram: <strong>@studsovet_sgn</strong></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}