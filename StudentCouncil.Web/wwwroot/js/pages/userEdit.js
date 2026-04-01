window.renderUserEdit = async function () {
    const userId = window.editUserId || new URLSearchParams(window.location.search).get('id');

    if (!userId) {
        return '<div class="alert alert-danger">ID пользователя не указан</div>';
    }

    const result = await API.getUser(userId);
    if (!result.ok) {
        if (result.status === 401) {
            window.location.href = '/login';
            return '';
        }
        return '<div class="alert alert-danger">Ошибка загрузки пользователя</div>';
    }

    const user = result.data;
    window.editUserId = userId;

    window.currentEditUserRole = user.role;
    window.currentEditUserIsActive = user.isActive;

    return `
        <div class="user-edit-page">
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
            <div class="user-edit-container">
                <div class="user-edit-card">
                    <div class="user-edit-header">
                        <h2>Редактирование пользователя</h2>
                        <p>${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</p>
                    </div>
                    <div class="user-edit-body">
                        <form id="userEditForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Имя *</label>
                                    <input type="text" name="firstName" value="${escapeHtml(user.firstName)}" required>
                                </div>
                                <div class="form-group">
                                    <label>Фамилия *</label>
                                    <input type="text" name="lastName" value="${escapeHtml(user.lastName)}" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Отчество</label>
                                <input type="text" name="patronymic" value="${escapeHtml(user.patronymic || '')}">
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Email *</label>
                                    <input type="email" name="email" value="${escapeHtml(user.email)}" required>
                                </div>
                                <div class="form-group">
                                    <label>Группа</label>
                                    <input type="text" name="group" value="${escapeHtml(user.group || '')}">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Телефон</label>
                                    <input type="tel" name="phoneNumber" value="${escapeHtml(user.phoneNumber || '')}">
                                </div>
                                <div class="form-group">
                                    <label>Telegram</label>
                                    <input type="text" name="telegram" value="${escapeHtml(user.telegram || '')}">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Размер одежды</label>
                                <input type="text" name="clothingSize" value="${escapeHtml(user.clothingSize || '')}">
                            </div>
                            
                            <div class="form-group">
                                <label>Дата рождения</label>
                                <input type="date" name="birthDate" value="${user.birthDate ? user.birthDate.split('T')[0] : ''}">
                            </div>
                            
                            ${window.isAdmin() ? `
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Роль</label>
                                        <select name="role">
                                            <option value="Member" ${user.role === 'Member' ? 'selected' : ''}>Участник</option>
                                            <option value="Leader" ${user.role === 'Leader' ? 'selected' : ''}>Руководство</option>
                                            <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Админ</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Статус</label>
                                        <select name="isActive">
                                            <option value="true" ${user.isActive ? 'selected' : ''}>Активен</option>
                                            <option value="false" ${!user.isActive ? 'selected' : ''}>Заблокирован</option>
                                        </select>
                                    </div>
                                </div>
                            ` : ''}
                            
                            <div id="editErrorMessage" class="error-message" style="display: none;"></div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn-save">Сохранить</button>
                                <a href="/users" class="btn-cancel">Отмена</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
};

window.initUserEdit = function () {
    const form = document.getElementById('userEditForm');
    const errorDiv = document.getElementById('editErrorMessage');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const userId = window.editUserId;

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

        if (window.isAdmin()) {
            data.role = formData.get('role');
            data.isActive = formData.get('isActive') === 'true';
        }
        else {
            data.role = window.currentEditUserRole;
            data.isActive = window.currentEditUserIsActive;
        }

        if (errorDiv) {
            errorDiv.style.display = 'none';
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Сохранение...';
        submitBtn.disabled = true;

        const result = await API.updateUser(userId, data);

        if (result.ok) {
            window.location.href = '/users';
        } else {
            if (errorDiv) {
                if (result.status === 403) {
                    errorDiv.textContent = result.data?.error || 'У вас нет прав на это действие';
                }
                else {
                    errorDiv.textContent = result.data?.error || 'Ошибка сохранения';
                }
                errorDiv.style.display = 'block';
            }
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
};