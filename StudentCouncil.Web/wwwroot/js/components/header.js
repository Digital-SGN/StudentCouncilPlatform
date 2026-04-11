window.renderHeader = async function (user) {
    return `
        <header>
            <nav class="navbar navbar-expand-sm navbar-light">
                <div class="container">
                    <a class="navbar-brand" href="/home">
                        <img src="/images/logo.svg" alt="Лого" style="height: 35px;" />
                        Студсовет
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target=".navbar-collapse">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="navbar-collapse collapse">
                        <ul class="navbar-nav ms-auto" id="nav-menu">
                            ${renderNavMenu(user)}
                             <button id="global-music-btn" class="music-control" onclick="window.toggleGlobalMusic()">
                                🔊
                            </button>
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
    `;
};

function renderNavMenu(user) {
    let menuHtml = `
        <li class="nav-item"><a class="nav-link" href="/home">Главная</a></li>
    `;

    if (user?.role === 'Admin' || user?.role === 'Leader') {
        menuHtml += `<li class="nav-item"><a class="nav-link" href="/users">Участники</a></li>`;
        menuHtml += `<li class="nav-item"><a class="nav-link" href="/events">Мероприятия</a></li>`;
    }

    if (user) {
        menuHtml += `
            <li class="nav-item"><a class="nav-link" href="/profile/${user.id}">Мой профиль</a></li>
            <li class="nav-item"><span class="nav-link">Привет, ${escapeHtml(user.email)}!</span></li>
            <li class="nav-item"><a class="nav-link" href="#" onclick="window.logout()">Выйти</a></li>
        `;
    }
    else {
        menuHtml += `
            <li class="nav-item"><a class="nav-link" href="/help">Помощь</a></li>
            <li class="nav-item"><a class="nav-link" href="/login">Войти</a></li>
        `;
    }

    return menuHtml;
}