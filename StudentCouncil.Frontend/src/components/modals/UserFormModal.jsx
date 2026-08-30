import { useState, useEffect } from 'react';
import { API } from '../../api.js';

export default function UserFormModal({ isOpen, onClose, userId, isAdmin, isLeader, isOwnProfile, onSuccess }) {
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', patronymic: '', email: '', password: '',
        group: '', phoneNumber: '', telegram: '', clothingSize: '', birthDate: '',
        joinedAt: '', balance: 0, experiencePoints: 0,
        role: 'Member', isActive: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [initialLoading, setInitialLoading] = useState(!!userId);

    const isEditMode = !!userId;

    const canEditRoleAndStatus = isAdmin && !isOwnProfile;
    const canEditStats = isAdmin && !isOwnProfile;
    const showStatsForSelf = isAdmin && isOwnProfile;

    useEffect(() => {
        if (isOpen && userId) loadUser();
        if (!isOpen) resetForm();
    }, [isOpen, userId]);

    const loadUser = async () => {
        setInitialLoading(true);
        const result = await API.getUser(userId);
        if (result.ok) {
            const user = result.data;
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                patronymic: user.patronymic || '',
                email: user.email || '',
                password: '',
                group: user.group || '',
                phoneNumber: user.phoneNumber || '',
                telegram: user.telegram || '',
                clothingSize: user.clothingSize || '',
                birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
                joinedAt: user.joinedAt ? user.joinedAt.split('T')[0] : '',
                balance: user.balance ?? 0,
                experiencePoints: user.experiencePoints ?? 0,
                role: user.role || 'Member',
                isActive: user.isActive ?? true
            });
        }
        setInitialLoading(false);
    };

    const resetForm = () => {
        setFormData({
            firstName: '', lastName: '', patronymic: '', email: '', password: '',
            group: '', phoneNumber: '', telegram: '', clothingSize: '', birthDate: '',
            joinedAt: '', balance: 0, experiencePoints: 0,
            role: 'Member', isActive: true
        });
        setError('');
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const data = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            patronymic: formData.patronymic,
            email: formData.email,
            group: formData.group,
            phoneNumber: formData.phoneNumber,
            telegram: formData.telegram,
            clothingSize: formData.clothingSize,
            birthDate: formData.birthDate || null,
        };

        if (!isEditMode) {
            data.password = formData.password;
        }

        if (canEditRoleAndStatus) {
            data.role = formData.role;
            data.isActive = formData.isActive;
        }
        if (canEditStats || showStatsForSelf) {
            data.joinedAt = formData.joinedAt || null;
            data.balance = parseInt(formData.balance) || 0;
            data.experiencePoints = parseInt(formData.experiencePoints) || 0;
        }

        let result;
        if (isEditMode) {
            result = await API.updateUser(userId, data);
        } else {
            result = await API.createUser(data);
        }

        if (result.ok) {
            onSuccess();
            onClose();
        } else {
            setError(result.data?.error || 'Ошибка сохранения');
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="modal" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{isEditMode ? 'Редактирование пользователя' : 'Создание пользователя'}</h3>
                    <span className="modal-close" onClick={onClose}>&times;</span>
                </div>
                <div className="modal-body">
                    {initialLoading ? (
                        <div className="loading-container"><div className="spinner"></div><p>Загрузка...</p></div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group"><label>Имя *</label><input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required /></div>
                                <div className="form-group"><label>Фамилия *</label><input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required /></div>
                            </div>
                            <div className="form-group"><label>Отчество</label><input type="text" name="patronymic" value={formData.patronymic} onChange={handleChange} /></div>

                            <div className="form-group">
                                <label>Email *</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    required 
                                    disabled={!isAdmin}
                                />
                            </div>

                            {!isEditMode && (
                                <div className="form-group">
                                    <label>Пароль *</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                                </div>
                            )}

                            <div className="form-row">
                                <div className="form-group"><label>Группа</label><input type="text" name="group" value={formData.group} onChange={handleChange} /></div>
                                <div className="form-group"><label>Телефон</label><input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Telegram</label><input type="text" name="telegram" value={formData.telegram} onChange={handleChange} /></div>
                                <div className="form-group"><label>Размер одежды</label>
                                    <select name="clothingSize" value={formData.clothingSize} onChange={handleChange}>
                                        <option value="">Не указан</option>
                                        <option value="XS">XS</option><option value="S">S</option><option value="M">M</option>
                                        <option value="L">L</option><option value="XL">XL</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group"><label>Дата рождения</label><input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} /></div>

                            {canEditRoleAndStatus && (
                                <div className="form-row">
                                    <div className="form-group"><label>Роль</label>
                                        <select name="role" value={formData.role} onChange={handleChange}>
                                            <option value="Member">Участник</option>
                                            <option value="Leader">Руководство</option>
                                            <option value="Admin">Админ</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Статус</label>
                                        <select name="isActive" value={formData.isActive.toString()} onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}>
                                            <option value="true">Активен</option>
                                            <option value="false">Заблокирован</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {(canEditStats || showStatsForSelf) && (
                                <>
                                    <div className="form-group"><label>Дата вступления</label><input type="date" name="joinedAt" value={formData.joinedAt} onChange={handleChange} /></div>
                                    <div className="form-row">
                                        <div className="form-group"><label>Баланс (баллы)</label><input type="number" name="balance" value={formData.balance} onChange={handleChange} /></div>
                                        <div className="form-group"><label>Опыт (XP)</label><input type="number" name="experiencePoints" value={formData.experiencePoints} onChange={handleChange} /></div>
                                    </div>
                                </>
                            )}

                            {error && <div className="error-message">{error}</div>}
                            <div className="form-actions">
                                <button type="submit" className="btn-save" disabled={loading}>{loading ? 'Сохранение...' : (isEditMode ? 'Сохранить' : 'Создать')}</button>
                                <button type="button" onClick={onClose} className="btn-cancel">Отмена</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}