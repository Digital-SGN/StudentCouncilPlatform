window.currentUser = null;
let listeners = [];

window.initAuth = async function () {
    window.currentUser = await API.getCurrentUser();
    notifyListeners();
    return window.currentUser;
};

window.getCurrentUser = function () {
    return window.currentUser;
};

window.isAuthenticated = function () {
    return window.currentUser !== null;
};

window.isAdmin = function () {
    return window.currentUser?.role === 'Admin';
};

window.isLeader = function () {
    return window.currentUser?.role === 'Leader';
};

window.isAdminOrLeader = function () {
    return window.isAdmin() || window.isLeader();
};

window.login = async function (email, password) {
    const result = await API.login(email, password);
    if (result.ok) {
        window.currentUser = await API.getCurrentUser();
        notifyListeners();
    }
    return result;
};

window.logout = async function () {
    await API.logout();
    window.currentUser = null;
    notifyListeners();
    window.location.href = '/login';
};

function notifyListeners() {
    listeners.forEach(cb => cb(window.currentUser));
}

window.subscribeAuth = function (callback) {
    listeners.push(callback);
    callback(window.currentUser);
};