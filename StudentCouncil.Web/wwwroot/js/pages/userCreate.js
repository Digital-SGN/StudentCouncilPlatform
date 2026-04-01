window.renderUserCreate = async function () {
    const isAdmin = window.isAdmin();

    return `
        <div class="user-create-page">
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
            <div class="user-create-container">
                <div class="user-create-card">
                    <div class="user-create-header">
                        <h2>Создание пользователя</h2>
                        <p>Заполните информацию о новом участнике</p>
                    </div>
                    <div class="user-create-body">
                        <form id="userCreateForm">
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
                                <div class="form-group">
                                    <label>Размер одежды</label>
                                    <input type="text" name="clothingSize">
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
                            
                            <div id="createErrorMessage" class="error-message" style="display: none;"></div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn-save">Создать</button>
                                <a href="/users" class="btn-cancel">Отмена</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
};

window.initUserCreate = function () {
    const isAdmin = window.isAdmin();
    const form = document.getElementById('userCreateForm');
    const errorDiv = document.getElementById('createErrorMessage');

    if (!form) return;

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
        }
        else {
            data.role = 'Member';
            data.isActive = true;
        }

        if (errorDiv) {
            errorDiv.style.display = 'none';
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Создание...';
        submitBtn.disabled = true;

        const result = await API.createUser(data);

        if (result.ok) {
            window.location.href = '/users';
        } else {
            if (errorDiv) {
                errorDiv.textContent = result.data?.error || 'Ошибка создания пользователя';
                errorDiv.style.display = 'block';
            }
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
};