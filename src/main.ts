import { createApp } from 'vue'
import 'normalize.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router/index.ts'
import './assets/style/index.less'
const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')
