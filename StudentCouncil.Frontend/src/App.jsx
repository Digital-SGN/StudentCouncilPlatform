import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { API } from './api';
import Header from './components/Header';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor'; 
import Loader from './components/Loader'; 

const HomePage = lazy(() => import('./pages/HomePage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage')); 
const LoginPage = lazy(() => import('./pages/LoginPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const FishingGamePage = lazy(() => import('./pages/FishingGamePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage')); // 404

import './css/Index.css';
import './css/LoginPage.css';
import './css/Bubbles.css';

function AppContent() {
    const { user, setUser, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

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
            <Header onLogout={handleLogout} />
            <main className={isLoginPage ? 'main-login' : ''}>
                {isLoginPage ? (
                    <LoginPage setUser={setUser} />
                ) : (
                    <Suspense fallback={<Loader text="Загрузка страницы..." />}>
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
                            
                            <Route path="*" element={<NotFoundPage />} /> 
                        </Routes>
                    </Suspense>
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
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;