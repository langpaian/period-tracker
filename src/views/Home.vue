<template>
  <div class="home">
    <!-- Today's Status -->
    <div class="card today-status">
      <div class="status-header">
        <div class="status-date">{{ todayFormatted }}</div>
        <div class="status-day">{{ dayOfWeek }}</div>
      </div>
      
      <div class="status-content" v-if="nextPeriod">
        <div class="status-label">下次经期</div>
        <div class="status-value">{{ daysUntilNext }} 天后</div>
        <div class="status-date-next">{{ formatDate(nextPeriod) }}</div>
      </div>
      <div class="status-content" v-else>
        <div class="status-label">记录您的第一次经期</div>
        <router-link to="/record" class="btn btn-primary mt-md">
          立即记录
        </router-link>
      </div>
    </div>

    <!-- Calendar Navigation -->
    <div class="calendar-nav">
      <button class="nav-btn" @click="prevMonth">&lt;</button>
      <h2 class="calendar-title">{{ monthYear }}</h2>
      <button class="nav-btn" @click="nextMonth">&gt;</button>
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-wrapper">
      <div class="calendar">
        <!-- Weekday headers -->
        <div class="weekday-row">
          <div 
            v-for="(day, index) in weekDays" 
            :key="index" 
            class="weekday"
          >
            {{ day }}
          </div>
        </div>
        
        <!-- Days grid -->
        <div class="days-grid">
          <div 
            v-for="(day, index) in calendarDays" 
            :key="index"
            class="day-cell"
            :class="{
              'other-month': !day.currentMonth,
              'today': day.isToday,
              'in-period': day.isInPeriod,
              'selected': selectedDate === day.date
            }"
            @click="onDayClick(day)"
          >
            <span class="day-number">{{ day.dayNum }}</span>
            <span v-if="day.isInPeriod" class="period-indicator"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="legend">
      <div class="legend-item">
        <span class="legend-dot period"></span>
        <span>经期</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot today"></span>
        <span>今天</span>
      </div>
    </div>

    <!-- Quick Record -->
    <div class="quick-actions mt-md" v-if="selectedDate">
      <button class="btn btn-primary" @click="goToRecord">
        记录 {{ formatDate(selectedDate) }} 的经期
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePeriodStore } from '../stores/period'

const router = useRouter()
const store = usePeriodStore()

// Current month for display
const currentDate = ref(new Date())
const selectedDate = ref(null)

// Week days
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// Today formatted
const todayFormatted = computed(() => {
  const now = new Date()
  return `${now.getMonth() + 1}月${now.getDate()}日`
})

const dayOfWeek = computed(() => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[new Date().getDay()]
})

// Next period prediction
const nextPeriod = computed(() => store.nextPeriod)
const daysUntilNext = computed(() => {
  if (!nextPeriod.value) return null
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

// Generate calendar days
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
    days.push({
      dayNum: d,
      date: dateStr,
      currentMonth: false,
      isToday: false,
      isInPeriod: store.isInPeriod(dateStr)
    })
  }
  
  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = new Date(year, month, d).toISOString().split('T')[0]
    const thisDate = new Date(year, month, d)
    days.push({
      dayNum: d,
      date: dateStr,
      currentMonth: true,
      isToday: thisDate.getTime() === today.getTime(),
      isInPeriod: store.isInPeriod(dateStr)
    })
  }
  
  // Next month padding
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const dateStr = new Date(year, month + 1, d).toISOString().split('T')[0]
    days.push({
      dayNum: d,
      date: dateStr,
      currentMonth: false,
      isToday: false,
      isInPeriod: store.isInPeriod(dateStr)
    })
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
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<style scoped>
.home {
  padding: var(--spacing-md);
}

/* Today Status */
.today-status {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: var(--white);
}

.status-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.status-date {
  font-size: 18px;
  font-weight: 600;
}

.status-day {
  font-size: 16px;
  opacity: 0.9;
}

.status-content {
  text-align: center;
}

.status-label {
  font-size: 14px;
  opacity: 0.9;
}

.status-value {
  font-size: 32px;
  font-weight: 700;
  margin: var(--spacing-xs) 0;
}

.status-date-next {
  font-size: 14px;
  opacity: 0.8;
}

/* Calendar Navigation */
.calendar-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) 0;
}

.calendar-title {
  font-size: 18px;
  font-weight: 600;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: var(--white);
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: var(--primary-light);
}

/* Calendar */
.calendar-wrapper {
  background: var(--white);
  border-radius: var(--radius);
  padding: var(--spacing-md);
  box-shadow: var(--shadow);
}

.calendar {
  width: 100%;
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: var(--spacing-sm);
}

.weekday {
  font-size: 12px;
  color: var(--text-light);
  font-weight: 500;
}

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
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  font-size: 14px;
}

.day-cell.other-month {
  color: var(--text-light);
  opacity: 0.5;
}

.day-cell.today {
  border: 2px solid var(--primary);
}

.day-cell.in-period {
  background: var(--primary-light);
}

.day-cell.selected {
  background: var(--primary);
  color: var(--white);
}

.day-cell:hover {
  background: var(--primary-light);
}

.period-indicator {
  position: absolute;
  bottom: 4px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--primary);
}

/* Legend */
.legend {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-md) 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 12px;
  color: var(--text-light);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.period {
  background: var(--primary-light);
}

.legend-dot.today {
  border: 2px solid var(--primary);
}

/* Quick Actions */
.quick-actions {
  text-align: center;
}

.quick-actions .btn {
  width: 100%;
}
</style>