import { useState, useEffect } from 'react';
import { API } from '../../api';

export default function EventFormModal({ isOpen, onClose, eventId, isAdmin, onSuccess }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        eventDate: '',
        location: '',
        registeredParticipants: 0,
        actualParticipants: 0,
        registrationLink: '',
        responsibleUserId: '',
        status: 'Upcoming'
    });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [initialLoading, setInitialLoading] = useState(false);

    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [removePhoto, setRemovePhoto] = useState(false);

    const isEditMode = !!eventId;

    useEffect(() => {
        if (isOpen) {
            loadUsers();
            if (isEditMode) {
                loadEvent();
            } else {
                resetForm();
            }
        }
    }, [isOpen, eventId]);

    const loadUsers = async () => {
        const result = await API.getUsers();
        if (result.ok) {
            setUsers(result.data.users || []);
        }
    };

    const loadEvent = async () => {
        setInitialLoading(true);
        const result = await API.getEvent(eventId);
        if (result.ok) {
            const event = result.data;
            setFormData({
                title: event.title || '',
                description: event.description || '',
                budget: event.budget || '',
                eventDate: event.eventDate ? event.eventDate.slice(0, 16) : '',
                location: event.location || '',
                registeredParticipants: event.registeredParticipants ?? 0,
                actualParticipants: event.actualParticipants ?? 0,
                registrationLink: event.registrationLink || '',
                responsibleUserId: event.responsibleUserId || '',
                status: event.status || 'Upcoming'
            });
            setPhotoPreview(event.photoPath || null);
            setPhotoFile(null);
            setRemovePhoto(false);
        } else {
            setError('Ошибка загрузки мероприятия');
        }
        setInitialLoading(false);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            budget: '',
            eventDate: '',
            location: '',
            registeredParticipants: 0,
            actualParticipants: 0,
            registrationLink: '',
            responsibleUserId: '',
            status: 'Upcoming'
        });
        setPhotoFile(null);
        setPhotoPreview(null);
        setRemovePhoto(false);
        setError('');
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
        setRemovePhoto(false);
    };

    const handleRemovePhoto = () => {
        setPhotoFile(null);
        setPhotoPreview(null);
        setRemovePhoto(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const data = {
            title: formData.title,
            description: formData.description,
            budget: formData.budget ? parseFloat(formData.budget) : null,
            eventDate: new Date(formData.eventDate).toISOString(),
            location: formData.location,
            registeredParticipants: parseInt(formData.registeredParticipants) || 0,
            actualParticipants: parseInt(formData.actualParticipants) || 0,
            registrationLink: formData.registrationLink,
            responsibleUserId: parseInt(formData.responsibleUserId)
        };

        if (isEditMode && isAdmin) {
            data.status = formData.status;
        }

        let eventIdToUse = eventId;

        if (isEditMode) {
            const result = await API.updateEvent(eventId, data);
            if (!result.ok) {
                setError(result.data?.error || 'Ошибка сохранения');
                setLoading(false);
                return;
            }
        } else {
            const result = await API.createEvent(data);
            if (!result.ok) {
                setError(result.data?.error || 'Ошибка создания');
                setLoading(false);
                return;
            }
            eventIdToUse = result.data.id;
        }

        if (photoFile) {
            const fd = new FormData();
            fd.append('photo', photoFile);
            const photoRes = await API.uploadEventPhoto(eventIdToUse, fd);
            if (!photoRes.ok) {
                setError(photoRes.data?.error || 'Ошибка загрузки фото');
                setLoading(false);
                return;
            }
        } else if (removePhoto && isEditMode) {
            const delRes = await API.deleteEventPhoto(eventIdToUse);
            if (!delRes.ok) {
                setError(delRes.data?.error || 'Ошибка удаления фото');
                setLoading(false);
                return;
            }
        }

        onSuccess();
        onClose();
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="modal" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{isEditMode ? 'Редактирование мероприятия' : 'Создание мероприятия'}</h3>
                    <span className="modal-close" onClick={onClose}>&times;</span>
                </div>
                <div className="modal-body">
                    {initialLoading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Загрузка...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Название *</label>
                                <input type="text" name="title" value={formData.title} onChange={handleChange} required />
                            </div>

                            <div className="form-group">
                                <label>Описание</label>
                                <textarea name="description" rows="4" value={formData.description} onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label>Фото мероприятия</label>
                                {photoPreview && (
                                    <div className="photo-preview-wrapper">
                                        <img src={photoPreview} alt="Превью" className="photo-preview" />
                                        <button
                                            type="button"
                                            className="btn-remove-photo"
                                            onClick={handleRemovePhoto}
                                        >
                                            Удалить фото
                                        </button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.gif"
                                    onChange={handlePhotoChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Бюджет (₽)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="budget"
                                    value={formData.budget}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                />
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

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Зарегистрировалось</label>
                                    <input type="number" min="0" name="registeredParticipants" value={formData.registeredParticipants} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Пришло</label>
                                    <input type="number" min="0" name="actualParticipants" value={formData.actualParticipants} onChange={handleChange} />
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
                                <button type="button" onClick={onClose} className="btn-cancel">Отмена</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}