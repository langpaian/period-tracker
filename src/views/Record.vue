<template>
  <div class="record-page">
    <!-- Header -->
    <div class="page-header">
      <h2 class="page-title">{{ editId ? '编辑记录' : '记录经期' }}</h2>
      <p class="page-subtitle">选择日期并添加详细信息</p>
    </div>

    <!-- Main Form Card -->
    <div class="card">
      <!-- Date Inputs -->
      <div class="form-section">
        <h3 class="form-section-title">
          <span class="section-icon">📅</span>
          日期
        </h3>
        
        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">开始日期</label>
            <input 
              type="date" 
              class="input date-input"
              v-model="form.startDate"
            />
          </div>
          
          <div class="form-group flex-1">
            <label class="form-label">结束日期</label>
            <input 
              type="date" 
              class="input date-input"
              v-model="form.endDate"
            />
          </div>
        </div>
        
        <div class="duration-display" v-if="form.startDate && form.endDate">
          <span class="duration-badge">
            持续 {{ periodDuration }} 天
          </span>
        </div>
      </div>

      <!-- Flow Amount -->
      <div class="form-section">
        <h3 class="form-section-title">
          <span class="section-icon">🩸</span>
          流量
        </h3>
        
        <div class="flow-options">
          <button 
            v-for="option in flowOptions" 
            :key="option.value"
            class="flow-btn"
            :class="{ 
              active: form.flowAmount === option.value,
              light: option.value === 'light',
              medium: option.value === 'medium',
              heavy: option.value === 'heavy'
            }"
            @click="form.flowAmount = option.value"
          >
            <span class="flow-icon">{{ option.icon }}</span>
            <span class="flow-label">{{ option.label }}</span>
            <span class="flow-desc">{{ option.desc }}</span>
          </button>
        </div>
      </div>

      <!-- Symptoms -->
      <div class="form-section">
        <h3 class="form-section-title">
          <span class="section-icon">🤒</span>
          症状 <span class="section-optional">(可选)</span>
        </h3>
        
        <div class="symptom-chips">
          <button 
            v-for="symptom in symptomOptions"
            :key="symptom"
            class="chip"
            :class="{ active: form.symptoms.includes(symptom) }"
            @click="toggleSymptom(symptom)"
          >
            {{ symptom }}
          </button>
        </div>
      </div>

      <!-- Notes -->
      <div class="form-section">
        <h3 class="form-section-title">
          <span class="section-icon">📝</span>
          备注 <span class="section-optional">(可选)</span>
        </h3>
        
        <textarea 
          class="textarea note-textarea"
          v-model="form.notes"
          placeholder="添加备注..."
        ></textarea>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button 
        class="btn btn-primary btn-block btn-lg" 
        @click="saveRecord" 
        :disabled="!canSave"
      >
        <span class="btn-icon">✨</span>
        {{ editId ? '更新记录' : '保存记录' }}
      </button>
      
      <button 
        v-if="editId" 
        class="btn btn-outline btn-block mt-md" 
        @click="deleteRecord"
      >
        <span class="btn-icon">🗑️</span>
        删除记录
      </button>
    </div>

    <!-- Recent Records -->
    <div class="card" v-if="recentRecords.length > 0">
      <h3 class="section-title">
        <span class="section-icon">📋</span>
        最近记录
      </h3>
      
      <div class="records-list">
        <div 
          v-for="record in recentRecords" 
          :key="record.id"
          class="record-item"
          @click="editRecord(record)"
        >
          <div class="record-dates">
            <span class="date-badge">{{ formatDateRange(record.startDate, record.endDate) }}</span>
            <span v-if="record.flowAmount" class="flow-badge" :class="record.flowAmount">
              {{ getFlowLabel(record.flowAmount) }}
            </span>
          </div>
          <div class="record-symptoms" v-if="record.symptoms?.length">
            <span 
              v-for="symptom in record.symptoms.slice(0, 3)" 
              :key="symptom"
              class="symptom-mini"
            >
              {{ symptom }}
            </span>
            <span v-if="record.symptoms.length > 3" class="symptom-more">
              +{{ record.symptoms.length - 3 }}
            </span>
          </div>
          <div class="record-arrow">›</div>
        </div>
      </div>
    </div>

    <!-- Tips Card -->
    <div class="card tips-card">
      <h3 class="tips-title">💡 小贴士</h3>
      <p class="tips-text">定期记录可以帮助更准确地预测经期，建议持续记录3个月以上。</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePeriodStore } from '../stores/period'

