const API = {
    async request(endpoint, options = {}) {
        if (options.method === 'GET' || options.method === 'HEAD') {
            delete options.body;
        }

        const response = await fetch(`/api${endpoint}`, {
            credentials: 'include',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        let data = {};
        try {
            data = await response.json();
        } catch (e) {
            console.warn('Response is not JSON:', response);
            data = { error: response.statusText || "Ошибка сервера" };
        }

        if (response.status === 403) {
            return {
                ok: false,
                status: 403,
                data: data  
            };
        }

        if (response.status === 401) {
            return { ok: false, status: 401, data: { error: 'Unauthorized' } };
        }

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

    async updateUser(id, data) {
        return this.request(`/users/${id}`, {
            method: 'PUT',  
            body: JSON.stringify(data)
        });
    },

    async createUser(data) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async uploadAvatar(userId, formData) {
        const response = await fetch(`/api/users/${userId}/avatar`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        if (response.ok) return { ok: true };
        const error = await response.json();
        return { ok: false, error: error.error || 'Ошибка загрузки' };
    },

    async deleteAvatar(userId) {
        const response = await fetch(`/api/users/${userId}/avatar`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (response.ok) return { ok: true };
        const error = await response.json();
        return { ok: false, error: error.error || 'Ошибка удаления' };
    },

    async getEvents() {
        return this.request('/events');
    },


    async getEvent(id) {
        return this.request(`/events/${id}`);
    },

    async createEvent(data) {
        return this.request('/events', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateEvent(id, data) {
        return this.request(`/events/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteEvent(id) {
        return this.request(`/events/${id}`, {
            method: 'DELETE'
        });
    },

    async getBadgesByUser(userId) {
        return this.request(`/badges/user/${userId}`);
    },

    async getBadgesByEvent(eventId) {
        return this.request(`/badges/event/${eventId}`);
    },

    async getBadge(id) {
        return this.request(`/badges/${id}`);
    },

    async downloadBadge(id) {
        const response = await fetch(`/api/badges/${id}/download`, {
            credentials: 'include'
        });
        return response;
    },

    async downloadBadgeAndSave(badgeId, fileName) {
        const response = await fetch(`/api/badges/${badgeId}/download`, {
            credentials: 'include'
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName ? `${fileName}.pdf` : `badge_${badgeId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            return true;
        }
        return false;
    },

    async createBadge(formData) {
        const response = await fetch('/api/badges', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        if (response.ok) {
            return { ok: true };
        }
        const error = await response.json();
        return { ok: false, error: error.error || 'Ошибка создания' };
    },

    async updateBadge(id, data) {
        return this.request(`/badges/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteBadge(id) {
        return this.request(`/badges/${id}`, { method: 'DELETE' });
    },

    async uploadBadgeFile(badgeId, formData) {
        const response = await fetch(`/api/badges/${badgeId}/upload`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        if (response.ok) {
            return { ok: true };
        }
        const error = await response.json();
        return { ok: false, error: error.error || 'Ошибка загрузки' };
    },
};