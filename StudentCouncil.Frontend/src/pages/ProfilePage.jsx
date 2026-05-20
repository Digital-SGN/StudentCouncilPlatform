import { useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faLeaf, faChartSimple, faGem, faCrown, faDiamond, faInfinity,
    faEnvelope, faUsers, faStar, faPhone, faComment, 
    faShirt, faBirthdayCake, faCalendarAlt,
    faCamera, faTrashAlt,  
    faMoneyBillWave, faEdit, faChartLine
} from '@fortawesome/free-solid-svg-icons';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    Filler,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';
import { Radar, Bar, Line } from 'react-chartjs-2';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import Bubbles from '../components/Bubbles';
import ConfirmModal from '../components/modals/ConfirmDialogModal';
import '../css/ProfilePage.css';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    Filler,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

const roleColors = {
    'Главный организатор': '#0CBFA1',
    'Организатор': '#148C9C',
    'Медиа': '#FF6B6B',
    'Техпод': '#4ECDC4',
    'Волонтёр': '#FFE66D',
};

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

export default function ProfilePage() {
    const { id } = useParams();
    const { user: currentUser } = useAuth();

    const userId = id || currentUser?.id;
    const isAdmin = currentUser?.role === 'Admin';
    const isLeader = currentUser?.role === 'Leader';
    const isAdminOrLeader = isAdmin || isLeader;

    const [user, setUser] = useState(null);
    const [badges, setBadges] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            if (badgesResult.ok) {
                setBadges(badgesResult.data.badges || []);
            }
            
            const eventsResult = await API.getEvents();
            if (eventsResult.ok) {
                setAllEvents(eventsResult.data.events || []);
            }
        } catch (err) {
            setError('Ошибка загрузки профиля');
        } finally {
            setLoading(false);
        }
    };

    const uploadAvatar = async (file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('avatar', file);
        const result = await API.uploadAvatar(userId, formData);
        if (result.ok) {
            loadProfile(); 
        } else {
            alert(result.error || 'Ошибка загрузки');
        }
    };

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null });

    const deleteAvatar = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Удаление аватара',
            message: 'Вы действительно хотите удалить фотографию профиля?',
            confirmText: 'Удалить',
            onConfirm: async () => {
                const result = await API.deleteAvatar(userId);
                if (result.ok) {
                    loadProfile();
                } else {
                    alert(result.error || 'Ошибка удаления');
                }
                setConfirmModal({ isOpen: false });
            }
        });
    };

    const downloadBadge = async (badge) => {
        const fileName = `${badge.eventTitle}_${badge.userName}_${badge.role}`
            .replace(/[^\wа-яё]/gi, '_')
            .toLowerCase();
        const result = await API.downloadBadge(badge.id, fileName);
        if (!result) alert('Ошибка скачивания бейджа');
    };

    const showEditProfileModal = async () => {
        const result = await API.getUser(userId);
        if (!result.ok) {
            alert('Ошибка загрузки данных');
            return;
        }
        const userData = result.data;
        
        const modalHtml = `
            <div id="editProfileModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Редактирование профиля</h3>
                        <span class="modal-close" onclick="document.getElementById('editProfileModal')?.remove()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="editProfileForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Имя *</label>
                                    <input type="text" name="firstName" value="${escapeHtml(userData.firstName)}" required>
                                </div>
                                <div class="form-group">
                                    <label>Фамилия *</label>
                                    <input type="text" name="lastName" value="${escapeHtml(userData.lastName)}" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Отчество</label>
                                <input type="text" name="patronymic" value="${escapeHtml(userData.patronymic || '')}">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Email *</label>
                                    <input type="email" name="email" value="${escapeHtml(userData.email)}" required>
                                </div>
                                <div class="form-group">
                                    <label>Группа</label>
                                    <input type="text" name="group" value="${escapeHtml(userData.group || '')}">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Телефон</label>
                                    <input type="tel" name="phoneNumber" value="${escapeHtml(userData.phoneNumber || '')}">
                                </div>
                                <div class="form-group">
                                    <label>Telegram</label>
                                    <input type="text" name="telegram" value="${escapeHtml(userData.telegram || '')}">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Размер одежды</label>
                                    <select name="clothingSize">
                                        <option value="">Не указан</option>
                                        <option value="XS" ${userData.clothingSize === 'XS' ? 'selected' : ''}>XS</option>
                                        <option value="S" ${userData.clothingSize === 'S' ? 'selected' : ''}>S</option>
                                        <option value="M" ${userData.clothingSize === 'M' ? 'selected' : ''}>M</option>
                                        <option value="L" ${userData.clothingSize === 'L' ? 'selected' : ''}>L</option>
                                        <option value="XL" ${userData.clothingSize === 'XL' ? 'selected' : ''}>XL</option>
                                        <option value="XXL" ${userData.clothingSize === 'XXL' ? 'selected' : ''}>XXL</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Дата рождения</label>
                                    <input type="date" name="birthDate" value="${userData.birthDate ? userData.birthDate.split('T')[0] : ''}">
                                </div>
                            </div>
                            ${isAdminOrLeader && currentUser?.id !== userId ? `
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Роль</label>
                                        <select name="role">
                                            <option value="Member" ${userData.role === 'Member' ? 'selected' : ''}>Участник</option>
                                            <option value="Leader" ${userData.role === 'Leader' ? 'selected' : ''}>Руководство</option>
                                            <option value="Admin" ${userData.role === 'Admin' ? 'selected' : ''}>Админ</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Статус</label>
                                        <select name="isActive">
                                            <option value="true" ${userData.isActive ? 'selected' : ''}>Активен</option>
                                            <option value="false" ${!userData.isActive ? 'selected' : ''}>Заблокирован</option>
                                        </select>
                                    </div>
                                </div>
                            ` : ''}
                            <div id="modalErrorMessage" class="error-message" style="display: none;"></div>
                            <div class="form-actions">
                                <button type="submit" class="btn-save">Сохранить</button>
                                <button type="button" onclick="document.getElementById('editProfileModal')?.remove()" class="btn-cancel">Отмена</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const form = document.getElementById('editProfileForm');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const formData = new FormData(form);
            const data = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                patronymic: formData.get('patronymic'),
                email: formData.get('email'),
                group: formData.get('group'),
                phoneNumber: formData.get('phoneNumber'),
                telegram: formData.get('telegram'),
                clothingSize: formData.get('clothingSize'),
                birthDate: formData.get('birthDate') || null,
            };
            
            if (isAdminOrLeader && currentUser?.id !== userId) {
                data.role = formData.get('role');
                data.isActive = formData.get('isActive') === 'true';
            }
            
            const errorDiv = document.getElementById('modalErrorMessage');
            errorDiv.style.display = 'none';
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Сохранение...';
            submitBtn.disabled = true;
            
            const result = await API.updateUser(userId, data);
            
            if (result.ok) {
                document.getElementById('editProfileModal')?.remove();
                loadProfile(); 
            } else {
                errorDiv.textContent = result.data?.error || 'Ошибка сохранения';
                errorDiv.style.display = 'block';
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Загрузка...</p></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!user) return <div className="alert alert-danger">Пользователь не найден</div>;

    const isOwnProfile = currentUser?.id === user.id;
    if (!isOwnProfile && !isAdmin && !isLeader) {
        return <div className="alert alert-danger">У вас нет прав на просмотр этого профиля</div>;
    }

    const xpPerLevel = 250;
    const currentLevelXP = (user.level - 1) * xpPerLevel;
    const xpForCurrentLevel = user.experiencePoints - currentLevelXP;
    const nextLevelXP = user.level * xpPerLevel;
    const xpPercent = Math.min(100, Math.max(0, (xpForCurrentLevel / xpPerLevel * 100)));
    const levelBorderClass = getLevelBorderClass(user.level);
    const levelName = getLevelName(user.level);
    const levelIcon = getLevelIcon(user.level);

    const userEvents = allEvents.filter(e => badges.some(b => b.eventId === e.id));
    
    const radarData = {
        labels: ['Участие', 'Задачи', 'Организация', 'Бейджи', 'Опыт'],
        datasets: [{
            label: 'Достижения',
            data: [
                user.eventsAttended || 0,
                user.tasksCompleted || 0,
                user.eventsOrganized || 0,
                badges.length,
                Math.min(user.experiencePoints / 100, 10)
            ],
            backgroundColor: 'rgba(12, 191, 161, 0.2)',
            borderColor: '#0CBFA1',
            borderWidth: 2,
            pointBackgroundColor: '#0CBFA1',
            pointBorderColor: '#fff',
            pointRadius: 5,
            pointHoverRadius: 8,
        }]
    };

    const radarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                beginAtZero: true,
                ticks: { stepSize: 1, color: '#2d3748' },
                grid: { color: 'rgba(0,0,0,0.1)' },
                pointLabels: { color: '#0CBFA1', font: { size: 12, weight: 'bold' } }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#fff',
                titleColor: '#2d3748',
                bodyColor: '#4a5568',
                borderColor: '#0CBFA1',
                borderWidth: 1
            }
        }
    };

    const getTimelineEvents = () => {
        const events = [];

        if (user.joinedAt) {
            events.push({
                date: new Date(user.joinedAt),
                title: 'Вступление в студсовет',
                type: 'join',
                color: '#f59e0b', // оранжевый
            });
        }

        badges.forEach(badge => {
            const event = allEvents.find(e => e.id === badge.eventId);
            if (event && event.eventDate) {
                events.push({
                    date: new Date(event.eventDate),
                    title: event.title,
                    role: badge.role,
                    type: 'event',
                    color: roleColors[badge.role] || '#94a3b8', 
                });
            }
        });
        events.sort((a, b) => a.date - b.date);
        return events;
    };

    const getRoleData = () => {
        const roleCount = {};
        badges.forEach(b => {
            roleCount[b.role] = (roleCount[b.role] || 0) + 1;
        });
        
        return {
            labels: Object.keys(roleCount),
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
            title: { display: true, text: 'Распределение ролей', color: 'black', font: { size: 18 } }
        },
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
    };

    const timelineEvents = getTimelineEvents();

    return (
        <div className="profile-page fade-in">
            <Bubbles />
            <div className="profile-wrapper">
                <div className="profile-card">
                    <div className="profile-container">
                     <div className="profile-header">
                        <div className={`avatar-wrapper ${levelBorderClass}`}>
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
                        
                        <div className="avatar-actions-compact">
                            <button 
                                className="avatar-small-btn upload" 
                                onClick={() => document.getElementById('avatarUpload').click()}
                            >
                                <FontAwesomeIcon icon={faCamera} />
                                <span>Загрузить</span>
                            </button>
                            {user.avatarPath && (
                                <button 
                                    className="avatar-small-btn delete" 
                                    onClick={deleteAvatar}
                                >
                                    <FontAwesomeIcon icon={faTrashAlt} />
                                    <span>Удалить</span>
                                </button>
                            )}
                        </div>
                        
                        <form id="avatarUploadForm" style={{ display: 'none' }}>
                            <input 
                                type="file" 
                                id="avatarUpload" 
                                name="avatar" 
                                accept="image/*" 
                                onChange={(e) => uploadAvatar(e.target.files[0])} 
                            />
                        </form>
                    </div>

                        <div className="profile-stats-row">
                         <div className="level-card">
                            <div className="level-icon">{levelIcon}</div>
                            <div className="level-details">
                                <div className="level-badge">
                                    <span className="level-number">Уровень {user.level}</span>
                                    <span className="level-name">{levelName}</span>
                                </div>
                                <div className="xp-bar"><div className="xp-fill" style={{ width: `${xpPercent}%` }}></div></div>
                                <div className="xp-text">{user.experiencePoints} / {nextLevelXP} XP</div>
                                {/* Баллы внутри */}
                                <div className="balance-inline">
                                    <FontAwesomeIcon icon={faMoneyBillWave} />
                                    <span>{user.balance} баллов</span>
                                </div>
                            </div>
                        </div>
                        </div>

                        <div className="info-grid">
                            <div className="info-item">
                                <div className="info-icon"><FontAwesomeIcon icon={faEnvelope} /></div>
                                <div className="info-content">
                                    <div className="info-label">Email</div>
                                    <div className="info-value">{user.email}</div>
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-icon"><FontAwesomeIcon icon={faUsers} /></div>
                                <div className="info-content">
                                    <div className="info-label">Группа</div>
                                    <div className="info-value">{user.group || '—'}</div>
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-icon"><FontAwesomeIcon icon={faStar} /></div>
                                <div className="info-content">
                                    <div className="info-label">Роль</div>
                                    <div className="info-value">{user.role === 'Admin' ? 'Администратор' : (user.role === 'Leader' ? 'Руководитель' : 'Участник')}</div>
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-icon"><FontAwesomeIcon icon={faPhone} /></div>
                                <div className="info-content">
                                    <div className="info-label">Телефон</div>
                                    <div className="info-value">{user.phoneNumber || '—'}</div>
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-icon"><FontAwesomeIcon icon={faComment} /></div>
                                <div className="info-content">
                                    <div className="info-label">Telegram</div>
                                    <div className="info-value">{user.telegram || '—'}</div>
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-icon"><FontAwesomeIcon icon={faShirt} /></div>
                                <div className="info-content">
                                    <div className="info-label">Размер одежды</div>
                                    <div className="info-value">{user.clothingSize || '—'}</div>
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-icon"><FontAwesomeIcon icon={faBirthdayCake} /></div>
                                <div className="info-content">
                                    <div className="info-label">Дата рождения</div>
                                    <div className="info-value">{user.birthDate ? new Date(user.birthDate).toLocaleDateString('ru-RU') : '—'}</div>
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-icon"><FontAwesomeIcon icon={faCalendarAlt} /></div>
                                <div className="info-content">
                                    <div className="info-label">В студсовете с</div>
                                    <div className="info-value">{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('ru-RU') : '—'}</div>
                                </div>
                            </div>
                        </div>
                        {/*
                        <div className="stats-section">
                            <h3>Статистика активности</h3>
                            <div className="stats-numbers">
                                <div className="stat-item">
                                    <FontAwesomeIcon icon={faClipboardList} /> Мероприятий: {user.eventsAttended}
                                </div>
                                <div className="stat-item">
                                    <FontAwesomeIcon icon={faCheckCircle} /> Задач: {user.tasksCompleted}
                                </div>
                                <div className="stat-item">
                                    <FontAwesomeIcon icon={faUserPlus} /> Организовал: {user.eventsOrganized}
                                </div>
                            </div>
                        </div>
                        */}
                        <div className="charts-section">
                            <h3><FontAwesomeIcon icon={faChartLine} /> Аналитика</h3>
                            
                            {barData && (
                                <div className="chart-card full-width">
                                    <div style={{ height: '260px' }}>
                                        <Bar data={barData} options={barOptions} />
                                    </div>
                                </div>
                            )}
                            
                            <div className="chart-card full-width">
                                <h4>Хронология событий</h4>
                                {timelineEvents.length === 0 ? (
                                    <p className="no-timeline">Нет событий для отображения</p>
                                ) : (
                                    <div className="timeline-vertical">
                                        {timelineEvents.map((event, idx) => (
                                            <div key={idx} className="timeline-item">
                                                <div className="timeline-date">
                                                    {event.date.toLocaleDateString('ru-RU', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}
                                                </div>
                                                <div className="timeline-marker">
                                                    <div 
                                                        className="timeline-dot" 
                                                        style={{ backgroundColor: event.color, boxShadow: `0 0 0 2px ${event.color}` }}
                                                    ></div>
                                                    {idx !== timelineEvents.length - 1 && <div className="timeline-line"></div>}
                                                </div>
                                                <div className="timeline-content">
                                                    <div className="timeline-title">{event.title}</div>
                                                    {event.type === 'event' && (
                                                        <div className="timeline-role" style={{ color: event.color }}>
                                                            Роль: {event.role}
                                                        </div>
                                                    )}
                                                    {event.type === 'join' && (
                                                        <div className="timeline-role join-text">Начало пути</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
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
                                            <a 
                                                key={badge.id}
                                                href="#" 
                                                className="badge-link" 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    downloadBadge(badge);
                                                }}
                                            >
                                                {badge.eventTitle.toLowerCase()}_{badge.role.toLowerCase()}.pdf
                                            </a>
                                        ) : (
                                            <span key={badge.id} className="badge-link pending">
                                                {badge.eventTitle.toLowerCase()}_{badge.role.toLowerCase()}.pdf (ожидает загрузки)
                                            </span>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="profile-actions">
                            <button onClick={showEditProfileModal} className="btn-edit">
                                <FontAwesomeIcon icon={faEdit} /> Редактировать профиль
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
            />
        </div>
    );
}

function getLevelBorderClass(level) {
    if (level >= 1 && level <= 3) return 'level-border-1';
    if (level >= 4 && level <= 5) return 'level-border-2';
    if (level >= 6 && level <= 8) return 'level-border-3';
    if (level >= 9 && level <= 12) return 'level-border-4';
    if (level >= 13 && level <= 15) return 'level-border-5';
    return 'level-border-legend';
}

function getLevelIcon(level) {
    if (level >= 1 && level <= 3) {
        return <FontAwesomeIcon icon={faLeaf} style={{ color: '#cd7f32' }} />;
    }
    if (level >= 4 && level <= 5) {
        return <FontAwesomeIcon icon={faChartSimple} style={{ color: '#c0c0c0' }} />;
    }
    if (level >= 6 && level <= 8) {
        return <FontAwesomeIcon icon={faGem} style={{ color: '#ffd700' }} />;
    }
    if (level >= 9 && level <= 12) {
        return <FontAwesomeIcon icon={faCrown} style={{ color: '#e5e4e2' }} />;
    }
    if (level >= 13 && level <= 15) {
        return <FontAwesomeIcon icon={faDiamond} style={{ color: '#b0e0e6' }} />;
    }
    return <FontAwesomeIcon icon={faInfinity} style={{ color: '#ffaa00' }} />;
}

function getLevelName(level) {
    if (level >= 1 && level <= 3) return 'Новичок';
    if (level >= 4 && level <= 5) return 'Практик';
    if (level >= 6 && level <= 8) return 'Профессионал';
    if (level >= 9 && level <= 12) return 'Мастер';
    if (level >= 13 && level <= 15) return 'Грандмастер';
    return 'Легенда';
}