import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';
import axios from 'axios';

import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';

import 'primevue/resources/themes/lara-light-blue/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import './assets/styles/global.css';

// Configurar interceptor de axios para el token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(PrimeVue);
app.use(ToastService);

app.component('Button', Button);
app.component('InputText', InputText);
app.component('Password', Password);
app.component('Toast', Toast);

// Initialize auth store
const authStore = useAuthStore();
authStore.initializeAuth();

app.mount('#app');
