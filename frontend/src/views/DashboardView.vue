<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useGroupStore } from '../stores/groups';
import { useAuthStore } from '../stores/auth';
import { useRouter, useRoute } from 'vue-router';
import { useNotificationStore } from '../stores/notifications';

const router = useRouter();
const route = useRoute();
const groupStore = useGroupStore();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const loading = ref(true);
const showCreateModal = ref(false);
const showJoinModal = ref(false);
const joiningGroup = ref(false);
const inviteCode = ref('');

const newGroup = ref({
  title: '',
  description: ''
});

// Función para extraer el código de invitación de una URL
const extractInviteCode = (input: string) => {
  try {
    const url = new URL(input);
    const code = url.searchParams.get('invite') || url.pathname.split('/').pop();
    return code;
  } catch {
    // Si no es una URL válida, asumimos que es el código directamente
    return input;
  }
};

const joinGroup = async () => {
  if (!inviteCode.value) return;
  
  try {
    joiningGroup.value = true;
    const code = extractInviteCode(inviteCode.value);
    await groupStore.joinGroupByInvite(code);
    showJoinModal.value = false;
    inviteCode.value = '';
    notificationStore.success('¡Te has unido al grupo exitosamente!');
  } catch (error: any) {
    console.error('Error joining group:', error);
    notificationStore.error(error.message || 'Error al unirse al grupo');
  } finally {
    joiningGroup.value = false;
  }
};

// Verificar si hay un código de invitación en la URL al cargar
onMounted(async () => {
  try {
    await groupStore.fetchGroups();
    
    // Verificar si hay un código de invitación en la URL
    const inviteParam = route.query.invite as string;
    if (inviteParam) {
      try {
        joiningGroup.value = true;
        await groupStore.joinGroupByInvite(inviteParam);
        // Limpiar el parámetro de la URL
        router.replace({ query: {} });
        notificationStore.success('¡Te has unido al grupo exitosamente!');
      } catch (error: any) {
        console.error('Error joining group from URL:', error);
        notificationStore.error(error.message || 'Error al unirse al grupo');
      } finally {
        joiningGroup.value = false;
      }
    }
  } finally {
    loading.value = false;
  }
});

const recentGroups = computed(() => {
  return groupStore.groups.slice(0, 4);
});

const pendingTasks = computed(() => {
  return groupStore.groups.reduce((acc, group) => {
    const tasks = group.tasks?.filter(task => task.status === 'pending' && task.assignedTo?._id === authStore.user?._id) || [];
    return [...acc, ...tasks.map(task => ({ ...task, groupTitle: group.title }))];
  }, [] as any[]);
});

const createGroup = async () => {
  if (!newGroup.value.title.trim()) return;
  
  try {
    await groupStore.createGroup(newGroup.value.title, newGroup.value.description);
    showCreateModal.value = false;
    newGroup.value = { title: '', description: '' };
  } catch (error) {
    console.error('Error creating group:', error);
  }
};
</script>

