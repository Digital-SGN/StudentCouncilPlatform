import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { API } from './api';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import HelpPage from './pages/HelpPage';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import './css/site.css';
import './css/login.css';
import './css/users.css';
import './css/profile.css';
import './css/events.css';
import './css/bubbles.css';
import './css/help.css';
import { initGlobalMusic } from './music';

function AppContent() {
    const { user, setUser, loading } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await API.logout();
        setUser(null);
        window.currentUser = null;
        navigate('/login');
    };

    if (loading) return <div className="loading">Загрузка...</div>;

    return (
        <div className="app-wrapper">
            <Header user={user} onLogout={handleLogout} />
            <main>
                <div className="container">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage setUser={setUser} />} />
                        <Route path="/users" element={<UsersPage />} />
                        <Route path="/users/:id" element={<ProfilePage />} />
                        <Route path="/events" element={<EventsPage />} />
                        <Route path="/events/:id" element={<EventDetailPage />} />
                        <Route path="/help" element={<HelpPage />} />
                    </Routes>
                </div>
            </main>
            <Footer />
        </div>
    );
}

function App() {
    useEffect(() => {
        initGlobalMusic();
    }, []);

    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;