import { useState, useEffect } from 'react';

export default function UserFormModal({ isOpen, onClose, user, onSave, title }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        patronymic: '',
        email: '',
        password: '',
        group: '',
        phoneNumber: '',
        telegram: '',
        clothingSize: '',
        birthDate: '',
        role: 'Member',
        isActive: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
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
                role: user.role || 'Member',
                isActive: user.isActive !== undefined ? user.isActive : true
            });
        }
    }, [user]);

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

        if (!user) {
            data.password = formData.password;
        }

        if (window.isAdmin?.()) {
            data.role = formData.role;
            data.isActive = formData.isActive === 'true';
        }

        const result = await onSave(data, user?.id);
        if (result.ok) {
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
                    <h3>{title}</h3>
                    <span className="modal-close" onClick={onClose}>&times;</span>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Имя *</label>
                                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Фамилия *</label>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Отчество</label>
                            <input type="text" name="patronymic" value={formData.patronymic} onChange={handleChange} />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Email *</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                            </div>
                            {!user && (
                                <div className="form-group">
                                    <label>Пароль *</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                                </div>
                            )}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Группа</label>
                                <input type="text" name="group" value={formData.group} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Телефон</label>
                                <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Telegram</label>
                                <input type="text" name="telegram" value={formData.telegram} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Размер одежды</label>
                                <select name="clothingSize" value={formData.clothingSize} onChange={handleChange}>
                                    <option value="">Не указан</option>
                                    <option value="XS">XS</option>
                                    <option value="S">S</option>
                                    <option value="M">M</option>
                                    <option value="L">L</option>
                                    <option value="XL">XL</option>
                                    <option value="XXL">XXL</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Дата рождения</label>
                                <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
                            </div>
                        </div>

                        {window.isAdmin?.() && user && user.id !== window.currentUser?.id && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Роль</label>
                                    <select name="role" value={formData.role} onChange={handleChange}>
                                        <option value="Member">Участник</option>
                                        <option value="Leader">Руководство</option>
                                        <option value="Admin">Админ</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Статус</label>
                                    <select name="isActive" value={formData.isActive} onChange={handleChange}>
                                        <option value="true">Активен</option>
                                        <option value="false">Заблокирован</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {error && <div className="error-message">{error}</div>}

                        <div className="form-actions">
                            <button type="submit" className="btn-save" disabled={loading}>
                                {loading ? 'Сохранение...' : 'Сохранить'}
                            </button>
                            <button type="button" onClick={onClose} className="btn-cancel">Отмена</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}