<template>
  <div class="home">
    <!-- Today's Status Card -->
    <div class="card card-pink today-card">
      <div class="today-header">
        <div class="today-date">
          <span class="date-month">{{ currentMonth }}</span>
          <span class="date-day">{{ currentDay }}</span>
        </div>
        <div class="today-weekday">{{ dayOfWeek }}</div>
      </div>
      
      <div class="today-content" v-if="nextPeriod">
        <div class="next-label">下次经期</div>
        <div class="next-countdown">
          <span class="countdown-number">{{ daysUntilNext }}</span>
          <span class="countdown-unit">天</span>
        </div>
        <div class="next-date">{{ formatDate(nextPeriod) }}</div>
      </div>
      
      <div class="today-content empty" v-else>
        <div class="empty-text">记录您的第一次经期</div>
        <router-link to="/record" class="btn btn-ghost btn-block mt-md">
          立即记录 ✨
        </router-link>
      </div>
      
      <!-- Decorative elements -->
      <div class="decoration decoration-1">🌸</div>
      <div class="decoration decoration-2">💕</div>
    </div>

    <!-- Calendar Card -->
    <div class="card">
      <!-- Calendar Header -->
      <div class="calendar-header">
        <button class="nav-btn" @click="prevMonth" aria-label="上一月">
          <span class="nav-icon">‹</span>
        </button>
        <h2 class="calendar-title">{{ monthYear }}</h2>
        <button class="nav-btn" @click="nextMonth" aria-label="下一月">
          <span class="nav-icon">›</span>
        </button>
      </div>

      <!-- Weekday Header -->
      <div class="weekday-header">
        <div 
          v-for="(day, index) in weekDays" 
          :key="index" 
          class="weekday-cell"
          :class="{ weekend: index === 0 || index === 6 }"
        >
          {{ day }}
        </div>
      </div>

      <!-- Days Grid -->
      <div class="days-grid">
        <div 
          v-for="(day, index) in calendarDays" 
          :key="index"
          class="day-cell"
          :class="{
            'other-month': !day.currentMonth,
            'today': day.isToday,
            'in-period': day.isInPeriod,
            'period-start': day.isPeriodStart,
            'period-end': day.isPeriodEnd,
            'selected': selectedDate === day.date,
            'predicted': day.isPredicted,
            'has-period': day.hasPeriod
          }"
          @click="onDayClick(day)"
        >
          <span class="day-number">{{ day.dayNum }}</span>
          <!-- Period indicator dots -->
          <span v-if="day.isInPeriod" class="period-bar"></span>
          <!-- Today indicator -->
          <span v-if="day.isToday" class="today-tag">今天</span>
        </div>
      </div>

      <!-- Legend -->
      <div class="calendar-legend">
        <div class="legend-item">
          <span class="legend-dot period"></span>
          <span>经期</span>
        </div>
        <div class="legend-item">
          <span class="legend-circle today"></span>
          <span>今天</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot predicted"></span>
          <span>预测</span>
        </div>
      </div>
    </div>

    <!-- Cycle Info Card -->
    <div class="card stats-preview">
      <div class="preview-item">
        <div class="preview-icon">📅</div>
        <div class="preview-data">
          <div class="preview-value">{{ averageCycle }}</div>
          <div class="preview-label">平均周期(天)</div>
        </div>
      </div>
      <div class="preview-divider"></div>
      <div class="preview-item">
        <div class="preview-icon">🩸</div>
        <div class="preview-data">
          <div class="preview-value">{{ averagePeriodLength }}</div>
          <div class="preview-label">平均天数</div>
        </div>
      </div>
    </div>

    <!-- Quick Action Floating -->
    <button 
      v-if="selectedDate && !store.isInPeriod(selectedDate)"
      class="quick-fab" 
      @click="goToRecord"
      aria-label="快速记录"
    >
      <span class="fab-icon">+</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePeriodStore } from '../stores/period'

const router = useRouter()
const route = useRoute()
const store = usePeriodStore()

// Current month for display
const currentDate = ref(new Date())
const selectedDate = ref(null)

