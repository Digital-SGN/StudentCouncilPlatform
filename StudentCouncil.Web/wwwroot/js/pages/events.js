window.renderEvents = async function () {
    const result = await API.getEvents();
    if (!result.ok) {
        if (result.status === 401) {
            window.location.href = '/login';
            return '';
        }
        return '<div class="alert alert-danger">Ошибка загрузки мероприятий</div>';
    }

    const events = result.data.events || [];

    const usersResult = await API.getUsers();
    const usersMap = new Map();
    if (usersResult.ok) {
        usersResult.data.users.forEach(user => {
            usersMap.set(user.id, `${user.lastName} ${user.firstName}`);
        });
    }

    if (events.length === 0) {
        return `
            <div class="events-page">
                <div class="events-wrapper">
                    <div class="empty-state">
                        <div class="empty-icon">📅</div>
                        <h3>Нет мероприятий</h3>
                        <p>Пока нет запланированных мероприятий</p>
                        ${window.isAdminOrLeader() ? '<a href="/events/create" class="create-event-btn">+ Создать мероприятие</a>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="events-page">
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
            <div class="events-wrapper">
                <div class="events-header">
                    <h1>Мероприятия</h1>
                    ${window.isAdminOrLeader() ? '<a href="/events/create" class="create-event-btn">+ Создать мероприятие</a>' : ''}
                </div>
                <div class="events-grid">
                    ${events.map(event => renderEventCard(event, usersMap)).join('')}
                </div>
            </div>
        </div>
    `;
};

function getStatusClass(status) {
    switch (status) {
        case 'Upcoming': return 'status-upcoming';
        case 'Completed': return 'status-completed';
        case 'Cancelled': return 'status-cancelled';
        default: return 'status-upcoming';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'Upcoming': return 'Предстоит';
        case 'Completed': return 'Завершено';
        case 'Cancelled': return 'Отменено';
        default: return status;
    }
}

function renderEventCard(event, usersMap) {
    const eventDate = new Date(event.eventDate);
    const formattedDate = eventDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const statusClass = getStatusClass(event.status);
    const statusText = getStatusText(event.status);
    const responsibleName = usersMap.get(event.responsibleUserId) || '—';

    return `
        <div class="event-card">
            <div class="event-card-header">
                <div class="event-title">${escapeHtml(event.title)}</div>
                <div class="event-status ${statusClass}">${statusText}</div>
            </div>
            <div class="event-card-body">
                <div class="event-info">
                    <div class="event-info-item">
                        <span class="event-info-icon">📅</span>
                        <span class="event-info-text">${formattedDate}</span>
                    </div>
                    <div class="event-info-item">
                        <span class="event-info-icon">📍</span>
                        <span class="event-info-text">${escapeHtml(event.location)}</span>
                    </div>
                    <div class="event-info-item">
                        <span class="event-info-icon">👤</span>
                        <span class="event-info-text">Ответственный: ${escapeHtml(responsibleName)}</span>
                    </div>
                    ${event.registrationLink ? `
                        <div class="event-info-item">
                            <span class="event-info-icon">🔗</span>
                            <a href="${event.registrationLink}" target="_blank" class="event-link">Список участников</a>
                        </div>
                    ` : ''}
                </div>
                ${event.description ? `
                    <div class="event-description">
                        ${escapeHtml(event.description)}
                    </div>
                ` : ''}
            </div>
            <div class="event-card-footer">
                <a href="/events/${event.id}" class="event-btn view">Подробнее</a>
                ${window.isAdminOrLeader() ? `
                    <a href="/events/edit/${event.id}" class="event-btn edit">✏️ Редактировать</a>
                    <button onclick="deleteEvent(${event.id})" class="event-btn delete">🗑️ Удалить</button>
                ` : ''}
            </div>
        </div>
    `;
}

window.initEvents = function () {
    // TODO
};

async function deleteEvent(id) {
    if (!confirm('Удалить мероприятие?')) return;
    const result = await API.deleteEvent(id);
    if (result.ok) {
        window.location.reload();
    } else {
        alert(result.data?.error || 'Ошибка удаления');
    }
}