import { createApp } from 'vue'
import App from './App.vue'

import './assets/main.css'

window.renderdiceroll = (containerId) => {
    console.log("mountDiceroll", containerId);
    createApp(App).mount(containerId)
};

//verify do we also have a thing like unmount?