// Week days
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// Current date display
const now = new Date()
const currentMonth = computed(() => `${now.getMonth() + 1}月`)
const currentDay = computed(() => `${now.getDate()}`)

const dayOfWeek = computed(() => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[now.getDay()]
})

// Store data
const nextPeriod = computed(() => store.nextPeriod)
const averageCycle = computed(() => store.averageCycle)
const averagePeriodLength = computed(() => store.averagePeriodDays)

const daysUntilNext = computed(() => {
  if (!nextPeriod.value) return '--'
  const diff = Math.ceil(
    (new Date(nextPeriod.value) - new Date()) / (1000 * 60 * 60 * 24)
  )
  return diff > 0 ? diff : 0
})

// Month Year display
const monthYear = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth() + 1
  return `${year}年${month}月`
})

// Generate calendar days with enhanced data
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPadding = firstDay.getDay()
  
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Previous month padding
  const prevMonth = new Date(year, month, 0)
  for (let i = startPadding - 1; i >= 0; i--) {
    const d = prevMonth.getDate() - i
    const dateStr = new Date(year, month - 1, d).toISOString().split('T')[0]
    const periodData = store.getPeriodForDate(dateStr)
    days.push({
      dayNum: d,
      date: dateStr,
      currentMonth: false,
      isToday: false,
      isInPeriod: !!periodData,
      isPeriodStart: periodData?.startDate === dateStr,
      isPeriodEnd: periodData?.endDate === dateStr,
      isPredicted: false,
      hasPeriod: !!periodData
    })
  }
  
  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = new Date(year, month, d).toISOString().split('T')[0]
    const thisDate = new Date(year, month, d)
    thisDate.setHours(0, 0, 0, 0)
    const periodData = store.getPeriodForDate(dateStr)
    days.push({
      dayNum: d,
      date: dateStr,
      currentMonth: true,
      isToday: thisDate.getTime() === today.getTime(),
      isInPeriod: !!periodData,
      isPeriodStart: periodData?.startDate === dateStr,
      isPeriodEnd: periodData?.endDate === dateStr,
      isPredicted: false,
      hasPeriod: !!periodData
    })
  }
  
  // Next month padding
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const dateStr = new Date(year, month + 1, d).toISOString().split('T')[0]
    const periodData = store.getPeriodForDate(dateStr)
    days.push({
      dayNum: d,
      date: dateStr,
      currentMonth: false,
      isToday: false,
      isInPeriod: !!periodData,
      isPeriodStart: periodData?.startDate === dateStr,
      isPeriodEnd: periodData?.endDate === dateStr,
      isPredicted: false,
      hasPeriod: !!periodData
    })
  }
  
  // Mark predicted days
  if (nextPeriod.value) {
    const predStart = new Date(nextPeriod.value)
    const avgDuration = averagePeriodLength.value
    for (let i = 0; i < avgDuration; i++) {
      const predDate = new Date(predStart)
      predDate.setDate(predDate.getDate() + i)
      const dateStr = predDate.toISOString().split('T')[0]
      const dayIdx = days.findIndex(d => d.date === dateStr)
      if (dayIdx !== -1 && !days[dayIdx].hasPeriod) {
        days[dayIdx].isPredicted = true
      }
    }
  }
  
  return days
})

function prevMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  )
}

function nextMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  )
}

function onDayClick(day) {
  selectedDate.value = day.date
}

function goToRecord() {
  if (selectedDate.value) {
    router.push(`/record?date=${selectedDate.value}`)
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
</script>

<style scoped>
.home {
  padding: var(--space-md);
  padding-bottom: calc(var(--tab-bar-height) + var(--space-lg));
}

/* Today's Status Card */
.today-card {
  position: relative;
  overflow: hidden;
  padding: var(--space-xl);
}

.today-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-lg);
}

