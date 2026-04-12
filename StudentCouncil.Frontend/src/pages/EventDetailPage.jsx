import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCalendar, faMapMarkerAlt, faUser, faLink, 
    faEdit, faTrashAlt,
    faDownload, faUpload, faFileAlt, faUsers
} from '@fortawesome/free-solid-svg-icons';
import Bubbles from '../components/Bubbles';
import '../css/events.css';

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        eventDate: '',
        location: '',
        registrationLink: '',
        responsibleUserId: '',
        status: 'Upcoming'
    });
    const [users, setUsers] = useState([]);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');
    
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingBadgeId, setEditingBadgeId] = useState(null);
    const [editingRole, setEditingRole] = useState('');
    const [selectedRole, setSelectedRole] = useState('');

    useEffect(() => {
        if (canView) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [id]);

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
                usersResult.data.users.forEach(user => {
                    map.set(user.id, `${user.lastName} ${user.firstName} ${user.patronymic || ''}`);
                });
                setUsersMap(map);
            }
        } catch (err) {
            setError('Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    };

    const deleteEvent = async () => {
        if (!confirm('Удалить мероприятие?')) return;
        const result = await API.deleteEvent(id);
        if (result.ok) {
            navigate('/events');
        } else {
            alert(result.data?.error || 'Ошибка удаления');
        }
    };

    const deleteBadge = async (badgeId) => {
        if (!confirm('Удалить участника из мероприятия?')) return;
        const result = await API.deleteBadge(badgeId);
        if (result.ok) {
            setBadges(badges.filter(b => b.id !== badgeId));
        } else {
            alert(result.data?.error || 'Ошибка удаления');
        }
    };

    const downloadBadge = async (badgeId, eventTitle, userName, role) => {
        const fileName = `${eventTitle}_${userName}_${role}`.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
        const result = await API.downloadBadgeAndSave(badgeId, fileName);
        if (!result) alert('Ошибка скачивания бейджа');
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

    const openEditRoleModal = (badgeId, currentRole) => {
        setEditingBadgeId(badgeId);
        setEditingRole(currentRole);
        setSelectedRole(currentRole);
        setShowRoleModal(true);
    };

    const showAddMemberModal = async () => {
        const usersResult = await API.getUsers();
        const users = usersResult.ok ? usersResult.data.users || [] : [];
        
        const modalHtml = `
            <div id="addMemberModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Добавить участника</h3>
                        <span class="modal-close" onclick="document.getElementById('addMemberModal')?.remove()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Участник *</label>
                            <select id="memberUserId">
                                <option value="">Выберите участника</option>
                                ${users.map(u => `<option value="${u.id}">${escapeHtml(u.lastName)} ${escapeHtml(u.firstName)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Роль *</label>
                            <select id="memberRole">
                                <option value="Организатор">Организатор</option>
                                <option value="Медиа">Медиа</option>
                                <option value="Техпод">Техпод</option>
                                <option value="Волонтёр">Волонтёр</option>
                                <option value="Участник">Участник</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Файл бейджа (PDF)</label>
                            <input type="file" id="badgeFile" accept=".pdf">
                            <small class="form-hint">Можно загрузить позже</small>
                        </div>
                        <div id="modalErrorMessage" class="error-message" style="display: none;"></div>
                        <div class="form-actions">
                            <button id="submitAddMemberBtn" class="btn-save">Добавить</button>
                            <button onclick="document.getElementById('addMemberModal')?.remove()" class="btn-cancel">Отмена</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('submitAddMemberBtn').onclick = async () => {
            const userId = document.getElementById('memberUserId').value;
            const role = document.getElementById('memberRole').value;
            const file = document.getElementById('badgeFile').files[0];
            const errorDiv = document.getElementById('modalErrorMessage');
            
            if (!userId) {
                errorDiv.textContent = 'Выберите участника';
                errorDiv.style.display = 'block';
                return;
            }
            
            const formData = new FormData();
            formData.append('UserId', userId);
            formData.append('EventId', id);
            formData.append('Role', role);
            if (file) formData.append('file', file);
            
            const result = await API.createBadge(formData);
            
            if (result.ok) {
                document.getElementById('addMemberModal')?.remove();
                loadData();
            } else {
                errorDiv.textContent = result.error || 'Ошибка добавления';
                errorDiv.style.display = 'block';
            }
        };
    };

    const openEditModal = () => {
        setEditFormData({
            title: event.title || '',
            description: event.description || '',
            eventDate: event.eventDate ? event.eventDate.slice(0, 16) : '',
            location: event.location || '',
            registrationLink: event.registrationLink || '',
            responsibleUserId: event.responsibleUserId || '',
            status: event.status || 'Upcoming'
        });
        setShowEditModal(true);
        loadUsersForEdit();
    };

    const loadUsersForEdit = async () => {
        const result = await API.getUsers();
        if (result.ok) {
            setUsers(result.data.users || []);
        }
    };

    const handleEditChange = (e) => {
        setEditFormData({
            ...editFormData,
            [e.target.name]: e.target.value
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditError('');
        setEditLoading(true);

        const data = {
            title: editFormData.title,
            description: editFormData.description,
            eventDate: new Date(editFormData.eventDate).toISOString(),
            location: editFormData.location,
            registrationLink: editFormData.registrationLink,
            responsibleUserId: parseInt(editFormData.responsibleUserId),
            status: editFormData.status
        };

        const result = await API.updateEvent(id, data);

        if (result.ok) {
            setShowEditModal(false);
            loadData();
        } else {
            setEditError(result.data?.error || 'Ошибка сохранения');
        }
        setEditLoading(false);
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

    return (
        <div className="event-detail-page">
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
                                <div className="team-table-wrapper">
                                    <table className="team-table">
                                        <thead>
                                            <tr>
                                                <th>Участник</th>
                                                <th>Роль</th>
                                                <th>Бейдж</th>
                                                {isAdmin && <th>Действия</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {badges.map(badge => (
                                                <tr key={badge.id}>
                                                    <td>
                                                        <Link to={`/users/${badge.userId}`} className="team-member-link">
                                                            {badge.userName}
                                                        </Link>
                                                    </td>
                                                    <td><span className="team-role-badge">{badge.role}</span></td>
                                                    <td>
                                                        <div className="team-badge-cell">
                                                            {badge.filePath && (
                                                                <button onClick={() => downloadBadge(badge.id, badge.eventTitle, badge.userName, badge.role)} className="team-badge-btn download">
                                                                    <FontAwesomeIcon icon={faDownload} /> Скачать
                                                                </button>
                                                            )}
                                                            {isAdmin && (
                                                                <button onClick={() => uploadBadgeFile(badge.id)} className="team-badge-btn upload">
                                                                    <FontAwesomeIcon icon={faUpload} /> {badge.filePath ? 'Заменить' : 'Загрузить'}
                                                                </button>
                                                            )}
                                                            {!badge.filePath && !isAdmin && <span className="no-badge">—</span>}
                                                        </div>
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="team-actions">
                                                            <button onClick={() => openEditRoleModal(badge.id, badge.role)} className="team-action-btn edit" title="Изменить роль">
                                                                <FontAwesomeIcon icon={faEdit} />Изменить
                                                            </button>
                                                            <button onClick={() => deleteBadge(badge.id)} className="team-action-btn delete" title="Удалить">
                                                                <FontAwesomeIcon icon={faTrashAlt} /> Удалить
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {isAdmin && (
                                <div className="add-member-section">
                                    <button onClick={showAddMemberModal} className="add-member-btn">+ Добавить участника</button>
                                </div>
                            )}
                        </div>

                        {isAdmin && (
                            <div className="event-actions">
                                <button onClick={openEditModal} className="event-edit-btn">
                                     <FontAwesomeIcon icon={faEdit} />Редактировать
                                </button>
                                <button onClick={deleteEvent} className="event-delete-btn">
                                    <FontAwesomeIcon icon={faTrashAlt} />Удалить
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showEditModal && (
                <div className="modal" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Редактирование мероприятия</h3>
                            <span className="modal-close" onClick={() => setShowEditModal(false)}>&times;</span>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleEditSubmit}>
                                <div className="form-group">
                                    <label>Название *</label>
                                    <input type="text" name="title" value={editFormData.title} onChange={handleEditChange} required />
                                </div>

                                <div className="form-group">
                                    <label>Описание</label>
                                    <textarea name="description" rows="4" value={editFormData.description} onChange={handleEditChange} />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Дата и время *</label>
                                        <input type="datetime-local" name="eventDate" value={editFormData.eventDate} onChange={handleEditChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Место *</label>
                                        <input type="text" name="location" value={editFormData.location} onChange={handleEditChange} required />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Ссылка на регистрацию</label>
                                    <input type="url" name="registrationLink" placeholder="https://..." value={editFormData.registrationLink} onChange={handleEditChange} />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Ответственный *</label>
                                        <select name="responsibleUserId" value={editFormData.responsibleUserId} onChange={handleEditChange} required>
                                            <option value="">Выберите ответственного</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.lastName} {user.firstName} ({user.role === 'Admin' ? 'Админ' : user.role === 'Leader' ? 'Руководство' : 'Участник'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Статус</label>
                                        <select name="status" value={editFormData.status} onChange={handleEditChange}>
                                            <option value="Upcoming">Предстоит</option>
                                            <option value="Completed">Завершено</option>
                                            <option value="Cancelled">Отменено</option>
                                        </select>
                                    </div>
                                </div>

                                {editError && <div className="error-message">{editError}</div>}

                                <div className="form-actions">
                                    <button type="submit" className="btn-save" disabled={editLoading}>
                                        {editLoading ? 'Сохранение...' : 'Сохранить'}
                                    </button>
                                    <button type="button" onClick={() => setShowEditModal(false)} className="btn-cancel">Отмена</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showRoleModal && (
                <div className="modal" onClick={() => setShowRoleModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Изменение роли</h3>
                            <span className="modal-close" onClick={() => setShowRoleModal(false)}>&times;</span>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Новая роль</label>
                                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                                    <option value="Организатор">Организатор</option>
                                    <option value="Медиа">Медиа</option>
                                    <option value="Техпод">Техпод</option>
                                    <option value="Волонтёр">Волонтёр</option>

                                </select>
                            </div>
                            <div className="form-actions">
                                <button className="btn-save" onClick={async () => {
                                    if (selectedRole !== editingRole) {
                                        const result = await API.updateBadge(editingBadgeId, { role: selectedRole });
                                        if (result.ok) {
                                            setBadges(badges.map(b => b.id === editingBadgeId ? { ...b, role: selectedRole } : b));
                                        } else {
                                            alert(result.data?.error || 'Ошибка обновления');
                                        }
                                    }
                                    setShowRoleModal(false);
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