import { useState } from 'react';
import { API } from '../../api';

const ROLES = ['Главный организатор', 'Организатор', 'Медиа', 'Техпод', 'Волонтёр'];

export default function AddMemberModal({ isOpen, onClose, eventId, usersList, onSuccess }) {
    const [userId, setUserId] = useState('');
    const [role, setRole] = useState(ROLES[0]);
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) {
            setError('Выберите участника');
            return;
        }

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('UserId', userId);
        formData.append('EventId', eventId);
        formData.append('Role', role);
        if (file) formData.append('file', file);

        const result = await API.createBadge(formData);
        if (result.ok) {
            onSuccess(); 
            onClose();
        } else {
            setError(result.error || 'Ошибка добавления участника');
        }
        setLoading(false);
    };

    return (
        <div className="modal" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Добавить участника</h3>
                    <span className="modal-close" onClick={onClose}>&times;</span>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Участник *</label>
                            <select
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                required
                            >
                                <option value="">Выберите участника</option>
                                {usersList.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.lastName} {u.firstName} {u.patronymic || ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Роль *</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                {ROLES.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Файл бейджа (PDF)</label>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setFile(e.target.files[0])}
                            />
                            <small className="form-hint">Можно загрузить позже</small>
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <div className="form-actions">
                            <button type="submit" className="btn-save" disabled={loading}>
                                {loading ? 'Добавление...' : 'Добавить'}
                            </button>
                            <button type="button" className="btn-cancel" onClick={onClose}>
                                Отмена
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}