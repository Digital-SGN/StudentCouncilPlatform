import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import '../css/events.css';

export default function EventFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const isEditMode = !!id;
    
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAdmin) return;
        loadUsers();
        if (isEditMode) {
            loadEvent();
        }
    }, [id]);

    const loadUsers = async () => {
        const result = await API.getUsers();
        if (result.ok) {
            setUsers(result.data.users || []);
        }
    };

    const loadEvent = async () => {
        setLoading(true);
        const result = await API.getEvent(id);
        if (result.ok) {
            const event = result.data;
            setFormData({
                title: event.title || '',
                description: event.description || '',
                eventDate: event.eventDate ? event.eventDate.slice(0, 16) : '',
                location: event.location || '',
                registrationLink: event.registrationLink || '',
                responsibleUserId: event.responsibleUserId || '',
                status: event.status || 'Upcoming'
            });
        } else {
            setError('Ошибка загрузки мероприятия');
        }
        setLoading(false);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

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
            result = await API.updateEvent(id, data);
        } else {
            result = await API.createEvent(data);
        }

        if (result.ok) {
            navigate('/events');
        } else {
            setError(result.data?.error || 'Ошибка сохранения');
        }
        setLoading(false);
    };

    if (!isAdmin) {
        return <div className="alert alert-danger">Доступ запрещён</div>;
    }

    if (loading && isEditMode) {
        return <div className="loading-container"><div className="spinner"></div><p>Загрузка...</p></div>;
    }

    return (
        <div className="event-form-page">
            <div className="event-form-container">
                <div className="event-form-card">
                    <div className="event-form-header">
                        <h2>{isEditMode ? 'Редактирование мероприятия' : 'Создание мероприятия'}</h2>
                        <p>{isEditMode ? 'Измените информацию о мероприятии' : 'Заполните информацию о новом мероприятии'}</p>
                    </div>
                    <div className="event-form-body">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Название *</label>
                                <input type="text" name="title" value={formData.title} onChange={handleChange} required />
                            </div>

                            <div className="form-group">
                                <label>Описание</label>
                                <textarea name="description" rows="4" value={formData.description} onChange={handleChange} />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Дата и время *</label>
                                    <input type="datetime-local" name="eventDate" value={formData.eventDate} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Место *</label>
                                    <input type="text" name="location" value={formData.location} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Ссылка на регистрацию</label>
                                <input type="url" name="registrationLink" placeholder="https://..." value={formData.registrationLink} onChange={handleChange} />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Ответственный *</label>
                                    <select name="responsibleUserId" value={formData.responsibleUserId} onChange={handleChange} required>
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
                                        <select name="status" value={formData.status} onChange={handleChange}>
                                            <option value="Upcoming">Предстоит</option>
                                            <option value="Completed">Завершено</option>
                                            <option value="Cancelled">Отменено</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <div className="form-actions">
                                <button type="submit" className="btn-save" disabled={loading}>
                                    {loading ? 'Сохранение...' : (isEditMode ? 'Сохранить' : 'Создать')}
                                </button>
                                <a href="/events" className="btn-cancel">Отмена</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}