const router = useRouter()
const route = useRoute()
const store = usePeriodStore()

// Form data
const form = ref({
  startDate: '',
  endDate: '',
  flowAmount: 'medium',
  symptoms: [],
  notes: ''
})

// Edit mode
const editId = ref(null)

// Options
const flowOptions = [
  { value: 'light', label: '较少', icon: '💧', desc: '点滴出血' },
  { value: 'medium', label: '中等', icon: '🩸', desc: '正常量' },
  { value: 'heavy', label: '较多', icon: '🩸', desc: '大量' }
]

const symptomOptions = [
  '腹痛', '腰痛', '头痛', '乳房胀痛', '情绪波动', '疲劳', '恶心', '痘痘', '腹胀', '乏力', '失眠', '食欲变化'
]

// Duration calculation
const periodDuration = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return 0
  const start = new Date(form.value.startDate)
  const end = new Date(form.value.endDate)
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
  return diff > 0 ? diff : 1
})

// Can save
const canSave = computed(() => {
  return form.value.startDate && form.value.endDate
})

// Recent records
const recentRecords = computed(() => {
  return store.periods
    .slice()
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
    .filter(r => r.id !== editId.value)
    .slice(0, 5)
})

// Simple "quick add" mode - end date auto-filled
const useSimpleMode = ref(true)

// Watch for start date changes in simple mode
watch(() => form.value.startDate, () => {
  if (useSimpleMode.value && form.value.startDate) {
    form.value.endDate = store.calculateEndDate(
      form.value.startDate, 
      store.settings.averagePeriodDays
    )
  }
})

// Toggle symptom
function toggleSymptom(symptom) {
  const idx = form.value.symptoms.indexOf(symptom)
  if (idx > -1) {
    form.value.symptoms.splice(idx, 1)
  } else {
    form.value.symptoms.push(symptom)
  }
}

// Save record
function saveRecord() {
  if (!canSave.value) return
  
  if (editId.value) {
    store.updatePeriod(editId.value, form.value)
  } else {
    store.addPeriod(
      form.value.startDate,
      form.value.endDate,
      form.value.symptoms,
      form.value.flowAmount,
      form.value.notes
    )
  }
  
  router.push('/')
}

// Delete record
function deleteRecord() {
  if (editId.value) {
    store.deletePeriod(editId.value)
    router.push('/')
  }
}

// Edit existing record
function editRecord(record) {
  editId.value = record.id
  form.value = {
    startDate: record.startDate,
    endDate: record.endDate,
    flowAmount: record.flowAmount || 'medium',
    symptoms: [...(record.symptoms || [])],
    notes: record.notes || ''
  }
  
  // Scroll to top
  window.scrollTo(0, 0)
}

// Format helpers
function formatDateRange(start, end) {
  const s = new Date(start)
  const e = new Date(end)
  const sStr = `${s.getMonth() + 1}/${s.getDate()}`
  const eStr = `${e.getMonth() + 1}/${e.getDate()}`
  return start === end ? sStr : `${sStr}-${eStr}`
}

function getFlowLabel(flow) {
  const labels = { light: '少', medium: '中', heavy: '多' }
  return labels[flow] || flow
}

