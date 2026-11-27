import { useState, useRef, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API } from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEye, faEyeSlash, faTriangleExclamation, faArrowRight,
    faCalendarAlt, faUsers, faTrophy, faRocket, faLightbulb,
    faStar, faWandMagicSparkles 
} from '@fortawesome/free-solid-svg-icons';
import '../css/LoginPage.css';
import '../css/Bubbles.css';

function OtpInput({ value, onChange, disabled }) {
    const [otp, setOtp] = useState(value.split('').slice(0, 6));
    const inputRefs = useRef([]);

    useEffect(() => {
        const newOtp = value.split('').slice(0, 6);
        while (newOtp.length < 6) newOtp.push('');
        setOtp(newOtp);
    }, [value]);

    const handleChange = (index, val) => {
        if (val.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = val;
        setOtp(newOtp);
        onChange(newOtp.join(''));
        if (val && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const paste = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');
        if (paste.length) {
            const newOtp = paste.split('');
            while (newOtp.length < 6) newOtp.push('');
            setOtp(newOtp);
            onChange(paste);
            const focusIndex = Math.min(paste.length, 5);
            inputRefs.current[focusIndex]?.focus();
        }
    };

    return (
        <div className="otp-container" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
                <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={disabled}
                    className="otp-input"
                    autoFocus={idx === 0}
                />
            ))}
        </div>
    );
}

