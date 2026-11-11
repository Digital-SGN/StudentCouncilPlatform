import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faLeaf, faChartSimple, faGem, faCrown, faDiamond, faInfinity,
    faEnvelope, faUsers, faPhone, faComment, 
    faBirthdayCake, faCalendarAlt,
    faMoneyBillWave, faCog, faQuoteLeft, faChartLine
} from '@fortawesome/free-solid-svg-icons';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';  
import { API } from '../api';
import { ROLE_STYLES } from '../constants/roles';
import { AVAILABLE_BANNERS } from '../constants/banners';
import { useAuth } from '../context/AuthContext';
import Bubbles from '../components/Bubbles';
import Alert from '../components/Alert';
import UserFormModal from '../components/modals/UserFormModal';
import '../css/ProfilePage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ProfilePage() {
    const { id } = useParams();
    const { user: currentUser } = useAuth();

    const userId = id ?? currentUser?.id;
    const isAdmin = currentUser?.role === 'Admin';
    const isLeader = currentUser?.role === 'Leader';
    const isOwnProfile = currentUser?.id != null && String(currentUser.id) === String(userId);
    const canEdit = isOwnProfile || isAdmin;

    const [user, setUser] = useState(null);
    const [badges, setBadges] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        loadProfile();
    }, [userId]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const userResult = await API.getUser(userId);
            if (!userResult.ok) {
                setError(userResult.data?.error || 'Ошибка загрузки');
                return;
            }
            setUser(userResult.data);

            const badgesResult = await API.getBadgesByUser(userId);
            if (badgesResult.ok) setBadges(badgesResult.data.badges || []);

            const eventsResult = await API.getEvents();
            if (eventsResult.ok) setAllEvents(eventsResult.data.events || []);
        } catch (err) {
            setError('Ошибка загрузки профиля');
        } finally {
            setLoading(false);
        }
    };

    const downloadBadge = async (badge) => {
        const fileName = `${badge.eventTitle}_${badge.userName}_${badge.role}`
            .replace(/[^\wа-яё]/gi, '_')
            .toLowerCase();
        const result = await API.downloadBadge(badge.id, fileName);
        if (!result) alert('Ошибка скачивания бейджа');
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Загрузка...</p></div>;
    if (error) return <Alert type="danger" message={error} />;
    if (!user) return <div className="alert alert-danger">Пользователь не найден</div>;
    if (!isOwnProfile && !isAdmin && !isLeader) return <div className="alert alert-danger">Нет прав на просмотр</div>;

    const xpPerLevel = 250;
    const currentLevel = Math.floor(user.experiencePoints / xpPerLevel) + 1;
    const xpInCurrentLevel = user.experiencePoints % xpPerLevel;
    const xpPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpPerLevel * 100)));

    const isDefaultBanner = !user.bannerPath || user.bannerPath === 'default';
    const currentBanner = AVAILABLE_BANNERS.find(b => b.id === user.bannerPath);
    const bannerStyle = (!isDefaultBanner && currentBanner) 
        ? { backgroundImage: `url(${currentBanner.url})` } 
        : {};

    const getTimelineEvents = () => {
        const events = [];
        if (user.joinedAt) {
            events.push({ date: new Date(user.joinedAt), title: 'Вступление в студсовет', type: 'join', color: '#f59e0b' });
        }
        badges.forEach(badge => {
            const event = allEvents.find(e => e.id === badge.eventId);
            if (event && event.eventDate) {
                events.push({
                    date: new Date(event.eventDate), title: event.title, role: badge.role,
                    type: 'event', color: ROLE_STYLES[badge.role]?.background || '#94a3b8',
                });
            }
        });
        return events.sort((a, b) => b.date - a.date);
    };
    const timelineEvents = getTimelineEvents();

    const getRoleData = () => {
        const roleCount = {};
        badges.forEach(b => { roleCount[b.role] = (roleCount[b.role] || 0) + 1; });

        const shortRoleNames = {
            'Ответственный за направление': 'Отв. за напр.',
            'Главный организатор': 'Гл. орг.',
            'Организатор': 'Орг.',
            'Техпод': 'Техпод',
            'Участник': 'Участник',
            'Волонтер': 'Волонтер',
            'Медиа': 'Медиа',
            'Спикер': 'Спикер',
            'Куратор': 'Куратор',
            'Ведущий': 'Ведущий'
        };

        const labels = Object.keys(roleCount).map(role => shortRoleNames[role] || role);

        return {
            labels: labels,
            datasets: [{
                label: 'Количество',
                data: Object.values(roleCount),
                backgroundColor: ['#0CBFA1', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#DDA0DD'],
                borderRadius: 8,
            }]
        };
    };

    const barData = badges.length > 0 ? getRoleData() : null;
    const barOptions = {
        responsive: true, 
        maintainAspectRatio: false,
        plugins: { 
            legend: { display: false }, 
            title: { display: false } 
        },
        scales: { 
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
            x: { 
                ticks: {
                    maxRotation: 45, 
                    minRotation: 0  
                }
            }
        }
    };

    return (
        <div className="profile-page fade-in">
            <Bubbles />
            <div className="profile-wrapper">
                <div className="profile-card">
                    
                    <div className="profile-banner" style={bannerStyle}>
                        <div className="banner-overlay"></div>
                    </div>

                    <div className="profile-container">
                        <div className="profile-header">
                            <div className="avatar-wrapper">
                                <div className="avatar-shine">
                                    {user.avatarPath ? (
                                        <img src={user.avatarPath} className="avatar-img" alt="Аватар" />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {user.firstName?.[0]}{user.lastName?.[0]}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <h2 className="profile-fullname">{user.lastName} {user.firstName} {user.patronymic || ''}</h2>
                            
                            <div className="profile-actions-row">
                                <span className="profile-role-badge">
                                    {user.role === 'Admin' ? 'Администратор' : (user.role === 'Leader' ? 'Руководитель' : 'Участник')}
                                </span>
                                
                                {canEdit && (
                                    <button className="btn-settings" onClick={() => setShowEditModal(true)}>
                                        <FontAwesomeIcon icon={faCog} /> Настройки
                                    </button>
                                )}
                            </div>
                        </div>

                        {user.aboutMe ? (
                            <div className="about-me-card">
                                <FontAwesomeIcon icon={faQuoteLeft} className="quote-icon" />
                                <p>{user.aboutMe}</p>
                            </div>
                        ) : canEdit && (
                            <div className="about-me-empty" onClick={() => setShowEditModal(true)}>
                                + Добавить информацию о себе
                            </div>
                        )}

                        <div className="profile-stats-row">
                            <div className="level-card">
                                <div className={`level-icon-wrapper ${getLevelBorderClass(currentLevel)}`}>
                                    {getLevelIcon(currentLevel)}
                                </div>
                                <div className="level-details">
                                    <div className="level-badge">
                                        <span className="level-number">Уровень {currentLevel}</span>
                                        <span className="level-name">{getLevelName(currentLevel)}</span>
                                    </div>
                                    <div className="xp-bar"><div className="xp-fill" style={{ width: `${xpPercent}%` }}></div></div>
                                    <div className="xp-text">{xpInCurrentLevel} / {xpPerLevel} XP до {currentLevel + 1} ур.</div>
                                </div>
                            </div>
                            <div className="balance-card">
                                <div className="balance-icon"><FontAwesomeIcon icon={faMoneyBillWave} /></div>
                                <div className="balance-text">
                                    <div className="balance-value">{user.balance}</div>
                                    <div className="balance-label">Баллов</div>
                                </div>
                            </div>
                        </div>

                        <div className="info-grid">
                            <div className="info-item"><div className="info-icon"><FontAwesomeIcon icon={faEnvelope} /></div><div className="info-content"><div className="info-label">Email</div><div className="info-value">{user.email}</div></div></div>
                            <div className="info-item"><div className="info-icon"><FontAwesomeIcon icon={faUsers} /></div><div className="info-content"><div className="info-label">Группа</div><div className="info-value">{user.group || '—'}</div></div></div>
                            <div className="info-item"><div className="info-icon"><FontAwesomeIcon icon={faPhone} /></div><div className="info-content"><div className="info-label">Телефон</div><div className="info-value">{user.phoneNumber || '—'}</div></div></div>
                            <div className="info-item"><div className="info-icon"><FontAwesomeIcon icon={faComment} /></div><div className="info-content"><div className="info-label">Telegram</div><div className="info-value">{user.telegram || '—'}</div></div></div>
                            <div className="info-item"><div className="info-icon"><FontAwesomeIcon icon={faBirthdayCake} /></div><div className="info-content"><div className="info-label">Дата рождения</div><div className="info-value">{user.birthDate ? new Date(user.birthDate).toLocaleDateString('ru-RU') : '—'}</div></div></div>
                            <div className="info-item"><div className="info-icon"><FontAwesomeIcon icon={faCalendarAlt} /></div><div className="info-content"><div className="info-label">В совете с</div><div className="info-value">{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('ru-RU') : '—'}</div></div></div>
                        </div>

                        <div className="charts-section">
                            {barData && (
                                <div className="chart-card">
                                    <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <FontAwesomeIcon icon={faChartLine} /> Статистика
                                    </h3>
                                    <div className="chart-wrapper">
                                        <Bar data={barData} options={barOptions} />
                                    </div>
                                </div>
                            )}

                            <div className="chart-card timeline-card">
                                <h4>Хронология событий</h4>
                                {timelineEvents.length === 0 ? (
                                    <p className="no-timeline">Пока нет событий</p>
                                ) : (
                                    <div className="timeline-scroll-container">
                                        <div className="timeline-vertical">
                                            {timelineEvents.map((event, idx) => (
                                                <div key={idx} className="timeline-item">
                                                    <div className="timeline-marker">
                                                        <div className="timeline-dot" style={{ backgroundColor: event.color }} />
                                                    </div>
                                                    <div className="timeline-body">
                                                        <div className="timeline-date">
                                                            {event.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </div>
                                                        <div className="timeline-title">{event.title}</div>
                                                        {event.type === 'event' && (
                                                            <div className="timeline-role" style={{ color: event.color }}>Роль: {event.role}</div>
                                                        )}
                                                        {event.type === 'join' && <div className="timeline-role join-text">Начало пути</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {badges.length > 0 && (
                            <div className="badges-section">
                                <div className="badges-title">Мои бейджи</div>
                                <div className="badges-list">
                                    {badges.map(badge => (
                                        badge.filePath ? (
                                            <a key={badge.id} href="#" className="badge-link" onClick={(e) => { e.preventDefault(); downloadBadge(badge); }}>{badge.eventTitle.toLowerCase()}_{badge.role.toLowerCase()}.pdf</a>
                                        ) : (
                                            <span key={badge.id} className="badge-link pending">{badge.eventTitle.toLowerCase()}_{badge.role.toLowerCase()}.pdf (ожидает)</span>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <UserFormModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                userId={userId}
                isAdmin={isAdmin}
                isLeader={isLeader}
                isOwnProfile={isOwnProfile}
                onSuccess={loadProfile}
            />
        </div>
    );
}

function getLevelBorderClass(level) {
    if (level >= 1 && level <= 3) return 'level-bronze';
    if (level >= 4 && level <= 5) return 'level-silver';
    if (level >= 6 && level <= 8) return 'level-gold';
    if (level >= 9 && level <= 12) return 'level-platinum';
    if (level >= 13) return 'level-legend';
    return '';
}

function getLevelIcon(level) {
    if (level >= 1 && level <= 3) return <FontAwesomeIcon icon={faLeaf} style={{ color: '#cd7f32' }} />;
    if (level >= 4 && level <= 5) return <FontAwesomeIcon icon={faChartSimple} style={{ color: '#64748b' }} />;
    if (level >= 6 && level <= 8) return <FontAwesomeIcon icon={faGem} style={{ color: '#eab308' }} />;
    if (level >= 9 && level <= 12) return <FontAwesomeIcon icon={faCrown} style={{ color: '#94a3b8' }} />;
    if (level >= 13 && level <= 15) return <FontAwesomeIcon icon={faDiamond} style={{ color: '#38bdf8' }} />;
    return <FontAwesomeIcon icon={faInfinity} style={{ color: '#f97316' }} />;
}

function getLevelName(level) {
    if (level >= 1 && level <= 3) return 'Новичок';
    if (level >= 4 && level <= 5) return 'Практик';
    if (level >= 6 && level <= 8) return 'Профессионал';
    if (level >= 9 && level <= 12) return 'Мастер';
    if (level >= 13 && level <= 15) return 'Грандмастер';
    return 'Легенда';
}