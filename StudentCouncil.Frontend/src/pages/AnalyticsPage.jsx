import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUsers, faCalendarAlt, faIdCard, faChartLine, 
    faTrophy, faMedal, faUserGraduate, faLayerGroup,
    faCalendarWeek, faUserPlus, faUserCheck, faMoneyBillWave  
} from '@fortawesome/free-solid-svg-icons';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import Bubbles from '../components/Bubbles';
import '../css/AnalyticsPage.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

export default function AnalyticsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const isLeader = user?.role === 'Leader';
    const canView = isAdmin || isLeader;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalEvents: 0,
        totalBadges: 0,
        avgLevel: 0,
        totalBalance: 0,
        totalRegistered: 0,
        totalActual: 0,
        averageAttendanceRate: 0,
        topEventsByAttendance: [],
        roleDistribution: {},
        topUsersByBadges: [],
        eventsPerMonth: [],
        totalBudget: 0,
        avgBudget: 0,
        topEventsByBudget: []
    });

    useEffect(() => {
        if (canView) {
            loadAnalytics();
        } else {
            setLoading(false);
        }
    }, [canView]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            const usersResult = await API.getUsers();
            if (!usersResult.ok) throw new Error(usersResult.data?.error || 'Ошибка загрузки пользователей');
            const users = usersResult.data.users || [];

            const eventsResult = await API.getEvents();
            if (!eventsResult.ok) throw new Error(eventsResult.data?.error || 'Ошибка загрузки мероприятий');
            const events = eventsResult.data.events || [];

            let totalRegistered = 0;
            let totalActual = 0;
            const eventsAttendance = [];

            events.forEach(e => {
                const registered = e.registeredParticipants || 0;
                const actual = e.actualParticipants || 0;
                totalRegistered += registered;
                totalActual += actual;
                const rate = registered > 0 ? (actual / registered) * 100 : 0;
                eventsAttendance.push({
                    id: e.id,
                    title: e.title,
                    registered,
                    actual,
                    rate
                });
            });

            const averageAttendanceRate = events.length > 0 ? (totalActual / totalRegistered * 100).toFixed(1) : 0;
            const topEventsByAttendance = [...eventsAttendance].sort((a, b) => b.rate - a.rate).slice(0, 5);

            const badgesPromises = users.map(u => API.getBadgesByUser(u.id));
            const badgesResults = await Promise.all(badgesPromises);
            const allBadges = [];
            badgesResults.forEach((res, idx) => {
                if (res.ok && res.data.badges) {
                    allBadges.push(...res.data.badges);
                } else {
                    console.warn(`Не удалось загрузить бейджи для пользователя ${users[idx].id}`);
                }
            });

            const activeUsers = users.filter(u => u.isActive !== false).length;
            const totalUsers = users.length;
            const totalEvents = events.length;
            const totalBadges = allBadges.length;

            const sumLevel = users.reduce((sum, u) => sum + (u.level || 0), 0);
            const avgLevel = totalUsers ? (sumLevel / totalUsers).toFixed(1) : 0;

            const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);

            const roleDist = {};
            allBadges.forEach(b => {
                const role = b.role;
                roleDist[role] = (roleDist[role] || 0) + 1;
            });

            const userBadgeCount = new Map();
            allBadges.forEach(b => {
                userBadgeCount.set(b.userId, (userBadgeCount.get(b.userId) || 0) + 1);
            });
            const topUsers = users
                .map(u => ({
                    id: u.id,
                    name: `${u.lastName} ${u.firstName} ${u.patronymic || ''}`.trim(),
                    badgeCount: userBadgeCount.get(u.id) || 0,
                    level: u.level || 0,
                    balance: u.balance || 0
                }))
                .sort((a, b) => b.badgeCount - a.badgeCount)
                .slice(0, 10);

            const eventsByMonth = {};
            events.forEach(e => {
                if (e.eventDate) {
                    const date = new Date(e.eventDate);
                    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
                    eventsByMonth[key] = (eventsByMonth[key] || 0) + 1;
                }
            });
            const sortedMonths = Object.keys(eventsByMonth).sort();
            const eventsPerMonth = sortedMonths.map(month => ({
                month,
                count: eventsByMonth[month]
            }));

            let totalBudget = 0;
            let eventsWithBudget = 0;
            const eventsWithBudgetList = [];
            events.forEach(e => {
                if (e.budget && e.budget > 0) {
                    totalBudget += e.budget;
                    eventsWithBudget++;
                    eventsWithBudgetList.push({ id: e.id, title: e.title, budget: e.budget });
                }
            });
            const avgBudget = eventsWithBudget ? (totalBudget / eventsWithBudget).toFixed(2) : 0;
            const topEventsByBudget = [...eventsWithBudgetList]
                .sort((a, b) => b.budget - a.budget)
                .slice(0, 5);

            setStats({
                totalUsers,
                activeUsers,
                totalEvents,
                totalBadges,
                avgLevel,
                totalBalance,
                totalRegistered,
                totalActual,
                averageAttendanceRate,
                topEventsByAttendance,
                roleDistribution: roleDist,
                topUsersByBadges: topUsers,
                eventsPerMonth,
                totalBudget,
                avgBudget,
                eventsWithBudget,
                topEventsByBudget
            });

        } catch (err) {
            console.error(err);
            setError(err.message || 'Ошибка загрузки аналитики');
        } finally {
            setLoading(false);
        }
    };

    if (!canView) {
        return <div className="alert alert-danger">Доступ запрещён</div>;
    }
    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Загрузка аналитики...</p></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    const pieLabels = Object.keys(stats.roleDistribution);
    const pieDataValues = Object.values(stats.roleDistribution);
    const pieData = {
        labels: pieLabels,
        datasets: [{
            data: pieDataValues,
            backgroundColor: ['#0CBFA1', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#DDA0DD', '#F39C12', '#3498DB'],
            borderWidth: 0
        }]
    };
    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'right', labels: { font: { size: 12 } } },
            tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} (${((ctx.raw / stats.totalBadges)*100).toFixed(1)}%)` } }
        }
    };

    const lineLabels = stats.eventsPerMonth.map(item => item.month);
    const lineCounts = stats.eventsPerMonth.map(item => item.count);
    const lineData = {
        labels: lineLabels,
        datasets: [{
            label: 'Количество мероприятий',
            data: lineCounts,
            borderColor: '#0CBFA1',
            backgroundColor: 'rgba(12, 191, 161, 0.1)',
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#0CBFA1',
            pointRadius: 4
        }]
    };
    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { mode: 'index' }
        },
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
    };

    const topNames = stats.topUsersByBadges.map(u => u.name.split(' ')[1] || u.name);
    const topBadgeCounts = stats.topUsersByBadges.map(u => u.badgeCount);
    const barData = {
        labels: topNames,
        datasets: [{
            label: 'Количество мероприятий',
            data: topBadgeCounts,
            backgroundColor: '#0CBFA1',
            borderRadius: 8
        }]
    };
    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    };

    const budgetBarLabels = stats.topEventsByBudget.map(e => e.title.length > 20 ? e.title.slice(0,17)+'...' : e.title);
    const budgetBarValues = stats.topEventsByBudget.map(e => e.budget);
    const budgetBarData = {
        labels: budgetBarLabels,
        datasets: [{
            label: 'Бюджет (₽)',
            data: budgetBarValues,
            backgroundColor: '#F39C12',
            borderRadius: 8
        }]
    };
    const budgetBarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.raw.toLocaleString()} ₽` } } },
        scales: { y: { beginAtZero: true, ticks: { callback: (value) => value.toLocaleString() } } }
    };

    return (
        <div className="global-analytics-page fade-in">
            <Bubbles />
            <div className="analytics-wrapper">
                <div className="analytics-card">
                    <h1 className="analytics-title">Глобальная аналитика</h1>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon"><FontAwesomeIcon icon={faUsers} /></div>
                            <div className="stat-value">{stats.totalUsers}</div>
                            <div className="stat-label">Участников</div>
                            <div className="stat-sub">Активных: {stats.activeUsers}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon"><FontAwesomeIcon icon={faCalendarAlt} /></div>
                            <div className="stat-value">{stats.totalEvents}</div>
                            <div className="stat-label">Мероприятий</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon"><FontAwesomeIcon icon={faIdCard} /></div>
                            <div className="stat-value">{stats.totalBadges}</div>
                            <div className="stat-label">Бейджей</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon"><FontAwesomeIcon icon={faUserGraduate} /></div>
                            <div className="stat-value">{stats.avgLevel}</div>
                            <div className="stat-label">Средний уровень</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon"><FontAwesomeIcon icon={faMedal} /></div>
                            <div className="stat-value">{stats.totalBalance}</div>
                            <div className="stat-label">Общий баланс</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon"><FontAwesomeIcon icon={faMoneyBillWave} /></div>
                            <div className="stat-value">{stats.totalBudget.toLocaleString()} ₽</div>
                            <div className="stat-label">Общий бюджет</div>
                            <div className="stat-sub">Ср. бюджет: {stats.avgBudget.toLocaleString()} ₽</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon"><FontAwesomeIcon icon={faUserPlus} /></div>
                            <div className="stat-value">{stats.totalRegistered}</div>
                            <div className="stat-label">Всего записей</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon"><FontAwesomeIcon icon={faUserCheck} /></div>
                            <div className="stat-value">{stats.totalActual}</div>
                            <div className="stat-label">Всего пришло</div>
                            <div className="stat-sub">Явка: {stats.averageAttendanceRate}%</div>
                        </div>
                        
                    </div>

                    <div className="charts-grid">
                        {pieLabels.length > 0 && (
                            <div className="chart-card">
                                <h3><FontAwesomeIcon icon={faLayerGroup} /> Распределение ролей</h3>
                                <div style={{ height: '300px' }}>
                                    <Pie data={pieData} options={pieOptions} />
                                </div>
                            </div>
                        )}

                        {stats.eventsPerMonth.length > 0 && (
                            <div className="chart-card">
                                <h3><FontAwesomeIcon icon={faCalendarWeek} /> Динамика мероприятий</h3>
                                <div style={{ height: '300px' }}>
                                    <Line data={lineData} options={lineOptions} />
                                </div>
                            </div>
                        )}

                        {stats.topEventsByBudget.length > 0 && (
                            <div className="chart-card">
                                <h3><FontAwesomeIcon icon={faMoneyBillWave} /> Топ мероприятий по бюджету</h3>
                                <div style={{ height: '300px' }}>
                                    <Bar data={budgetBarData} options={budgetBarOptions} />
                                </div>
                                <div className="top-users-table" style={{ marginTop: '16px' }}>
                                    <table className="simple-table">
                                        <thead>
                                            <tr><th>Мероприятие</th><th>Бюджет (₽)</th></tr>
                                        </thead>
                                        <tbody>
                                            {stats.topEventsByBudget.map(e => (
                                                <tr key={e.id}>
                                                    <td>{e.title}</td>
                                                    <td>{e.budget.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {stats.topEventsByAttendance.length > 0 && (
                            <div className="chart-card">
                                <h3><FontAwesomeIcon icon={faChartLine} /> Топ мероприятий по посещаемости</h3>
                                <div className="top-users-table">
                                    <table className="simple-table">
                                        <thead>
                                            <tr>
                                                <th>Мероприятие</th>
                                                <th>Записалось</th>
                                                <th>Пришло</th>
                                                <th>Явка</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.topEventsByAttendance.map(e => (
                                                <tr key={e.id}>
                                                    <td>{e.title}</td>
                                                    <td>{e.registered}</td>
                                                    <td>{e.actual}</td>
                                                    <td>{e.rate.toFixed(1)}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {stats.topUsersByBadges.length > 0 && (
                            <div className="chart-card full-width">
                                <h3><FontAwesomeIcon icon={faTrophy} /> Топ участников по активности</h3>
                                <div style={{ height: '400px' }}>
                                    <Bar data={barData} options={barOptions} />
                                </div>
                                <div className="top-users-table">
                                    <table className="simple-table">
                                        <thead>
                                            <tr><th>Участник</th><th>Мероприятий</th><th>Уровень</th><th>Баллы</th></tr>
                                        </thead>
                                        <tbody>
                                            {stats.topUsersByBadges.map(u => (
                                                <tr key={u.id}>
                                                    <td>{u.name}</td>
                                                    <td>{u.badgeCount}</td>
                                                    <td>{u.level}</td>
                                                    <td>{u.balance}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}