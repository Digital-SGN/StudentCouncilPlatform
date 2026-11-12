import { useEffect, useRef } from 'react';
import Bubbles from '../components/Bubbles';
import '../css/HelpPage.css';

export default function HelpPage() {
  const pageRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      }),
      { threshold: 0.1 }
    );
    if (pageRef.current) observer.observe(pageRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="help-page" ref={pageRef}>
      <Bubbles />
      <div className="help-container">
        <div className="help-header">
          <h1>Помощь</h1>
          <p className="help-subtitle">Ответы на частые вопросы и контакты для связи</p>
        </div>

        <div className="help-content">
          <section>
            <h2>Как войти в систему?</h2>
            <p>
              Используйте email и пароль, которые вам выдал администратор при создании аккаунта. 
              Если вы не помните свои данные для входа, обратитесь к администратору.
            </p>
          </section>

          <section>
            <h2>Что делать, если забыли пароль?</h2>
            <p>
              На данный момент самостоятельный сброс пароля не предусмотрен. 
              Для смены или восстановления пароля напишите администратору в Telegram или на почту, 
              указанную в разделе «Контакты».
            </p>
          </section>

          <section>
            <h2>Двухфакторная аутентификация (2FA)</h2>
            <p>
              При первом входе система попросит вас настроить двухфакторную аутентификацию. 
              Отсканируйте QR-код в любом приложении-аутентификаторе (например, Google Authenticator 
              или Яндекс.Ключ) и введите полученный код.
            </p>
            <p>
              Если вы потеряли доступ к приложению с кодами — напишите администратору для сброса настроек 2FA.
            </p>
          </section>

          <section>
            <h2>Как получить бейджи?</h2>
            <p>
              Ваши бейджи участника доступны в личном профиле, если файл бейджа отсутствует или не скачивается — сообщите об этом 
              ответственному за мероприятие или администратору.
            </p>
          </section>

          <section>
            <h2>Нашли ошибку или что-то не работает?</h2>
            <p>
              Если вы столкнулись с ошибкой или некорректной работой сайта, пожалуйста, 
              пришлите скриншот и краткое описание проблемы в Telegram. Мы постараемся 
              исправить это как можно скорее.
            </p>
          </section>

          <section>
            <h2>Контакты для связи</h2>
            <p>
              По любым вопросам, связанным с работой сайта или аккаунта, обращайтесь:
            </p>
            <ul>
              <li>Telegram: <a href="https://t.me/skebob_gg" target="_blank" rel="noopener noreferrer">@skebob_gg</a></li>
              <li>Email: <a href="mailto:demonrux201@yandex.ru">demonrux201@yandex.ru</a></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}