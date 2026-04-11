async function render() {
    const path = window.location.pathname; 

    const noHeaderPages = ['/login'];
    const publicPages = ['/login', '/help'];

    let user = null;

    if (path !== '/login') {
        user = await API.getCurrentUser();  
        window.currentUser = user;

        if (!user && !publicPages.includes(path)) {
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
        const headerHtml = await window.renderHeader(user);
        html = `${headerHtml}<main><div class="container" id="content">${content}</div></main>${renderFooter()}`;
    }

    document.getElementById('app').innerHTML = html;

    if (path === '/login' && window.initLogin) window.initLogin();
    if (path === '/users' && window.initUsers) window.initUsers();
    if (path.startsWith('/users/edit/') && window.initUserEdit) window.initUserEdit();
    if (path === '/users/create' && window.initUserCreate) window.initUserCreate();
    if (path.startsWith('/profile/') && window.initProfile) window.initProfile();
    if (path === '/events' && window.initEvents) window.initEvents();
    if (path.startsWith('/events/') && !path.startsWith('/events/create') && !path.startsWith('/events/edit/') && window.initEventDetail) {
        window.initEventDetail();
    }
    if ((path === '/events/create' || path.startsWith('/events/edit/')) && window.initEventForm) {
        window.initEventForm();  
    }
    if (path === '/help' && window.initHelp) window.initHelp();
    if (path === '/home' && window.initHome) window.initHome();
}

async function getContent(path, user) {
    if (path.startsWith('/users/edit/')) {
        window.editUserId = path.split('/')[3];
        return await window.renderUserEdit();
    }

    if (path.startsWith('/profile/')) {
        window.profileUserId = path.split('/')[2];
        return await window.renderProfile();
    }
    if (path.startsWith('/events/edit/'))
        return await window.renderEventForm();

    if (path.startsWith('/events/') && !path.startsWith('/events/create') && !path.startsWith('/events/edit/')) {
        return await window.renderEventDetail();
    }


    switch (path) {
        case '/login':
            return window.renderLogin();

        case '/users':
            if (user?.role === 'Admin' || user?.role === 'Leader') {
                return await window.renderUsers();
            }
            return '<h1>403 Доступ запрещён</h1>';

        case '/users/create':
            if (user?.role === 'Admin') {
                return await window.renderUserCreate();
            }
            return '<h1>403 Доступ запрещён</h1>';

        case '/events':
            if (user?.role === 'Admin' || user?.role === 'Leader') {
                return window.renderEvents();
            }

        case '/events/create':
            if (user?.role == 'Admin') {
                return await window.renderEventForm();
            }
            return '<h1>403 Доступ запрещён</h1>';

        case '/help':
            return await window.renderHelp();

        case '/home':
            return await window.renderHome();

        default:
            return '<h1>404</h1>';
    }
}

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