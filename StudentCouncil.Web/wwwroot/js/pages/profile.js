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

window.initProfile = async function () {
    const userId = window.profileUserId || new URLSearchParams(window.location.search).get('id');
    if (!userId) {
        document.getElementById('profile-content').innerHTML = '<div class="alert alert-danger">ID пользователя не указан</div>';
        return;
    }

    const result = await API.getUser(userId);
    if (!result.ok) {
        if (result.status === 401) {
            window.location.href = '/login';
            return;
        }
        document.getElementById('profile-content').innerHTML = '<div class="alert alert-danger">Ошибка загрузки профиля</div>';
        return;
    }

    const user = result.data;

    const xpPerLevel = 250;
    const currentLevelXP = (user.level - 1) * xpPerLevel;
    const xpForCurrentLevel = user.experiencePoints - currentLevelXP;
    const nextLevelXP = user.level * xpPerLevel;
    const xpPercent = Math.min(100, Math.max(0, (xpForCurrentLevel / xpPerLevel * 100)));
    const levelBorderClass = getLevelBorderClass(user.level);
    const levelName = getLevelName(user.level);

    const avatarHtml = user.avatarPath
        ? `<img src="${user.avatarPath}" class="avatar-img ${levelBorderClass}" alt="Аватар">`
        : `<div class="avatar-placeholder ${levelBorderClass}">${user.firstName?.[0]}${user.lastName?.[0]}</div>`;

    const html = `
        <div class="profile-container">
            <div class="profile-row">
                <div class="profile-avatar-section">
                    <div class="avatar-wrapper">
                        <div class="avatar-shine">${avatarHtml}</div>
                    </div>
                    <div class="level-info">
                        <div class="level-badge">Уровень ${user.level} — ${levelName}</div>
                        <div class="xp-bar"><div class="xp-fill" style="width: ${xpPercent}%"></div></div>
                        <div class="xp-text">${user.experiencePoints} / ${nextLevelXP} XP</div>
                    </div>
                    <div class="balance-info">💰 ${user.balance}</div>
                    <div class="avatar-actions">
                        <button class="upload-btn" onclick="document.getElementById('avatarUpload').click()">Загрузить фото</button>
                        <form id="avatarUploadForm" style="display:none">
                            <input type="file" id="avatarUpload" name="avatar" accept="image/*" onchange="uploadAvatar(this.form)" />
                        </form>
                        ${user.avatarPath ? `<button class="delete-avatar-btn" onclick="deleteAvatar(${user.id})">Удалить фото</button>` : ''}
                    </div>
                </div>
                <div class="profile-info">
                    <div class="info-card">
                        <div class="info-card-header"><h2>${escapeHtml(user.lastName)} ${escapeHtml(user.firstName)}</h2></div>
                        <div class="info-card-body">
                            <div class="info-grid">
                                <div class="info-label">Email</div><div class="info-value">${escapeHtml(user.email)}</div>
                                <div class="info-label">Группа</div><div class="info-value">${escapeHtml(user.group || '—')}</div>
                                <div class="info-label">Роль</div><div class="info-value">${user.role === 'Admin' ? 'Админ' : (user.role === 'Leader' ? 'Руководство' : 'Участник')}</div>
                                <div class="info-label">Телефон</div><div class="info-value">${escapeHtml(user.phoneNumber || '—')}</div>
                                <div class="info-label">Телеграм</div><div class="info-value">${escapeHtml(user.telegram || '—')}</div>
                                <div class="info-label">Размер одежды</div><div class="info-value">${escapeHtml(user.clothingSize || '—')}</div>
                            </div>
                            <hr />
                            <h3>Статистика активности</h3>
                            <div class="stats-charts">
                                <div class="chart-card">
                                    <div class="chart-title">Мероприятия</div>
                                    <div class="bar-container">
                                        <div class="chart-bar-vertical"><div class="bar" style="height: ${Math.min(user.eventsAttended * 8, 120)}px;"></div></div>
                                        <div class="chart-value">${user.eventsAttended}</div>
                                    </div>
                                </div>
                                <div class="chart-card">
                                    <div class="chart-title">Задачи</div>
                                    <div class="bar-container">
                                        <div class="chart-bar-vertical"><div class="bar" style="height: ${Math.min(user.tasksCompleted * 5, 120)}px;"></div></div>
                                        <div class="chart-value">${user.tasksCompleted}</div>
                                    </div>
                                </div>
                                <div class="chart-card">
                                    <div class="chart-title">Организовал</div>
                                    <div class="bar-container">
                                        <div class="chart-bar-vertical"><div class="bar" style="height: ${Math.min(user.eventsOrganized * 12, 120)}px;"></div></div>
                                        <div class="chart-value">${user.eventsOrganized}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="profile-actions">
                                <a href="/user/edit/${user.id}" class="btn-edit">✏️ Редактировать</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('profile-content').innerHTML = html;
};

function getLevelBorderClass(level) {
    if (level >= 1 && level <= 3) return 'level-border-1';
    if (level >= 4 && level <= 5) return 'level-border-2';
    if (level >= 6 && level <= 8) return 'level-border-3';
    if (level >= 9 && level <= 12) return 'level-border-4';
    if (level >= 13 && level <= 15) return 'level-border-5';
    return 'level-border-1';
}

function getLevelName(level) {
    if (level >= 1 && level <= 3) return 'Бронза';
    if (level >= 4 && level <= 5) return 'Серебро';
    if (level >= 6 && level <= 8) return 'Золото';
    if (level >= 9 && level <= 12) return 'Платина';
    if (level >= 13 && level <= 15) return 'Алмаз';
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