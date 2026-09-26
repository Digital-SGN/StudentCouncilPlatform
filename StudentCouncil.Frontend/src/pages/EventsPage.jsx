import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendar, faMapMarkerAlt, faUser, faLink,
    faEdit, faTrashAlt, faEye, faPlus, faCalendarDay, faMoneyBillWave,
    faSort, faSortUp, faSortDown, faSearch, faFileExport, faUsers
} from '@fortawesome/free-solid-svg-icons';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import Bubbles from '../components/Bubbles';
import Alert from '../components/Alert';
import EventFormModal from '../components/modals/EventFormModal';
import ConfirmModal from '../components/modals/ConfirmDialogModal';
import '../css/EventsPage.css';

export default function EventsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const isLeader = user?.role === 'Leader';
    const canView = isAdmin || isLeader;

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usersMap, setUsersMap] = useState(new Map());

    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('eventDate');
    const [sortOrder, setSortOrder] = useState('desc');

    const [modalState, setModalState] = useState({ isOpen: false, eventId: null });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, eventId: null });

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
                            const u = userResult.data;
                            map.set(userId, `${u.lastName} ${u.firstName} ${u.patronymic || ''}`.trim());
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

    const filteredEvents = events.filter(event => {
        const search = searchTerm.toLowerCase();
        return event.title.toLowerCase().includes(search) ||
               (event.description && event.description.toLowerCase().includes(search)) ||
               event.location.toLowerCase().includes(search);
    });

    const sortedEvents = [...filteredEvents].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        if (sortField === 'eventDate') {
            aVal = new Date(aVal).getTime();
            bVal = new Date(bVal).getTime();
        } else if (sortField === 'budget') {
            aVal = aVal ?? 0;
            bVal = bVal ?? 0;
        } else if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const renderSortIcon = (field) => {
        if (sortField !== field) return <FontAwesomeIcon icon={faSort} className="sort-icon" />;
        return sortOrder === 'asc'
            ? <FontAwesomeIcon icon={faSortUp} className="sort-icon" />
            : <FontAwesomeIcon icon={faSortDown} className="sort-icon" />;
    };

    const openCreateModal = () => setModalState({ isOpen: true, eventId: null });
    const openEditModal = (eventId) => setModalState({ isOpen: true, eventId });
    const closeModal = () => setModalState({ isOpen: false, eventId: null });

    const handleDeleteClick = (eventId) => setConfirmDelete({ isOpen: true, eventId });
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

    const exportEventsToCSV = () => {
        const dataToExport = sortedEvents.map(event => ({
            'Название': event.title,
            'Описание': event.description || '',
            'Дата и время': new Date(event.eventDate).toLocaleString('ru-RU'),
            'Место': event.location,
            'Бюджет (₽)': event.budget ? event.budget.toLocaleString() : '',
            'Статус': getStatusText(event.status),
            'Ссылка на регистрацию': event.registrationLink || '',
            'Создано': new Date(event.createdAt).toLocaleDateString('ru-RU'),
        }));

        if (dataToExport.length === 0) {
            alert('Нет данных для экспорта');
            return;
        }

        const headers = Object.keys(dataToExport[0]);
        const csvRows = [];
        csvRows.push(headers.join(';'));
        for (const row of dataToExport) {
            const values = headers.map(header => {
                let val = row[header];
                if (val === undefined || val === null) val = '';
                return `"${String(val).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(';'));
        }

        const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;

        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
        link.setAttribute('download', `events_${dateStr}.csv`);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (!canView) {
        return <div className="alert alert-danger">Доступ запрещён</div>;
    }
    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Загрузка...</p></div>;
    if (error) return <Alert type="danger" message={error} />;

    return (
        <div className="events-page fade-in">
            <Bubbles />
            <div className="events-wrapper">
                <div className="events-header">
                    <h1>Мероприятия</h1>
                    <div className="header-actions">
                        <div className="search-box">
                            <FontAwesomeIcon icon={faSearch} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Поиск..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <div className="sort-buttons">
                            <button onClick={() => handleSort('eventDate')} className="sort-btn">
                                Дата {renderSortIcon('eventDate')}
                            </button>
                            <button onClick={() => handleSort('budget')} className="sort-btn">
                                Бюджет {renderSortIcon('budget')}
                            </button>
                            <button onClick={() => handleSort('status')} className="sort-btn">
                                Статус {renderSortIcon('status')}
                            </button>
                        </div>
                        <button onClick={exportEventsToCSV} className="export-btn">
                            <FontAwesomeIcon icon={faFileExport} /> Экспорт CSV
                        </button>
                        {isAdmin && (
                            <button onClick={openCreateModal} className="create-event-btn">
                                <FontAwesomeIcon icon={faPlus} /> Создать мероприятие
                            </button>
                        )}
                    </div>
                </div>

                {sortedEvents.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><FontAwesomeIcon icon={faCalendarDay} /></div>
                        <h3>Нет мероприятий</h3>
                        <p>Пока нет мероприятий, соответствующих критериям</p>
                    </div>
                ) : (
                    <div className="events-grid">
                        {sortedEvents.map(event => (
                            <div key={event.id} className="event-card">
                                {event.photoPath && (
                                    <div
                                        className="event-card-photo"
                                        style={{ backgroundImage: `url(${event.photoPath})` }}
                                    />
                                )}
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
                                        {event.budget != null && (
                                            <div className="event-info-item">
                                                <span className="event-info-icon"><FontAwesomeIcon icon={faMoneyBillWave} /></span>
                                                <span className="event-info-text">{event.budget.toLocaleString()} ₽</span>
                                            </div>
                                        )}
                                        <div className="event-info-item">
                                            <span className="event-info-icon"><FontAwesomeIcon icon={faMapMarkerAlt} /></span>
                                            <span className="event-info-text">{event.location}</span>
                                        </div>
                                        <div className="event-info-item">
                                            <FontAwesomeIcon icon={faUsers} className="event-info-icon" />
                                            <div className="attendance-stats">
                                                <div className="attendance-numbers">
                                                    {event.actualParticipants} / {event.registeredParticipants} ({event.registeredParticipants > 0 ? Math.round(event.actualParticipants / event.registeredParticipants * 100) : 0}%)
                                                </div>
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: `${event.registeredParticipants > 0 ? (event.actualParticipants / event.registeredParticipants * 100) : 0}%` }}
                                                    />
                                                </div>
                                            </div>
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
                                                    Ссылка на регистрацию
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                    {event.description && (
                                        <div className="event-description">{event.description}</div>
                                    )}
                                </div>
                                <div className="event-card-footer">
                                    <Link to={`/events/${event.id}`} className="event-btn view"><FontAwesomeIcon icon={faEye} /> Подробнее</Link>
                                    {isAdmin && (
                                        <>
                                            <button onClick={() => openEditModal(event.id)} className="event-btn edit">
                                                <FontAwesomeIcon icon={faEdit} /> Редактировать
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