// Initialize
onMounted(() => {
  const dateParam = route.query.date
  if (dateParam) {
    form.value.startDate = dateParam
    form.value.endDate = dateParam
  } else {
    const today = new Date().toISOString().split('T')[0]
    form.value.startDate = today
    form.value.endDate = today
  }
})
</script>

<style scoped>
.record-page {
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

/* Form Section */
.form-section {
  margin-bottom: var(--space-xl);
}

.form-section-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.section-icon {
  font-size: 18px;
}

.section-optional {
  font-size: var(--font-size-sm);
  font-weight: 400;
  color: var(--text-light);
}

/* Form Row */
.form-row {
  display: flex;
  gap: var(--space-md);
}

.form-group {
  margin-bottom: var(--space-md);
}

.form-group.flex-1 {
  flex: 1;
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.date-input {
  padding: var(--space-md);
  font-size: var(--font-size-md);
}

/* Duration Badge */
.duration-display {
  text-align: center;
  margin-top: var(--space-sm);
}

.duration-badge {
  display: inline-block;
  padding: var(--space-xs) var(--space-md);
  background: var(--primary-subtle);
  color: var(--primary-dark);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

/* Flow Options */
.flow-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
}

.flow-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-md) var(--space-sm);
  border: 2px solid var(--border);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.flow-btn.active {
  border-color: var(--primary);
  background: var(--primary-subtle);
}

.flow-btn.light.active {
  border-color: #8ECDA8;
  background: rgba(142, 205, 168, 0.2);
}

.flow-btn.medium.active {
  border-color: var(--primary);
  background: var(--primary-subtle);
}

.flow-btn.heavy.active {
  border-color: #E8A4A4;
  background: rgba(232, 164, 164, 0.2);
}

.flow-icon {
  font-size: 24px;
  margin-bottom: var(--space-xs);
}

.flow-label {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.flow-desc {
  font-size: var(--font-size-xs);
  color: var(--text-light);
}

/* Symptom Chips */
.symptom-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.chip {
  padding: var(--space-sm) var(--space-md);
  border: 2px solid var(--border);
  background: var(--bg-card);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--text-secondary);
}

.chip.active {
  border-color: var(--primary);
  background: var(--primary-light);
  color: var(--primary-dark);
}

/* Note Textarea */
.note-textarea {
  min-height: 100px;
  padding: var(--space-md);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
}

/* Action Buttons */
.action-buttons {
  margin-bottom: var(--space-lg);
}

.btn-icon {
  margin-right: var(--space-xs);
}

/* Recent Records */
.records-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  background: var(--primary-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.record-item:hover {
  background: var(--primary-light);
  transform: translateX(4px);
}

.record-dates {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.date-badge {
  font-weight: 600;
  font-size: var(--font-size-base);
}

.flow-badge {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
}

.flow-badge.light {
  background: rgba(142, 205, 168, 0.3);
  color: #5A9A6A;
}

.flow-badge.medium {
  background: var(--primary-light);
  color: var(--primary-dark);
}

.flow-badge.heavy {
  background: rgba(232, 164, 164, 0.3);
  color: #A85A5A;
}

.record-symptoms {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.symptom-mini {
  padding: 2px 6px;
  background: var(--bg-card);
  border-radius: 4px;
  font-size: 10px;
  color: var(--text-light);
}

.symptom-more {
  font-size: 10px;
  color: var(--text-light);
}

.record-arrow {
  font-size: 20px;
  color: var(--text-light);
}

/* Tips Card */
.tips-card {
  background: linear-gradient(135deg, var(--accent-light) 0%, var(--primary-subtle) 100%);
  text-align: center;
}

.tips-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--accent-dark);
  margin-bottom: var(--space-sm);
}

.tips-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
}

@media (min-width: 768px) {
  .flow-options {
    max-width: 400px;
    margin: 0 auto;
  }
}

@media (max-width: 380px) {
  .flow-options {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-xs);
  }
  
  .flow-label {
    font-size: var(--font-size-sm);
  }
  
  .flow-desc {
    display: none;
  }
}
</style>