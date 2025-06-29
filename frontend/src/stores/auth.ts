import { writable } from 'svelte/store';
import type { AuthState, User } from '../types';

export const authStore = writable<AuthState>({
    user: null,
    token: null,
    loading: false
});

export const authService = {
    async login(email: string, password: string) {
        authStore.update(state => ({ ...state, loading: true }));
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Login failed');
            }
            
            const data = await response.json();
            authStore.set({
                user: data.user,
                token: data.token,
                loading: false
            });
            
            return true;
        } catch (error) {
            authStore.update(state => ({ ...state, loading: false }));
            throw error;
        }
    },

    async register(email: string, password: string, name: string) {
        authStore.update(state => ({ ...state, loading: true }));
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
                credentials: 'include'
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Registration failed');
            }
            
            const data = await response.json();
            authStore.set({
                user: data.user,
                token: data.token,
                loading: false
            });
            
            return true;
        } catch (error) {
            authStore.update(state => ({ ...state, loading: false }));
            throw error;
        }
    },

    async logout() {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        authStore.set({
            user: null,
            token: null,
            loading: false
        });
    },

    async checkAuth() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                authStore.update(state => ({
                    ...state,
                    user: data.user,
                    token: data.token
                }));
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }
};
