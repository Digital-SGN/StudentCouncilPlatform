import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTable, faIdCard, faGraduationCap, faEnvelope, 
    faChartLine, faCircle, faEdit, faTrashAlt,
    faEye, faPlus, faCheckCircle, faKey, faShieldAlt, faEllipsisV,
    faSort, faSortUp, faSortDown, faFileExport, faSearch
} from '@fortawesome/free-solid-svg-icons';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import Bubbles from '../components/Bubbles';
import Alert from '../components/Alert';
import UserFormModal from '../components/modals/UserFormModal';
import ConfirmModal from '../components/modals/ConfirmDialogModal';
import '../css/UsersPage.css';

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, (m) => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

export default function UsersPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const isLeader = user?.role === 'Leader';

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('table');

    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('lastName');
    const [sortOrder, setSortOrder] = useState('asc');

    const [modalState, setModalState] = useState({ isOpen: false, userId: null });
    const [resetPasswordModal, setResetPasswordModal] = useState({ isOpen: false, userId: null, newPassword: '' });
    const [reset2FAModal, setReset2FAModal] = useState({ isOpen: false, userId: null });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, userId: null });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const result = await API.getUsers();
            if (result.ok) {
                setUsers(result.data.users || []);
            } else {
                setError(result.data?.error || 'Ошибка загрузки');
            }
        } catch (err) {
            setError('Ошибка загрузки пользователей');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const fullName = `${u.lastName} ${u.firstName} ${u.patronymic || ''}`.toLowerCase();
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) || u.email.toLowerCase().includes(search);
    });

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        let aVal = a[sortField] ?? '';
        let bVal = b[sortField] ?? '';
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
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

    const openCreateModal = () => setModalState({ isOpen: true, userId: null });
    const openEditModal = (userId) => setModalState({ isOpen: true, userId });
    const closeModal = () => setModalState({ isOpen: false, userId: null });

    const openResetPasswordModal = (userId) => setResetPasswordModal({ isOpen: true, userId, newPassword: '' });
    const closeResetPasswordModal = () => setResetPasswordModal({ isOpen: false, userId: null, newPassword: '' });
    const confirmResetPassword = async () => {
        const { userId, newPassword } = resetPasswordModal;
        if (!newPassword) return alert('Введите новый пароль');
        const result = await API.resetPassword(userId, newPassword);
        if (result.ok) {
            alert('Пароль успешно изменён');
            closeResetPasswordModal();
        } else {
            alert(result.data?.error || 'Ошибка сброса пароля');
        }
    };

    const openReset2FAModal = (userId) => setReset2FAModal({ isOpen: true, userId });
    const closeReset2FAModal = () => setReset2FAModal({ isOpen: false, userId: null });
    const confirmReset2FA = async () => {
        const { userId } = reset2FAModal;
        const result = await API.resetTwoFactor(userId);
        if (result.ok) {
            alert('2FA успешно сброшена');
            closeReset2FAModal();
        } else {
            alert(result.data?.error || 'Ошибка сброса 2FA');
        }
    };

    const exportToCSV = () => {
        const dataToExport = sortedUsers.map(user => ({
            'Фамилия': user.lastName,
            'Имя': user.firstName,
            'Отчество': user.patronymic || '',
            'Email': user.email,
            'Группа': user.group || '',
            'Роль': user.role === 'Admin' ? 'Админ' : (user.role === 'Leader' ? 'Руководство' : 'Участник'),
            'Статус': user.isActive ? 'Активен' : 'Заблокирован',
            'Уровень': user.level,
            'Опыт (XP)': user.experiencePoints,
            'Баланс (баллы)': user.balance,
            'Дата вступления': user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('ru-RU') : '',
            'Дата рождения': user.birthDate ? new Date(user.birthDate).toLocaleDateString('ru-RU') : '',
            'Телефон': user.phoneNumber || '',
            'Telegram': user.telegram || '',
            'Размер одежды': user.clothingSize || '',
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
        link.setAttribute('download', `users_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDeleteClick = (userId) => setConfirmDelete({ isOpen: true, userId });
    const confirmDeleteUser = async () => {
        const { userId } = confirmDelete;
        const result = await API.deleteUser(userId);
        if (result.ok) {
            setUsers(users.filter(u => u.id !== userId));
        } else {
            alert(result.data?.error || 'Ошибка удаления');
        }
        setConfirmDelete({ isOpen: false, userId: null });
    };

    if (!isAdmin && !isLeader) {
        return <div className="alert alert-danger">Доступ запрещён</div>;
    }
    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Загрузка...</p></div>;
    if (error) return <Alert type="danger" message={error} />;

    return (
        <div className="users-page fade-in">
            <Bubbles />
            <div className="users-wrapper">
                <div className="users-header">
                    <h1>Список участников</h1>
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
                        <div className="view-toggle">
                            <button className={`view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
                                <FontAwesomeIcon icon={faTable} />
                            </button>
                            <button className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => setViewMode('cards')}>
                                <FontAwesomeIcon icon={faIdCard} />
                            </button>
                        </div>
                        <button onClick={exportToCSV} className="export-btn">
                            <FontAwesomeIcon icon={faFileExport} /> Экспорт CSV
                        </button>
                        {isAdmin && (
                            <button onClick={openCreateModal} className="create-btn">
                                <FontAwesomeIcon icon={faPlus} /> Создать участника
                            </button>
                        )}
                    </div>
                </div>

                <div className="users-card">
                    <div className="users-card-body">
                        {viewMode === 'cards' ? (
                            <div className="users-cards">
                                {sortedUsers.map(user => (
                                    <div key={user.id} className="user-card">
                                        <div className="user-card-header">
                                            <div className="user-avatar-wrapper">
                                                {user.avatarPath ? (
                                                    <img src={user.avatarPath} alt="Аватар" className="user-avatar-img" />
                                                ) : (
                                                    <div className="user-avatar-placeholder">
                                                        {user.firstName?.[0]}{user.lastName?.[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="user-card-info">
                                                <div className="user-name">{user.lastName} {user.firstName}</div>
                                                <div className={`role-badge ${user.role === 'Admin' ? 'admin' : (user.role === 'Leader' ? 'leader' : 'member')}`}>
                                                    {user.role === 'Admin' ? 'Админ' : (user.role === 'Leader' ? 'Руководство' : 'Участник')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="user-card-body">
                                            <div><FontAwesomeIcon icon={faGraduationCap} /> {user.group || '—'}</div>
                                            <div><FontAwesomeIcon icon={faEnvelope} /> {user.email}</div>
                                            <div><FontAwesomeIcon icon={faChartLine} /> Уровень {user.level}</div>
                                            <div>
                                                <FontAwesomeIcon icon={user.isActive ? faCheckCircle : faCircle} style={{ color: user.isActive ? '#10b981' : '#ef4444' }} />
                                                {user.isActive ? 'Активен' : 'Заблокирован'}
                                            </div>
                                        </div>
                                        <div className="user-card-footer">
                                            <Link to={`/users/${user.id}`} className="action-btn view">
                                                <FontAwesomeIcon icon={faEye} /> Профиль
                                            </Link>
                                            {isAdmin && (
                                                <>
                                                    <button onClick={() => openEditModal(user.id)} className="action-btn edit">
                                                        <FontAwesomeIcon icon={faEdit} /> Ред.
                                                    </button>
                                                    <button onClick={() => openResetPasswordModal(user.id)} className="action-btn reset-pwd">
                                                        <FontAwesomeIcon icon={faKey} /> Сброс пароля
                                                    </button>
                                                    <button onClick={() => openReset2FAModal(user.id)} className="action-btn reset-2fa">
                                                        <FontAwesomeIcon icon={faShieldAlt} /> 2FA
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(user.id)} className="action-btn delete">
                                                        <FontAwesomeIcon icon={faTrashAlt} /> Удалить
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="users-table">
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort('firstName')}>Имя{renderSortIcon('firstName')}</th>
                                            <th onClick={() => handleSort('lastName')}>Фамилия{renderSortIcon('lastName')}</th>
                                            <th onClick={() => handleSort('group')}>Группа{renderSortIcon('group')}</th>
                                            <th onClick={() => handleSort('email')}>Email{renderSortIcon('email')}</th>
                                            <th onClick={() => handleSort('role')}>Роль{renderSortIcon('role')}</th>
                                            <th onClick={() => handleSort('isActive')}>Статус{renderSortIcon('isActive')}</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedUsers.map(user => (
                                            <tr key={user.id} className={user.role === 'Admin' ? 'admin-row' : (user.role === 'Leader' ? 'leader-row' : '')}>
                                                <td>{escapeHtml(user.firstName)}</td>
                                                <td>{escapeHtml(user.lastName)}</td>
                                                <td>{escapeHtml(user.group || '—')}</td>
                                                <td>{escapeHtml(user.email)}</td>
                                                <td>
                                                    <span className={`role-badge ${user.role === 'Admin' ? 'admin' : (user.role === 'Leader' ? 'leader' : 'member')}`}>
                                                        {user.role === 'Admin' ? 'Админ' : (user.role === 'Leader' ? 'Руководство' : 'Участник')}
                                                    </span>
                                                 </td>
                                                <td>
                                                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                                                        {user.isActive ? 'Активен' : 'Заблокирован'}
                                                    </span>
                                                 </td>
                                                <td className="action-buttons">
                                                    <Link to={`/users/${user.id}`} className="action-btn view">
                                                        <FontAwesomeIcon icon={faEye} /> Профиль
                                                    </Link>
                                                    {isAdmin && (
                                                        <>
                                                            <button onClick={() => openEditModal(user.id)} className="action-btn edit">
                                                                <FontAwesomeIcon icon={faEdit} /> Ред.
                                                            </button>
                                                            <details className="dropdown">
                                                                <summary className="action-btn more">
                                                                    <FontAwesomeIcon icon={faEllipsisV} />
                                                                </summary>
                                                                <div className="dropdown-menu">
                                                                    <button onClick={() => openResetPasswordModal(user.id)} className="dropdown-item">
                                                                        <FontAwesomeIcon icon={faKey} /> Сброс пароля
                                                                    </button>
                                                                    <button onClick={() => openReset2FAModal(user.id)} className="dropdown-item">
                                                                        <FontAwesomeIcon icon={faShieldAlt} /> 2FA
                                                                    </button>
                                                                    <button onClick={() => handleDeleteClick(user.id)} className="dropdown-item delete">
                                                                        <FontAwesomeIcon icon={faTrashAlt} /> Удалить
                                                                    </button>
                                                                </div>
                                                            </details>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, userId: null })}
                onConfirm={confirmDeleteUser}
                title="Удаление пользователя"
                message="Вы действительно хотите удалить этого пользователя?"
                confirmText="Удалить"
            />

            {resetPasswordModal.isOpen && (
                <div className="modal" onClick={closeResetPasswordModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Сброс пароля</h3>
                            <span className="modal-close" onClick={closeResetPasswordModal}>&times;</span>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Новый пароль</label>
                                <input
                                    type="password"
                                    value={resetPasswordModal.newPassword}
                                    onChange={(e) => setResetPasswordModal(prev => ({ ...prev, newPassword: e.target.value }))}
                                    autoFocus
                                />
                            </div>
                            <div className="form-actions">
                                <button onClick={confirmResetPassword} className="btn-save">Сохранить</button>
                                <button onClick={closeResetPasswordModal} className="btn-cancel">Отмена</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={reset2FAModal.isOpen}
                onClose={closeReset2FAModal}
                onConfirm={confirmReset2FA}
                title="Сброс двухфакторной аутентификации"
                message="Вы уверены, что хотите сбросить 2FA для этого пользователя?"
                confirmText="Сбросить"
            />

            <UserFormModal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                userId={modalState.userId}
                isAdmin={isAdmin}
                isOwnProfile={false}
                onSuccess={loadUsers}
            />
        </div>
    );
}