.today-date {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.date-month {
  font-size: var(--font-size-lg);
  font-weight: 600;
  opacity: 0.9;
}

.date-day {
  font-size: var(--font-size-xxl);
  font-weight: 800;
  letter-spacing: -1px;
}

.today-weekday {
  font-size: var(--font-size-sm);
  opacity: 0.8;
}

.today-content {
  text-align: center;
}

.empty .empty-text {
  font-size: var(--font-size-base);
  opacity: 0.85;
  margin-bottom: var(--space-sm);
}

.next-label {
  font-size: var(--font-size-sm);
  opacity: 0.85;
  margin-bottom: var(--space-xs);
}

.next-countdown {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-bottom: var(--space-xs);
}

.countdown-number {
  font-size: 48px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -2px;
}

.countdown-unit {
  font-size: var(--font-size-lg);
  opacity: 0.8;
}

.next-date {
  font-size: var(--font-size-md);
  opacity: 0.8;
}

/* Decorations */
.decoration {
  position: absolute;
  font-size: 28px;
  opacity: 0.2;
}

.decoration-1 {
  top: 10px;
  right: 20px;
}

.decoration-2 {
  bottom: 10px;
  left: 20px;
}

/* Calendar Card */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.calendar-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--primary-dark);
}

.nav-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--primary-subtle);
  border-radius: 50%;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover {
  background: var(--primary-light);
}

.nav-icon {
  font-size: 22px;
  color: var(--primary-dark);
  font-weight: 300;
}

/* Weekday Header */
.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: var(--space-sm);
}

.weekday-cell {
  text-align: center;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-light);
  padding: var(--space-xs);
}

.weekday-cell.weekend {
  color: var(--primary);
}

/* Days Grid */
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  font-size: var(--font-size-base);
  font-weight: 500;
  min-height: 46px;
}

.day-number {
  position: relative;
  z-index: 1;
}

.day-cell.other-month {
  color: var(--text-light);
  opacity: 0.4;
}

.day-cell.today {
  border: 2px solid var(--primary);
}

.day-cell.in-period {
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
  color: var(--text-white);
  border-radius: 0;
}

.day-cell.period-start {
  border-radius: var(--radius-md) 0 0 var(--radius-md);
}

.day-cell.period-end {
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.day-cell.selected {
  background: var(--accent);
  color: var(--text-white);
  box-shadow: 0 4px 12px rgba(183, 148, 200, 0.4);
  transform: scale(1.08);
}

.day-cell.predicted {
  background: var(--accent-light);
}

.day-cell.predicted .day-number {
  color: var(--accent-dark);
}

.day-cell:hover:not(.other-month) {
  background: var(--primary-subtle);
}

/* Period Bar */
.period-bar {
  position: absolute;
  bottom: 6px;
  width: 16px;
  height: 4px;
  background: currentColor;
  border-radius: 2px;
  opacity: 0.8;
}

/* Today Tag */
.today-tag {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 8px;
  padding: 1px 4px;
  background: var(--primary);
  color: var(--text-white);
  border-radius: 4px;
}

/* Calendar Legend */
.calendar-legend {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  margin-top: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.legend-dot {
  width: 12px;
  height: 8px;
  border-radius: 4px;
}

.legend-dot.period {
  background: linear-gradient(135deg, var(--primary-light), var(--primary));
}

.legend-dot.predicted {
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
}

.legend-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--primary);
}

/* Stats Preview Card */
.stats-preview {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: var(--space-lg);
}

.preview-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex: 1;
  justify-content: center;
}

.preview-icon {
  font-size: 28px;
}

.preview-data {
  text-align: left;
}

.preview-value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--primary-dark);
  line-height: 1.2;
}

.preview-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: 2px;
}

.preview-divider {
  width: 1px;
  height: 40px;
  background: var(--border);
}

/* Quick FAB */
.quick-fab {
  position: fixed;
  bottom: calc(var(--tab-bar-height) + var(--space-lg));
  right: var(--space-lg);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  border: none;
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-normal);
  z-index: var(--z-sticky);
}

.quick-fab:hover {
  transform: scale(1.1);
}

.quick-fab:active {
  transform: scale(0.95);
}

.fab-icon {
  font-size: 28px;
  color: var(--text-white);
  font-weight: 300;
}

/* Animations */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@media (min-width: 768px) {
  .home {
    max-width: 600px;
    margin: 0 auto;
  }
  
  .day-cell {
    min-height: 52px;
    font-size: var(--font-size-md);
  }
}
</style>