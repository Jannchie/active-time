import { createApp } from 'vue';
import App from './App.vue';
import './assets/app.css';
import { i18n } from './i18n';

const app = createApp(App);

app.use(i18n);

const mountApp = async () => {
  const { default: ui } = await import('@nuxt/ui/vue-plugin');
  app.use(ui);
  app.mount('#app');
};

void mountApp();
