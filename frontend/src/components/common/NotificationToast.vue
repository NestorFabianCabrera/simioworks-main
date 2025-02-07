<template>
  <div class="notifications-container">
    <TransitionGroup name="notification">
      <div
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        class="notification"
        :class="notification.type"
      >
        <div class="notification-content">
          <i :class="getIcon(notification.type)"></i>
          <span>{{ notification.message }}</span>
        </div>
        <button 
          class="close-button"
          @click="notificationStore.remove(notification.id)"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useNotificationStore } from '../../stores/notifications';

const notificationStore = useNotificationStore();

const getIcon = (type: string) => {
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };
  return icons[type as keyof typeof icons] || icons.info;
};
</script>

<style scoped>
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.notification {
  background: #1a1f25;
  border-radius: 8px;
  padding: 1rem;
  min-width: 300px;
  max-width: 400px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
}

.notification i {
  font-size: 1.25rem;
}

.notification.success {
  border-left: 4px solid #10B981;
}

.notification.error {
  border-left: 4px solid #EF4444;
}

.notification.warning {
  border-left: 4px solid #F59E0B;
}

.notification.info {
  border-left: 4px solid #3B82F6;
}

.notification.success i {
  color: #10B981;
}

.notification.error i {
  color: #EF4444;
}

.notification.warning i {
  color: #F59E0B;
}

.notification.info i {
  color: #3B82F6;
}

.close-button {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.close-button:hover {
  color: white;
}

/* Animations */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
