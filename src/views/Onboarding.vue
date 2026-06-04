<template>
  <div class="onboarding">
    <div class="onboarding-content">
      <div class="onboarding-icon">💕</div>
      <h1>欢迎使用经期助手</h1>
      <p>让我先了解一下你的基本情况</p>
      
      <div class="form-group">
        <label>你的昵称（可选）</label>
        <input 
          type="text" 
          class="input"
          v-model="userName"
          placeholder="怎么称呼你？"
        />
      </div>
      
      <div class="form-group">
        <label>你的平均经期长度是？</label>
        <div class="slider-container">
          <input 
            type="range" 
            v-model.number="averagePeriodDays"
            min="3"
            max="10"
            class="slider"
          />
          <div class="slider-value">{{ averagePeriodDays }} 天</div>
        </div>
        <p class="hint">大多数女性的经期在 3-7 天</p>
      </div>
      
      <div class="form-group">
        <label>你的平均月经周期是？</label>
        <div class="slider-container">
          <input 
            type="range" 
            v-model.number="averageCycle"
            min="21"
            max="35"
            class="slider"
          />
          <div class="slider-value">{{ averageCycle }} 天</div>
        </div>
        <p class="hint">大多数女性的周期在 21-35 天，28天最常见</p>
      </div>
      
      <button class="btn-primary" @click="completeSetup">
        开始使用 💕
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePeriodStore } from '../stores/period'

const router = useRouter()
const store = usePeriodStore()

const userName = ref('')
const averagePeriodDays = ref(store.settings.averagePeriodDays)
const averageCycle = ref(store.settings.averageCycle)

function completeSetup() {
  // Save settings
  store.settings.averagePeriodDays = averagePeriodDays.value
  store.settings.averageCycle = averageCycle.value
  store.saveData()
  
  // Mark onboarding complete with username
  store.completeOnboarding(userName.value || '小主')
  
  // Go to home
  router.push('/')
}
</script>

<style scoped>
.onboarding {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  background: var(--bg-color);
}

.onboarding-content {
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.onboarding-icon {
  font-size: 64px;
  margin-bottom: var(--space-lg);
}

h1 {
  color: var(--primary-color);
  margin-bottom: var(--space-sm);
}

p {
  color: var(--text-secondary);
  margin-bottom: var(--space-xl);
}

.form-group {
  margin-bottom: var(--space-xl);
  text-align: left;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: var(--space-md);
  color: var(--text-color);
}

.slider-container {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.slider {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: var(--secondary-color);
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(255, 107, 129, 0.3);
}

.slider-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
  min-width: 60px;
  text-align: right;
}

.hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: var(--space-sm);
  margin-bottom: 0;
}

.btn-primary {
  width: 100%;
  padding: var(--space-md);
  font-size: 16px;
  font-weight: 600;
  color: white;
  background: var(--primary-color);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}

.btn-primary:active {
  transform: scale(0.98);
}
</style>