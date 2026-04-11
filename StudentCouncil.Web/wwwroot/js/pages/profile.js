window.renderProfile = function () {
    return `
        <div class="profile-page">
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
            <div class="profile-wrapper">
                <div id="profile-content" class="profile-card">
                    <div class="loading-container">
                        <div class="spinner"></div>
                        <p>Загрузка профиля...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
};

async function downloadBadge(badgeId, eventTitle, userName, role) {
    const fileName = `${eventTitle}_${userName}_${role}`.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
    const result = await API.downloadBadgeAndSave(badgeId, fileName);
    if (!result) {
        alert('Ошибка скачивания бейджа');
    }
}

window.initProfile = async function () {
    const userId = window.profileUserId || new URLSearchParams(window.location.search).get('id');
    if (!userId) {
        document.getElementById('profile-content').innerHTML = '<div class="alert alert-danger">ID пользователя не указан</div>';
        return;
    }

    const result = await API.getUser(userId);
    if (!result.ok) {
        switch (result.status) {
            case 401:
                window.location.href = '/login';
                return;
            case 403:
                document.getElementById('profile-content').innerHTML = `
                    <div class="alert alert-danger">
                        <div>${result.data?.error || 'Доступ запрещён'}</div>
                    </div>
                `;
                return;
            case 404:
                document.getElementById('profile-content').innerHTML = `
                    <div class="alert alert-warning">
                        <div>${result.data?.error || 'Пользователь не найден'}</div>
                    </div>
                `;
                return;
            default:
                document.getElementById('profile-content').innerHTML = `
                    <div class="alert alert-danger">
                        <div><strong>Ошибка загрузки</strong><br>${result.data?.error || 'Неизвестная ошибка'}</div>
                    </div>
                `;
                return;
        }
    }

    const user = result.data;

    const badgesResult = await API.getBadgesByUser(userId);
    const badges = badgesResult.ok ? badgesResult.data.badges || [] : [];

    const xpPerLevel = 250;
    const currentLevelXP = (user.level - 1) * xpPerLevel;
    const xpForCurrentLevel = user.experiencePoints - currentLevelXP;
    const nextLevelXP = user.level * xpPerLevel;
    const xpPercent = Math.min(100, Math.max(0, (xpForCurrentLevel / xpPerLevel * 100)));
    const levelBorderClass = getLevelBorderClass(user.level);
    const levelName = getLevelName(user.level);

    const avatarHtml = user.avatarPath
        ? `<img src="${user.avatarPath}" class="avatar-img ${levelBorderClass}" alt="Аватар" style="box-shadow: 0 0 0 20px red !important;">`
        : `<div class="avatar-placeholder ${levelBorderClass}" style="box-shadow: 0 0 0 20px red !important;">${user.firstName?.[0]}${user.lastName?.[0]}</div>`;

    const badgesHtml = badges.length > 0 ? `
        <div class="badges-section">
            <div class="badges-title">Мои бейджи</div>
            <div class="badges-list">
                ${badges.map(badge => `
                    <a href="#" class="badge-link" onclick="downloadBadge(${badge.id}, '${escapeHtml(badge.eventTitle)}', '${escapeHtml(badge.userName)}', '${escapeHtml(badge.role)}'); return false;">
                        <span class="badge-role">${escapeHtml(badge.role)}</span>
                        <span class="badge-event">${escapeHtml(badge.eventTitle)}</span>
                    </a>
                `).join('')}
            </div>
        </div>
    ` : '';

    const html = `
        <div class="profile-container">
            <div class="profile-header">
                <div class="avatar-wrapper">
                    <div class="avatar-shine">${avatarHtml}</div>
                </div>
                <h2 class="profile-fullname">${escapeHtml(user.lastName)} ${escapeHtml(user.firstName)} ${escapeHtml(user.patronymic || '')}</h2>
            </div>

            <div class="profile-stats-row">
                <div class="level-card ${levelBorderClass}">
                    <div class="level-icon">${getLevelIcon(user.level)}</div>
                    <div class="level-details">
                        <div class="level-badge">
                            <span class="level-number">Уровень ${user.level}</span>
                            <span class="level-name">${levelName}</span>
                        </div>
                        <div class="xp-bar"><div class="xp-fill" style="width: ${xpPercent}%"></div></div>
                        <div class="xp-text">${user.experiencePoints} / ${nextLevelXP} XP</div>
                    </div>
                </div>
                <div class="balance-card">
                    <span class="balance-icon">💰</span>
                    <span class="balance-amount">${user.balance}</span>
                    <span class="balance-label">баллов</span>
                </div>
            </div>

            <div class="avatar-actions">
                <button class="upload-btn" onclick="document.getElementById('avatarUpload').click()">Загрузить фото</button>
                ${user.avatarPath ? `<button class="delete-avatar-btn" onclick="deleteAvatar(${user.id})">Удалить фото</button>` : ''}
                <form id="avatarUploadForm" style="display:none">
                    <input type="file" id="avatarUpload" name="avatar" accept="image/*" onchange="uploadAvatar(this.form)" />
                </form>
            </div>

            <div class="info-grid">
                <div class="info-item">
                    <div class="info-icon">📧</div>
                    <div class="info-content">
                        <div class="info-label">Email</div>
                        <div class="info-value">${escapeHtml(user.email)}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon">👥</div>
                    <div class="info-content">
                        <div class="info-label">Группа</div>
                        <div class="info-value">${escapeHtml(user.group || '—')}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon">⭐</div>
                    <div class="info-content">
                        <div class="info-label">Роль</div>
                        <div class="info-value">${user.role === 'Admin' ? 'Администратор' : (user.role === 'Leader' ? 'Руководитель' : 'Участник')}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon">📱</div>
                    <div class="info-content">
                        <div class="info-label">Телефон</div>
                        <div class="info-value">${escapeHtml(user.phoneNumber || '—')}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon">💬</div>
                    <div class="info-content">
                        <div class="info-label">Telegram</div>
                        <div class="info-value">${user.telegram ? `<a href="https://t.me/${user.telegram.replace('@', '')}" target="_blank">${escapeHtml(user.telegram)}</a>` : '—'}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon">👕</div>
                    <div class="info-content">
                        <div class="info-label">Размер одежды</div>
                        <div class="info-value">${escapeHtml(user.clothingSize || '—')}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon">🎂</div>
                    <div class="info-content">
                        <div class="info-label">Дата рождения</div>
                        <div class="info-value">${user.birthDate ? new Date(user.birthDate).toLocaleDateString('ru-RU') : '—'}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon">📅</div>
                    <div class="info-content">
                        <div class="info-label">В студсовете с</div>
                        <div class="info-value">${user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('ru-RU') : '—'}</div>
                    </div>
                </div>
            </div>

            <div class="stats-section">
                <h3>Статистика активности</h3>
                <div class="stats-numbers">
                    <div class="stat-item">Мероприятий: ${user.eventsAttended}</div>
                    <div class="stat-item">Задач: ${user.tasksCompleted}</div>
                    <div class="stat-item">Организовал: ${user.eventsOrganized}</div>
                </div>
                <canvas id="statsChart" style="width: 100%; height: 300px; margin-top: 20px;"></canvas>
            </div>

            ${badgesHtml}

            <div class="profile-actions">
                <a href="/users/edit/${user.id}" class="btn-edit">✏️ Редактировать профиль</a>
            </div>
        </div>
    `;

    document.getElementById('profile-content').innerHTML = html;

    const ctx = document.getElementById('statsChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Мероприятия', 'Задачи', 'Организовал'],
                datasets: [{
                    label: 'Мои достижения',
                    data: [user.eventsAttended, user.tasksCompleted, user.eventsOrganized],
                    backgroundColor: 'rgba(12, 191, 161, 0.25)',
                    borderColor: '#0CBFA1',
                    borderWidth: 3,
                    pointBackgroundColor: '#0CBFA1',
                    pointBorderColor: '#ffffff',
                    pointRadius: 6,
                    pointHoverRadius: 9,
                    pointBorderWidth: 2,
                    tension: 0.2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, backdropColor: 'transparent', color: '#2d3748', font: { size: 12 } },
                        grid: { color: 'rgba(0, 0, 0, 0.1)' },
                        angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
                        pointLabels: { color: '#0CBFA1', font: { size: 14, weight: 'bold' } }
                    }
                },
                plugins: {
                    tooltip: {
                        backgroundColor: '#ffffff',
                        titleColor: '#2d3748',
                        bodyColor: '#4a5568',
                        borderColor: '#0CBFA1',
                        borderWidth: 2,
                        callbacks: { label: (context) => `${context.label}: ${context.raw}` }
                    },
                    legend: { position: 'top', labels: { color: '#2d3748', font: { size: 14, weight: 'bold' }, boxWidth: 15, padding: 15 } }
                },
                layout: { padding: { top: 20, bottom: 20, left: 20, right: 20 } }
            }
        });
    }
};

function calculateAge(birthDate) {
    if (!birthDate) return '—';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function getLevelBorderClass(level) {
    if (level >= 1 && level <= 3) return 'level-border-1';
    if (level >= 4 && level <= 5) return 'level-border-2';
    if (level >= 6 && level <= 8) return 'level-border-3';
    if (level >= 9 && level <= 12) return 'level-border-4';
    if (level >= 13 && level <= 15) return 'level-border-5';
    return 'level-border-legend';
}

function getLevelIcon(level) {
    if (level >= 1 && level <= 3) return '⭐';
    if (level >= 4 && level <= 5) return '⭐';
    if (level >= 6 && level <= 8) return '🔮';
    if (level >= 9 && level <= 12) return '💎';
    if (level >= 13 && level <= 15) return '🔷';
    return '👑';
}

function getLevelName(level) {
    if (level >= 1 && level <= 3) return 'Новичок';
    if (level >= 4 && level <= 5) return 'Практик';
    if (level >= 6 && level <= 8) return 'Профессионал';
    if (level >= 9 && level <= 12) return 'Мастер';
    if (level >= 13 && level <= 15) return 'Грандмастер';
    return 'Легенда';
}

async function uploadAvatar(form) {
    const userId = window.profileUserId || new URLSearchParams(window.location.search).get('id');
    const formData = new FormData(form);
    const result = await API.uploadAvatar(userId, formData);
    if (result.ok) {
        window.location.reload();
    } else {
        alert(result.error);
    }
}

async function deleteAvatar(id) {
    if (!confirm('Удалить фото?')) return;
    const result = await API.deleteAvatar(id);
    if (result.ok) {
        window.location.reload();
    } else {
        alert(result.error);
    }
}