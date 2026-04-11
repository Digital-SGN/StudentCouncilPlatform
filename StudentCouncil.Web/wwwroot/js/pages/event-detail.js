let detailEventId = null;

window.renderEventDetail = async function () {
    const path = window.location.pathname;
    detailEventId = path.split('/')[2];

    const eventResult = await API.getEvent(detailEventId);
    if (!eventResult.ok) {
        if (eventResult.status === 404) {
            return '<div class="alert alert-danger">Мероприятие не найдено</div>';
        }
        return '<div class="alert alert-danger">Ошибка загрузки мероприятия</div>';
    }

    const event = eventResult.data;

    const badgesResult = await API.getBadgesByEvent(detailEventId);
    const badges = badgesResult.ok ? badgesResult.data.badges || [] : [];

    let teamHtml = '';

    if (badges.length > 0) {
        teamHtml = `
            <div class="event-team-section">
                <h3>👥 Участники мероприятия</h3>
                <div class="team-table-wrapper">
                    <table class="team-table">
                     <thead>
                        <tr>
                            <th>Участник</th>
                            <th>Роль</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                        <tbody>
                  ${badges.map(badge => {
                      let actionButtons = '';

                      if (badge.filePath) {
                          actionButtons += `<button onclick="window.downloadBadge(${badge.id}, '${escapeHtml(badge.eventTitle)}', '${escapeHtml(badge.userName)}', '${escapeHtml(badge.role)}')" class="team-badge-btn download">📥 Скачать бейдж</button>`;
                      }
                      if (window.isAdmin()) {
                          actionButtons += `<button onclick="uploadBadgeFile(${badge.id})" class="team-badge-btn upload">📤 ${badge.filePath ? 'Заменить бейдж' : 'Загрузить бейдж'}</button>`;
                      } else if (!badge.filePath) {
                          actionButtons = '<span class="no-badge">—</span>';
                      }

                      if (window.isAdmin()) {
                          actionButtons += `
                        <button onclick="editBadgeRole(${badge.id}, '${escapeHtml(badge.role)}')" class="team-action-btn edit">✏️ Роль</button>
                        <button onclick="deleteBadge(${badge.id})" class="team-action-btn delete">🗑️ Удалить</button>
                    `;
                      }

                      return `
                        <tr>
                            <td><a href="/profile/${badge.userId}" class="team-member-link">${escapeHtml(badge.userName)}</a></td>
                            <td><span class="team-role-badge">${escapeHtml(badge.role || '—')}</span></td>
                            <td class="team-actions-cell">${actionButtons}</td>
                        </tr>
                    `;
                  }).join('')}
                        </tbody>
                    </table>
                </div>
                ${window.isAdmin() ? `
                    <div class="add-member-section">
                        <button onclick="showAddMemberModal()" class="add-member-btn">+ Добавить участника</button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    else {
        teamHtml = `
            <div class="event-team-section">
                <h3>👥 Участники мероприятия</h3>
                <p class="no-team-message">Пока нет участников</p>
                ${window.isAdmin() ? `
                    <div class="add-member-section">
                        <button onclick="showAddMemberModal()" class="add-member-btn">+ Добавить участника</button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    const eventDate = new Date(event.eventDate);
    const formattedDate = eventDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const statusText = getEventStatusText(event.status);
    const statusClass = getEventStatusClass(event.status);

    return `
        <div class="event-detail-page">
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
            <div class="event-detail-container">
                <div class="event-detail-card">
                    <div class="event-detail-header">
                        <a href="/events" class="back-link">← Назад к списку</a>
                        <div class="event-detail-title">
                            <h1>${escapeHtml(event.title)}</h1>
                            <span class="event-status-badge ${statusClass}">${statusText}</span>
                        </div>
                    </div>
                    <div class="event-detail-body">
                        <div class="event-info-grid">
                            <div class="event-info-row">
                                <span class="event-info-icon">📅</span>
                                <span class="event-info-label">Дата и время:</span>
                                <span class="event-info-value">${formattedDate}</span>
                            </div>
                            <div class="event-info-row">
                                <span class="event-info-icon">📍</span>
                                <span class="event-info-label">Место:</span>
                                <span class="event-info-value">${escapeHtml(event.location)}</span>
                            </div>
                            <div class="event-info-row">
                                <span class="event-info-icon">👤</span>
                                <span class="event-info-label">Ответственный:</span>
                                <span class="event-info-value">
                                    <a href="/profile/${event.responsibleUserId}">Загрузка...</a>
                                </span>
                            </div>
                            ${event.registrationLink ? `
                                <div class="event-info-row">
                                    <span class="event-info-icon">🔗</span>
                                    <span class="event-info-label">Список участников:</span>
                                    <span class="event-info-value">
                                        <a href="${event.registrationLink}" target="_blank" class="registration-link">Перейти к форме →</a>
                                    </span>
                                </div>
                            ` : ''}
                        </div>
                        
                        ${event.description ? `
                            <div class="event-description-section">
                                <h3>📄 Описание</h3>
                                <p>${escapeHtml(event.description)}</p>
                            </div>
                        ` : ''}
                        
                        ${teamHtml}
                        
                        ${window.isAdminOrLeader() ? `
                            <div class="event-actions">
                                <a href="/events/edit/${event.id}" class="event-edit-btn">✏️ Редактировать</a>
                                <button onclick="deleteEvent(${event.id})" class="event-delete-btn">🗑️ Удалить</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
};

window.initEventDetail = async function () {
    const eventResult = await API.getEvent(detailEventId);
    if (eventResult.ok) {
        const event = eventResult.data;
        const userResult = await API.getUser(event.responsibleUserId);
        if (userResult.ok) {
            const responsibleSpan = document.querySelector('.event-info-row .event-info-value a');
            if (responsibleSpan) {
                responsibleSpan.textContent = `${userResult.data.lastName} ${userResult.data.firstName}`;
                responsibleSpan.href = `/profile/${event.responsibleUserId}`;
            }
        }
    }
};

function getEventStatusText(status) {
    switch (status) {
        case 'Upcoming': return 'Предстоит';
        case 'Completed': return 'Завершено';
        case 'Cancelled': return 'Отменено';
        default: return status;
    }
}

function getEventStatusClass(status) {
    switch (status) {
        case 'Upcoming': return 'status-upcoming';
        case 'Completed': return 'status-completed';
        case 'Cancelled': return 'status-cancelled';
        default: return '';
    }
}

async function deleteEvent(id) {
    if (!confirm('Удалить мероприятие?')) return;
    const result = await API.deleteEvent(id);
    if (result.ok) {
        window.location.href = '/events';
    } else {
        alert(result.data?.error || 'Ошибка удаления');
    }
}

function showAddMemberModal() {
    closeAddMemberModal();

    const modalHtml = `
        <div id="addMemberModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Добавить участника</h3>
                    <span class="modal-close" onclick="closeAddMemberModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="addMemberForm">
                        <div class="form-group">
                            <label>Участник *</label>
                            <select id="memberUserId" required>
                                <option value="">Выберите участника</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Роль *</label>
                            <select id="memberRole" required>
                                  <option value="Главный организатор">Главный организатор</option>
                                <option value="Организатор">Организатор</option>
                                <option value="Медиа">Медиа</option>
                                <option value="Техпод">Техпод</option>
                                <option value="Волонтёр">Волонтёр</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Файл бейджа (PDF)</label>
                            <input type="file" id="badgeFile" accept=".pdf">
                            <small class="form-hint">Можно загрузить позже</small>
                        </div>
                        <div id="modalErrorMessage" class="error-message" style="display: none;"></div>
                        <div class="form-actions">
                            <button type="submit" class="btn-save">Добавить</button>
                            <button type="button" onclick="closeAddMemberModal()" class="btn-cancel">Отмена</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    loadUsersForSelect();

    document.getElementById('addMemberForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitAddMember();
    });
}

function closeAddMemberModal() {
    const modal = document.getElementById('addMemberModal');
    if (modal) modal.remove();
}

async function loadUsersForSelect() {
    const result = await API.getUsers();
    if (result.ok) {
        const select = document.getElementById('memberUserId');
        result.data.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.lastName} ${user.firstName} (${user.role === 'Admin' ? 'Админ' : user.role === 'Leader' ? 'Руководство' : 'Участник'})`;
            select.appendChild(option);
        });
    }
}

