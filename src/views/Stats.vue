<template>
  <div class="stats-page">
    <!-- Summary Cards -->
    <div class="stats-grid">
      <div class="stat-card stat-card-gradient">
        <div class="stat-icon">📅</div>
        <div class="stat-value">{{ averageCycle }}</div>
        <div class="stat-unit">天</div>
        <div class="stat-label">平均周期</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🩸</div>
        <div class="stat-value secondary">{{ averagePeriodDays }}</div>
        <div class="stat-unit secondary">天</div>
        <div class="stat-label">平均经期</div>
      </div>
    </div>

    <!-- Next Prediction Card -->
    <div class="card card-lavender" v-if="nextPeriod">
      <div class="prediction-header">
        <span class="prediction-icon">🔮</span>
        <span class="prediction-title">下次经期预测</span>
      </div>
      
      <div class="prediction-content">
        <div class="pred-date">{{ formatDate(nextPeriod) }}</div>
        <div class="pred-countdown">
          <span class="countdown-num">{{ daysUntil }}</span>
          <span class="countdown-label">天后</span>
        </div>
        <div class="pred-message" v-if="daysUntil <= 3">
          {{ getPredictionMessage() }}
        </div>
      </div>
      
      <!-- Prediction Visual -->
      <div class="prediction-visual">
        <div class="cycle-bar">
          <div 
            class="cycle-progress" 
            :style="{ width: `${Math.max(0, 100 - (daysUntil / averageCycle) * 100)}%` }"
          ></div>
        </div>
        <div class="cycle-labels">
          <span>开始</span>
          <span>排卵</span>
          <span>下一次</span>
        </div>
      </div>
    </div>

    <!-- No Data Card -->
    <div class="card empty-card" v-else>
      <div class="empty-icon">🌸</div>
      <div class="empty-title">还没有记录</div>
      <div class="empty-text">记录您的经期开始获取统计和预测</div>
      <router-link to="/record" class="btn btn-primary btn-block mt-lg">
        开始记录
      </router-link>
    </div>

    <!-- History Records -->
    <div class="card" v-if="orderedRecords.length > 0">
      <h2 class="section-title">
        <span class="section-icon">📋</span>
        历史记录
      </h2>
      
      <div class="history-list">
        <div 
          v-for="(record, index) in orderedRecords" 
          :key="record.id"
          class="history-item"
        >
          <div class="history-number">{{ index + 1 }}</div>
          
          <div class="history-content">
            <div class="history-dates">
              {{ formatDateRange(record.startDate, record.endDate) }}
              <span class="history-duration">{{ getDuration(record) }}天</span>
            </div>
            
            <div class="history-details">
              <span class="detail-chip" :class="record.flowAmount">
                {{ getFlowLabel(record.flowAmount) }}
              </span>
              <span 
                v-for="symptom in (record.symptoms || []).slice(0, 2)" 
                :key="symptom"
                class="detail-chip symptom"
              >
                {{ symptom }}
              </span>
              <span 
                v-if="(record.symptoms || []).length > 2" 
                class="detail-more"
              >
                +{{ record.symptoms.length - 2 }}
              </span>
            </div>
          </div>
          
          <div class="history-cycle" v-if="index < orderedRecords.length - 1">
            <span class="cycle-value">{{ getCycleDays(record.startDate, orderedRecords[index + 1].startDate) }}</span>
            <span class="cycle-label">天周期</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Insights Card -->
    <div class="card insights-card" v-if="store.periods.length >= 2">
      <h2 class="section-title">
        <span class="section-icon">💡</span>
        健康洞察
      </h2>
      
      <div class="insight-item" v-if="commonSymptoms.length > 0">
        <div class="insight-label">最常见症状</div>
        <div class="insight-tags">
          <span 
            v-for="symptom in commonSymptoms" 
            :key="symptom.name"
            class="insight-tag"
            :class="{ highlight: symptom.count >= 2 }"
          >
            {{ symptom.name }} ({{ symptom.count }})
          </span>
        </div>
      </div>
      
      <div class="insight-item" v-if="averageCycle">
        <div class="insight-label">周期稳定性</div>
        <div class="insight-value">
          <span :class="cycleRegularity.class">{{ cycleRegularity.text }}</span>
        </div>
      </div>
    </div>

    <!-- Tips Card -->
    <div class="card tips-card">
      <h3 class="tips-title">🌿 健康小贴士</h3>
      <ul class="tips-list">
        <li>保持规律作息，有助于稳定经期</li>
        <li>经期适量补充含铁食物</li>
        <li>温和运动如瑜伽可以缓解不适</li>
        <li>注意保暖，避免受凉</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePeriodStore } from '../stores/period'

