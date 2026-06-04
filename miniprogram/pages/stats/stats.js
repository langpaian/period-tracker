// pages/stats/stats.js
const storage = require('../../utils/storage.js')

Page({
  data: {
    avgCycle: 28,
    minCycle: 0,
    maxCycle: 0,
    avgPeriod: 5,
    recordCount: 0,
    symptomStats: []
  },

  onLoad() {
    this.loadStats()
  },

  onShow() {
    this.loadStats()
  },

  loadStats() {
    const periods = storage.getPeriods()
    const records = storage.getRecords()
    const settings = storage.getSettings()
    
    // 计算周期统计
    let avgCycle = 28
    let minCycle = 0
    let maxCycle = 0
    
    if (periods.length > 1) {
      const cycles = []
      for (let i = 1; i < periods.length; i++) {
        const d1 = new Date(periods[i].date)
        const d2 = new Date(periods[i-1].date)
        const cycle = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24))
        cycles.push(cycle)
      }
      
      avgCycle = Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length)
      minCycle = Math.min(...cycles)
      maxCycle = Math.max(...cycles)
    }
    
    // 统计记录次数
    const recordCount = Object.keys(records).length
    
    // 统计症状
    const symptomMap = {}
    const symptomNames = {
      'cramp': '腹痛',
      'headache': '头痛',
      'breast': '乳房胀痛',
      'tired': '疲劳',
      'mood': '情绪波动',
      'acne': '痘痘'
    }
    
    Object.values(records).forEach(record => {
      if (record.symptoms) {
        record.symptoms.forEach(symptom => {
          symptomMap[symptom] = (symptomMap[symptom] || 0) + 1
        })
      }
    })
    
    const symptomStats = Object.entries(symptomMap)
      .map(([key, count]) => ({
        name: symptomNames[key] || key,
        count
      }))
      .sort((a, b) => b.count - a.count)
    
    // 计算平均经期
    let avgPeriod = settings.avgPeriod || 5
    if (periods.length > 0) {
      // 简单估算：统计有记录的经期天数
      let totalPeriodDays = 0
      periods.forEach(p => {
        totalPeriodDays += avgPeriod  // 假设每次经期都是 avgPeriod 天
      })
      avgPeriod = Math.round(totalPeriodDays / periods.length)
    }
    
    this.setData({
      avgCycle,
      minCycle,
      maxCycle,
      avgPeriod,
      recordCount,
      symptomStats
    })
  },

  resetData() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有数据吗？此操作不可恢复！',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('periods')
          wx.removeStorageSync('records')
          wx.removeStorageSync('symptoms')
          
          wx.showToast({
            title: '已清空',
            icon: 'success'
          })
          
          this.loadStats()
        }
      }
    })
  }
})
