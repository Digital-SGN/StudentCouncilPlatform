import Bubbles from '../components/Bubbles';

export default function HomePage({ user }) {
    return (
        <div className="home-page">
            <Bubbles />
            <div className="home-wrapper">
                <div className="welcome-card">
                    <h1>Добро пожаловать в платформу студсовета СГН</h1>
                    {user && <p>Привет, {user.firstName}! 👋</p>}
                </div>
            </div>
        </div>
    );
}