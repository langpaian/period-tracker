<template>
  <div id="app">
    <!-- Header -->
    <header class="header" v-if="showHeader">
      <h1 class="header-title">{{ title }}</h1>
      <p class="header-subtitle" v-if="subtitle">{{ subtitle }}</p>
    </header>
    
    <!-- Main Content -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <!-- Tab Bar -->
    <nav class="tab-bar" v-if="showTabBar">
      <router-link to="/" class="tab-item">
        <span class="tab-icon">📅</span>
        <span class="tab-label">日历</span>
      </router-link>
      <router-link to="/record" class="tab-item">
        <span class="tab-icon">✏️</span>
        <span class="tab-label">记录</span>
      </router-link>
      <router-link to="/stats" class="tab-item">
        <span class="tab-icon">📊</span>
        <span class="tab-label">统计</span>
      </router-link>
      <router-link to="/settings" class="tab-item">
        <span class="tab-icon">⚙️</span>
        <span class="tab-label">设置</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePeriodStore } from './stores/period'

const route = useRoute()
const router = useRouter()
const store = usePeriodStore()

// Check onboarding on mount
onMounted(() => {
  store.loadData()
  if (!store.hasCompletedOnboarding && route.path !== '/onboarding') {
    router.replace('/onboarding')
  }
})

const showTabBar = computed(() => true)
const showHeader = computed(() => false)

const title = computed(() => {
  const titles = {
    '/': '经期助手',
    '/record': '记录',
    '/stats': '统计',
    '/settings': '设置'
  }
  return titles[route.path] || '经期助手'
})

const subtitle = computed(() => {
  const subtitles = {
    '/': '',
    '/record': '记录您的经期',
    '/stats': '数据分析',
    '/settings': '应用设置'
  }
  return subtitles[route.path] || ''
})
</script>

<style scoped>
.main-content {
  flex: 1;
  padding-bottom: calc(var(--tab-bar-height) + var(--space-md));
  min-height: 100vh;
}
</style>