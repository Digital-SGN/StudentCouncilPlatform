import Bubbles from '../components/Bubbles';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom'; 

export default function HomePage() {
    const { user } = useAuth();
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    return (
        <div className="home-page">
            <Bubbles />
            <div className="home-wrapper">
                <div className="welcome-card">
                    <h1>Добро пожаловать в платформу студсовета СГН</h1>
                </div>
            </div>
        </div>
    );
}