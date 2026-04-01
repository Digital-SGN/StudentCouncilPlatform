window.renderUsers = async function () {
    const result = await API.getUsers();
    if (!result.ok) {
        if (result.status === 401) {
            window.location.href = '/login';
            return '';
        }
        return '<div class="alert alert-danger">Ошибка загрузки пользователей</div>';
    }

    const users = result.data.users;

    if (!users || users.length === 0) {
        return '<div class="error-message-users">Нет пользователей</div>';
    }

    return `
        <div class="users-page">
             <div class="bubbles-side bubbles-left">
                <div class="bubble bubble-left-1"></div>
                <div class="bubble bubble-left-2"></div>
                <div class="bubble bubble-left-3"></div>
                <div class="bubble bubble-left-4"></div>
                <div class="bubble bubble-left-5"></div>
                <div class="bubble-large bubble-left-large"></div>
                <div class="bubble-large bubble-left-large-2"></div>
            </div>
            <div class="bubbles-side bubbles-right">
                <div class="bubble bubble-right-1"></div>
                <div class="bubble bubble-right-2"></div>
                <div class="bubble bubble-right-3"></div>
                <div class="bubble bubble-right-4"></div>
                <div class="bubble bubble-right-5"></div>
                <div class="bubble-large bubble-right-large"></div>
                <div class="bubble-large bubble-right-large-2"></div>
            </div>
            <div class="users-wrapper">
                <div class="users-card">
                    <div class="users-card-header">
                        <h2>Список участников</h2>
                    </div>
                    <div class="users-card-body">
                        <div class="table-responsive">
                            <table class="users-table">
                                <thead>
                                    <tr>
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
                                    ${users.map(user => `
                                        <tr class="${user.role === 'Admin' ? 'admin-row' : (user.role === 'Leader' ? 'leader-row' : '')}">
                                            <td>${escapeHtml(user.firstName)}</td>
                                            <td>${escapeHtml(user.lastName)}</td>
                                            <td>${escapeHtml(user.group || '—')}</td>
                                            <td>${escapeHtml(user.email)}</td>
                                            <td>
                                                <span class="role-badge ${user.role === 'Admin' ? 'admin' : (user.role === 'Leader' ? 'leader' : 'member')}">
                                                    ${user.role === 'Admin' ? 'Админ' : (user.role === 'Leader' ? 'Руководство' : 'Участник')}
                                                </span>
                                            </td>
                                            <td>
                                                <span class="status-badge ${user.isActive ? 'active' : 'inactive'}">
                                                    ${user.isActive ? 'Активен' : 'Заблокирован'}
                                                </span>
                                            </td>
                                            <td class="action-buttons">
                                                <a href="/profile/${user.id}" class="action-btn view">👁️ Профиль</a>
                                                <a href="/users/edit/${user.id}" class="action-btn edit">✏️ Редактировать</a>
                                                <button onclick="deleteUser(${user.id})" class="action-btn delete">🗑️ Удалить</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div style="padding: 20px; text-align: right;">
                            <a href="/users/create" class="create-btn">+ Создать участника</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

async function deleteUser(id) {
    if (!confirm('Удалить пользователя?')) return;
    const result = await API.deleteUser(id);
    if (result.ok) {
        window.location.reload();
    } else {
        alert('Ошибка удаления');
    }
}