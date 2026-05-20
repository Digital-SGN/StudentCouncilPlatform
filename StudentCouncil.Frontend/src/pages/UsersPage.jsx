import { useState, useEffect} from 'react';
import { Link } from 'react-router-dom';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTable, faIdCard, faGraduationCap, faEnvelope, 
    faChartLine, faCircle, faEdit, faTrashAlt,
    faEye, faPlus, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import Bubbles from '../components/Bubbles';
import UserFormModal from '../components/UserFormModal';
import ConfirmModal from '../components/ConfirmDialog';
import '../css/users.css';

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
    
    const [modalState, setModalState] = useState({
        isOpen: false,
        userId: null
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, userId: null });

    const handleDeleteClick = (userId) => {
        setConfirmDelete({ isOpen: true, userId });
    };

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

    const deleteUser = async (id) => {
        if (!confirm('Удалить пользователя?')) return;
        const result = await API.deleteUser(id);
        if (result.ok) {
            setUsers(users.filter(u => u.id !== id));
        } else {
            alert(result.data?.error || 'Ошибка удаления');
        }
    };

    const openCreateModal = () => {
        setModalState({ isOpen: true, userId: null });
    };

    const openEditModal = (userId) => {
        setModalState({ isOpen: true, userId });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, userId: null });
    };

    if (!isAdmin && !isLeader) {
        return <div className="alert alert-danger">Доступ запрещён</div>;
    }

    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Загрузка...</p></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div className="users-page fade-in">
            <Bubbles />
            <div className="users-wrapper">
                <div className="users-header">
                    <h1>Список участников</h1>
                    <div className="header-actions">
                        <div className="view-toggle">
                            <button className={`view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
                                <FontAwesomeIcon icon={faTable} />
                            </button>
                            <button className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => setViewMode('cards')}>
                                <FontAwesomeIcon icon={faIdCard} />
                            </button>
                        </div>
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
                            {users.map(user => (
                                <div key={user.id} className="user-card">
                                    <div className="user-card-header">
                                        <div className="user-name">{user.lastName} {user.firstName}</div>
                                        <div className={`role-badge ${user.role === 'Admin' ? 'admin' : (user.role === 'Leader' ? 'leader' : 'member')}`}>
                                            {user.role === 'Admin' ? 'Админ' : (user.role === 'Leader' ? 'Руководство' : 'Участник')}
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
                                               <button onClick={() => handleDeleteClick(user.id)} className="action-btn delete">
                                                <FontAwesomeIcon icon={faTrashAlt} /> Удалить
                                            </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) 
                    : (
                        <div className="table-responsive">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>Уровень</th>
                                        <th>Имя</th>
                                        <th>Фамилия</th>
                                        <th>Группа</th>
                                        <th>Email</th>
                                        <th>Роль</th>
                                        <th>Статус</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id} className={user.role === 'Admin' ? 'admin-row' : (user.role === 'Leader' ? 'leader-row' : '')}>
                                            <td>{user.level}</td>
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
                                                       <button onClick={() => handleDeleteClick(user.id)} className="action-btn delete">
                                                        <FontAwesomeIcon icon={faTrashAlt} /> Удалить
                                                    </button>
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

            <UserFormModal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                userId={modalState.userId}
                isAdmin={isAdmin}
                onSuccess={loadUsers}
            />
        </div>
    );
}