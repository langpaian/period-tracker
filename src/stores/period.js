import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'period_tracker_data'
const SETTINGS_KEY = 'period_tracker_settings'
const ONBOARDING_KEY = 'period_tracker_onboarding'
const USER_KEY = 'period_tracker_user'

export const usePeriodStore = defineStore('period', () => {
  const periods = ref([])
  const hasCompletedOnboarding = ref(false)
  const user = ref({ name: '', id: '' })
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
    
    try {
      const onboarding = localStorage.getItem(ONBOARDING_KEY)
      hasCompletedOnboarding.value = onboarding === 'true'
    } catch (e) {
      console.error('Failed to load onboarding:', e)
    }
    
    try {
      const savedUser = localStorage.getItem(USER_KEY)
      if (savedUser) user.value = JSON.parse(savedUser)
    } catch (e) {
      console.error('Failed to load user:', e)
    }
  }

  // Complete onboarding and save user
  function completeOnboarding(userName) {
    hasCompletedOnboarding.value = true
    user.value = {
      name: userName,
      id: Date.now().toString(36)
    }
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true')
      localStorage.setItem(USER_KEY, JSON.stringify(user.value))
    } catch (e) {
      console.error('Failed to save onboarding:', e)
    }
  }

  // Update user profile
  function updateUserProfile(name) {
    user.value.name = name
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user.value))
    } catch (e) {
      console.error('Failed to save user:', e)
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

  // Add period with auto end date
  function addPeriodSimple(startDate) {
    const endDate = calculateEndDate(startDate, settings.value.averagePeriodDays)
    return addPeriod(startDate, endDate, [], 'medium', '')
  }

  // Calculate end date from start date and duration
  function calculateEndDate(startDate, days) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + days - 1)
    return date.toISOString().split('T')[0]
  }

  // Get pending reminders
  function getPendingReminders() {
    if (periods.value.length === 0) return []
    
    const reminders = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Sort periods by start date, most recent first
    const sorted = [...periods.value].sort((a, b) => 
      new Date(b.startDate) - new Date(a.startDate)
    )
    const lastPeriod = sorted[0]
    const lastStart = new Date(lastPeriod.startDate)
    lastStart.setHours(0, 0, 0, 0)
    
    // Days since period started
    const daysSinceStart = Math.floor((today - lastStart) / (1000 * 60 * 60 * 24))
    const avgDays = settings.value.averagePeriodDays
    
    // Reminder: (avgDays - 2) days after start - may be ending soon
    const reminderDay1 = avgDays - 2
    if (daysSinceStart === reminderDay1) {
      reminders.push({
        type: 'ending_soon',
        message: '经期可能快要结束了，确认一下？',
        daysAfterStart: reminderDay1
      })
    }
    
    // Reminder: (avgDays + 2) days after start - should have ended
    const reminderDay2 = avgDays + 2
    if (daysSinceStart === reminderDay2) {
      reminders.push({
        type: 'should_end',
        message: '经期持续时间比平时长，确认结束了吗？',
        daysAfterStart: reminderDay2
      })
    }
    
    return reminders
  }

  return {
    periods,
    settings,
    hasCompletedOnboarding,
    user,
    loadData,
    saveData,
    completeOnboarding,
    updateUserProfile,
    addPeriod,
    addPeriodSimple,
    updatePeriod,
    deletePeriod,
    averageCycle,
    averagePeriodDays,
    nextPeriod,
    getPeriodForDate,
    isInPeriod,
    calculateEndDate,
    getPendingReminders
  }
})