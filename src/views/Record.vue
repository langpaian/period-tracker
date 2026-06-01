<template>
  <div class="record-page">
    <div class="card">
      <h2 class="section-title">经期记录</h2>
      
      <!-- Date Input -->
      <div class="form-group">
        <label class="form-label">开始日期</label>
        <input 
          type="date" 
          class="input"
          v-model="form.startDate"
        />
      </div>
      
      <div class="form-group">
        <label class="form-label">结束日期</label>
        <input 
          type="date" 
          class="input"
          v-model="form.endDate"
        />
      </div>
      
      <!-- Flow Amount -->
      <div class="form-group">
        <label class="form-label">流量</label>
        <div class="flow-options">
          <button 
            v-for="option in flowOptions" 
            :key="option.value"
            class="flow-btn"
            :class="{ active: form.flowAmount === option.value }"
            @click="form.flowAmount = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      
      <!-- Symptoms -->
      <div class="form-group">
        <label class="form-label">症状（可选）</label>
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
      <div class="form-group">
        <label class="form-label">备注</label>
        <textarea 
          class="input textarea"
          v-model="form.notes"
          placeholder="添加备注..."
          rows="3"
        ></textarea>
      </div>
    </div>
    
    <!-- Actions -->
    <div class="actions">
      <button class="btn btn-primary" @click="saveRecord" :disabled="!canSave">
        保存记录
      </button>
      <button 
        v-if="editId" 
        class="btn btn-outline" 
        @click="deleteRecord"
      >
        删除记录
      </button>
    </div>

    <!-- Recent Records -->
    <div class="card mt-lg" v-if="recentRecords.length > 0">
      <h2 class="section-title">最近记录</h2>
      <div class="records-list">
        <div 
          v-for="record in recentRecords" 
          :key="record.id"
          class="record-item"
          @click="editRecord(record)"
        >
          <div class="record-dates">
            {{ formatDateRange(record.startDate, record.endDate) }}
          </div>
          <div class="record-flow">
            {{ getFlowLabel(record.flowAmount) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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
  { value: 'light', label: '少' },
  { value: 'medium', label: '中' },
  { value: 'heavy', label: '多' }
]

const symptomOptions = [
  '腹痛', '腰痛', '头痛', '乳房胀痛', '情绪波动', '疲劳', '恶心', '痘痘'
]

// Can save
const canSave = computed(() => {
  return form.value.startDate && form.value.endDate
})

// Recent records
const recentRecords = computed(() => {
  return store.periods
    .slice()
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
    .slice(0, 5)
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
    flowAmount: record.flowAmount,
    symptoms: [...record.symptoms],
    notes: record.notes
  }
}

// Format helpers
function formatDateRange(start, end) {
  const s = new Date(start)
  const e = new Date(end)
  const sStr = `${s.getMonth() + 1}/${s.getDate()}`
  const eStr = `${e.getMonth() + 1}/${e.getDate()}`
  return start === end ? sStr : `${sStr} - ${eStr}`
}

function getFlowLabel(flow) {
  const opt = flowOptions.find(o => o.value === flow)
  return opt ? opt.label : flow
}

// Initialize
onMounted(() => {
  const dateParam = route.query.date
  if (dateParam) {
    form.value.startDate = dateParam
    form.value.endDate = dateParam
  } else {
    form.value.startDate = new Date().toISOString().split('T')[0]
    form.value.endDate = new Date().toISOString().split('T')[0]
  }
})
</script>

<style scoped>
.record-page {
  padding: var(--spacing-md);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--primary);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
  color: var(--text-light);
}

.flow-options {
  display: flex;
  gap: var(--spacing-sm);
}

.flow-btn {
  flex: 1;
  padding: var(--spacing-sm);
  border: 2px solid var(--border);
  background: var(--white);
  border-radius: var(--radius);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.flow-btn.active {
  border-color: var(--primary);
  background: var(--primary-light);
  color: var(--primary-dark);
}

.symptom-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.chip {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 2px solid var(--border);
  background: var(--white);
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chip.active {
  border-color: var(--primary);
  background: var(--primary-light);
  color: var(--primary-dark);
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.actions .btn {
  width: 100%;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.record-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm);
  background: var(--bg);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.2s ease;
}

.record-item:hover {
  background: var(--primary-light);
}

.record-dates {
  font-weight: 500;
}

.record-flow {
  color: var(--text-light);
  font-size: 14px;
}
</style>