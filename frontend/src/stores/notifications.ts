import { defineStore } from 'pinia';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timeout?: number;
}

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as Notification[]
  }),

  actions: {
    show(notification: Omit<Notification, 'id'>) {
      const id = Math.random().toString(36).substring(2);
      const newNotification = {
        ...notification,
        id,
        timeout: notification.timeout || 5000
      };

      this.notifications.push(newNotification);

      // Auto remove after timeout
      setTimeout(() => {
        this.remove(id);
      }, newNotification.timeout);

      return id;
    },

    success(message: string, timeout?: number) {
      return this.show({ message, type: 'success', timeout });
    },

    error(message: string, timeout?: number) {
      return this.show({ message, type: 'error', timeout });
    },

    info(message: string, timeout?: number) {
      return this.show({ message, type: 'info', timeout });
    },

    warning(message: string, timeout?: number) {
      return this.show({ message, type: 'warning', timeout });
    },

    remove(id: string) {
      const index = this.notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        this.notifications.splice(index, 1);
      }
    }
  }
});
