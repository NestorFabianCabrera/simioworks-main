import { defineStore } from 'pinia';
import axios from 'axios';
import router from '../router';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    getUser: (state) => state.user,
  },

  actions: {
    async register(data: { username: string; email: string; password: string }) {
      try {
        this.loading = true;
        this.error = null;
        const response = await axios.post(`${API_URL}/users/register`, data);
        
        this.token = response.data.token;
        this.user = response.data.user;
        
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        await router.push('/dashboard');
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Error al registrarse';
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async login(email: string, password: string) {
      try {
        this.loading = true;
        this.error = null;
        const response = await axios.post(`${API_URL}/users/login`, {
          email,
          password,
        });
        
        this.token = response.data.token;
        this.user = response.data.user;
        
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        await router.push('/dashboard');
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Error al iniciar sesión';
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      router.push('/login');
    },

    async checkAuth() {
      try {
        const response = await axios.get(`${API_URL}/users/me`);
        this.user = response.data;
        return true;
      } catch (error) {
        return false;
      }
    },

    async initializeAuth() {
      const token = localStorage.getItem('token');
      if (token) {
        this.token = token;
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await this.checkAuth();
      }
    },

    async updateProfile(userData: { username?: string; email?: string }) {
      try {
        const response = await axios.patch(`${API_URL}/users/me`, userData);
        this.user = response.data;
        return response.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error updating profile');
      }
    },

    async updatePassword(currentPassword: string, newPassword: string) {
      try {
        await axios.patch(`${API_URL}/users/me/password`, {
          currentPassword,
          newPassword,
        });
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error updating password');
      }
    },
  },
});
