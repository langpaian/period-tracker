<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="page-header">
      <h2 class="page-title">设置</h2>
      <p class="page-subtitle">自定义您的经期追踪体验</p>
    </div>

    <!-- Cycle Settings Card -->
    <div class="card">
      <h3 class="section-title">
        <span class="section-icon">📅</span>
        周期设置
      </h3>
      
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">平均周期长度</div>
          <div class="setting-desc">用于预测下次经期</div>
        </div>
        <div class="setting-control">
          <div class="slider-container">
            <input 
              type="range" 
              min="21" 
              max="35" 
              v-model.number="settings.averageCycle"
              @change="saveSettings"
              class="slider"
            />
            <span class="slider-value">{{ settings.averageCycle }} 天</span>
          </div>
        </div>
      </div>
      
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">平均经期长度</div>
          <div class="setting-desc">经期持续的典型天数</div>
        </div>
        <div class="setting-control">
          <div class="slider-container">
            <input 
              type="range" 
              min="3" 
              max="10" 
              v-model.number="settings.averagePeriodDays"
              @change="saveSettings"
              class="slider"
            />
            <span class="slider-value">{{ settings.averagePeriodDays }} 天</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Reminder Settings Card -->
    <div class="card">
      <h3 class="section-title">
        <span class="section-icon">🔔</span>
        提醒设置
      </h3>
      
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">提前提醒</div>
          <div class="setting-desc">在预计经期前提醒</div>
        </div>
        <div class="setting-control">
          <div class="slider-container">
            <input 
              type="range" 
              min="0" 
              max="7" 
              v-model.number="settings.reminderDays"
              @change="saveSettings"
              class="slider"
            />
            <span class="slider-value">{{ settings.reminderDays === 0 ? '关闭' : settings.reminderDays + '天前' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Management Card -->
    <div class="card">
      <h3 class="section-title">
        <span class="section-icon">💾</span>
        数据管理
      </h3>
      
      <div class="data-info">
        <div class="data-stat">
          <span class="data-number">{{ store.periods.length }}</span>
          <span class="data-label">条记录</span>
        </div>
      </div>
      
      <div class="data-buttons">
        <button class="btn btn-outline btn-block" @click="exportData">
          <span class="btn-icon">📤</span>
          导出数据
        </button>
        <button class="btn btn-outline btn-block danger" @click="clearData">
          <span class="btn-icon">🗑️</span>
          清空数据
        </button>
      </div>
      
      <p class="data-hint">
        导出数据将保存为 JSON 文件，方便备份和迁移
      </p>
    </div>

    <!-- About Card -->
    <div class="card about-card">
      <div class="about-logo">🌸</div>
      <h3 class="about-title">经期助手</h3>
      <p class="about-version">版本 1.1.0</p>
      <p class="about-desc">帮助女性追踪和管理经期，健康生活</p>
      
      <div class="about-features">
        <div class="feature-item">
          <span class="feature-icon">📅</span>
          <span>日历视图</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🔮</span>
          <span>智能预测</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📊</span>
          <span>统计分析</span>
        </div>
      </div>
    </div>

    <!-- Tips Card -->
    <div class="card tips-card">
      <h3 class="tips-title">💡 使用建议</h3>
      <ul class="tips-list">
        <li>坚持记录，获取更准确的预测</li>
        <li>经期注意保暖，多喝热水</li>
        <li>适量运动可缓解不适</li>
        <li>保持心情愉悦很重要</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { usePeriodStore } from '../stores/period'

const store = usePeriodStore()

const settings = reactive({ ...store.settings })

function saveSettings() {
  Object.assign(store.settings, settings)
  store.saveData()
}

function exportData() {
  const data = {
    periods: store.periods,
    settings: store.settings,
    exportedAt: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `period-tracker-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function clearData() {
  if (confirm('确定要清空所有经期记录吗？此操作不可恢复。')) {
    if (confirm('真的确定吗？所有数据将被永久删除！')) {
      store.periods.splice(0, store.periods.length)
      store.saveData()
    }
  }
}

onMounted(() => {
  Object.assign(settings, store.settings)
})
</script>

<style scoped>
.settings-page {
  padding: var(--space-md);
  padding-bottom: calc(var(--tab-bar-height) + var(--space-lg));
}

/* Page Header */
.page-header {
  text-align: center;
  margin-bottom: var(--space-lg);
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--primary-dark);
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: var(--space-xs);
}

/* Section Title */
.section-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--primary-dark);
  margin-bottom: var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.section-icon {
  font-size: 18px;
}

/* Setting Item */
.setting-item {
  margin-bottom: var(--space-xl);
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-info {
  margin-bottom: var(--space-md);
}

.setting-label {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.setting-desc {
  font-size: var(--font-size-sm);
  color: var(--text-light);
  margin-top: 2px;
}

/* Slider */
.slider-container {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.slider {
  flex: 1;
  height: 8px;
  -webkit-appearance: none;
  background: var(--border);
  border-radius: var(--radius-full);
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(232, 164, 196, 0.4);
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.slider-value {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--primary);
  min-width: 70px;
  text-align: right;
}

/* Data Info */
.data-info {
  text-align: center;
  padding: var(--space-lg);
  background: var(--primary-subtle);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
}

.data-stat {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--space-xs);
}

.data-number {
  font-size: 32px;
  font-weight: 800;
  color: var(--primary-dark);
}

.data-label {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
}

/* Data Buttons */
.data-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);
}

.btn-icon {
  margin-right: var(--space-xs);
}

.btn.danger {
  border-color: #E8A4A4;
  color: #C05050;
}

.btn.danger:hover {
  background: #E8A4A4;
  color: var(--text-white);
}

.data-hint {
  font-size: var(--font-size-xs);
  color: var(--text-light);
  text-align: center;
}

/* About Card */
.about-card {
  text-align: center;
  background: linear-gradient(135deg, var(--primary-subtle) 0%, var(--accent-light) 100%);
}

.about-logo {
  font-size: 48px;
  margin-bottom: var(--space-sm);
}

.about-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: var(--space-xs);
}

.about-version {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.about-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-lg);
}

.about-features {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  padding: var(--space-xs) var(--space-md);
  background: var(--bg-card);
  border-radius: var(--radius-full);
}

.feature-icon {
  font-size: 14px;
}

/* Tips Card */
.tips-card {
  background: var(--primary-subtle);
}

.tips-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--primary-dark);
  margin-bottom: var(--space-md);
  text-align: center;
}

.tips-list {
  list-style: none;
  padding: 0;
}

.tips-list li {
  padding: var(--space-sm) 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  border-bottom: 1px dashed var(--border);
  padding-left: var(--space-md);
  position: relative;
}

.tips-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--primary);
}

.tips-list li:first-child {
  border-top: none;
}

.tips-list li:last-child {
  border-bottom: none;
}

@media (max-width: 400px) {
  .data-buttons {
    grid-template-columns: 1fr;
  }
}
</style>