<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <div class="welcome-section">
        <h1>Bienvenido, {{ authStore.user?.username }}</h1>
        <p class="date">{{ new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
      </div>
      <div class="actions">
        <button @click="showCreateModal = true" class="create-button">
          <i class="fas fa-plus"></i>
          Crear Nuevo Grupo
        </button>
        <button @click="showJoinModal = true" class="join-button">
          <i class="fas fa-link"></i>
          Unirse a Grupo
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-circle-notch fa-spin"></i>
      Cargando...
    </div>
    
    <div v-else class="dashboard-grid">
      <!-- Grupos Recientes -->
      <div class="dashboard-card groups-section">
        <div class="card-header">
          <h2><i class="fas fa-users"></i> Grupos Recientes</h2>
          <router-link to="/groups" class="view-all">Ver todos</router-link>
        </div>
        
        <div v-if="recentGroups.length === 0" class="empty-state">
          <i class="fas fa-users-slash"></i>
          <p>No tienes grupos aún</p>
          <button @click="showCreateModal = true" class="create-button-small">
            Crear mi primer grupo
          </button>
        </div>
        
        <div v-else class="groups-grid">
          <div v-for="group in recentGroups" :key="group._id" class="group-card" @click="router.push(`/groups/${group._id}`)">
            <div class="group-card-content">
              <h3>{{ group.title }}</h3>
              <p>{{ group.description || 'Sin descripción' }}</p>
              <div class="group-stats">
                <span><i class="fas fa-users"></i> {{ group.members?.length || 0 }}</span>
                <span><i class="fas fa-tasks"></i> {{ group.tasks?.length || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tareas Pendientes -->
      <div class="dashboard-card tasks-section">
        <div class="card-header">
          <h2><i class="fas fa-tasks"></i> Tus Tareas Pendientes</h2>
        </div>
        
        <div v-if="pendingTasks.length === 0" class="empty-state">
          <i class="fas fa-check-circle"></i>
          <p>¡No tienes tareas pendientes!</p>
        </div>
        
        <div v-else class="tasks-list">
          <div v-for="task in pendingTasks" :key="task._id" class="task-item">
            <div class="task-priority" :class="task.priority">
              {{ task.priority }}
            </div>
            <div class="task-content">
              <h4>{{ task.title }}</h4>
              <p class="task-group">{{ task.groupTitle }}</p>
            </div>
            <button class="task-action" @click="router.push(`/groups/${task.group}`)">
              <i class="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para unirse a grupo -->
    <div v-if="showJoinModal" class="modal-overlay" @click.self="showJoinModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Unirse a un Grupo</h2>
          <button class="close-button" @click="showJoinModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <p class="modal-description">Ingresa el código o URL de invitación para unirte a un grupo</p>
          
          <div class="form-group">
            <input
              v-model="inviteCode"
              type="text"
              placeholder="Código o URL de invitación"
              :disabled="joiningGroup"
            >
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-button" @click="showJoinModal = false" :disabled="joiningGroup">
            Cancelar
          </button>
          <button class="confirm-button" @click="joinGroup" :disabled="!inviteCode || joiningGroup">
            <i class="fas fa-spinner fa-spin" v-if="joiningGroup"></i>
            <span>{{ joiningGroup ? 'Uniéndose...' : 'Unirse al Grupo' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para crear grupo -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal-content" @click.stop>
        <h2>Crear Nuevo Grupo</h2>
        <form @submit.prevent="createGroup">
          <div class="form-group">
            <label for="groupTitle">Nombre del Grupo</label>
            <input
              id="groupTitle"
              v-model="newGroup.title"
              type="text"
              required
              placeholder="Ingresa el nombre del grupo"
            >
          </div>
          
          <div class="form-group">
            <label for="groupDescription">Descripción</label>
            <textarea
              id="groupDescription"
              v-model="newGroup.description"
              rows="3"
              placeholder="Describe el propósito del grupo"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showCreateModal = false" class="cancel-button">
              Cancelar
            </button>
            <button type="submit" class="create-button">
              Crear Grupo
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
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

.welcome-section h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--text-primary);
}

.date {
  color: var(--text-secondary);
  margin: 0.5rem 0 0;
  font-size: 1rem;
  opacity: 0.8;
}

.actions {
  display: flex;
  gap: 1rem;
}

.create-button,
.join-button {
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  border: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.create-button {
  background: var(--accent-color);
  color: white;
}

.join-button {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.create-button:hover {
  background: var(--accent-color-dark);
}

.join-button:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.dashboard-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.dashboard-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-header .view-all {
  color: var(--accent-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.card-header .view-all:hover {
  color: var(--accent-hover);
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.group-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.group-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.group-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.group-card p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  opacity: 0.8;
}

.group-stats {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.task-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(5px);
}

.task-priority {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.task-priority.high {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.task-priority.medium {
  background: rgba(241, 196, 15, 0.2);
  color: #f1c40f;
}

.task-priority.low {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.task-content {
  flex: 1;
}

.task-content h4 {
  margin: 0;
  color: var(--text-primary);
}

.task-group {
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  opacity: 0.8;
}

.task-action {
  background: none;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.task-action:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--accent-hover);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.empty-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1f25;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: white;
}

.close-button {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.5rem;
  transition: color 0.2s;
}

.close-button:hover {
  color: white;
}

.modal-body {
  padding: 1.5rem;
}

.modal-description {
  color: #94a3b8;
  margin: 0 0 1.5rem;
}

.modal-body .form-group {
  margin-bottom: 1rem;
}

.modal-body input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  transition: all 0.2s;
}

.modal-body input:focus {
  outline: none;
  border-color: var(--accent-color);
  background: rgba(255, 255, 255, 0.1);
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.modal-footer button {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancel-button {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.confirm-button {
  background: var(--accent-color);
  color: white;
  border: none;
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

.confirm-button:hover {
  background: var(--accent-color-dark);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: var(--text-secondary);
}

.loading i {
  font-size: 1.5rem;
}
</style>
