// pages/history/history.js
const storage = require('../../utils/storage.js')

Page({
  data: {
    records: [],
    selectedRecord: null,
    showDeleteConfirm: false
  },

  onLoad() {
    this.loadRecords()
  },

  onShow() {
    this.loadRecords()
  },

  /**
   * 加载历史记录
   */
  loadRecords() {
    const allRecords = storage.getRecords()
    const periods = storage.getPeriods()

    // 转换为数组并排序
    const recordsArray = Object.keys(allRecords).map(date => {
      const record = allRecords[date]
      const periodRecord = periods.find(p => p.date === date)

      return {
        date,
        flow: record.flow || 'none',
        symptoms: record.symptoms || [],
        note: record.note || '',
        isPeriodStart: record.isPeriodStart || false,
        isPeriodEnd: record.isPeriodEnd || false,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    }).sort((a, b) => new Date(b.date) - new Date(a.date)) // 倒序排列，最近的在前

    this.setData({ records: recordsArray })
  },

  /**
   * 点击记录项 - 跳转到记录页编辑
   */
  onRecordTap(e) {
    const date = e.currentTarget.dataset.date
    getApp().globalData.selectedRecordDate = date
    wx.switchTab({
      url: '/pages/record/record'
    })
  },

  /**
   * 长按删除记录
   */
  onRecordLongTap(e) {
    const date = e.currentTarget.dataset.date
    const that = this

    wx.showModal({
      title: '删除记录',
      content: '确定要删除该日期的记录吗？',
      success(res) {
        if (res.confirm) {
          that.deleteRecord(date)
        }
      }
    })
  },

  /**
   * 删除记录
   */
  deleteRecord(date) {
    const records = storage.getRecords()
    delete records[date]

    // 同时删除 periods 数组中的对应记录
    const periods = storage.getPeriods()
    const filteredPeriods = periods.filter(p => p.date !== date)

    storage.saveRecords(records)
    storage.savePeriods(filteredPeriods)

    wx.showToast({
      title: '已删除',
      icon: 'success'
    })

    this.loadRecords()
  },

  /**
   * 批量删除模式
   */
  startBatchDelete() {
    const that = this
    wx.showActionSheet({
      itemList: ['批量删除选中记录'],
      success(res) {
        if (res.tapIndex === 0) {
          that.setData({ batchDeleteMode: true })
          wx.showToast({
            title: '请点击要删除的记录',
            icon: 'none'
          })
        }
      }
    })
  },

  /**
   * 获取症状文本
   */
  getSymptomText(symptoms) {
    if (!symptoms || symptoms.length === 0) return ''

    const symptomMap = {
      'cramp': '腹痛',
      'headache': '头痛',
      'breast': '乳房胀痛',
      'tired': '疲劳',
      'mood': '情绪波动',
      'acne': '痘痘'
    }

    return symptoms.map(s => symptomMap[s] || s).join(', ')
  },

  /**
   * 获取流量文本
   */
  getFlowText(flow) {
    const flowMap = {
      'none': '无',
      'light': '少量',
      'medium': '中量',
      'heavy': '大量'
    }
    return flowMap[flow] || '无'
  },

  /**
   * 格式化日期显示
   */
  formatDisplayDate(dateStr) {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    if (dateStr === this.formatDate(today)) {
      return '今天'
    } else if (dateStr === this.formatDate(yesterday)) {
      return '昨天'
    }

    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]

    return `${month}月${day}日 ${weekday}`
  },

  formatDate(date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}-${month}-${day}`
  }
})
