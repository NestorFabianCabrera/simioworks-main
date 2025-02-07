<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGroupStore } from '../../stores/groups';
import { useTaskStore } from '../../stores/tasks';
import draggable from 'vuedraggable';

const route = useRoute();
const router = useRouter();
const groupStore = useGroupStore();
const taskStore = useTaskStore();

const loading = ref(true);
const error = ref('');
const showCreateTaskModal = ref(false);
const showInviteModal = ref(false);
const inviteLink = ref('');
const copySuccess = ref(false);
const showTaskDetailModal = ref(false);
const selectedTask = ref(null);

const newTask = ref({
  title: '',
  description: '',
  priority: 'medium',
  status: 'pending'
});

// Computed properties para filtrar tareas por estado
const pendingTasks = computed(() => {
  if (!taskStore.tasks) return [];
  return taskStore.tasks.filter(task => task.status === 'pending');
});

const inProgressTasks = computed(() => {
  if (!taskStore.tasks) return [];
  return taskStore.tasks.filter(task => task.status === 'in_progress');
});

const completedTasks = computed(() => {
  if (!taskStore.tasks) return [];
  return taskStore.tasks.filter(task => task.status === 'completed');
});

// Cargar el grupo y sus tareas
onMounted(async () => {
  const groupId = route.params.id?.toString();
  
  if (!groupId) {
    error.value = 'ID de grupo no válido';
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    error.value = '';
    
    await groupStore.fetchGroup(groupId);
    
    if (groupStore.currentGroup) {
      await taskStore.fetchGroupTasks(groupId);
    } else {
      throw new Error('No se pudo cargar el grupo');
    }
  } catch (err: any) {
    console.error('Error:', err);
    error.value = err.message || 'Error al cargar el grupo';
  } finally {
    loading.value = false;
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && showTaskDetailModal.value) {
      closeTaskDetail();
    }
  });
});

const createTask = async () => {
  if (!route.params.id || !newTask.value.title) return;
  
  try {
    await taskStore.createTask({
      ...newTask.value,
      group: route.params.id.toString()
    });
    
    await taskStore.fetchGroupTasks(route.params.id.toString());
    
    showCreateTaskModal.value = false;
    newTask.value = {
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending'
    };
  } catch (err: any) {
    console.error('Error creating task:', err);
  }
};

const generateInviteLink = async () => {
  if (!route.params.id) return;
  
  try {
    const response = await groupStore.generateInviteLink(route.params.id.toString());
    inviteLink.value = `${window.location.origin}/dashboard?invite=${response.inviteCode}`;
    showInviteModal.value = true;
  } catch (err: any) {
    console.error('Error generating invite link:', err);
  }
};

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(inviteLink.value);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch (err) {
    console.error('Error copying to clipboard:', err);
  }
};

const handleTaskMove = async (evt: any) => {
  const taskId = evt.item.getAttribute('data-task-id');
  if (!taskId) return;

  // Obtener el estado de la columna de destino del contenedor padre
  const targetColumn = evt.to.closest('.tasks-column').getAttribute('data-status');
  
  console.log('Moving task:', taskId, 'to status:', targetColumn);
  
  if (!targetColumn) {
    console.error('No se pudo determinar el estado de destino');
    return;
  }

  try {
    await taskStore.updateTaskStatus(taskId, targetColumn);
  } catch (err) {
    console.error('Error updating task status:', err);
    // Si hay un error, recargar las tareas para restaurar el estado original
    if (route.params.id) {
      await taskStore.fetchGroupTasks(route.params.id.toString());
    }
  }
};

const openTaskDetail = (task) => {
  selectedTask.value = task;
  showTaskDetailModal.value = true;
};

const assignTask = async (userId) => {
  if (!selectedTask.value) return;
  
  try {
    const updatedTask = await taskStore.updateTaskAssignment(selectedTask.value._id, userId);
    selectedTask.value = updatedTask;
  } catch (err) {
    console.error('Error assigning task:', err);
  }
};

const getAssignedUserName = (task) => {
  if (!task?.assignedTo) return 'Sin asignar';
  const member = groupStore.currentGroup?.members.find(m => 
    m.user._id === task.assignedTo || m.user._id === task.assignedTo._id
  );
  return member ? member.user.username || 'Sin asignar' : 'Sin asignar';
};

const closeTaskDetail = () => {
  showTaskDetailModal.value = false;
  selectedTask.value = null;
};

const getPriorityClass = (priority: string) => {
  return {
    'low': 'priority-low',
    'medium': 'priority-medium',
    'high': 'priority-high'
  }[priority] || 'priority-medium';
};

