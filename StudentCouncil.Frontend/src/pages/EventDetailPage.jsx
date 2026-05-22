import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCalendar, faMapMarkerAlt, faUser, faLink, 
    faEdit, faTrashAlt, faEye, faDownload, faUpload, faFileAlt, faUsers, faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import Bubbles from '../components/Bubbles';
import EventFormModal from '../components/modals/EventFormModal';
import ConfirmModal from '../components/modals/ConfirmDialogModal';
import AddMemberModal from '../components/modals/AddMemberModal';
import '../css/EventDetailPage.css';

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

export default function EventDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const isLeader = user?.role === 'Leader';
    const canView = isAdmin || isLeader;
    
    const [event, setEvent] = useState(null);
    const [badges, setBadges] = useState([]);
    const [usersMap, setUsersMap] = useState(new Map());
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    
    const [editingBadge, setEditingBadge] = useState({ id: null, userId: null, role: '' });
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');

    const [confirmDeleteEvent, setConfirmDeleteEvent] = useState(false);
    const [confirmDeleteBadge, setConfirmDeleteBadge] = useState({ isOpen: false, badgeId: null });

    useEffect(() => {
        const loadUsers = async () => {
            const result = await API.getUsers();
            if (result.ok) {
                setUsersList(result.data.users || []);
            }
        };
        loadUsers();
    }, []);

    useEffect(() => {
        if (canView && id) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [id, canView]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            const eventResult = await API.getEvent(id);
            if (!eventResult.ok) {
                setError(eventResult.data?.error || 'Мероприятие не найдено');
                return;
            }
            setEvent(eventResult.data);
            
            const badgesResult = await API.getBadgesByEvent(id);
            if (badgesResult.ok) {
                setBadges(badgesResult.data.badges || []);
            }
            
            const usersResult = await API.getUsers();
            if (usersResult.ok) {
                const map = new Map();
                usersResult.data.users.forEach(u => {
                    map.set(u.id, `${u.lastName} ${u.firstName} ${u.patronymic || ''}`.trim());
                });
                setUsersMap(map);
            }
        } catch (err) {
            setError('Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    };

    const downloadBadge = async (badgeId, eventTitle, userName, role) => {
        const fileName = `${eventTitle}_${userName}_${role}`
            .replace(/[^\wа-яё]/gi, '_')
            .toLowerCase();
        const result = await API.downloadBadge(badgeId, fileName);
        if (!result) alert('Ошибка скачивания бейджа');
    };

    const viewBadge = async (badgeId) => {
        const response = await fetch(`/api/badges/${badgeId}/file`, {
            credentials: 'include'
        });
        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            URL.revokeObjectURL(url);
        } else {
            alert('Не удалось открыть бейдж');
        }
    };

    const uploadBadgeFile = async (badgeId) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.pdf';
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('file', file);
            const result = await API.uploadBadgeFile(badgeId, formData);
            if (result.ok) {
                alert('Файл успешно загружен');
                loadData();
            } else {
                alert(result.error || 'Ошибка загрузки');
            }
        };
        fileInput.click();
    };

    const handleDeleteBadgeClick = (badgeId) => {
        setConfirmDeleteBadge({ isOpen: true, badgeId });
    };

    const confirmDeleteBadgeAction = async () => {
        const { badgeId } = confirmDeleteBadge;
        const result = await API.deleteBadge(badgeId);
        if (result.ok) {
            setBadges(badges.filter(b => b.id !== badgeId));
        } else {
            alert(result.data?.error || 'Ошибка удаления');
        }
        setConfirmDeleteBadge({ isOpen: false, badgeId: null });
    };

    const openEditRoleModal = (badgeId, userId, currentRole) => {
        setEditingBadge({ id: badgeId, userId, role: currentRole });
        setSelectedRole(currentRole);
        setSelectedUserId(userId);
        setShowRoleModal(true);
    };

    const handleDeleteEventClick = () => setConfirmDeleteEvent(true);

    const confirmDeleteEventAction = async () => {
        const result = await API.deleteEvent(id);
        if (result.ok) {
            navigate('/events');
        } else {
            alert(result.data?.error || 'Ошибка удаления');
        }
        setConfirmDeleteEvent(false);
    };

    if (!canView) {
        return <div className="alert alert-danger">Доступ запрещён</div>;
    }

    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Загрузка...</p></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!event) return <div className="alert alert-danger">Мероприятие не найдено</div>;

    const eventDate = new Date(event.eventDate);
    const formattedDate = eventDate.toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    const statusText = getStatusText(event.status);
    const statusClass = getStatusClass(event.status);

    const roleStyles = {
        'Главный организатор': { background: '#0CBFA1', color: 'white' },           
        'Организатор': { background: '#148C9C', color: 'white' },                  
        'Медиа': { background: '#FF6B6B', color: 'white' },                        
        'Техпод': { background: '#4ECDC4', color: 'white' },                      
        'Волонтёр': { background: '#FFE66D', color: '#2d3748' },                  
    };

    return (
        <div className="event-detail-page fade-in">
            <Bubbles />
            <div className="event-detail-container">
                <div className="event-detail-card">
                    <div className="event-detail-header">
                        <Link to="/events" className="back-link">← Назад к списку</Link>
                        <div className="event-detail-title">
                            <h1>{event.title}</h1>
                            <span className={`event-status-badge ${statusClass}`}>{statusText}</span>
                        </div>
                    </div>
                    <div className="event-detail-body">
                        <div className="event-info-grid">
                            <div className="event-info-row">
                                <span className="event-info-icon"><FontAwesomeIcon icon={faCalendar} /></span>
                                <span className="event-info-label">Дата и время:</span>
                                <span className="event-info-value">{formattedDate}</span>
                            </div>
                            <div className="event-info-row">
                                <span className="event-info-icon"><FontAwesomeIcon icon={faMapMarkerAlt} /></span>
                                <span className="event-info-label">Место:</span>
                                <span className="event-info-value">{event.location}</span>
                            </div>
                            <div className="event-info-row">
                                <span className="event-info-icon"><FontAwesomeIcon icon={faUser} /></span>
                                <span className="event-info-label">Ответственный:</span>
                                <span className="event-info-value">
                                    <Link to={`/users/${event.responsibleUserId}`}>
                                        {usersMap.get(event.responsibleUserId) || 'Загрузка...'}
                                    </Link>
                                </span>
                            </div>
                            {event.budget != null && (
                                <div className="event-info-row">
                                    <span className="event-info-icon"><FontAwesomeIcon icon={faMoneyBillWave} /></span>
                                    <span className="event-info-label">Бюджет:</span>
                                    <span className="event-info-value">{event.budget.toLocaleString()} ₽</span>
                                </div>
                            )}

                            {event.registrationLink && (
                                <div className="event-info-row">
                                    <span className="event-info-icon"><FontAwesomeIcon icon={faLink} /></span>
                                    <span className="event-info-label">Регистрация:</span>
                                    <span className="event-info-value">
                                        <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="registration-link">
                                            Перейти к форме →
                                        </a>
                                    </span>
                                </div>
                            )}
                        </div>
                        {event.description && (
                            <div className="event-description-section">
                                <h3><FontAwesomeIcon icon={faFileAlt} /> Описание</h3>
                                <p>{event.description}</p>
                            </div>
                        )}


                        <div className="event-team-section">
                            <h3><FontAwesomeIcon icon={faUsers} /> Организаторский состав</h3>
                            {badges.length === 0 ? (
                                <p className="no-team-message">Пока нет участников</p>
                            ) : (
                                <div className="team-cards">
                                    {badges.map(badge => (
                                        <div key={badge.id} className="team-card">
                                            <div className="team-card-row">
                                                <span className="team-card-label">
                                                     <Link to={`/users/${badge.userId}`} className="team-member-link">
                                                        {badge.userName}
                                                    </Link>
                                                </span>
                                            </div>
                                            <div className="team-card-row">
                                                <span className="team-card-label">Роль</span>
                                                <span className="team-card-value">
                                                    <span className="team-role-badge" style={roleStyles[badge.role] || { background: '#e2e8f0', color: '#2d3748' }}>
                                                        {badge.role}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="team-card-row">
                                                <span className="team-card-label">Бейдж</span>
                                                <div className="team-card-value badge-buttons">
                                                    {badge.filePath && (
                                                        <>
                                                            <button onClick={() => viewBadge(badge.id)} className="team-badge-btn view">
                                                                <FontAwesomeIcon icon={faEye} /> Просмотр
                                                            </button>
                                                            <button onClick={() => downloadBadge(badge.id, badge.eventTitle, badge.userName, badge.role)} className="team-badge-btn download">
                                                                <FontAwesomeIcon icon={faDownload} /> Скачать
                                                            </button>
                                                        </>
                                                    )}
                                                    {isAdmin && (
                                                        <button onClick={() => uploadBadgeFile(badge.id)} className="team-badge-btn upload">
                                                            <FontAwesomeIcon icon={faUpload} /> {badge.filePath ? 'Заменить' : 'Загрузить'}
                                                        </button>
                                                    )}
                                                    {!badge.filePath && !isAdmin && <span className="no-badge">—</span>}
                                                </div>
                                            </div>
                                            {isAdmin && (
                                                <div className="team-card-row">
                                                    <span className="team-card-label">Действия</span>
                                                    <div className="team-card-value team-actions-cell">
                                                        <button onClick={() => openEditRoleModal(badge.id, badge.userId, badge.role)} className="team-action-btn edit">
                                                            <FontAwesomeIcon icon={faEdit} /> Изменить
                                                        </button>
                                                        <button onClick={() => handleDeleteBadgeClick(badge.id)} className="team-action-btn delete">
                                                            <FontAwesomeIcon icon={faTrashAlt} /> Удалить
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {isAdmin && (
                                <button onClick={() => setShowAddMemberModal(true)} className="add-member-btn">+ Добавить участника</button>
                            )}
                        </div>

                        {isAdmin && (
                            <div className="event-actions">
                                <button onClick={() => setShowEditModal(true)} className="event-edit-btn">
                                    <FontAwesomeIcon icon={faEdit} />Редактировать
                                </button>
                                <button onClick={handleDeleteEventClick} className="event-delete-btn">
                                    <FontAwesomeIcon icon={faTrashAlt} /> Удалить
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmDeleteEvent}
                onClose={() => setConfirmDeleteEvent(false)}
                onConfirm={confirmDeleteEventAction}
                title="Удаление мероприятия"
                message="Вы уверены, что хотите удалить это мероприятие?"
                confirmText="Удалить"
            />

            <ConfirmModal
                isOpen={confirmDeleteBadge.isOpen}
                onClose={() => setConfirmDeleteBadge({ isOpen: false, badgeId: null })}
                onConfirm={confirmDeleteBadgeAction}
                title="Удаление участника"
                message="Удалить участника из мероприятия?"
                confirmText="Удалить"
            />

            <EventFormModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                eventId={id}
                isAdmin={isAdmin}
                onSuccess={loadData}
            />

            <AddMemberModal
                isOpen={showAddMemberModal}
                onClose={() => setShowAddMemberModal(false)}
                eventId={id}
                usersList={usersList}
                onSuccess={loadData}
            />

            {showRoleModal && (
                <div className="modal" onClick={() => setShowRoleModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Редактирование участника</h3>
                            <span className="modal-close" onClick={() => setShowRoleModal(false)}>&times;</span>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Участник</label>
                                <select 
                                    value={selectedUserId} 
                                    onChange={(e) => setSelectedUserId(Number(e.target.value))}
                                >
                                    {usersList.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.lastName} {u.firstName} ({u.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Роль</label>
                                <select 
                                    value={selectedRole} 
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                >
                                    <option value="Главный организатор">Главный организатор</option>
                                    <option value="Организатор">Организатор</option>
                                    <option value="Медиа">Медиа</option>
                                    <option value="Техпод">Техпод</option>
                                    <option value="Волонтёр">Волонтёр</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button className="btn-save" onClick={async () => {
                                    let success = true;
                                    if (selectedRole !== editingBadge.role) {
                                        const roleResult = await API.updateBadge(editingBadge.id, { role: selectedRole });
                                        if (!roleResult.ok) success = false;
                                    }
                                    if (selectedUserId !== editingBadge.userId) {
                                        const formData = new FormData();
                                        formData.append('UserId', selectedUserId);
                                        formData.append('EventId', id);
                                        formData.append('Role', selectedRole);
                                        const createResult = await API.createBadge(formData);
                                        if (createResult.ok) {
                                            await API.deleteBadge(editingBadge.id);
                                        } else {
                                            success = false;
                                        }
                                    }
                                    if (success) {
                                        loadData();
                                        setShowRoleModal(false);
                                    } else {
                                        alert('Ошибка при обновлении');
                                    }
                                }}>Сохранить</button>
                                <button className="btn-cancel" onClick={() => setShowRoleModal(false)}>Отмена</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function getStatusText(status) {
    switch (status) {
        case 'Upcoming': return 'Предстоит';
        case 'Completed': return 'Завершено';
        case 'Cancelled': return 'Отменено';
        default: return status;
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'Upcoming': return 'status-upcoming';
        case 'Completed': return 'status-completed';
        case 'Cancelled': return 'status-cancelled';
        default: return '';
    }
}