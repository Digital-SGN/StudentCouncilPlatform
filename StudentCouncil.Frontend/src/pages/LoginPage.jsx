import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../api';
import logo from '../assets/logo.svg';
import Bubbles from '../components/Bubbles';
import '../css/login.css';
import '../css/bubbles.css';

export default function LoginPage({ setUser }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await API.login(email, password);
            
             if (result.ok) {
                const user = await API.getCurrentUser();
                setUser(user); 
                navigate('/');
            } else {
                setError(result.data?.error || 'Неверный email или пароль');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Ошибка соединения с сервером');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page fade-in">
            <Bubbles />
            <div className="login-container">
                <div className="login-logo">
                    <img src={logo} alt="Лого" style={{ width: '120px', height: '82px' }} />
                </div>
                <h1>Добро пожаловать!</h1>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoFocus />
                    </div>
                    <div className="form-group">
                        <label>Пароль</label>
                        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                    </div>
                    
                    {error && (
                        <div className="error-message" style={{ display: 'block' }}>
                            {error}
                        </div>
                    )}
                    
                   <button type="submit" disabled={loading}>
                    {loading ? (
                    <>
                        <span className="spinner-border-sm" role="status" aria-hidden="true"></span> Вход...
                    </>
                    ) 
                    : (
                        'Войти'
                    )}
                    </button>
                </form>
                
                <div className="help-row">
                    <div className="help-link">
                        <a href="/help">Помощь</a>
                    </div>
                </div>
            </div>
        </div>
    );
}