const store = usePeriodStore()

// Store data
const averageCycle = computed(() => store.averageCycle)
const averagePeriodDays = computed(() => store.averagePeriodDays)
const nextPeriod = computed(() => store.nextPeriod)
const periods = computed(() => store.periods)

const daysUntil = computed(() => {
  if (!nextPeriod.value) return '--'
  return Math.ceil((new Date(nextPeriod.value) - new Date()) / (1000 * 60 * 60 * 24))
})

// Ordered records (newest first)
const orderedRecords = computed(() => {
  return periods.value
    .slice()
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
})

// Common symptoms
const commonSymptoms = computed(() => {
  const symptoms = {}
  for (const record of periods.value) {
    for (const symptom of (record.symptoms || [])) {
      symptoms[symptom] = (symptoms[symptom] || 0) + 1
    }
  }
  return Object.entries(symptoms)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

// Cycle regularity
const cycleRegularity = computed(() => {
  if (orderedRecords.value.length < 3) {
    return { text: '数据不足', class: 'neutral' }
  }
  const cycles = []
  for (let i = 0; i < orderedRecords.value.length - 1; i++) {
    cycles.push(getCycleDays(
      orderedRecords.value[i].startDate,
      orderedRecords.value[i + 1].startDate
    ))
  }
  const avg = cycles.reduce((a, b) => a + b, 0) / cycles.length
  const variance = cycles.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / cycles.length
  const stdDev = Math.sqrt(variance)
  
  if (stdDev <= 3) {
    return { text: '非常规律 ✨', class: 'good' }
  } else if (stdDev <= 7) {
    return { text: '基本规律', class: 'normal' }
  } else {
    return { text: '不够规律', class: 'warn' }
  }
})

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}��${date.getDate()}日`
}

function formatDateRange(start, end) {
  const s = new Date(start)
  const e = new Date(end)
  const sStr = `${s.getMonth() + 1}/${s.getDate()}`
  const eStr = `${e.getMonth() + 1}/${e.getDate()}`
  return start === end ? sStr : `${sStr} - ${eStr}`
}

function getDuration(record) {
  const s = new Date(record.startDate)
  const e = new Date(record.endDate)
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1
}

function getFlowLabel(flow) {
  const labels = { light: '少', medium: '中', heavy: '多' }
  return labels[flow] || flow
}

function getCycleDays(start1, start2) {
  const d1 = new Date(start1)
  const d2 = new Date(start2)
  return Math.abs(Math.floor((d1 - d2) / (1000 * 60 * 60 * 24)))
}

function getPredictionMessage() {
  const days = daysUntil.value
  if (days <= 0) return '可能已经开始，注意休息'
  if (days === 1) return '预计明天开始'
  if (days === 2) return '预计后天开始'
  if (days === 3) return '即将到来'
  return ''
}
</script>

<style scoped>
.stats-page {
  padding: var(--space-md);
  padding-bottom: calc(var(--tab-bar-height) + var(--space-lg));
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-card);
  text-align: center;
}

.stat-card-gradient {
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
  color: var(--text-white);
}

.stat-icon {
  font-size: 28px;
  margin-bottom: var(--space-xs);
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  line-height: 1.2;
}

.stat-value.secondary {
  color: var(--primary-dark);
}

.stat-unit {
  font-size: var(--font-size-sm);
  opacity: 0.8;
  margin-bottom: var(--space-xs);
}

.stat-unit.secondary {
  color: var(--text-secondary);
}

.stat-label {
  font-size: var(--font-size-sm);
  opacity: 0.85;
}

/* Prediction Card */
.prediction-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.prediction-icon {
  font-size: 20px;
}

.prediction-title {
  font-size: var(--font-size-base);
  font-weight: 600;
}

.prediction-content {
  text-align: center;
  margin-bottom: var(--space-lg);
}

.pred-date {
  font-size: var(--font-size-xl);
  font-weight: 700;
  margin-bottom: var(--space-sm);
}

.pred-countdown {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.countdown-num {
  font-size: 48px;
  font-weight: 800;
}

.countdown-label {
  font-size: var(--font-size-md);
  opacity: 0.8;
}

.pred-message {
  font-size: var(--font-size-sm);
  margin-top: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  background: rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-full);
  display: inline-block;
}

/* Prediction Visual */
.prediction-visual {
  margin-top: var(--space-lg);
}

.cycle-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-xs);
}

.cycle-progress {
  height: 100%;
  background: var(--text-white);
  border-radius: var(--radius-full);
  transition: width var(--transition-slow);
}

.cycle-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  opacity: 0.7;
}

/* Empty Card */
.empty-card {
  text-align: center;
  padding: var(--space-xl);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-md);
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--primary-dark);
  margin-bottom: var(--space-sm);
}

.empty-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* Section Title */
.section-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.section-icon {
  font-size: 18px;
}

/* History List */
.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
}

.history-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-light), var(--primary));
  color: var(--text-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: 700;
  flex-shrink: 0;
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-dates {
  font-weight: 600;
  font-size: var(--font-size-base);
  margin-bottom: var(--space-xs);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.history-duration {
  font-size: var(--font-size-xs);
  color: var(--primary);
  background: var(--primary-subtle);
  padding: 2px 6px;
  border-radius: 4px;
}

.history-details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.detail-chip {
  font-size: 11px;
  padding: 3px 8px;
  background: var(--primary-subtle);
  border-radius: 4px;
  color: var(--primary-dark);
}

.detail-chip.light {
  background: rgba(142, 205, 168, 0.2);
  color: #5A9A6A;
}

.detail-chip.heavy {
  background: rgba(232, 164, 164, 0.2);
  color: #A85A5A;
}

.detail-chip.symptom {
  background: var(--bg-main);
  color: var(--text-secondary);
}

.detail-more {
  font-size: 11px;
  color: var(--text-light);
}

.history-cycle {
  text-align: right;
  flex-shrink: 0;
}

.cycle-value {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--accent);
}

.cycle-label {
  font-size: 10px;
  color: var(--text-light);
  display: block;
}

/* Insights Card */
.insights-card {
  background: linear-gradient(135deg, var(--accent-light) 0%, var(--primary-subtle) 100%);
}

.insight-item {
  margin-bottom: var(--space-md);
}

.insight-item:last-child {
  margin-bottom: 0;
}

.insight-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
}

.insight-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.insight-tag {
  font-size: var(--font-size-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--bg-card);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
}

.insight-tag.highlight {
  background: var(--primary);
  color: var(--text-white);
}

.insight-value {
  font-size: var(--font-size-md);
  font-weight: 600;
}

.insight-value .good {
  color: #5A9A6A;
}

.insight-value .normal {
  color: var(--primary);
}

.insight-value .warn {
  color: #E8A4A4;
}

.insight-value .neutral {
  color: var(--text-secondary);
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

@media (min-width: 768px) {
  .stats-grid {
    max-width: 500px;
    margin: 0 auto var(--space-md);
  }
}
</style>