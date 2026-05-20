import { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faFileAlt, faPhoneAlt } from '@fortawesome/free-solid-svg-icons';
import Bubbles from '../components/Bubbles';
import '../css/HelpPage.css'; 

export default function HelpPage() {
  const pageRef = useRef(null);
  const blocksRef = useRef([]);

  useEffect(() => {
    const pageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (pageRef.current) pageObserver.observe(pageRef.current);

    const blockObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, index * 150);
          }
        });
      },
      { threshold: 0.2 }
    );

    blocksRef.current.forEach((block) => {
      if (block) blockObserver.observe(block);
    });

    return () => {
      pageObserver.disconnect();
      blockObserver.disconnect();
    };
  }, []);

  return (
    <div className="help-page" ref={pageRef}>
      <Bubbles />
      <div className="help-container">
        <div className="help-header">
          <h1>Помощь</h1>
          <p>Всё, что нужно знать о платформе студсовета СГН</p>
        </div>
        <div className="help-content">
          <div 
            className="help-block" 
            ref={el => blocksRef.current[0] = el}
          >
            <div className="help-icon">
              <FontAwesomeIcon icon={faLock} />
            </div>
            <div className="help-text">
              <h3>Доступ к платформе</h3>
              <p>Платформа предназначена <strong>только для участников студенческого совета СГН</strong>. Данные для входа выдаются при вступлении в совет.</p>
            </div>
          </div>
          <div 
            className="help-block" 
            ref={el => blocksRef.current[1] = el}
          >
            <div className="help-icon">
              <FontAwesomeIcon icon={faFileAlt} />
            </div>
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
          <div 
            className="help-block" 
            ref={el => blocksRef.current[2] = el}
          >
            <div className="help-icon">
              <FontAwesomeIcon icon={faPhoneAlt} />
            </div>
            <div className="help-text">
              <h3>Контакты</h3>
              <p>По всем вопросам обращайтесь к администратору:</p>
              <p className="help-contacts"><strong>demonrux201@gmail.com</strong> &nbsp;|&nbsp; Telegram: <strong>@skebob_gg</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}