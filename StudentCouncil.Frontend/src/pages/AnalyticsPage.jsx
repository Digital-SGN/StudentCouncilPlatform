import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUsers, faCalendarAlt, faChartLine, faMoneyBillWave, 
    faTrophy, faUserCheck, faArrowTrendUp, faLock
} from '@fortawesome/free-solid-svg-icons';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import Bubbles from '../components/Bubbles';
import ErrorState from '../components/ErrorState';
import '../css/AnalyticsPage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

export default function AnalyticsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const isLeader = user?.role === 'Leader';
    const canView = isAdmin || isLeader;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalUsers: 0, activeUsers: 0, totalEvents: 0, totalRegistered: 0, totalActual: 0,
        averageAttendanceRate: 0, totalBudget: 0, avgBudget: 0,
        topUsers: [], topEvents: [], eventsPerMonth: []
    });

    useEffect(() => {
        if (canView) loadAnalytics();
        else setLoading(false);
    }, [canView]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const [usersResult, eventsResult] = await Promise.all([
                API.getUsers(),
                API.getEvents()
            ]);

            if (!usersResult.ok || !eventsResult.ok) throw new Error('Ошибка загрузки данных');

            const users = usersResult.data.users || [];
            const events = eventsResult.data.events || [];

            let totalRegistered = 0;
            let totalActual = 0;
            let totalBudget = 0;
            let eventsWithBudget = 0;
            const eventsByMonth = {};

            events.forEach(e => {
                totalRegistered += e.registeredParticipants || 0;
                totalActual += e.actualParticipants || 0;
                
                if (e.budget && e.budget > 0) {
                    totalBudget += e.budget;
                    eventsWithBudget++;
                }

                if (e.eventDate) {
                    const date = new Date(e.eventDate);
                    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    eventsByMonth[key] = (eventsByMonth[key] || 0) + 1;
                }
            });

            const averageAttendanceRate = totalRegistered > 0 ? (totalActual / totalRegistered * 100).toFixed(1) : 0;
            const avgBudget = eventsWithBudget > 0 ? (totalBudget / eventsWithBudget).toFixed(0) : 0;

            const topEvents = [...events]
                .filter(e => e.registeredParticipants > 0)
                .map(e => ({
                    title: e.title,
                    registered: e.registeredParticipants,
                    actual: e.actualParticipants,
                    rate: (e.actualParticipants / e.registeredParticipants * 100)
                }))
                .sort((a, b) => b.rate - a.rate)
                .slice(0, 5);

            const sortedMonths = Object.keys(eventsByMonth).sort();
            const eventsPerMonth = sortedMonths.map(month => ({
                month,
                count: eventsByMonth[month]
            }));

            const badgesPromises = users.map(u => API.getBadgesByUser(u.id));
            const badgesResults = await Promise.all(badgesPromises);
            const userBadgeCount = new Map();
            
            badgesResults.forEach((res, idx) => {
                if (res.ok && res.data.badges) {
                    userBadgeCount.set(users[idx].id, res.data.badges.length);
                }
            });

            const topUsers = users
                .map(u => ({
                    id: u.id,
                    name: `${u.lastName} ${u.firstName}`,
                    badgeCount: userBadgeCount.get(u.id) || 0,
                    level: u.level || 1,
                    experience: u.experiencePoints || 0
                }))
                .sort((a, b) => b.experience - a.experience)
                .slice(0, 5);

            setStats({
                totalUsers: users.length,
                activeUsers: users.filter(u => u.isActive !== false).length,
                totalEvents: events.length,
                totalRegistered,
                totalActual,
                averageAttendanceRate,
                totalBudget,
                avgBudget,
                topUsers,
                topEvents,
                eventsPerMonth
            });

        } catch (err) {
            setError(err.message || 'Ошибка загрузки аналитики');
        } finally {
            setLoading(false);
        }
    };

    if (!canView) return (
        <ErrorState 
            code={403} 
            title="Отказано." 
            message="Аналитика доступна только руководству студсовета."
            icon={faLock}
        />
    );

    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Сбор аналитики...</p></div>;
    if (error) return (
        <ErrorState 
            code={500} 
            title="Сервер ушёл на обед" 
            message="Мы не смогли собрать аналитику. Попробуйте обновить страницу через пару минут."
            icon={faServer}
        />
    );

    
    const lineData = {
        labels: stats.eventsPerMonth.map(i => i.month),
        datasets: [{
            label: 'Мероприятий',
            data: stats.eventsPerMonth.map(i => i.count),
            borderColor: '#0CBFA1',
            backgroundColor: 'rgba(12, 191, 161, 0.1)',
            fill: true,
            tension: 0.4, // Плавные изгибы
            pointBackgroundColor: '#fff',
            pointBorderColor: '#0CBFA1',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    };
    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { borderDash: [5, 5] } }
        }
    };

    const doughnutData = {
        labels: ['Пришли', 'Не пришли'],
        datasets: [{
            data: [stats.totalActual, stats.totalRegistered - stats.totalActual],
            backgroundColor: ['#0CBFA1', '#E2E8F0'],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };
    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%', // Делает из пирога пончик
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } }
    };

    return (
        <div className="analytics-page fade-in">
            <Bubbles />
            <div className="analytics-wrapper">
                
                <div className="analytics-header">
                    <h1>Дашборд</h1>
                    <p>Ключевые метрики Студенческого совета</p>
                </div>

                <div className="kpi-grid">
                    <div className="kpi-card">
                        <div className="kpi-icon" style={{ background: 'rgba(12, 191, 161, 0.1)', color: '#0CBFA1' }}><FontAwesomeIcon icon={faUsers} /></div>
                        <div className="kpi-info">
                            <span className="kpi-label">Участники</span>
                            <span className="kpi-value">{stats.totalUsers}</span>
                            <span className="kpi-sub">Активных: {stats.activeUsers}</span>
                        </div>
                    </div>
                    
                    <div className="kpi-card">
                        <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><FontAwesomeIcon icon={faCalendarAlt} /></div>
                        <div className="kpi-info">
                            <span className="kpi-label">Мероприятия</span>
                            <span className="kpi-value">{stats.totalEvents}</span>
                            <span className="kpi-sub">За всё время</span>
                        </div>
                    </div>

                    <div className="kpi-card">
                        <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><FontAwesomeIcon icon={faMoneyBillWave} /></div>
                        <div className="kpi-info">
                            <span className="kpi-label">Бюджет</span>
                            <span className="kpi-value">{stats.totalBudget.toLocaleString()} ₽</span>
                            <span className="kpi-sub">Ср. чек: {stats.avgBudget.toLocaleString()} ₽</span>
                        </div>
                    </div>

                    <div className="kpi-card">
                        <div className="kpi-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}><FontAwesomeIcon icon={faUserCheck} /></div>
                        <div className="kpi-info">
                            <span className="kpi-label">Средняя явка</span>
                            <span className="kpi-value">{stats.averageAttendanceRate}%</span>
                            <span className="kpi-sub">{stats.totalActual} из {stats.totalRegistered}</span>
                        </div>
                    </div>
                </div>

                <div className="charts-grid">
                    <div className="chart-card wide">
                        <div className="chart-header">
                            <h3><FontAwesomeIcon icon={faArrowTrendUp} /> Динамика мероприятий</h3>
                        </div>
                        <div className="chart-container">
                            <Line data={lineData} options={lineOptions} />
                        </div>
                    </div>

                    <div className="chart-card">
                        <div className="chart-header">
                            <h3><FontAwesomeIcon icon={faChartLine} /> Общая явка</h3>
                        </div>
                        <div className="chart-container doughnut-container">
                            <Doughnut data={doughnutData} options={doughnutOptions} />
                            <div className="doughnut-center">
                                <span>{stats.averageAttendanceRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="tables-grid">
                    <div className="table-card">
                        <div className="chart-header">
                            <h3><FontAwesomeIcon icon={faTrophy} /> Топ активистов</h3>
                        </div>
                        <div className="table-responsive">
                            <table className="analytics-table">
                                <thead>
                                    <tr>
                                        <th>Участник</th>
                                        <th>Уровень</th>
                                        <th>Опыт (XP)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.topUsers.map((u, i) => (
                                        <tr key={u.id}>
                                            <td>
                                                <div className="user-rank">
                                                    <span className={`rank-badge rank-${i+1}`}>{i+1}</span>
                                                    {u.name}
                                                </div>
                                            </td>
                                            <td><span className="level-pill">Lvl {u.level}</span></td>
                                            <td><strong>{u.experience}</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Топ мероприятий */}
                    <div className="table-card">
                        <div className="chart-header">
                            <h3><FontAwesomeIcon icon={faCalendarAlt} /> Лучшие мероприятия</h3>
                        </div>
                        <div className="table-responsive">
                            <table className="analytics-table">
                                <thead>
                                    <tr>
                                        <th>Название</th>
                                        <th>Записалось</th>
                                        <th>Явка</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.topEvents.map((e, i) => (
                                        <tr key={i}>
                                            <td><div className="event-title-cell">{e.title}</div></td>
                                            <td>{e.actual} / {e.registered}</td>
                                            <td>
                                                <span className="rate-pill" style={{ 
                                                    background: e.rate > 75 ? '#d1fae5' : e.rate > 50 ? '#fef3c7' : '#fee2e2',
                                                    color: e.rate > 75 ? '#065f46' : e.rate > 50 ? '#92400e' : '#991b1b'
                                                }}>
                                                    {e.rate.toFixed(0)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}