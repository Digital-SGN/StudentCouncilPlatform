let currentUser = null;

window.initAuth = async function () {
    currentUser = await API.getCurrentUser();
    notifyListeners();
    return currentUser;
};

window.getCurrentUser = function () {
    return currentUser;
};

window.isAuthenticated = function () {
    return currentUser !== null;
};

window.isAdmin = function () {
    return currentUser?.role === 'Admin';
};

window.isLeader = function () {
    return currentUser?.role === 'Leader';
};

window.isAdminOrLeader = function () {
    return isAdmin() || isLeader();
};

window.login = async function (email, password) {
    const result = await API.login(email, password);
    if (result.ok) {
        currentUser = await API.getCurrentUser();
        notifyListeners();
    }
    return result;
};

window.logout = async function () {
    await API.logout();
    currentUser = null;
    notifyListeners();
    window.location.href = '/login';
};