import { createContext, useContext, useState, useEffect } from 'react';
import { API } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const hasAuthCookie = document.cookie .split(';').some(cookie => cookie.trim().startsWith('.AspNetCore.Identity.Application='));
        if (!hasAuthCookie) {
            setLoading(false);
            return;
        }

        try {
            const currentUser = await API.getCurrentUser();
            setUser(currentUser);
        } catch (err) {
            console.error('Auth check failed', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}