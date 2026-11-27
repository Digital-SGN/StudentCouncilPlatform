import { useState, useEffect, useRef } from 'react';
import { API } from '../../api.js';
import { AVAILABLE_BANNERS } from '../../constants/banners.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faShieldHalved, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { QRCodeSVG } from 'qrcode.react';
import ConfirmModal from './ConfirmDialogModal';
import '../../css/Modal.css';

function OtpInput({ value, onChange, disabled }) {
    const [otp, setOtp] = useState(value.split('').slice(0, 6));
    const inputRefs = useRef([]);

    useEffect(() => {
        const newOtp = value.split('').slice(0, 6);
        while (newOtp.length < 6) newOtp.push('');
        setOtp(newOtp);
    }, [value]);

    const handleChange = (index, val) => {
        if (val.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = val;
        setOtp(newOtp);
        onChange(newOtp.join(''));
        if (val && index < 5) inputRefs.current[index + 1]?.focus();
    };

    return (
        <div className="otp-container" style={{ gap: '8px', margin: '12px 0' }}>
            {otp.map((digit, idx) => (
                <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value.replace(/\D/g, ''))}
                    disabled={disabled}
                    className="otp-input"
                    style={{ width: '40px', height: '45px', fontSize: '20px', padding: 0 }}
                />
            ))}
        </div>
    );
}

