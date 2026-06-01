<template>
  <div class="settings-page">
    <div class="card">
      <h2 class="section-title">常规设置</h2>
      
      <div class="form-group">
        <label class="form-label">平均周期长度</label>
        <div class="range-input">
          <input 
            type="range" 
            min="21" 
            max="35" 
            v-model.number="settings.averageCycle"
            @change="saveSettings"
          />
          <span class="range-value">{{ settings.averageCycle }} 天</span>
        </div>
        <p class="form-hint">用于预测下次经期（默认28天）</p>
      </div>
      
      <div class="form-group">
        <label class="form-label">平均经期长度</label>
        <div class="range-input">
          <input 
            type="range" 
            min="3" 
            max="10" 
            v-model.number="settings.averagePeriodDays"
            @change="saveSettings"
          />
          <span class="range-value">{{ settings.averagePeriodDays }} 天</span>
        </div>
        <p class="form-hint">用于预测经期持续时间</p>
      </div>
    </div>
    
    <div class="card">
      <h2 class="section-title">提醒设置</h2>
      
      <div class="form-group">
        <label class="form-label">提前提醒天数</label>
        <div class="range-input">
          <input 
            type="range" 
            min="0" 
            max="7" 
            v-model.number="settings.reminderDays"
            @change="saveSettings"
          />
          <span class="range-value">{{ settings.reminderDays }} 天前</span>
        </div>
        <p class="form-hint">在预计经期开始前提醒</p>
      </div>
    </div>
    
    <div class="card">
      <h2 class="section-title">数据管理</h2>
      
      <div class="data-actions">
        <button class="btn btn-outline" @click="exportData">
          导出数据
        </button>
        <button class="btn btn-outline" @click="clearData">
          清空数据
        </button>
      </div>
      <p class="form-hint mt-sm">
        导出数据将保存为 JSON 文件，方便备份
      </p>
    </div>
    
    <div class="card mt-lg">
      <h2 class="section-title">关于</h2>
      <div class="about-info">
        <p><strong>经期助手</strong></p>
        <p class="text-light">版本 1.0.0</p>
        <p class="text-light mt-sm">帮助您追踪和管理经期</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
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
  a.download = `period-tracker-export-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function clearData() {
  if (confirm('确定要清空所有经期记录吗？此操作不可恢复。')) {
    store.periods.splice(0, store.periods.length)
    store.saveData()
  }
}
</script>

<style scoped>
.settings-page {
  padding: var(--spacing-md);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--primary);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
}

.form-hint {
  font-size: 12px;
  color: var(--text-light);
  margin-top: var(--spacing-xs);
}

.range-input {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.range-input input[type="range"] {
  flex: 1;
  height: 4px;
  appearance: none;
  background: var(--border);
  border-radius: 2px;
  outline: none;
}

.range-input input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
}

.range-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary);
  min-width: 60px;
  text-align: right;
}

.data-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.data-actions .btn {
  flex: 1;
}

.about-info {
  text-align: center;
}
</style>