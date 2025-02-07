<template>
  <div class="auth-container">
    <div class="auth-content">
      <div class="brand">
        <div class="logo-container">
          <div class="logo">
            <i class="fas fa-code-branch"></i>
          </div>
          <h1>SimioWorks</h1>
        </div>
      </div>
      
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="error" class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          {{ error }}
        </div>

        <div class="form-group">
          <div class="input-group">
            <i class="fas fa-user"></i>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              required
              placeholder="Nombre de usuario"
              :disabled="loading"
              autocomplete="username"
            >
          </div>
        </div>

        <div class="form-group">
          <div class="input-group">
            <i class="fas fa-envelope"></i>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              placeholder="Email"
              :disabled="loading"
              autocomplete="email"
            >
          </div>
        </div>

        <div class="form-group">
          <div class="input-group">
            <i class="fas fa-lock"></i>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              placeholder="Contraseña"
              :disabled="loading"
              autocomplete="new-password"
            >
          </div>
        </div>

        <div class="form-group">
          <div class="input-group">
            <i class="fas fa-lock"></i>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              required
              placeholder="Confirmar contraseña"
              :disabled="loading"
              autocomplete="new-password"
            >
          </div>
        </div>

        <button type="submit" :disabled="loading" class="auth-button">
          <i class="fas fa-user-plus"></i>
          <span>{{ loading ? 'Registrando...' : 'Crear Cuenta' }}</span>
        </button>

        <div class="form-footer">
          <p>¿Ya tienes cuenta? <router-link to="/login">Inicia sesión aquí</router-link></p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const formData = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
});

const loading = ref(false);
const error = ref('');

const handleSubmit = async () => {
  if (!formData.value.username || !formData.value.email || !formData.value.password) {
    error.value = 'Todos los campos son requeridos';
    return;
  }

  if (formData.value.password !== formData.value.confirmPassword) {
    error.value = 'Las contraseñas no coinciden';
    return;
  }

  try {
    loading.value = true;
    error.value = '';
    await authStore.register({
      username: formData.value.username,
      email: formData.value.email,
      password: formData.value.password
    });
    router.push('/login');
  } catch (err: any) {
    error.value = err.message || 'Error al registrar usuario';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: hidden;
}

.auth-content {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
}

.brand {
  text-align: center;
  margin-bottom: 3rem;
}

.brand h1 {
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.logo {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(52, 152, 219, 0.2);
  flex-shrink: 0;
}

.logo i {
  font-size: 2rem;
  color: white;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.input-group {
  position: relative;
}

.input-group i {
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 1rem;
  pointer-events: none;
}

.input-group input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.input-group input::placeholder {
  color: #94a3b8;
}

.input-group input:focus {
  background: rgba(255, 255, 255, 0.1);
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.input-group input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-button {
  background: #3498db;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
}

.auth-button:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(52, 152, 219, 0.3);
}

.auth-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid #e74c3c;
  color: #e74c3c;
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-footer {
  text-align: center;
  margin-top: 1rem;
}

.form-footer p {
  color: #94a3b8;
  font-size: 0.9rem;
  margin: 0;
}

.form-footer a {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.form-footer a:hover {
  color: #2980b9;
}
</style>
