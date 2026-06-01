import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'period_tracker_data'
const SETTINGS_KEY = 'period_tracker_settings'

export const usePeriodStore = defineStore('period', () => {
  const periods = ref([])
  const settings = ref({
    averageCycle: 28,
    averagePeriodDays: 5,
    reminderDays: 1,
    notificationsEnabled: false
  })

  // Load from localStorage
  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) periods.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load data:', e)
    }
    
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY)
      if (savedSettings) settings.value = { ...settings.value, ...JSON.parse(savedSettings) }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
  }

  // Save to localStorage
  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(periods.value))
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
    } catch (e) {
      console.error('Failed to save data:', e)
    }
  }

  // Add a new period record
  function addPeriod(startDate, endDate = null, symptoms = [], flowAmount = 'medium', notes = '') {
    const period = {
      id: Date.now().toString(),
      startDate,
      endDate: endDate || startDate,
      symptoms,
      flowAmount,
      notes,
      createdAt: Date.now()
    }
    periods.value.push(period)
    saveData()
    return period
  }

  // Update a period record
  function updatePeriod(id, data) {
    const index = periods.value.findIndex(p => p.id === id)
    if (index !== -1) {
      periods.value[index] = { ...periods.value[index], ...data }
      saveData()
    }
  }

  // Delete a period record
  function deletePeriod(id) {
    periods.value = periods.value.filter(p => p.id !== id)
    saveData()
  }

  // Calculate average cycle length
  const averageCycle = computed(() => {
    if (periods.value.length < 2) return settings.value.averageCycle
    
    const sorted = [...periods.value].sort((a, b) => 
      new Date(a.startDate) - new Date(b.startDate)
    )
    
    let total = 0
    let count = 0
    for (let i = 1; i < sorted.length; i++) {
      const diff = Math.floor(
        (new Date(sorted[i].startDate) - new Date(sorted[i-1].startDate)) / (1000 * 60 * 60 * 24)
      )
      if (diff > 0 && diff < 60) { // Sanity check: less than 60 days
        total += diff
        count++
      }
    }
    
    return count > 0 ? Math.round(total / count) : settings.value.averageCycle
  })

  // Calculate average period duration
  const averagePeriodDays = computed(() => {
    if (periods.value.length === 0) return settings.value.averagePeriodDays
    
    let total = 0
    let count = 0
    for (const period of periods.value) {
      const duration = Math.floor(
        (new Date(period.endDate) - new Date(period.startDate)) / (1000 * 60 * 60 * 24)
      ) + 1
      if (duration > 0 && duration < 15) { // Sanity check
        total += duration
        count++
      }
    }
    
    return count > 0 ? Math.round(total / count) : settings.value.averagePeriodDays
  })

  // Predict next period start date
  const nextPeriod = computed(() => {
    if (periods.value.length === 0) return null
    
    const sorted = [...periods.value].sort((a, b) => 
      new Date(b.startDate) - new Date(a.startDate)
    )
    const lastPeriod = sorted[0]
    const lastStart = new Date(lastPeriod.startDate)
    const predicted = new Date(lastStart)
    predicted.setDate(predicted.getDate() + averageCycle.value)
    
    return predicted.toISOString().split('T')[0]
  })

  // Get period falling on a specific date
  function getPeriodForDate(dateStr) {
    const date = new Date(dateStr)
    return periods.value.find(p => {
      const start = new Date(p.startDate)
      const end = new Date(p.endDate)
      return date >= start && date <= end
    })
  }

  // Check if date is in period
  function isInPeriod(dateStr) {
    return getPeriodForDate(dateStr) !== undefined
  }

  return {
    periods,
    settings,
    loadData,
    saveData,
    addPeriod,
    updatePeriod,
    deletePeriod,
    averageCycle,
    averagePeriodDays,
    nextPeriod,
    getPeriodForDate,
    isInPeriod
  }
})