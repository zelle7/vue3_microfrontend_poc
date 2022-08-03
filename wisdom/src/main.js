import { createApp } from 'vue'
import App from './App.vue'

import './assets/main.css'

window.renderwisdom = (containerId) => {
    createApp(App).mount(containerId)
};
