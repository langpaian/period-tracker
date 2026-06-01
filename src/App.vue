<template>
  <div id="app">
    <header class="header" v-if="showHeader">
      <h1 class="header-title">{{ title }}</h1>
    </header>
    
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <nav class="tab-bar" v-if="showTabBar">
      <router-link to="/" class="tab-item">
        <span class="tab-icon">📅</span>
        <span>日历</span>
      </router-link>
      <router-link to="/record" class="tab-item">
        <span class="tab-icon">✏️</span>
        <span>记录</span>
      </router-link>
      <router-link to="/stats" class="tab-item">
        <span class="tab-icon">📊</span>
        <span>统计</span>
      </router-link>
      <router-link to="/settings" class="tab-item">
        <span class="tab-icon">⚙️</span>
        <span>设置</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const showTabBar = computed(() => true)
const showHeader = computed(() => true)

const title = computed(() => {
  const titles = {
    '/': '经期助手',
    '/record': '记录经期',
    '/stats': '数据统计',
    '/settings': '设置'
  }
  return titles[route.path] || '经期助手'
})
</script>

<style scoped>
.main-content {
  flex: 1;
  padding-bottom: 70px;
}
</style>