<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';

const authStore = useAuthStore();
const avatarInput = ref<HTMLInputElement | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const uploadingAvatar = ref(false);
const avatarPreview = ref<string | null>(null);
const activeTab = ref('profile');

const stats = ref({
  totalGroups: 0,
  totalTasks: 0,
  completedTasks: 0,
  pendingTasks: 0
});

const formData = ref({
  username: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const fetchProfile = async () => {
  try {
    loading.value = true;
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`);
    stats.value = response.data.stats || {
      totalGroups: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0
    };
    formData.value = {
      ...formData.value,
      username: authStore.user?.username || '',
      email: authStore.user?.email || ''
    };
  } catch (err) {
    console.error('Error fetching profile:', err);
    error.value = 'Error al cargar el perfil';
  } finally {
    loading.value = false;
  }
};

const triggerAvatarUpload = () => {
  avatarInput.value?.click();
};

const handleAvatarChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  // Preview
  const reader = new FileReader();
  reader.onload = (e) => {
    avatarPreview.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
  
  // Upload
  try {
    uploadingAvatar.value = true;
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/users/me/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    authStore.user = {
      ...authStore.user,
      avatar: response.data.avatar
    };
  } catch (err) {
    console.error('Error uploading avatar:', err);
    error.value = 'Error al subir el avatar';
  } finally {
    uploadingAvatar.value = false;
  }
};

const deleteAvatar = async () => {
  try {
    uploadingAvatar.value = true;
    await axios.delete(`${import.meta.env.VITE_API_URL}/users/me/avatar`);
    authStore.user = {
      ...authStore.user,
      avatar: null
    };
    avatarPreview.value = null;
  } catch (err) {
    console.error('Error deleting avatar:', err);
    error.value = 'Error al eliminar el avatar';
  } finally {
    uploadingAvatar.value = false;
  }
};

const updateProfile = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    if (activeTab.value === 'profile') {
      await authStore.updateProfile({
        username: formData.value.username,
        email: formData.value.email
      });
    } else {
      if (formData.value.newPassword !== formData.value.confirmPassword) {
        error.value = 'Las contraseñas no coinciden';
        return;
      }
      
      await authStore.updatePassword(
        formData.value.currentPassword,
        formData.value.newPassword
      );
      
      // Clear password fields
      formData.value.currentPassword = '';
      formData.value.newPassword = '';
      formData.value.confirmPassword = '';
    }
  } catch (err: any) {
    error.value = err.message || 'Error al actualizar el perfil';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (authStore.user) {
    formData.value = {
      ...formData.value,
      username: authStore.user.username || '',
      email: authStore.user.email || ''
    };
  }
  fetchProfile();
});
</script>

<template>
  <div class="profile-container">
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Cargando...</span>
    </div>
    
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    
    <div v-else class="profile-content">
      <!-- Tabs de navegación -->
      <div class="profile-tabs">
        <button 
          :class="['tab-button', { active: activeTab === 'profile' }]"
          @click="activeTab = 'profile'"
        >
          <i class="fas fa-user"></i>
          Perfil
        </button>
        <button 
          :class="['tab-button', { active: activeTab === 'password' }]"
          @click="activeTab = 'password'"
        >
          <i class="fas fa-key"></i>
          Contraseña
        </button>
      </div>

      <div class="profile-header">
        <div class="avatar-section">
          <div 
            class="avatar-container"
            :class="{ 'uploading': uploadingAvatar }"
          >
            <img 
              :src="avatarPreview || authStore.user?.avatar?.url || '/default-avatar.png'" 
              :alt="authStore.user?.username"
              class="avatar-image"
            />
            <div class="avatar-overlay">
              <button 
                @click="triggerAvatarUpload"
                class="avatar-upload-btn"
                :disabled="uploadingAvatar"
              >
                {{ uploadingAvatar ? 'Subiendo...' : 'Cambiar' }}
              </button>
              <button 
                v-if="authStore.user?.avatar?.public_id"
                @click="deleteAvatar"
                class="avatar-delete-btn"
                :disabled="uploadingAvatar"
              >
                Eliminar
              </button>
            </div>
          </div>
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleAvatarChange"
          />
        </div>
        
        <div class="user-info">
          <h2>{{ authStore.user?.username }}</h2>
          <p class="email">{{ authStore.user?.email }}</p>
        </div>
      </div>

      <div class="stats-section">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalGroups }}</div>
          <div class="stat-label">Grupos</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalTasks }}</div>
          <div class="stat-label">Tareas Totales</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-value">{{ stats.completedTasks }}</div>
          <div class="stat-label">Tareas Completadas</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-value">{{ stats.pendingTasks }}</div>
          <div class="stat-label">Tareas Pendientes</div>
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
                required
                :disabled="loading"
              >
            </div>

            <div class="form-group">
              <label for="newPassword">Nueva Contraseña</label>
              <input
                id="newPassword"
                v-model="formData.newPassword"
                type="password"
                required
                :disabled="loading"
              >
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirmar Nueva Contraseña</label>
              <input
                id="confirmPassword"
                v-model="formData.confirmPassword"
                type="password"
                required
                :disabled="loading"
              >
            </div>
          </template>

          <div class="form-actions">
            <button type="submit" class="submit-button" :disabled="loading">
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
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-content {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 2rem;
}

.profile-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-button:hover {
  background: rgba(255, 255, 255, 0.15);
}

.tab-button.active {
  background: #646cff;
  color: white;
}

.profile-header {
  display: flex;
  gap: 2rem;
  align-items: center;
  margin-bottom: 3rem;
}

.avatar-section {
  position: relative;
}

.avatar-container {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.2);
}

.avatar-container.uploading {
  opacity: 0.7;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.avatar-upload-btn,
.avatar-delete-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.avatar-upload-btn {
  background: #646cff;
  color: white;
}

.avatar-delete-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.avatar-upload-btn:hover,
.avatar-delete-btn:hover {
  opacity: 0.9;
}

.hidden {
  display: none;
}

.user-info {
  flex: 1;
}

.user-info h2 {
  font-size: 1.8rem;
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
}

.user-info .email {
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.5rem;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 600;
  color: #646cff;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.profile-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 2rem;
  border-radius: 12px;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  color: white;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #646cff;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.submit-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #646cff;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.submit-button:hover {
  opacity: 0.9;
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.8);
}

.error {
  background: rgba(255, 0, 0, 0.1);
  color: #ff4444;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
