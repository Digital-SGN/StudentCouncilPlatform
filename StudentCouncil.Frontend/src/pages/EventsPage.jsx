import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCalendar, faMapMarkerAlt, faUser, faLink, 
    faEdit, faTrashAlt, faEye, faPlus, faCalendarDay
} from '@fortawesome/free-solid-svg-icons';
import Bubbles from '../components/Bubbles';
import '../css/events.css';

export default function EventsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const isLeader = user?.role === 'Leader';
    const canView = isAdmin || isLeader;
    
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usersMap, setUsersMap] = useState(new Map());
    
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editEventId, setEditEventId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        eventDate: '',
        location: '',
        registrationLink: '',
        responsibleUserId: '',
        status: 'Upcoming'
    });
    const [users, setUsers] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState('');

    useEffect(() => {
        if (canView) {
            loadEvents();
        } else {
            setLoading(false);
        }
    }, []);

   const loadEvents = async () => {
    try {
        setLoading(true);
        const result = await API.getEvents();
        if (result.ok) {
            const eventsList = result.data.events || [];
            setEvents(eventsList);
            
            const responsibleIds = [...new Set(eventsList.map(e => e.responsibleUserId).filter(id => id))];
            
            const map = new Map();
            await Promise.all(
                responsibleIds.map(async (userId) => {
                    const userResult = await API.getUser(userId);
                    if (userResult.ok) {
                        const user = userResult.data;
                        map.set(userId, `${user.lastName} ${user.firstName} ${user.patronymic || ''}`.trim());
                    }
                })
            );
            setUsersMap(map);
        } else {
            setError(result.data?.error || 'Ошибка загрузки');
        }
    } catch (err) {
        setError('Ошибка загрузки мероприятий');
    } finally {
        setLoading(false);
    }
};

    const loadUsers = async () => {
        const result = await API.getUsers();
        if (result.ok) {
            const map = new Map();
            result.data.users.forEach(user => {
                map.set(user.id, `${user.lastName} ${user.firstName}`);
            });
            setUsersMap(map);
            setUsers(result.data.users || []);
        }
    };

    const deleteEvent = async (id) => {
        if (!confirm('Удалить мероприятие?')) return;
        const result = await API.deleteEvent(id);
        if (result.ok) {
            setEvents(events.filter(e => e.id !== id));
        } else {
            alert(result.data?.error || 'Ошибка удаления');
        }
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setEditEventId(null);
        setFormData({
            title: '',
            description: '',
            eventDate: '',
            location: '',
            registrationLink: '',
            responsibleUserId: '',
            status: 'Upcoming'
        });
        setModalError('');
        setShowModal(true);
    };

    const openEditModal = async (eventId) => {
        const result = await API.getEvent(eventId);
        if (!result.ok) {
            alert('Ошибка загрузки мероприятия');
            return;
        }
        const event = result.data;
        setIsEditMode(true);
        setEditEventId(eventId);
        setFormData({
            title: event.title || '',
            description: event.description || '',
            eventDate: event.eventDate ? event.eventDate.slice(0, 16) : '',
            location: event.location || '',
            registrationLink: event.registrationLink || '',
            responsibleUserId: event.responsibleUserId || '',
            status: event.status || 'Upcoming'
        });
        setModalError('');
        setShowModal(true);
    };

    const handleFormChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalError('');
        setModalLoading(true);

        const data = {
            title: formData.title,
            description: formData.description,
            eventDate: new Date(formData.eventDate).toISOString(),
            location: formData.location,
            registrationLink: formData.registrationLink,
            responsibleUserId: parseInt(formData.responsibleUserId)
        };

        if (isEditMode && isAdmin) {
            data.status = formData.status;
        }

        let result;
        if (isEditMode) {
            result = await API.updateEvent(editEventId, data);
        } else {
            result = await API.createEvent(data);
        }

        if (result.ok) {
            setShowModal(false);
            loadEvents();
        } else {
            setModalError(result.data?.error || 'Ошибка сохранения');
        }
        setModalLoading(false);
    };

    if (!canView) {
        return <div className="alert alert-danger">Доступ запрещён</div>;
    }

    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Загрузка...</p></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div className="events-page">
            <Bubbles />
            <div className="events-wrapper">
                <div className="events-header">
                    <h1>Мероприятия</h1>
                    {isAdmin && (
                        <button onClick={openCreateModal} className="create-event-btn"><FontAwesomeIcon icon={faPlus} /> Создать мероприятие</button>
                    )}
                </div>
                {events.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><FontAwesomeIcon icon={faCalendarDay} /></div>
                        <h3>Нет мероприятий</h3>
                        <p>Пока нет запланированных мероприятий</p>
                    </div>
                ) : (
                    <div className="events-grid">
                        {events.map(event => (
                            <div key={event.id} className="event-card">
                                <div className="event-card-header">
                                    <div className="event-title">{event.title}</div>
                                    <div className={`event-status ${getStatusClass(event.status)}`}>
                                        {getStatusText(event.status)}
                                    </div>
                                </div>
                                <div className="event-card-body">
                                    <div className="event-info">
                                        <div className="event-info-item">
                                            <span className="event-info-icon"><FontAwesomeIcon icon={faCalendar} /></span>
                                            <span className="event-info-text">
                                                {new Date(event.eventDate).toLocaleDateString('ru-RU', {
                                                    day: 'numeric', month: 'long', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <div className="event-info-item">
                                            <span className="event-info-icon"><FontAwesomeIcon icon={faMapMarkerAlt} /></span>
                                            <span className="event-info-text">{event.location}</span>
                                        </div>
                                        <div className="event-info-item">
                                            <span className="event-info-icon"><FontAwesomeIcon icon={faUser} /></span>
                                            <span className="event-info-text">
                                                Ответственный: {usersMap.get(event.responsibleUserId) || '—'}
                                            </span>
                                        </div>
                                        {event.registrationLink && (
                                            <div className="event-info-item">
                                                <span className="event-info-icon"><FontAwesomeIcon icon={faLink} /></span>
                                                <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="event-link">
                                                    Регистрация
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                    {event.description && (
                                        <div className="event-description">{event.description}</div>
                                    )}
                                </div>
                                <div className="event-card-footer">
                                    <Link to={`/events/${event.id}`} className="event-btn view"><FontAwesomeIcon icon={faEye} />Подробнее</Link>
                                    {isAdmin && (
                                        <>
                                            <button onClick={() => openEditModal(event.id)} className="event-btn edit"><
                                                FontAwesomeIcon icon={faEdit} /> Редактировать
                                            </button>
                                            <button onClick={() => deleteEvent(event.id)} className="event-btn delete">
                                                <FontAwesomeIcon icon={faTrashAlt} /> Удалить
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{isEditMode ? 'Редактирование мероприятия' : 'Создание мероприятия'}</h3>
                            <span className="modal-close" onClick={() => setShowModal(false)}>&times;</span>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Название *</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleFormChange} required />
                                </div>

                                <div className="form-group">
                                    <label>Описание</label>
                                    <textarea name="description" rows="4" value={formData.description} onChange={handleFormChange} />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Дата и время *</label>
                                        <input type="datetime-local" name="eventDate" value={formData.eventDate} onChange={handleFormChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Место *</label>
                                        <input type="text" name="location" value={formData.location} onChange={handleFormChange} required />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Ссылка на регистрацию</label>
                                    <input type="url" name="registrationLink" placeholder="https://..." value={formData.registrationLink} onChange={handleFormChange} />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Ответственный *</label>
                                        <select name="responsibleUserId" value={formData.responsibleUserId} onChange={handleFormChange} required>
                                            <option value="">Выберите ответственного</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.lastName} {user.firstName} ({user.role === 'Admin' ? 'Админ' : user.role === 'Leader' ? 'Руководство' : 'Участник'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {isEditMode && isAdmin && (
                                        <div className="form-group">
                                            <label>Статус</label>
                                            <select name="status" value={formData.status} onChange={handleFormChange}>
                                                <option value="Upcoming">Предстоит</option>
                                                <option value="Completed">Завершено</option>
                                                <option value="Cancelled">Отменено</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {modalError && <div className="error-message">{modalError}</div>}

                                <div className="form-actions">
                                    <button type="submit" className="btn-save" disabled={modalLoading}>
                                        {modalLoading ? 'Сохранение...' : (isEditMode ? 'Сохранить' : 'Создать')}
                                    </button>
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Отмена</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function getStatusClass(status) {
    switch (status) {
        case 'Upcoming': return 'status-upcoming';
        case 'Completed': return 'status-completed';
        case 'Cancelled': return 'status-cancelled';
        default: return 'status-upcoming';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'Upcoming': return 'Предстоит';
        case 'Completed': return 'Завершено';
        case 'Cancelled': return 'Отменено';
        default: return status;
    }
}