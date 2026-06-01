import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Record from './views/Record.vue'
import Stats from './views/Stats.vue'
import Settings from './views/Settings.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/record', name: 'Record', component: Record },
  { path: '/record/:id?', name: 'RecordEdit', component: Record },
  { path: '/stats', name: 'Stats', component: Stats },
  { path: '/settings', name: 'Settings', component: Settings }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router