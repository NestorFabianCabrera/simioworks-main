<template>
  <div class="groups-container">
    <div class="header">
      <h1>Mis Grupos</h1>
      <button @click="showCreateModal = true" class="create-button">
        <i class="fas fa-plus"></i>
        Crear Grupo
      </button>
    </div>

    <div v-if="loading" class="loading">
      <p>Cargando grupos...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>
    
    <div v-else-if="!groupStore.groups.length" class="no-groups">
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <h2>No tienes grupos</h2>
        <p>Crea un grupo para empezar a colaborar</p>
        <button @click="showCreateModal = true" class="create-button">
          <i class="fas fa-plus"></i>
          Crear Grupo
        </button>
      </div>
    </div>
    
    <div v-else class="groups-grid">
      <div 
        v-for="group in groupStore.groups" 
        :key="group._id" 
        class="group-card"
        @click="router.push(`/groups/${group._id}`)"
      >
        <div class="group-avatar">
          <i v-if="!group.avatar" class="fas fa-users"></i>
          <img v-else :src="group.avatar" :alt="group.title">
        </div>
        <div class="group-info">
          <h3>{{ group.title }}</h3>
          <p>{{ group.description }}</p>
        </div>
        <div class="group-meta">
          <span class="members-count">
            <i class="fas fa-user"></i>
            {{ group.members.length }} miembro{{ group.members.length !== 1 ? 's' : '' }}
          </span>
          <span class="tasks-count" v-if="group.tasks">
            <i class="fas fa-tasks"></i>
            {{ group.tasks.length }} tarea{{ group.tasks.length !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Modal de creación -->
    <div v-if="showCreateModal" class="modal">
      <div class="modal-content">
        <h2>Crear Nuevo Grupo</h2>
        <form @submit.prevent="createGroup">
          <div class="form-group">
            <label for="title">Título</label>
            <input
              id="title"
              v-model="newGroup.title"
              type="text"
              required
              placeholder="Nombre del grupo"
            >
          </div>
          <div class="form-group">
            <label for="description">Descripción</label>
            <textarea
              id="description"
              v-model="newGroup.description"
              required
              placeholder="Describe el propósito del grupo"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showCreateModal = false">
              Cancelar
            </button>
            <button type="submit">Crear Grupo</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGroupStore } from '../../stores/groups';

const router = useRouter();
const groupStore = useGroupStore();
const loading = ref(true);
const error = ref('');
const showCreateModal = ref(false);
const newGroup = ref({
  title: '',
  description: ''
});

onMounted(async () => {
  try {
    loading.value = true;
    error.value = '';
    await groupStore.fetchGroups();
  } catch (err: any) {
    error.value = err.message || 'Error al cargar los grupos';
  } finally {
    loading.value = false;
  }
});

const createGroup = async () => {
  if (!newGroup.value.title || !newGroup.value.description) return;
  
  try {
    await groupStore.createGroup(
      newGroup.value.title,
      newGroup.value.description
    );
    showCreateModal.value = false;
    newGroup.value = {
      title: '',
      description: ''
    };
  } catch (err: any) {
    console.error('Error al crear el grupo:', err);
  }
};
</script>

<style scoped>
.groups-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
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

.header h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--text-primary);
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

.loading, .error, .no-groups {
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin: 2rem 0;
}

.error {
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.empty-state i {
  font-size: 3rem;
  color: var(--text-secondary);
}

.empty-state h2 {
  margin: 0;
  color: var(--text-primary);
}

.empty-state p {
  margin: 0;
  color: var(--text-secondary);
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.group-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.group-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.08);
}

.group-avatar {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-hover) 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.group-avatar i {
  font-size: 1.5rem;
  color: white;
}

.group-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
}

.group-info {
  flex: 1;
}

.group-info h3 {
  margin: 0 0 0.5rem;
  color: var(--text-primary);
  font-size: 1.25rem;
}

.group-info p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.group-meta {
  display: flex;
  gap: 1rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.members-count, .tasks-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.members-count i, .tasks-count i {
  font-size: 0.875rem;
}

.modal {
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
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-content h2 {
  margin: 0 0 1.5rem;
  color: var(--text-primary);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 1rem;
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
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-actions button[type="button"] {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.modal-actions button[type="submit"] {
  background: var(--accent-color);
  color: white;
}

.modal-actions button:hover {
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .groups-container {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    padding: 1.5rem;
  }

  .create-button {
    width: 100%;
    justify-content: center;
  }

  .modal-content {
    margin: 1rem;
    padding: 1.5rem;
  }
}
</style>
