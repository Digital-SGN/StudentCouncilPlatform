async function renderHeader(user) {
    const headerHtml = await fetch('/html/header.html').then(r => r.text());
    return headerHtml;
}

async function render() {
    const path = window.location.pathname;
    const publicPages = ['/login', '/help'];
    const noHeaderPages = ['/login']; 

    let user = null;

    if (!publicPages.includes(path)) {
        user = await API.getCurrentUser();
        if (!user) {
            window.location.href = '/login';
            return;
        }
    }

    const content = await getContent(path, user);

    let html = '';

    if (noHeaderPages.includes(path)) {
        html = `<main><div class="container" id="content">${content}</div></main>`;
    }
    else {
        const headerHtml = await renderHeader(user);
        html = `${headerHtml}<main><div class="container" id="content">${content}</div></main>${renderFooter()}`;
    }

    document.getElementById('app').innerHTML = html;

    if (path === '/login' && window.initLogin) window.initLogin();
    if (path === '/users' && window.initUsers) window.initUsers();
    if (path.startsWith('/profile/') && window.initProfile) window.initProfile();
    if (path === '/help' && window.initHelp) window.initHelp();
    if (path === '/home' && window.initHome) window.initHome();

    if (user) {
        fillNavMenu(user);
    }
    else {
        fillPublicNavMenu();
    }
}

async function getContent(path, user) {
    if (path === '/login') return window.renderLogin();
    if (path === '/users' && user?.role === 'Admin') return await window.renderUsers();
    if (path.startsWith('/profile/')) {
        window.profileUserId = path.split('/')[2];
        return await window.renderProfile(window.profileUserId);
    }

    if (path === '/help') return window.renderHelp();

    if (path === '/home' || path === '/') return window.renderHome();

    return '<h1>404</h1>';
}

function fillPublicNavMenu() {
    const navMenu = document.getElementById('nav-menu');
    if (!navMenu) return;

    navMenu.innerHTML = `
        <li class="nav-item"><a class="nav-link" href="/home">Главная</a></li>
        <li class="nav-item"><a class="nav-link" href="/help">Помощь</a></li>
        <li class="nav-item"><a class="nav-link" href="/login">Войти</a></li>
    `;
}

function fillNavMenu(user) {
    const navMenu = document.getElementById('nav-menu');
    if (!navMenu) return;
    let menuHtml = `<li class="nav-item"><a class="nav-link" href="/home">Главная</a></li>`;
    if (user?.role === 'Admin') menuHtml += `<li class="nav-item"><a class="nav-link" href="/users">Участники</a></li>`;
    if (user) {
        menuHtml += `
            <li class="nav-item"><a class="nav-link" href="/profile/${user.id}">Мой профиль</a></li>
            <li class="nav-item"><span class="nav-link">Привет, ${escapeHtml(user.email)}!</span></li>
            <li class="nav-item"><a class="nav-link" href="#" onclick="logout()">Выйти</a></li>
        `;
    }
    else {
        menuHtml += `<li class="nav-item"><a class="nav-link" href="/login">Войти</a></li>`;
    }
    navMenu.innerHTML = menuHtml;
}



window.logout = async () => {
    await API.logout();
    window.location.href = '/login';
};

document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (link && link.href && link.href.startsWith(window.location.origin) && !link.hasAttribute('onclick')) {
        event.preventDefault();
        history.pushState(null, '', link.pathname);
        render();
    }
});

window.addEventListener('popstate', render);
render();