import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTable, faIdCard, faGraduationCap, faEnvelope, 
    faChartLine, faCircle, faEdit, faTrashAlt,
    faEye, faPlus, faCheckCircle
} from '@fortawesome/free-solid-svg-icons'
import Bubbles from '../components/Bubbles';
import '../css/users.css';

export default function UsersPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const isLeader = user?.role === 'Leader';

    if (!isAdmin && !isLeader) {
        return <div className="alert alert-danger">Доступ запрещён</div>;
    }
    
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('table');

    useEffect(() => {
        loadUsers();
    }, []);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

    const deleteUser = async (id) => {
        if (!confirm('Удалить пользователя?')) return;
        const result = await API.deleteUser(id);
        if (result.ok) {
            setUsers(users.filter(u => u.id !== id));
        } else {
            alert(result.data?.error || 'Ошибка удаления');
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Загрузка...</p></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    const showCreateUserModal = () => {
    const modalHtml = `
        <div id="createUserModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Создание пользователя</h3>
                    <span class="modal-close" onclick="document.getElementById('createUserModal')?.remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="createUserForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Имя *</label>
                                <input type="text" name="firstName" required>
                            </div>
                            <div class="form-group">
                                <label>Фамилия *</label>
                                <input type="text" name="lastName" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Отчество</label>
                            <input type="text" name="patronymic">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" name="email" required>
                            </div>
                            <div class="form-group">
                                <label>Пароль *</label>
                                <input type="password" name="password" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Группа</label>
                                <input type="text" name="group">
                            </div>
                            <div class="form-group">
                                <label>Телефон</label>
                                <input type="tel" name="phoneNumber">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Telegram</label>
                                <input type="text" name="telegram">
                            </div>
                        <div className="form-group">
                            <label>Размер одежды</label>
                            <select name="clothingSize">
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
                        <div class="form-group">
                            <label>Дата рождения</label>
                            <input type="date" name="birthDate">
                        </div>
                        ${isAdmin ? `
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Роль</label>
                                    <select name="role">
                                        <option value="Member">Участник</option>
                                        <option value="Leader">Руководство</option>
                                        <option value="Admin">Админ</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Статус</label>
                                    <select name="isActive">
                                        <option value="true">Активен</option>
                                        <option value="false">Заблокирован</option>
                                    </select>
                                </div>
                            </div>
                        ` : ''}
                        <div id="modalErrorMessage" class="error-message" style="display: none;"></div>
                        <div class="form-actions">
                            <button type="submit" class="btn-save">Создать</button>
                            <button type="button" onclick="document.getElementById('createUserModal')?.remove()" class="btn-cancel">Отмена</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const form = document.getElementById('createUserForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            patronymic: formData.get('patronymic'),
            email: formData.get('email'),
            password: formData.get('password'),
            group: formData.get('group'),
            phoneNumber: formData.get('phoneNumber'),
            telegram: formData.get('telegram'),
            clothingSize: formData.get('clothingSize'),
            birthDate: formData.get('birthDate') || null,
        };
        
        if (isAdmin) {
            data.role = formData.get('role');
            data.isActive = formData.get('isActive') === 'true';
        } else {
            data.role = 'Member';
            data.isActive = true;
        }
        
        const errorDiv = document.getElementById('modalErrorMessage');
        errorDiv.style.display = 'none';
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Создание...';
        submitBtn.disabled = true;
        
        const result = await API.createUser(data);
        
        if (result.ok) {
            document.getElementById('createUserModal')?.remove();
            loadUsers();
        } else {
            errorDiv.textContent = result.data?.error || 'Ошибка создания';
            errorDiv.style.display = 'block';
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
};

const showEditUserModal = async (userId) => {
    const result = await API.getUser(userId);
    if (!result.ok) {
        alert('Ошибка загрузки пользователя');
        return;
    }
    const userData = result.data;
    
    const modalHtml = `
        <div id="editUserModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Редактирование пользователя</h3>
                    <span class="modal-close" onclick="document.getElementById('editUserModal')?.remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="editUserForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Имя *</label>
                                <input type="text" name="firstName" value="${escapeHtml(userData.firstName)}" required>
                            </div>
                            <div class="form-group">
                                <label>Фамилия *</label>
                                <input type="text" name="lastName" value="${escapeHtml(userData.lastName)}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Отчество</label>
                            <input type="text" name="patronymic" value="${escapeHtml(userData.patronymic || '')}">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" name="email" value="${escapeHtml(userData.email)}" required>
                            </div>
                            <div class="form-group">
                                <label>Группа</label>
                                <input type="text" name="group" value="${escapeHtml(userData.group || '')}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Телефон</label>
                                <input type="tel" name="phoneNumber" value="${escapeHtml(userData.phoneNumber || '')}">
                            </div>
                            <div class="form-group">
                                <label>Telegram</label>
                                <input type="text" name="telegram" value="${escapeHtml(userData.telegram || '')}">
                            </div>
                        </div>
                        <div class="form-row">
                           <div className="form-row">
                                <div className="form-group">
                                    <label>Размер одежды</label>
                                    <select name="clothingSize">
                                        <option value="">Не указан</option>
                                        <option value="XS" ${userData.clothingSize === 'XS' ? 'selected' : ''}>XS</option>
                                        <option value="S" ${userData.clothingSize === 'S' ? 'selected' : ''}>S</option>
                                        <option value="M" ${userData.clothingSize === 'M' ? 'selected' : ''}>M</option>
                                        <option value="L" ${userData.clothingSize === 'L' ? 'selected' : ''}>L</option>
                                        <option value="XL" ${userData.clothingSize === 'XL' ? 'selected' : ''}>XL</option>
                                        <option value="XXL" ${userData.clothingSize === 'XXL' ? 'selected' : ''}>XXL</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Дата рождения</label>
                                <input type="date" name="birthDate" value="${userData.birthDate ? userData.birthDate.split('T')[0] : ''}">
                            </div>
                        </div>
                        ${isAdmin ? `
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Роль</label>
                                    <select name="role">
                                        <option value="Member" ${userData.role === 'Member' ? 'selected' : ''}>Участник</option>
                                        <option value="Leader" ${userData.role === 'Leader' ? 'selected' : ''}>Руководство</option>
                                        <option value="Admin" ${userData.role === 'Admin' ? 'selected' : ''}>Админ</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Статус</label>
                                    <select name="isActive">
                                        <option value="true" ${userData.isActive ? 'selected' : ''}>Активен</option>
                                        <option value="false" ${!userData.isActive ? 'selected' : ''}>Заблокирован</option>
                                    </select>
                                </div>
                            </div>
                        ` : ''}
                        <div id="modalErrorMessage" class="error-message" style="display: none;"></div>
                        <div class="form-actions">
                            <button type="submit" class="btn-save">Сохранить</button>
                            <button type="button" onclick="document.getElementById('editUserModal')?.remove()" class="btn-cancel">Отмена</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const form = document.getElementById('editUserForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            patronymic: formData.get('patronymic'),
            email: formData.get('email'),
            group: formData.get('group'),
            phoneNumber: formData.get('phoneNumber'),
            telegram: formData.get('telegram'),
            clothingSize: formData.get('clothingSize'),
            birthDate: formData.get('birthDate') || null,
        };
        
        if (isAdmin) {
            data.role = formData.get('role');
            data.isActive = formData.get('isActive') === 'true';
        }
        
        const errorDiv = document.getElementById('modalErrorMessage');
        errorDiv.style.display = 'none';
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Сохранение...';
        submitBtn.disabled = true;
        
        const result = await API.updateUser(userId, data);
        
        if (result.ok) {
            document.getElementById('editUserModal')?.remove();
            loadUsers();
        } else {
            errorDiv.textContent = result.data?.error || 'Ошибка сохранения';
            errorDiv.style.display = 'block';
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
};

    return (
    <div className="users-page">
        <Bubbles />
        <div className="users-wrapper">
            <div className="users-header">
                <h1>Список участников</h1>
                <div className="header-actions">
                    <div className="view-toggle">
                        <button className={`view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title="Таблица">
                            <FontAwesomeIcon icon={faTable} />
                        </button>
                       <button className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => setViewMode('cards')} title="Карточки">
                            <FontAwesomeIcon icon={faIdCard} />
                        </button>
                    </div>
                    {isAdmin && (
                        <button onClick={showCreateUserModal} className="create-btn">
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
                                                <button onClick={() => showEditUserModal(user.id)} className="action-btn edit">
                                                    <FontAwesomeIcon icon={faEdit} /> Ред.
                                                </button>
                                                <button onClick={() => deleteUser(user.id)} className="action-btn delete">
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
                                                        <button onClick={() => showEditUserModal(user.id)} className="action-btn edit">
                                                            <FontAwesomeIcon icon={faEdit} /> Ред.
                                                        </button>
                                                        <button onClick={() => deleteUser(user.id)} className="action-btn delete">
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
    </div>
    );
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}