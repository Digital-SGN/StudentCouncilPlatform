const API = {
    async request(endpoint, options = {}) {
        const response = await fetch(`/api${endpoint}`, {
            credentials: 'include',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        const data = await response.json();
        return { ok: response.ok, status: response.status, data };
    },

    async getCurrentUser() {
        const res = await this.request('/account/current');
        return res.ok ? res.data : null;
    },

    async login(email, password) {
        return this.request('/account/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    async logout() {
        return this.request('/account/logout', { method: 'POST' });
    },

    async getUsers() {
        return this.request('/users');
    },

    async getUser(id) {
        return this.request(`/users/${id}`);
    },

    async deleteUser(id) {
        return this.request(`/users/${id}`, { method: 'DELETE' });
    },

    async uploadAvatar(userId, formData) {
        const response = await fetch(`/api/users/${userId}/avatar`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        if (response.ok) {
            return { ok: true };
        }
        else {
            const error = await response.json();
            return { ok: false, error: error.error || 'Ошибка загрузки' };
        }
    },

    async deleteAvatar(userId) {
        const response = await fetch(`/api/users/${userId}/avatar`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            return { ok: true };
        }
        else {
            const error = await response.json();
            return { ok: false, error: error.error || 'Ошибка удаления' };
        }
    }
};