export default function UserFormModal({ isOpen, onClose, userId, isAdmin, isLeader, isOwnProfile, onSuccess }) {
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', patronymic: '', email: '', password: '',
        group: '', phoneNumber: '', telegram: '', clothingSize: '', birthDate: '',
        joinedAt: '', balance: 0, experiencePoints: 0,
        role: 'Member', isActive: true, aboutMe: '', bannerPath: 'default'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [initialLoading, setInitialLoading] = useState(!!userId);

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [removeAvatar, setRemoveAvatar] = useState(false);

    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [twoFactorSetupData, setTwoFactorSetupData] = useState(null);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [is2faLoading, setIs2faLoading] = useState(false);
    const [showDisable2FAConfirm, setShowDisable2FAConfirm] = useState(false); 

    const isEditMode = !!userId;
    const canEditRoleAndStatus = isAdmin && !isOwnProfile;
    const canEditStats = isAdmin && !isOwnProfile;
    const showStatsForSelf = isAdmin && isOwnProfile;

    useEffect(() => {
        if (isOpen && userId) {
            loadUser();
            if (isOwnProfile) {
                loadTwoFactorStatus();
            }
        }
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
                isActive: user.isActive ?? true,
                aboutMe: user.aboutMe || '',
                bannerPath: user.bannerPath || 'default'
            });
            setAvatarPreview(user.avatarPath || null);
            setAvatarFile(null);
            setRemoveAvatar(false);
        }
        setInitialLoading(false);
    };

    const loadTwoFactorStatus = async () => {
        const r = await API.getTwoFactorStatus();
        if (r.ok) setTwoFactorEnabled(r.data.enabled);
    };

    const resetForm = () => {
        setFormData({
            firstName: '', lastName: '', patronymic: '', email: '', password: '',
            group: '', phoneNumber: '', telegram: '', clothingSize: '', birthDate: '',
            joinedAt: '', balance: 0, experiencePoints: 0,
            role: 'Member', isActive: true, aboutMe: '', bannerPath: 'default'
        });
        setAvatarFile(null);
        setAvatarPreview(null);
        setRemoveAvatar(false);
        setError('');
        setTwoFactorSetupData(null);
        setTwoFactorCode('');
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        setRemoveAvatar(false);
    };

    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        setRemoveAvatar(true);
    };

    const startTwoFactorSetup = async () => {
        setIs2faLoading(true);
        setError('');
        const r = await API.setupTwoFactor();
        setIs2faLoading(false);
        if (!r.ok) return setError(r.data?.error || 'Ошибка инициализации 2FA');
        setTwoFactorSetupData(r.data);
    };

    const confirmTwoFactorSetup = async () => {
        if (twoFactorCode.length !== 6) return;
        setIs2faLoading(true);
        setError('');
        const r = await API.confirmTwoFactorSetup(twoFactorCode);
        setIs2faLoading(false);
        if (!r.ok) return setError(r.data?.error || 'Неверный код');
        
        setTwoFactorEnabled(true);
        setTwoFactorSetupData(null);
        setTwoFactorCode('');
    };

     const promptDisableTwoFactor = () => {
        setShowDisable2FAConfirm(true);
    };

    const executeDisableTwoFactor = async () => {
        setShowDisable2FAConfirm(false);
        setIs2faLoading(true);
        setError('');
        
        const r = await API.disableTwoFactor();
        setIs2faLoading(false);
        
        if (!r.ok) return setError(r.data?.error || 'Ошибка отключения 2FA');
        
        setTwoFactorEnabled(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const data = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            patronymic: formData.patronymic || null,  
            email: formData.email,
            group: formData.group || null,   
            phoneNumber: formData.phoneNumber || null,   
            telegram: formData.telegram || null,  
            clothingSize: formData.clothingSize || null,  
            birthDate: formData.birthDate || null,
            aboutMe: formData.aboutMe || null,
            bannerPath: formData.bannerPath
        };

        if (!isEditMode) data.password = formData.password;

        if (canEditRoleAndStatus) {
            data.role = formData.role;
            data.isActive = formData.isActive;
        }
        if (canEditStats || showStatsForSelf) {
            data.joinedAt = formData.joinedAt || null;
            data.balance = parseInt(formData.balance) || 0;
            data.experiencePoints = parseInt(formData.experiencePoints) || 0;
        }

        let result = isEditMode ? await API.updateUser(userId, data) : await API.createUser(data);

        if (!result.ok) {
            setError(result.data?.error || 'Ошибка сохранения профиля');
            setLoading(false);
            return;
        }

        if (avatarFile) {
            const fd = new FormData();
            fd.append('avatar', avatarFile);
            const avatarRes = await API.uploadAvatar(userId || result.data?.id, fd);
            if (!avatarRes.ok) {
                setError(avatarRes.data?.error || 'Ошибка загрузки аватара');
                setLoading(false);
                return;
            }
        } else if (removeAvatar && isEditMode) {
            await API.deleteAvatar(userId);
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
                    <h3>{isEditMode ? 'Настройки профиля' : 'Создание пользователя'}</h3>
                    <span className="modal-close" onClick={onClose}>&times;</span>
                </div>
                <div className="modal-body">
                    {initialLoading ? (
                        <div className="loading-container"><div className="spinner"></div><p>Загрузка...</p></div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            
                            <div className="form-group">
                                <label>Фото профиля</label>
                                <div className="avatar-modal-upload">
                                    {avatarPreview && (
                                        <div className="avatar-preview-wrapper">
                                            <img src={avatarPreview} alt="Превью" className="avatar-preview" />
                                            <button type="button" className="btn-remove-photo" onClick={handleRemoveAvatar}>Удалить</button>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={handleAvatarChange} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Фон профиля</label>
                                <div className="banner-selection-grid">
                                    {AVAILABLE_BANNERS.map((banner) => (
                                        <div 
                                            key={banner.id}
                                            className={`banner-option ${formData.bannerPath === banner.id ? 'selected' : ''}`}
                                            onClick={() => setFormData(prev => ({ ...prev, bannerPath: banner.id }))}
                                            style={{
                                                background: banner.url.startsWith('linear') ? banner.url : `url(${banner.url}) center/cover`
                                            }}
                                            title={banner.name}
                                        >
                                            {formData.bannerPath === banner.id && (
                                                <div className="banner-check"><FontAwesomeIcon icon={faCheck} /></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group"><label>Имя *</label><input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required /></div>
                                <div className="form-group"><label>Фамилия *</label><input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required /></div>
                            </div>
                            <div className="form-group"><label>Отчество</label><input type="text" name="patronymic" value={formData.patronymic} onChange={handleChange} /></div>

                            <div className="form-group">
                                <label>О себе</label>
                                <textarea name="aboutMe" value={formData.aboutMe} onChange={handleChange} rows="3" maxLength="500" className="form-textarea" />
                            </div>

                            <div className="form-group">
                                <label>Email *</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={!isAdmin} />
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

                            {isOwnProfile && (
                                <div className="form-group" style={{ marginTop: '24px', padding: '16px', background: 'var(--surface-subtle)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-primary)' }}>
                                        <FontAwesomeIcon icon={faShieldHalved} style={{ color: '#0CBFA1' }} />
                                        Двухфакторная защита (2FA)
                                    </label>
                                    
                                    {twoFactorSetupData ? (
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                                Отсканируйте QR-код в приложении (Google Authenticator, Яндекс Ключ и т.д.)
                                            </p>
                                            <div style={{ background: 'var(--surface)', padding: '12px', display: 'inline-block', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                <QRCodeSVG value={twoFactorSetupData.authenticatorUri} size={140} />
                                            </div>
                                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '12px' }}>Введите код из приложения:</p>
                                            <OtpInput value={twoFactorCode} onChange={setTwoFactorCode} disabled={is2faLoading} />
                                            <button 
                                                type="button" 
                                                onClick={confirmTwoFactorSetup} 
                                                disabled={is2faLoading || twoFactorCode.length !== 6}
                                                style={{ padding: '8px 16px', background: '#0CBFA1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                {is2faLoading ? 'Проверка...' : 'Подтвердить'}
                                            </button>
                                        </div>
                                    ) : twoFactorEnabled ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0CBFA1', fontSize: '14px', fontWeight: '500' }}>
                                                <FontAwesomeIcon icon={faCircleCheck} /> 2FA включена
                                            </span>
                                            <button 
                                                type="button" 
                                                onClick={promptDisableTwoFactor} 
                                                disabled={is2faLoading}
                                                style={{ padding: '6px 12px', background: 'var(--danger-surface)', color: 'var(--danger-text)', border: '1px solid var(--danger-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                                            >
                                                {is2faLoading ? 'Отключение...' : 'Отключить'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                                                Дополнительная защита аккаунта
                                            </span>
                                            <button 
                                                type="button" 
                                                onClick={startTwoFactorSetup} 
                                                disabled={is2faLoading}
                                                style={{ padding: '6px 12px', background: '#0CBFA1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                                            >
                                                {is2faLoading ? 'Загрузка...' : 'Настроить 2FA'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {canEditRoleAndStatus && (
                                <div className="form-row" style={{ marginTop: '16px' }}>
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

            <ConfirmModal
                isOpen={showDisable2FAConfirm}
                onClose={() => setShowDisable2FAConfirm(false)}
                onConfirm={executeDisableTwoFactor}
                title="Отключение 2FA"
                message="Вы уверены, что хотите отключить двухфакторную аутентификацию? Это снизит безопасность вашего аккаунта."
                confirmText="Да, отключить"
                cancelText="Отмена"
            />
        </div>
    );
}