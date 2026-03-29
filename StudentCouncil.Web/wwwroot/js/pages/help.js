window.renderHelp = function () {
    return `
        <div class="help-page">
          <div class="bubbles-side bubbles-left">
                <div class="bubble bubble-left-1"></div>
                <div class="bubble bubble-left-2"></div>
                <div class="bubble bubble-left-3"></div>
                <div class="bubble bubble-left-4"></div>
                <div class="bubble bubble-left-5"></div>
                <div class="bubble-large bubble-left-large"></div>
                <div class="bubble-large bubble-left-large-2"></div>
            </div>
            <div class="bubbles-side bubbles-right">
                <div class="bubble bubble-right-1"></div>
                <div class="bubble bubble-right-2"></div>
                <div class="bubble bubble-right-3"></div>
                <div class="bubble bubble-right-4"></div>
                <div class="bubble bubble-right-5"></div>
                <div class="bubble-large bubble-right-large"></div>
                <div class="bubble-large bubble-right-large-2"></div>
            </div>
            <div class="help-container">
                <div class="help-header">
                    <h1>Помощь</h1>
                    <p>Всё, что нужно знать о платформе студсовета СГН</p>
                </div>
                <div class="help-content">
                    <div class="help-block">
                        <div class="help-icon">🔐</div>
                        <div class="help-text">
                            <h3>Доступ к платформе</h3>
                            <p>Платформа предназначена <strong>только для участников студенческого совета СГН</strong>. Данные для входа выдаются при вступлении в совет.</p>
                            <div class="help-note">Если вы не получили данные для входа — обратитесь к администратору или руководителю совета.</div>
                        </div>
                    </div>
                    <div class="help-block">
                        <div class="help-icon">📜</div>
                        <div class="help-text">
                            <h3>Политика использования</h3>
                            <ul>
                                <li>Платформа является внутренним инструментом студенческого совета СГН.</li>
                                <li>Данные участников используются исключительно для организации деятельности совета.</li>
                                <li>Запрещена передача учётных данных третьим лицам.</li>
                                <li>Администрация оставляет за собой право блокировать аккаунты при нарушении правил.</li>
                                <li>Все действия на платформе логируются для обеспечения безопасности.</li>
                            </ul>
                        </div>
                    </div>
                    <div class="help-block">
                        <div class="help-icon">📞</div>
                        <div class="help-text">
                            <h3>Контакты</h3>
                            <p>По всем вопросам обращайтесь к администратору:</p>
                            <p class="help-contacts">📧 <strong>studsovet@sgn.ru</strong> &nbsp;|&nbsp; 📱 Telegram: <strong>@studsovet_sgn</strong></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

window.initHelp = function () {
    // TODO
};