let isEditMode = false;
let editEventId = null; 

window.renderEventForm = async function () {
    const path = window.location.pathname;
    isEditMode = path.startsWith('/events/edit/');

    if (isEditMode) {
        editEventId = path.split('/')[3];
        const result = await API.getEvent(editEventId);
        if (!result.ok) {
            if (result.status === 404) {
                return '<div class="alert alert-danger">Мероприятие не найдено</div>';
            }
            return '<div class="alert alert-danger">Ошибка загрузки мероприятия</div>';
        }
        window.currentEvent = result.data;
    }

    const usersResult = await API.getUsers();
    const users = usersResult.ok ? usersResult.data.users || [] : [];

    return `
        <div class="event-form-page">
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
            <div class="event-form-container">
                <div class="event-form-card">
                    <div class="event-form-header">
                        <h2>${isEditMode ? 'Редактирование мероприятия' : 'Создание мероприятия'}</h2>
                        <p>${isEditMode ? 'Измените информацию о мероприятии' : 'Заполните информацию о новом мероприятии'}</p>
                    </div>
                    <div class="event-form-body">
                        <form id="eventForm">
                            <div class="form-group">
                                <label>Название *</label>
                                <input type="text" name="title" required value="${escapeHtml(window.currentEvent?.title || '')}">
                            </div>
                            
                            <div class="form-group">
                                <label>Описание</label>
                                <textarea name="description" rows="4">${escapeHtml(window.currentEvent?.description || '')}</textarea>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Дата и время *</label>
                                    <input type="datetime-local" name="eventDate" required 
                                           value="${formatDateTimeForInput(window.currentEvent?.eventDate)}">
                                </div>
                                <div class="form-group">
                                    <label>Место *</label>
                                    <input type="text" name="location" required value="${escapeHtml(window.currentEvent?.location || '')}">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Ссылка на регистрацию</label>
                                <input type="url" name="registrationLink" placeholder="https://..." 
                                       value="${escapeHtml(window.currentEvent?.registrationLink || '')}">
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Ответственный *</label>
                                    <select name="responsibleUserId" required>
                                        <option value="">Выберите ответственного</option>
                                        ${users.map(user => `
                                            <option value="${user.id}" ${window.currentEvent?.responsibleUserId == user.id ? 'selected' : ''}>
                                                ${escapeHtml(user.lastName)} ${escapeHtml(user.firstName)} 
                                                (${user.role === 'Admin' ? 'Админ' : user.role === 'Leader' ? 'Руководство' : 'Участник'})
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                ${isEditMode && window.isAdminOrLeader() ? `
                                    <div class="form-group">
                                        <label>Статус</label>
                                        <select name="status">
                                            <option value="Upcoming" ${window.currentEvent?.status === 'Upcoming' ? 'selected' : ''}>Предстоит</option>
                                            <option value="Completed" ${window.currentEvent?.status === 'Completed' ? 'selected' : ''}>Завершено</option>
                                            <option value="Cancelled" ${window.currentEvent?.status === 'Cancelled' ? 'selected' : ''}>Отменено</option>
                                        </select>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div id="formErrorMessage" class="error-message" style="display: none;"></div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn-save">${isEditMode ? 'Сохранить' : 'Создать'}</button>
                                <a href="/events" class="btn-cancel">Отмена</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
};

window.initEventForm = function () {
    const form = document.getElementById('eventForm');
    const errorDiv = document.getElementById('formErrorMessage');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);

        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            eventDate: new Date(formData.get('eventDate')).toISOString(),
            location: formData.get('location'),
            registrationLink: formData.get('registrationLink'),
            responsibleUserId: parseInt(formData.get('responsibleUserId'))
        };

        if (isEditMode && window.isAdminOrLeader()) {
            const status = formData.get('status');
            if (status) data.status = status;
        }

        if (errorDiv) {
            errorDiv.style.display = 'none';
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Сохранение...';
        submitBtn.disabled = true;

        let result;
        if (isEditMode) {
            result = await API.updateEvent(editEventId, data);
        }
        else {
            result = await API.createEvent(data);  
        }

        if (result.ok) {
            window.location.href = '/events';
        } else {
            if (errorDiv) {
                errorDiv.textContent = result.data?.error || 'Ошибка сохранения';
                errorDiv.style.display = 'block';
            }
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
};

function formatDateTimeForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 16);
}