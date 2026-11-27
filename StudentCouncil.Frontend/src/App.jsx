import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { API } from './api';
import Header from './components/Header';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor'; 
import Loader from './components/Loader'; 
import ErrorState from './components/ErrorState';
import { faFish } from '@fortawesome/free-solid-svg-icons';

import HomePage from './pages/HomePage';
import HelpPage from './pages/HelpPage';
import PrivacyPage from './pages/PrivacyPage'; 
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import FishingGamePage from './pages/FishingGamePage';
import './css/Index.css';
import './css/LoginPage.css';
import './css/Bubbles.css';
import './css/Toast.css';

function AppContent() {
    const { user, setUser, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = useState(() =>
        localStorage.getItem('site-theme') === 'dark' ? 'dark' : 'light'
    );

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('site-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(currentTheme => currentTheme === 'dark' ? 'light' : 'dark');
    };

    const handleLogout = async () => {
        await API.logout();
        setUser(null);
        navigate('/login');
    };

    if (loading) return <Loader text="Проверка авторизации..." />;

    const isLoginPage = location.pathname === '/login';

    return (
        <div className={`app-wrapper ${isLoginPage ? 'app-wrapper-login' : ''}`}>
            <CustomCursor />
            <Header onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
            <main className={isLoginPage ? 'main-login' : ''}>
                {isLoginPage ? (
                    <LoginPage setUser={setUser} />
                ) : (
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/users" element={<UsersPage />} />
                            <Route path="/users/:id" element={<ProfilePage />} />
                            <Route path="/analytics" element={<AnalyticsPage />} />
                            <Route path="/events" element={<EventsPage />} />
                            <Route path="/events/:id" element={<EventDetailPage />} />
                            <Route path="/help" element={<HelpPage />} />
                            <Route path="/privacy" element={<PrivacyPage />} /> 
                            <Route path="/fishing" element={<FishingGamePage />} />
                            
                            <Route path="*" element={
                                <ErrorState 
                                    code={404} 
                                    title="Страница уплыла..." 
                                    message="Кажется, рыба сорвалась с крючка, а страница не найдена. Возможно, она была удалена или вы ошиблись адресом."
                                    icon={faFish}
                                />
                            } /> 
                        </Routes>
                )}
            </main>
            <Footer />
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider> 
                    <AppContent/>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;