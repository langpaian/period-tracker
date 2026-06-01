<template>
  <div class="stats-page">
    <!-- Summary Cards -->
    <div class="stats-grid">
      <div class="stat-card primary">
        <div class="stat-icon">📅</div>
        <div class="stat-label">平均周期</div>
        <div class="stat-value">{{ averageCycle }} <span class="stat-unit">天</span></div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🩸</div>
        <div class="stat-label">平均经期</div>
        <div class="stat-value">{{ averagePeriodDays }} <span class="stat-unit">天</span></div>
      </div>
    </div>

    <!-- Next Prediction -->
    <div class="card" v-if="nextPeriod">
      <h2 class="section-title">下次经期预测</h2>
      <div class="prediction">
        <div class="pred-date">{{ formatDate(nextPeriod) }}</div>
        <div class="pred-days" v-if="daysUntil > 0">
          还有 <span class="highlight">{{ daysUntil }}</span> 天
        </div>
        <div class="pred-days" v-else>
          <span class="highlight">今天</span> 可能开始
        </div>
      </div>
    </div>

    <!-- History -->
    <div class="card">
      <h2 class="section-title">历史记录</h2>
      <div class="history-list" v-if="store.periods.length > 0">
        <div 
          v-for="(record, index) in orderedRecords" 
          :key="record.id"
          class="history-item"
        >
          <div class="history-index">{{ index + 1 }}</div>
          <div class="history-content">
            <div class="history-dates">
              {{ formatDateRange(record.startDate, record.endDate) }}
            </div>
            <div class="history-details">
              <span class="detail-chip">{{ getFlowLabel(record.flowAmount) }}</span>
              <span 
                v-for="symptom in record.symptoms.slice(0, 2)" 
                :key="symptom"
                class="detail-chip"
              >
                {{ symptom }}
              </span>
              <span v-if="record.symptoms.length > 2" class="detail-more">
                +{{ record.symptoms.length - 2 }}
              </span>
            </div>
          </div>
          <div class="history-cycle" v-if="index < orderedRecords.length - 1">
            {{ getCycleDays(record.startDate, orderedRecords[index + 1].startDate) }}天周期
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>暂无记录</p>
        <router-link to="/record" class="btn btn-primary mt-md">
          开始记录
        </router-link>
      </div>
    </div>

    <!-- Tips -->
    <div class="card mt-md">
      <h2 class="section-title">健康小贴士</h2>
      <ul class="tips-list">
        <li>保持规律作息，有助于稳定经期</li>
        <li>经期适量补充铁元素</li>
        <li>温和运动可以缓解不适</li>
        <li>记录症状有助于了解身体规律</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePeriodStore } from '../stores/period'

const store = usePeriodStore()

// Stats
const averageCycle = computed(() => store.averageCycle)
const averagePeriodDays = computed(() => store.averagePeriodDays)
const nextPeriod = computed(() => store.nextPeriod)

const daysUntil = computed(() => {
  if (!nextPeriod.value) return 0
  return Math.ceil((new Date(nextPeriod.value) - new Date()) / (1000 * 60 * 60 * 24))
})

// Ordered records (newest first)
const orderedRecords = computed(() => {
  return store.periods
    .slice()
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
})

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function formatDateRange(start, end) {
  const s = new Date(start)
  const e = new Date(end)
  const sStr = `${s.getMonth() + 1}/${s.getDate()}`
  const eStr = `${e.getMonth() + 1}/${e.getDate()}`
  return start === end ? sStr : `${sStr} - ${eStr}`
}

function getFlowLabel(flow) {
  const labels = { light: '少', medium: '中', heavy: '多' }
  return labels[flow] || flow
}

function getCycleDays(start1, start2) {
  const d1 = new Date(start1)
  const d2 = new Date(start2)
  return Math.floor((d1 - d2) / (1000 * 60 * 60 * 24))
}
</script>

<style scoped>
.stats-page {
  padding: var(--spacing-md);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.stat-card {
  background: var(--white);
  border-radius: var(--radius);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow);
  text-align: center;
}

.stat-card.primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: var(--white);
}

.stat-icon {
  font-size: 28px;
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  margin-top: var(--spacing-xs);
}

.stat-unit {
  font-size: 16px;
  font-weight: normal;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--primary);
}

.prediction {
  text-align: center;
  padding: var(--spacing-md) 0;
}

.pred-date {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.pred-days {
  color: var(--text-light);
}

.highlight {
  color: var(--primary);
  font-weight: 600;
  font-size: 18px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.history-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.history-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.history-content {
  flex: 1;
}

.history-dates {
  font-weight: 500;
  margin-bottom: 4px;
}

.history-details {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.detail-chip {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--bg);
  border-radius: 10px;
  color: var(--text-light);
}

.detail-more {
  font-size: 12px;
  color: var(--text-light);
}

.history-cycle {
  font-size: 12px;
  color: var(--text-light);
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-lg) 0;
  color: var(--text-light);
}

.tips-list {
  list-style: none;
  padding: 0;
}

.tips-list li {
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
  color: var(--text-light);
}

.tips-list li:last-child {
  border-bottom: none;
}
</style>