import { useState, useRef, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';
import logo from '../assets/logo.svg';
import Bubbles from '../components/Bubbles';
import Alert from '../components/Alert';
import '../css/LoginPage.css';
import '../css/bubbles.css';

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
    const [step, setStep] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberDevice, setRememberDevice] = useState(false);
    const [code, setCode] = useState('');
    const [qrUri, setQrUri] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

     if (user) {
        return <Navigate to="/" replace />;
    }
    

    const handleLoginSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await API.login(email, password);
            if (result.ok && result.status === 200) {
                const user = await API.getCurrentUser();
                setUser(user);
                navigate('/');
            } 
            else if (result.status === 402) {
                const { authenticatorUri } = result.data;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(authenticatorUri)}`;
                setQrUri(qrUrl);
                setStep('setup');
            }
            else if (result.status === 403) {
                setStep('verify');
            }
            else {
                setError(result.data?.error || 'Неверный email или пароль');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Ошибка соединения с сервером');
        } finally {
            setLoading(false);
        }
    };

    const handleSetupSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await API.setupTwoFactor(email, code);
            if (result.ok) {
                const fullUser = await API.getCurrentUser();
                setUser(fullUser);
                navigate('/');
            } else {
                setError(result.data?.error || 'Неверный код. Попробуйте снова.');
            }
        } catch (err) {
            setError('Ошибка при настройке 2FA');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await API.loginWithTwoFactor(code, rememberDevice);
            if (result.ok) {
                const fullUser = await API.getCurrentUser();
                setUser(fullUser);
                navigate('/');
            } else {
                setError(result.data?.error || 'Неверный код двухфакторной аутентификации');
            }
        } catch (err) {
            setError('Ошибка при проверке кода');
        } finally {
            setLoading(false);
        }
    };

    const renderLoginForm = () => (
        <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    disabled={loading}
                />
            </div>
            <div className="form-group">
                <label>Пароль</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                />
            </div>
            {error && <Alert type="danger" message={error} />}
            <button type="submit" disabled={loading}>
                {loading ? 'Вход...' : 'Войти'}
            </button>
        </form>
    );

    const renderSetupForm = () => (
        <div className="twofa-setup">
            <h2>Подтвердите вход</h2>
            <p>Отсканируйте QR-код и настройте аутентификатор</p>
            {qrUri && (
                <div className="qr-container">
                    <img src={qrUri} alt="QR-код для настройки 2FA" />
                </div>
            )}
            <form onSubmit={handleSetupSubmit}>
                <div className="form-group">
                    <label>Код из приложения</label>
                    <OtpInput value={code} onChange={setCode} disabled={loading} />
                </div>
                {error && <Alert type="danger" message={error} />}
                <button type="submit" disabled={loading}>
                    {loading ? 'Проверка...' : 'Подтвердить и войти'}
                </button>
            </form>
        </div>
    );

    const renderVerifyForm = () => (
        <form onSubmit={handleVerifySubmit}>
            <p>Введите код из вашего приложения-аутентификатора.</p>
            <div className="form-group">
                <OtpInput value={code} onChange={setCode} disabled={loading} />
            </div>
            <div className="form-group checkbox-group">
                <label>
                    <input
                        type="checkbox"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                        disabled={loading}
                    />
                    Запомнить это устройство
                </label>
            </div>
            {error && <Alert type="danger" message={error} />}
            <button type="submit" disabled={loading}>
                {loading ? 'Вход...' : 'Войти'}
            </button>
        </form>
    );

    return (
        <div className="login-page fade-in">
            <Bubbles />
            <div className="login-container">
                <div className="login-logo">
                    <img src={logo} alt="Лого" style={{ width: '120px', height: '82px' }} />
                </div>
                <h1>Добро пожаловать!</h1>

                {step === 'login' && renderLoginForm()}
                {step === 'setup' && renderSetupForm()}
                {step === 'verify' && renderVerifyForm()}

                <div className="help-row">
                    <div className="help-link">
                        <a href="/help">Помощь</a>
                    </div>
                </div>
            </div>
        </div>
    );
}