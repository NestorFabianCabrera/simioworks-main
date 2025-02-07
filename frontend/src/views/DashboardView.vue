<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useGroupStore } from '../stores/groups';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const router = useRouter();
const groupStore = useGroupStore();
const authStore = useAuthStore();

const loading = ref(true);
const showCreateModal = ref(false);
const newGroup = ref({
  title: '',
  description: ''
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

onMounted(async () => {
  try {
    await groupStore.fetchGroups();
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <div class="welcome-section">
        <h1>Bienvenido, {{ authStore.user?.username }}</h1>
        <p class="date">{{ new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
      </div>
      <button @click="showCreateModal = true" class="create-button">
        <i class="fas fa-plus"></i>
        Crear Nuevo Grupo
      </button>
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

.create-button {
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

.create-button:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
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
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: var(--background-secondary);
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-content h2 {
  margin: 0 0 1.5rem 0;
  color: var(--text-primary);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  font-size: 1rem;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-color);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-button {
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.05);
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
