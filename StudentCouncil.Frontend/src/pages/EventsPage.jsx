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
import EventFormModal from '../components/EventFormModal';
import ConfirmModal from '../components/ConfirmDialog';
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
    
    const [modalState, setModalState] = useState({
        isOpen: false,
        eventId: null
    });

    useEffect(() => {
        if (canView) {
            loadEvents();
        } else {
            setLoading(false);
        }
    }, []);

    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, eventId: null });

    const handleDeleteClick = (eventId) => {
        setConfirmDelete({ isOpen: true, eventId });
    };

    const confirmDeleteEvent = async () => {
        const { eventId } = confirmDelete;
        const result = await API.deleteEvent(eventId);
        if (result.ok) {
            setEvents(events.filter(e => e.id !== eventId));
        } else {
            alert(result.data?.error || 'Ошибка удаления');
        }
        setConfirmDelete({ isOpen: false, eventId: null });
    };

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
        setModalState({ isOpen: true, eventId: null });
    };

    const openEditModal = (eventId) => {
        setModalState({ isOpen: true, eventId });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, eventId: null });
    };

    if (!canView) {
        return <div className="alert alert-danger">Доступ запрещён</div>;
    }

    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Загрузка...</p></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div className="events-page fade-in">
            <Bubbles />
            <div className="events-wrapper">
                <div className="events-header">
                    <h1>Мероприятия</h1>
                    {isAdmin && (
                        <button onClick={openCreateModal} className="create-event-btn">
                            <FontAwesomeIcon icon={faPlus} /> Создать мероприятие
                        </button>
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
                                         <button onClick={() => handleDeleteClick(event.id)} className="event-btn delete">
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

            <EventFormModal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                eventId={modalState.eventId}
                isAdmin={isAdmin}
                onSuccess={loadEvents}
            />

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, eventId: null })}
                onConfirm={confirmDeleteEvent}
                title="Удаление мероприятия"
                message="Вы действительно хотите удалить это мероприятие?"
                confirmText="Удалить"
            />
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