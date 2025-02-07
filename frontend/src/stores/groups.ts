import { defineStore } from 'pinia';
import axios from 'axios';
import type { Group } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useGroupStore = defineStore('groups', {
  state: () => ({
    groups: [] as Group[],
    currentGroup: null as Group | null,
    loading: false,
    error: null as string | null
  }),

  actions: {
    resetState() {
      this.groups = [];
      this.currentGroup = null;
      this.error = null;
      this.loading = false;
    },

    async fetchGroups() {
      try {
        this.loading = true;
        this.error = null;
        const response = await axios.get(`${API_URL}/groups`);
        this.groups = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message || 'Error al obtener los grupos';
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async fetchGroup(id: string) {
      try {
        if (!id || id === 'undefined') {
          throw new Error('ID de grupo no válido');
        }

        this.loading = true;
        this.error = null;
        
        const response = await axios.get(`${API_URL}/groups/${id}`);
        const tasksResponse = await axios.get(`${API_URL}/tasks/group/${id}`);
        
        const groupWithTasks = {
          ...response.data,
          tasks: tasksResponse.data || []
        };
        
        this.currentGroup = groupWithTasks;
        return groupWithTasks;
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message || 'Error al obtener el grupo';
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async createGroup(title: string, description: string) {
      try {
        this.loading = true;
        this.error = null;
        const response = await axios.post(`${API_URL}/groups`, {
          title,
          description
        });
        this.groups.unshift(response.data);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message || 'Error al crear el grupo';
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async updateGroup(id: string, data: Partial<Group>) {
      try {
        this.loading = true;
        this.error = null;
        const response = await axios.patch(`${API_URL}/groups/${id}`, data);
        const index = this.groups.findIndex(g => g._id === id);
        if (index !== -1) {
          this.groups[index] = response.data;
        }
        if (this.currentGroup?._id === id) {
          this.currentGroup = response.data;
        }
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message || 'Error al actualizar el grupo';
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async addMember(groupId: string, userId: string) {
      try {
        this.loading = true;
        this.error = null;
        const response = await axios.post(`${API_URL}/groups/${groupId}/members`, { userId });
        if (this.currentGroup?._id === groupId) {
          this.currentGroup = response.data;
        }
        const index = this.groups.findIndex(g => g._id === groupId);
        if (index !== -1) {
          this.groups[index] = response.data;
        }
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message || 'Error al agregar miembro';
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async removeMember(groupId: string, userId: string) {
      try {
        this.loading = true;
        this.error = null;
        const response = await axios.delete(`${API_URL}/groups/${groupId}/members/${userId}`);
        if (this.currentGroup?._id === groupId) {
          this.currentGroup = response.data;
        }
        const index = this.groups.findIndex(g => g._id === groupId);
        if (index !== -1) {
          this.groups[index] = response.data;
        }
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message || 'Error al remover miembro';
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async deleteGroup(groupId: string) {
      try {
        this.loading = true;
        this.error = null;
        await axios.delete(`${API_URL}/groups/${groupId}`);
        this.groups = this.groups.filter(g => g._id !== groupId);
        if (this.currentGroup?._id === groupId) {
          this.currentGroup = null;
        }
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message || 'Error al eliminar el grupo';
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async generateInviteLink(groupId: string) {
      try {
        this.loading = true;
        this.error = null;
        const response = await axios.post(`${API_URL}/groups/${groupId}/invite`);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message || 'Error al generar el enlace de invitación';
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    }
  }
});
