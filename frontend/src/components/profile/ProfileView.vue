<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useGroupStore } from '../../stores/groups';

const authStore = useAuthStore();
const groupStore = useGroupStore();
const loading = ref(false);
const error = ref('');
const success = ref('');
const activeTab = ref('profile');

const formData = ref({
  username: authStore.user?.username || '',
  email: authStore.user?.email || '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const userGroups = computed(() => {
  return groupStore.groups.filter(group => 
    group.members?.some(member => member.user._id === authStore.user?._id)
  );
});

const userStats = computed(() => {
  const stats = {
    totalGroups: userGroups.value.length,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  };

  userGroups.value.forEach(group => {
    const userTasks = group.tasks?.filter(task => task.assignedTo?._id === authStore.user?._id) || [];
    stats.totalTasks += userTasks.length;
    stats.completedTasks += userTasks.filter(task => task.status === 'completed').length;
    stats.pendingTasks += userTasks.filter(task => task.status === 'pending').length;
  });

  return stats;
});

const updateProfile = async () => {
  if (!formData.value.username || !formData.value.email) {
    error.value = 'El nombre de usuario y email son requeridos';
    return;
  }

  try {
    loading.value = true;
    error.value = '';
    success.value = '';

    await authStore.updateProfile({
      username: formData.value.username,
      email: formData.value.email
    });

    if (formData.value.currentPassword && formData.value.newPassword) {
      if (formData.value.newPassword !== formData.value.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      await authStore.updatePassword(formData.value.currentPassword, formData.value.newPassword);
      formData.value.currentPassword = '';
      formData.value.newPassword = '';
      formData.value.confirmPassword = '';
    }

    success.value = 'Perfil actualizado correctamente';
  } catch (err: any) {
    error.value = err.message || 'Error al actualizar el perfil';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="profile-container">
    <div class="profile-header">
      <h1>{{ authStore.user?.username }}</h1>
      <div class="avatar-section">
        <div class="avatar-placeholder">
          <i class="fas fa-user"></i>
        </div>
      </div>
    </div>

    <div class="profile-content">
      <div class="profile-card">
        <div class="profile-info">
          <div class="info-group">
            <label>Nombre de usuario</label>
            <div class="value">{{ authStore.user?.username }}</div>
          </div>
          <div class="info-group">
            <label>Email</label>
            <div class="value">{{ authStore.user?.email }}</div>
          </div>
        </div>
      </div>

      <div class="profile-card">
        <div class="profile-stats">
          <div class="stat-card">
            <div class="number">{{ userStats.totalGroups }}</div>
            <div class="label">Grupos</div>
          </div>
          <div class="stat-card">
            <div class="number">{{ userStats.totalTasks }}</div>
            <div class="label">Tareas Totales</div>
          </div>
          <div class="stat-card">
            <div class="number">{{ userStats.completedTasks }}</div>
            <div class="label">Tareas Completadas</div>
          </div>
          <div class="stat-card">
            <div class="number">{{ userStats.pendingTasks }}</div>
            <div class="label">Tareas Pendientes</div>
          </div>
        </div>
      </div>

      <div class="profile-card">
        <form @submit.prevent="updateProfile" class="profile-form">
          <template v-if="activeTab === 'profile'">
            <div class="form-group">
              <label for="username">Nombre de usuario</label>
              <input
                id="username"
                v-model="formData.username"
                type="text"
                required
                :disabled="loading"
              >
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                required
                :disabled="loading"
              >
            </div>
          </template>

          <template v-else>
            <div class="form-group">
              <label for="currentPassword">Contraseña Actual</label>
              <input
                id="currentPassword"
                v-model="formData.currentPassword"
                type="password"
                :disabled="loading"
              >
            </div>

            <div class="form-group">
              <label for="newPassword">Nueva Contraseña</label>
              <input
                id="newPassword"
                v-model="formData.newPassword"
                type="password"
                :disabled="loading"
              >
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirmar Nueva Contraseña</label>
              <input
                id="confirmPassword"
                v-model="formData.confirmPassword"
                type="password"
                :disabled="loading"
              >
            </div>
          </template>

          <div class="modal-actions">
            <button type="submit" class="edit-button" :disabled="loading">
              <i class="fas fa-save"></i>
              {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 1.5rem 2rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.profile-header h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--text-primary);
}

.profile-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.profile-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.profile-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-group label {
  color: var(--text-secondary);
  font-size: 0.9rem;
  opacity: 0.8;
}

.info-group .value {
  color: var(--text-primary);
  font-size: 1.1rem;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-card .number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--accent-color);
  margin-bottom: 0.5rem;
}

.stat-card .label {
  color: var(--text-secondary);
  font-size: 0.9rem;
  opacity: 0.8;
}

.edit-button {
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  border: none;
  background: var(--accent-color);
  color: white;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.edit-button:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 2rem;
  border: 3px solid var(--accent-color);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent-color);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.error-message {
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid rgba(231, 76, 60, 0.2);
}

.success-message {
  color: #2ecc71;
  background: rgba(46, 204, 113, 0.1);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid rgba(46, 204, 113, 0.2);
}
</style>