const getPriorityText = (priority: string) => {
  const translations = {
    'low': 'Baja',
    'medium': 'Media',
    'high': 'Alta'
  };
  return translations[priority] || priority;
};

onUnmounted(() => {
  window.removeEventListener('keydown', (e) => {
    if (e.key === 'Escape' && showTaskDetailModal.value) {
      closeTaskDetail();
    }
  });
});
</script>

<template>
  <div class="group-detail-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando grupo...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="router.push('/groups')" class="back-button">
        Volver a Grupos
      </button>
    </div>

    <!-- Content State -->
    <div v-else-if="groupStore.currentGroup" class="group-content">
      <!-- Group Header -->
      <header class="group-header">
        <div class="header-content">
          <h1>{{ groupStore.currentGroup.title }}</h1>
          <p v-if="groupStore.currentGroup.description">
            {{ groupStore.currentGroup.description }}
          </p>
        </div>
        <div class="header-actions">
          <button @click="generateInviteLink" class="invite-button">
            Invitar al grupo
          </button>
          <button @click="showCreateTaskModal = true" class="create-button">
            Nueva Tarea
          </button>
          <button @click="router.push('/groups')" class="back-button">
            Volver
          </button>
        </div>
      </header>

      <!-- Tasks Board -->
      <div class="tasks-board">
        <!-- Pending Tasks -->
        <div class="tasks-column" data-status="pending">
          <h3>Pendientes</h3>
          <draggable
            :list="pendingTasks"
            group="tasks"
            ghost-class="ghost"
            @end="handleTaskMove"
            item-key="_id"
            class="tasks-list"
          >
            <template #item="{ element: task }">
              <div
                :data-task-id="task._id"
                class="task-card"
                @click="openTaskDetail(task)"
              >
                <h4>{{ task.title }}</h4>
                <p v-if="task.description">{{ task.description }}</p>
                <div class="task-meta">
                  <span :class="['priority-badge', getPriorityClass(task.priority || 'medium')]">
                    {{ getPriorityText(task.priority || 'medium') }}
                  </span>
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <!-- In Progress Tasks -->
        <div class="tasks-column" data-status="in_progress">
          <h3>En Progreso</h3>
          <draggable
            :list="inProgressTasks"
            group="tasks"
            ghost-class="ghost"
            @end="handleTaskMove"
            item-key="_id"
            class="tasks-list"
          >
            <template #item="{ element: task }">
              <div
                :data-task-id="task._id"
                class="task-card"
                @click="openTaskDetail(task)"
              >
                <h4>{{ task.title }}</h4>
                <p v-if="task.description">{{ task.description }}</p>
                <div class="task-meta">
                  <span :class="['priority-badge', getPriorityClass(task.priority || 'medium')]">
                    {{ getPriorityText(task.priority || 'medium') }}
                  </span>
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <!-- Completed Tasks -->
        <div class="tasks-column" data-status="completed">
          <h3>Completadas</h3>
          <draggable
            :list="completedTasks"
            group="tasks"
            ghost-class="ghost"
            @end="handleTaskMove"
            item-key="_id"
            class="tasks-list"
          >
            <template #item="{ element: task }">
              <div
                :data-task-id="task._id"
                class="task-card"
                @click="openTaskDetail(task)"
              >
                <h4>{{ task.title }}</h4>
                <p v-if="task.description">{{ task.description }}</p>
                <div class="task-meta">
                  <span :class="['priority-badge', getPriorityClass(task.priority || 'medium')]">
                    {{ getPriorityText(task.priority || 'medium') }}
                  </span>
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </div>

      <!-- Create Task Modal -->
      <div v-if="showCreateTaskModal" class="modal">
        <div class="modal-content">
          <h2>Crear Nueva Tarea</h2>
          <form @submit.prevent="createTask">
            <div class="form-group">
              <label for="title">Título</label>
              <input
                id="title"
                v-model="newTask.title"
                type="text"
                required
                placeholder="Título de la tarea"
              >
            </div>
            <div class="form-group">
              <label for="description">Descripción</label>
              <textarea
                id="description"
                v-model="newTask.description"
                placeholder="Descripción de la tarea"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="priority">Prioridad</label>
              <select id="priority" v-model="newTask.priority" required>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="submit">Crear</button>
              <button type="button" @click="showCreateTaskModal = false">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Invite Modal -->
      <div v-if="showInviteModal" class="modal" @click.self="showInviteModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Invitar al Grupo</h2>
            <button class="close-button" @click="showInviteModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <p class="modal-description">Comparte este enlace para invitar a otros usuarios al grupo:</p>
            <div class="invite-link-box">
              <input
                type="text"
                readonly
                :value="inviteLink"
                class="invite-link-input"
              >
              <button
                @click="copyToClipboard"
                class="copy-button"
                :class="{ 'success': copySuccess }"
              >
                <i :class="copySuccess ? 'fas fa-check' : 'fas fa-copy'"></i>
                {{ copySuccess ? '¡Copiado!' : 'Copiar' }}
              </button>
            </div>
          </div>

          <div class="modal-footer">
            <button class="cancel-button" @click="showInviteModal = false">
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <!-- Task Detail Modal -->
      <div v-if="showTaskDetailModal && selectedTask" class="modal task-detail-modal">
        <div class="modal-content">
          <button 
            type="button" 
            class="close-button"
            @click="closeTaskDetail"
            title="Cerrar (Esc)"
          >
            ✕
          </button>
          <div class="task-detail-layout">
            <!-- Panel izquierdo -->
            <div class="task-main-content">
              <div class="task-detail-header">
                <div class="task-title-section">
                  <h2>{{ selectedTask.title }}</h2>
                  <span :class="['priority-badge', getPriorityClass(selectedTask.priority)]">
                    {{ getPriorityText(selectedTask.priority) }}
                  </span>
                </div>
              </div>
              
              <div class="task-detail-body">
                <div class="detail-section description-section">
                  <h3>Descripción</h3>
                  <div class="description-content">
                    {{ selectedTask.description || 'Sin descripción' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Panel derecho -->
            <div class="task-sidebar">
              <div class="detail-section">
                <h3>Estado</h3>
                <div class="status-display" :class="'status-' + selectedTask.status">
                  {{ {
                    'pending': 'Pendiente',
                    'in_progress': 'En Progreso',
                    'completed': 'Completada'
                  }[selectedTask.status] }}
                </div>
              </div>
              
              <div class="detail-section">
                <h3>Asignación</h3>
                <div class="assignment-section">
                  <div class="current-assignee">
                    <div class="assignee-info">
                      <span class="label">Asignado a</span>
                      <span class="value">{{ getAssignedUserName(selectedTask) }}</span>
                    </div>
                  </div>
                  <div class="assignment-controls">
                    <select
                      :value="selectedTask.assignedTo?._id || selectedTask.assignedTo || ''"
                      @change="assignTask($event.target.value)"
                      class="select-assignee"
                    >
                      <option value="">Sin asignar</option>
                      <option
                        v-for="member in groupStore.currentGroup.members"
                        :key="member.user._id"
                        :value="member.user._id"
                      >
                        {{ member.user.username || 'Usuario sin nombre' }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h3>Detalles</h3>
                <div class="task-details-list">
                  <div class="detail-item">
                    <span class="label">Creado</span>
                    <span class="value">{{ new Date(selectedTask.createdAt).toLocaleString() }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Última actualización</span>
                    <span class="value">{{ new Date(selectedTask.updatedAt).toLocaleString() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.group-detail-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  color: rgba(255, 255, 255, 0.87);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 2rem;
}

.error-container {
  text-align: center;
  padding: 2rem;
  background: rgba(220, 53, 69, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(220, 53, 69, 0.2);
}

.error-message {
  color: #dc3545;
  margin-bottom: 1rem;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.header-content h1 {
  margin: 0;
  font-size: 2.4rem;
  color: rgba(255, 255, 255, 0.87);
  line-height: 1.2;
}

.header-content p {
  margin: 0.5rem 0 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.create-button {
  background-color: #646cff;
  color: white;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.25s, transform 0.2s;
}

.create-button:hover {
  border-color: #535bf2;
  transform: translateY(-2px);
}

.back-button {
  background-color: #1a1a1a;
  color: rgba(255, 255, 255, 0.87);
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.25s, transform 0.2s;
}

.back-button:hover {
  border-color: #646cff;
  transform: translateY(-2px);
}

.tasks-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
}

.tasks-column {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 400px;
}

.tasks-column h3 {
  margin: 0 0 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.87);
  font-size: 1.2rem;
  text-align: center;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-card {
  background: rgba(26, 26, 26, 0.8);
  border-radius: 8px;
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.2s, border-color 0.25s;
  cursor: pointer;
}

.task-card:hover {
  transform: translateY(-2px);
  border-color: #646cff;
}

.task-card h4 {
  margin: 0 0 0.75rem;
  color: rgba(255, 255, 255, 0.87);
  font-size: 1.1rem;
}

.task-card p {
  margin: 0 0 1rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
  line-height: 1.5;
}

.task-meta {
  display: flex;
  gap: 0.75rem;
}

.priority-badge {
  padding: 0.4em 0.8em;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
}

.priority-low {
  background-color: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
  border: 1px solid rgba(46, 204, 113, 0.3);
}

.priority-medium {
  background-color: rgba(241, 196, 15, 0.2);
  color: #f1c40f;
  border: 1px solid rgba(241, 196, 15, 0.3);
}

.priority-high {
  background-color: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
}

.no-tasks {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  padding: 2rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #1a1a1a;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-content h2 {
  margin: 0 0 1.5rem;
  color: rgba(255, 255, 255, 0.87);
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.87);
  font-size: 1rem;
  transition: border-color 0.25s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #646cff;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.modal-actions button {
  padding: 0.6em 1.2em;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.25s, transform 0.2s;
}

.modal-actions button[type="submit"] {
  background-color: #646cff;
  color: white;
  border: 1px solid transparent;
}

.modal-actions button[type="submit"]:hover {
  border-color: #535bf2;
  transform: translateY(-2px);
}

.modal-actions button[type="button"] {
  background-color: #1a1a1a;
  color: rgba(255, 255, 255, 0.87);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-actions button[type="button"]:hover {
  border-color: #646cff;
  transform: translateY(-2px);
}

.loading-spinner {
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid #646cff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.invite-button {
  background-color: #2ecc71;
  color: white;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.25s, transform 0.2s;
}

.invite-button:hover {
  border-color: #27ae60;
  transform: translateY(-2px);
}

.invite-link-box {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  background: rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  border-radius: 8px;
}

.invite-link-input {
  flex: 1;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
}

.copy-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-button:hover {
  background: var(--accent-color-dark);
}

.copy-button.success {
  background: #10B981;
}

.copy-button i {
  font-size: 1rem;
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
  margin: 0;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
}

.cancel-button {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

.modal {
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

.task-detail-modal .modal-content {
  max-width: 1000px;
  width: 95%;
  max-height: 85vh;
  padding: 0;
  border-radius: 12px;
  overflow: hidden;
  background: #1e1e1e;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}

.task-detail-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  height: 100%;
  max-height: 85vh;
}

.task-main-content {
  padding: 32px;
  overflow-y: auto;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.task-sidebar {
  padding: 24px;
  background: rgba(0, 0, 0, 0.2);
  overflow-y: auto;
}

.task-title-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
  padding-right: 40px;
}

.task-title-section h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.3;
}

.priority-badge {
  align-self: flex-start;
  padding: 4px 12px;
  font-size: 0.85rem;
  font-weight: 500;
  border-radius: 12px;
}

.description-content {
  background: rgba(0, 0, 0, 0.2);
  padding: 20px;
  border-radius: 12px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.87);
  min-height: 100px;
  font-size: 1rem;
}

.detail-section {
  margin-bottom: 28px;
}

.detail-section h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 12px;
  font-weight: 600;
}

.status-display {
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  min-width: 120px;
  justify-content: center;
  font-size: 0.9rem;
}

.status-pending {
  background: rgba(255, 170, 0, 0.15);
  color: #ffaa00;
}

.status-in_progress {
  background: rgba(45, 136, 255, 0.15);
  color: #2d88ff;
}

.status-completed {
  background: rgba(50, 205, 50, 0.15);
  color: #32cd32;
}

.assignment-section {
  background: rgba(0, 0, 0, 0.15);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.current-assignee {
  margin-bottom: 16px;
}

.assignee-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.select-assignee {
  width: 100%;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.87);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-assignee:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.4);
}

.select-assignee:focus {
  outline: none;
  border-color: #646cff;
  box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.2);
}

.select-assignee option {
  background: #1e1e1e;
  color: rgba(255, 255, 255, 0.87);
  padding: 8px;
}

.task-details-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(0, 0, 0, 0.15);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
}

.value {
  color: rgba(255, 255, 255, 0.87);
  font-size: 0.95rem;
}

.close-button {
  position: absolute;
  top: 24px;
  right: 24px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.2rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.87);
}

@media (max-width: 768px) {
  .task-detail-modal .modal-content {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .task-detail-layout {
    grid-template-columns: 1fr;
    max-height: 100vh;
  }
  
  .task-main-content {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 24px;
  }

  .task-sidebar {
    padding: 24px;
  }

  .task-title-section {
    padding-right: 0;
    margin-bottom: 24px;
  }

  .close-button {
    top: 16px;
    right: 16px;
  }
}
</style>
