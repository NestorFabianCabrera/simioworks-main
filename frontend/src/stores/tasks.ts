import { defineStore } from 'pinia';
import axios from 'axios';
import { ref } from 'vue';
import type { Task } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [] as Task[],
    currentTask: null as Task | null,
    loading: false,
    error: null as string | null
  }),

  actions: {
    resetState() {
      this.tasks = [];
      this.currentTask = null;
      this.error = null;
      this.loading = false;
    },

    async fetchGroupTasks(groupId: string) {
      try {
        if (!groupId || groupId === 'undefined') {
          throw new Error('ID de grupo no válido');
        }

        this.loading = true;
        this.error = null;
        const response = await axios.get(`${API_URL}/tasks/group/${groupId}`);
        
        this.tasks = Array.isArray(response.data) ? response.data : [];
        
        return this.tasks;
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message || 'Error al obtener las tareas';
        this.tasks = [];
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async fetchTask(id: string) {
      try {
        this.loading = true;
        this.error = null;
        const response = await axios.get<Task>(`${API_URL}/tasks/${id}`);
        this.currentTask = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Error al obtener la tarea';
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async createTask(data: Partial<Task>) {
      try {
        if (!data.group || data.group === 'undefined') {
          throw new Error('ID de grupo no válido');
        }

        this.loading = true;
        this.error = null;
        const response = await axios.post(`${API_URL}/tasks`, data);
        this.tasks.unshift(response.data);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message || 'Error al crear la tarea';
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async updateTask(id: string, data: Partial<Task>) {
      try {
        this.loading = true;
        this.error = null;
        const response = await axios.patch<Task>(`${API_URL}/tasks/${id}`, data);
        const index = this.tasks.findIndex(t => t._id === id);
        if (index !== -1) {
          this.tasks[index] = response.data;
        }
        if (this.currentTask?._id === id) {
          this.currentTask = response.data;
        }
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Error al actualizar la tarea';
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async updateTaskStatus(taskId: string, status: string) {
      try {
        this.loading = true;
        this.error = null;
        const response = await axios.patch(`${API_URL}/tasks/${taskId}`, { status });
        const taskIndex = this.tasks.findIndex(t => t._id === taskId);
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = response.data;
        }
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message || 'Error al actualizar la tarea';
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async updateTaskAssignment(taskId: string, userId: string | null) {
      try {
        this.loading = true;
        this.error = null;
        const response = await axios.patch(`${API_URL}/tasks/${taskId}`, { 
          assignedTo: userId === '' ? null : userId 
        });
        const taskIndex = this.tasks.findIndex(t => t._id === taskId);
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = response.data;
        }
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message || 'Error al actualizar la asignación de la tarea';
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async deleteTask(id: string) {
      try {
        this.loading = true;
        this.error = null;
        await axios.delete(`${API_URL}/tasks/${id}`);
        this.tasks = this.tasks.filter(t => t._id !== id);
        if (this.currentTask?.id === id) {
          this.currentTask = null;
        }
      } catch (err: any) {
        this.error = err.response?.data?.error || 'Error al eliminar la tarea';
        throw this.error;
      } finally {
        this.loading = false;
      }
    },

    async uploadAttachment(taskId: string, file: File) {
      try {
        this.loading = true;
        this.error = null;
        const formData = new FormData();
        formData.append('attachment', file);
        const response = await axios.post<{url: string}>(`${API_URL}/tasks/${taskId}/attachments`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data.url;
      } catch (err: any) {
        this.error = err.response?.data?.error || 'Error al subir el archivo';
        throw this.error;
      } finally {
        this.loading = false;
      }
    }
  }
});