async function submitAddMember() {
    const userId = document.getElementById('memberUserId').value;
    const role = document.getElementById('memberRole').value;
    const file = document.getElementById('badgeFile').files[0];
    const errorDiv = document.getElementById('modalErrorMessage');

    if (!userId) {
        errorDiv.textContent = 'Выберите участника';
        errorDiv.style.display = 'block';
        return;
    }

    const formData = new FormData();
    formData.append('UserId', userId);
    formData.append('EventId', detailEventId);
    formData.append('Role', role);
    if (file) {
        formData.append('file', file);
    }

    errorDiv.style.display = 'none';

    const result = await API.createBadge(formData);

    if (result.ok) {
        closeAddMemberModal();
        window.location.reload();
    } else {
        errorDiv.textContent = result.error || 'Ошибка добавления';
        errorDiv.style.display = 'block';
    }
}

async function editBadgeRole(badgeId, currentRole) {
    const newRole = prompt('Введите новую роль:', currentRole);
    if (!newRole || newRole === currentRole) return;

    const result = await API.updateBadge(badgeId, { role: newRole });
    if (result.ok) {
        window.location.reload();
    } else {
        alert(result.data?.error || 'Ошибка обновления роли');
    }
}

async function deleteBadge(badgeId) {
    if (!confirm('Удалить участника из мероприятия?')) return;

    const result = await API.deleteBadge(badgeId);
    if (result.ok) {
        window.location.reload();
    } else {
        alert(result.data?.error || 'Ошибка удаления');
    }
}

async function uploadBadgeFile(badgeId) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const result = await API.uploadBadgeFile(badgeId, formData);
        if (result.ok) {
            alert('Файл успешно загружен');
            await refreshBadgeRow(badgeId);
        } else {
            alert(result.error || 'Ошибка загрузки');
        }
    };
    fileInput.click();
}

async function refreshBadgeRow(badgeId) {
    const result = await API.getBadge(badgeId);
    if (!result.ok) return;

    const badge = result.data;

    const rows = document.querySelectorAll('.team-table tbody tr');
    for (const row of rows) {
        const deleteBtn = row.querySelector(`.team-action-btn.delete[onclick*="deleteBadge(${badgeId})"]`);
        if (deleteBtn) {
            const badgeCell = row.cells[2];
            if (badgeCell) {
                badgeCell.innerHTML = `
                    <button onclick="window.downloadBadge(${badge.id}, '${escapeHtml(badge.eventTitle)}', '${escapeHtml(badge.userName)}', '${escapeHtml(badge.role)}')" class="team-badge-btn download">
                        📥 Скачать
                    </button>
                `;
            }
            break;
        }
    }
}

window.downloadBadge = async function (badgeId, eventTitle, userName, role) {
    const fileName = `${eventTitle}_${userName}_${role}`.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
    const result = await API.downloadBadgeAndSave(badgeId, fileName);
    if (!result) {
        alert('Ошибка скачивания бейджа');
    }
};