<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { RouterView } from 'vue-router';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

onMounted(() => {
  authStore.initializeAuth();
});
</script>

<template>
  <div class="app-container">
    <nav v-if="authStore.token" class="navbar">
      <div class="navbar-content">
        <router-link to="/" class="brand">
          <i class="fas fa-code-branch"></i>
          <span>SimioWorks</span>
        </router-link>
        
        <div class="nav-links">
          <router-link to="/dashboard" class="nav-link">
            <i class="fas fa-home"></i>
            <span>Dashboard</span>
          </router-link>
          <router-link to="/groups" class="nav-link">
            <i class="fas fa-users"></i>
            <span>Grupos</span>
          </router-link>
          <router-link to="/profile" class="nav-link">
            <i class="fas fa-user"></i>
            <span>Perfil</span>
          </router-link>
          <button @click="handleLogout" class="nav-link logout">
            <i class="fas fa-sign-out-alt"></i>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </nav>
    
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style>
:root {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2c2c2c;
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --accent-color: #3498db;
  --border-color: #404040;
}

body {
  margin: 0;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.app-container {
  min-height: 100vh;
  padding-top: 80px;
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
  background: rgba(26, 26, 26, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.navbar-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 1.25rem;
}

.brand i {
  font-size: 1.5rem;
  color: var(--accent-color);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 500;
  border-radius: 9999px;
  transition: all 0.3s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.1);
}

.nav-link i {
  font-size: 1.1rem;
}

.logout {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.logout:hover {
  color: #e74c3c;
}

@media (max-width: 768px) {
  .navbar-content {
    padding: 0 1rem;
  }

  .nav-link span {
    display: none;
  }

  .nav-link {
    padding: 0.5rem;
  }

  .brand span {
    display: none;
  }
}

input, textarea, select {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.5rem;
  border-radius: 4px;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--accent-color);
}

button {
  background-color: var(--accent-color);
  color: var(--text-primary);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.3s;
}

button:hover {
  opacity: 0.9;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
}

table {
  background-color: var(--bg-secondary);
  border-collapse: collapse;
  width: 100%;
}

th, td {
  border: 1px solid var(--border-color);
  padding: 0.75rem;
  text-align: left;
}

th {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

tr:nth-child(even) {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