export default function LoginPage({ setUser }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [step, setStep] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberDevice, setRememberDevice] = useState(false);
    const [code, setCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [capsLock, setCapsLock] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    if (user) {
        return <Navigate to="/" replace />;
    }

    const handleLoginSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            const result = await API.login(email, password);

            if (!result.ok) {
                showToast(result.data?.error || 'Неверный email или пароль', 'error');
                return;
            }

            const { status, id } = result.data;

            if (status === 'emailVerificationRequired') {
                setStep('email-verify');
                setResendCooldown(60);
                setCode('');
            } else if (status === 'twoFactorRequired') {
                setStep('verify-totp');
                setCode('');
            } else if (id) {
                // Успешный вход
                const fullUser = await API.getCurrentUser();
                setUser(fullUser);
                navigate('/');
            } else {
                showToast('Неожиданный ответ сервера', 'error');
            }
        } catch (err) {
            console.error('Login error:', err);
            showToast('Ошибка соединения с сервером', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailVerifySubmit = async (event) => {
        event.preventDefault();
        if (code.length !== 6) return;
        
        setLoading(true);
        try {
            const result = await API.verifyEmailCode(email, code);
            if (result.ok) {
                const fullUser = await API.getCurrentUser();
                setUser(fullUser);
                navigate('/');
            } else {
                showToast(result.data?.error || 'Неверный код', 'error');
            }
        } catch (err) {
            showToast('Ошибка при проверке кода', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResendEmail = async () => {
        if (resendCooldown > 0) return;
        setLoading(true);
        const result = await API.resendEmailCode(email);
        setLoading(false);
        
        if (result.ok) {
            showToast('Код отправлен повторно', 'success');
            setResendCooldown(60);
            setCode('');
        } else {
            showToast(result.data?.error || 'Не удалось отправить код', 'error');
        }
    };

    const handleVerifyTotpSubmit = async (event) => {
        event.preventDefault();
        if (code.length !== 6) return;

        setLoading(true);
        try {
            const result = await API.loginWithTwoFactor(code, rememberDevice);
            if (result.ok) {
                const fullUser = await API.getCurrentUser();
                setUser(fullUser);
                navigate('/');
            } else {
                showToast(result.data?.error || 'Неверный код двухфакторной аутентификации', 'error');
            }
        } catch (err) {
            showToast('Ошибка при проверке кода', 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderLoginForm = () => (
        <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    disabled={loading}
                />
            </div>

            <div className="form-group">
                <label htmlFor="login-password">Пароль</label>
                <div className="password-wrapper">
                    <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                        onKeyDown={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                        onBlur={() => setCapsLock(false)}
                        required
                        disabled={loading}
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </button>
                </div>
                {capsLock && (
                    <div className="caps-lock-warning" role="alert">
                        <FontAwesomeIcon icon={faTriangleExclamation} />
                        <span>Caps Lock включён</span>
                    </div>
                )}
            </div>

            <button type="submit" disabled={loading}>
                {loading ? (
                    'Вход...'
                ) : (
                    <>
                        Войти
                        <FontAwesomeIcon icon={faArrowRight} className="btn-arrow" />
                    </>
                )}
            </button>
        </form>
    );

    const renderEmailVerifyForm = () => (
        <form onSubmit={handleEmailVerifySubmit}>
            <h2 style={{ marginBottom: '12px', color: 'var(--text-primary)', fontSize: '22px' }}>
                Подтвердите почту
            </h2>
            <p style={{ marginBottom: '20px', color: 'var(--text-muted)', fontSize: '15px' }}>
                Мы отправили код на <strong>{email}</strong>. Введите его ниже.
            </p>
            <div className="form-group">
                <OtpInput value={code} onChange={setCode} disabled={loading} />
            </div>
            <button type="submit" disabled={loading || code.length !== 6}>
                {loading ? (
                    'Проверка...'
                ) : (
                    <>
                        Подтвердить и войти
                        <FontAwesomeIcon icon={faArrowRight} className="btn-arrow" />
                    </>
                )}
            </button>
            <div className="help-row" style={{ marginTop: '16px' }}>
                <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={loading || resendCooldown > 0}
                    style={{ 
                        background: 'none', border: 'none', 
                        color: resendCooldown > 0 ? 'var(--text-muted)' : '#0CBFA1',
                        cursor: resendCooldown > 0 ? 'default' : 'pointer', 
                        fontSize: '14px', fontWeight: '500'
                    }}
                >
                    {resendCooldown > 0
                        ? `Отправить ещё раз через ${resendCooldown} с`
                        : 'Отправить код ещё раз'}
                </button>
            </div>
        </form>
    );

    const renderVerifyTotpForm = () => (
        <form onSubmit={handleVerifyTotpSubmit}>
            <h2 style={{ marginBottom: '12px', color: 'var(--text-primary)', fontSize: '22px' }}>
                Подтвердите вход
            </h2>
            <p style={{ marginBottom: '20px', color: 'var(--text-muted)', fontSize: '15px' }}>
                Введите код из вашего приложения-аутентификатора.
            </p>
            <div className="form-group">
                <OtpInput value={code} onChange={setCode} disabled={loading} />
            </div>
            <div className="form-group checkbox-group">
                <label>
                    <input
                        type="checkbox"
                        autoComplete="off"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                        disabled={loading}
                    />
                    Запомнить это устройство
                </label>
            </div>
            <button type="submit" disabled={loading || code.length !== 6}>
                {loading ? (
                    'Вход...'
                ) : (
                    <>
                        Войти
                        <FontAwesomeIcon icon={faArrowRight} className="btn-arrow" />
                    </>
                )}
            </button>
        </form>
    );

    return (
        <div className="login-page fade-in">
            <div className="login-bg-circles" aria-hidden="true">
                <span className="bg-circle bg-circle-1"><FontAwesomeIcon icon={faCalendarAlt} /></span>
                <span className="bg-circle bg-circle-2"><FontAwesomeIcon icon={faUsers} /></span>
                <span className="bg-circle bg-circle-3"><FontAwesomeIcon icon={faTrophy} /></span>
                <span className="bg-circle bg-circle-4"><FontAwesomeIcon icon={faRocket} /></span>
                <span className="bg-circle bg-circle-5"><FontAwesomeIcon icon={faLightbulb} /></span>
                
                <span className="bg-sparkle sparkle-1"><FontAwesomeIcon icon={faStar} /></span>
                <span className="bg-sparkle sparkle-2"><FontAwesomeIcon icon={faWandMagicSparkles} /></span>
                <span className="bg-sparkle sparkle-3"><FontAwesomeIcon icon={faStar} /></span>
                <span className="bg-sparkle sparkle-4"><FontAwesomeIcon icon={faWandMagicSparkles} /></span>
            </div>

            <div className="login-layout">
                <div className="login-hero">
                    <h2 className="login-hero-title">Студсовет СГН</h2>
                    <p className="login-hero-subtitle">
                        Развиваем студенческую жизнь, организуем мероприятия, поддерживаем инициативы
                    </p>
                </div>

                <div className="login-container">
                    {step === 'login' && (
                        <>
                            <div className="login-logo">
                                <img src="/logo.svg" alt="Лого" />
                            </div>
                            <h1>Добро пожаловать!</h1>
                        </>
                    )}

                    {step === 'login' && renderLoginForm()}
                    {step === 'email-verify' && renderEmailVerifyForm()}
                    {step === 'verify-totp' && renderVerifyTotpForm()}
                </div>
            </div>
        </div>
    );
}