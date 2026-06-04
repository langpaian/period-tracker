// pages/record/record.js
const storage = require('../../utils/storage.js')

Page({
  data: {
    selectedDate: '',
    flow: 'none',
    // 使用独立的布尔变量控制每个症状的选中状态
    symptomCramp: false,
    symptomHeadache: false,
    symptomBreast: false,
    symptomTired: false,
    symptomMood: false,
    symptomAcne: false,
    symptoms: [], // 保存时用的数组
    note: '',
    // 编辑状态
    isEdit: false,
    lastEditTime: ''
  },

  // 标记是否从首页传递了日期（用于 onShow 中判断是否需要更新日期）
  hasPendingDate: false,

  onLoad(options) {
    const today = new Date()
    let dateStr = this.formatDate(today)

    console.log('=== record onLoad ===')

    // 优先级：URL 参数 > 今天
    if (options && options.date) {
      // 从 URL 参数获取（如果是 navigateTo 跳转）
      dateStr = options.date
      console.log('从 URL 获取日期:', dateStr)
    } else if (getApp().globalData.selectedRecordDate) {
      // 从全局变量获取（如果是首次 switchTab 跳转）
      dateStr = getApp().globalData.selectedRecordDate
      console.log('从全局变量获取日期:', dateStr)
      this.hasPendingDate = true
    }

    this.setData({ selectedDate: dateStr })
    this.loadRecordForDate(dateStr)
  },

  onShow() {
    console.log('=== record onShow ===')
    console.log('全局变量 selectedRecordDate:', getApp().globalData.selectedRecordDate)

    // 如果有全局变量传递的日期（从首页 switchTab 过来）
    if (getApp().globalData.selectedRecordDate) {
      const dateStr = getApp().globalData.selectedRecordDate
      console.log('onShow 从全局变量获取日期:', dateStr)

      // 清空全局变量
      getApp().globalData.selectedRecordDate = null

      // 更新日期并加载记录
      this.setData({ selectedDate: dateStr })
      this.loadRecordForDate(dateStr)
    } else {
      // 没有传递日期，加载当前选中日期的记录
      this.loadRecordForDate(this.data.selectedDate)
    }
  },

  loadRecordForDate(dateStr) {
    const records = storage.getRecords()
    const dayRecord = records[dateStr]

    console.log('加载日期:', dateStr)
    console.log('该日期记录:', dayRecord)

    // 默认初始化：所有症状都是未选中状态
    const defaultData = {
      flow: 'none',
      symptomCramp: false,
      symptomHeadache: false,
      symptomBreast: false,
      symptomTired: false,
      symptomMood: false,
      symptomAcne: false,
      symptoms: [],
      note: '',
      isEdit: false,
      lastEditTime: ''
    }

    // 如果有记录，加载实际数据
    if (dayRecord) {
      const symptoms = dayRecord.symptoms || []
      console.log('症状列表:', symptoms)

      this.setData({
        flow: dayRecord.flow || 'none',
        symptomCramp: symptoms.includes('cramp'),
        symptomHeadache: symptoms.includes('headache'),
        symptomBreast: symptoms.includes('breast'),
        symptomTired: symptoms.includes('tired'),
        symptomMood: symptoms.includes('mood'),
        symptomAcne: symptoms.includes('acne'),
        symptoms: symptoms,
        note: dayRecord.note || '',
        isEdit: true,
        lastEditTime: dayRecord.updatedAt ? this.formatRelativeTime(dayRecord.updatedAt) : ''
      })
    } else {
      // 没有记录，使用默认初始化
      console.log('该日期无记录，使用默认初始化')
      this.setData(defaultData)
    }
  },

  /**
   * 格式化相对时间
   */
  formatRelativeTime(timestamp) {
    const now = Date.now()
    const diff = now - timestamp

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
    return this.formatDate(new Date(timestamp))
  },

  /**
   * 选择日期
   */
  selectDate() {
    const that = this
    const currentDate = this.parseDate(this.data.selectedDate)

    wx.showModal({
      title: '选择日期',
      editable: true,
      placeholderText: '输入日期 (格式：2026-4-15)',
      content: `当前：${this.data.selectedDate}`,
      success(res) {
        if (res.confirm && res.content) {
          // 验证日期格式
          const newDate = that.parseDate(res.content)
          if (newDate) {
            const dateStr = that.formatDate(newDate)
            that.setData({ selectedDate: dateStr })
            that.loadRecordForDate(dateStr)
            wx.showToast({
              title: '已切换日期',
              icon: 'success'
            })
          } else {
            wx.showToast({
              title: '日期格式错误',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  /**
   * 前一天
   */
  prevDay() {
    const currentDate = this.parseDate(this.data.selectedDate)
    if (!currentDate) return

    const prevDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000)
    const dateStr = this.formatDate(prevDate)
    this.setData({ selectedDate: dateStr })
    this.loadRecordForDate(dateStr)
  },

  /**
   * 后一天
   */
  nextDay() {
    const currentDate = this.parseDate(this.data.selectedDate)
    if (!currentDate) return

    const nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
    const dateStr = this.formatDate(nextDate)
    this.setData({ selectedDate: dateStr })
    this.loadRecordForDate(dateStr)
  },

  formatDate(date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}-${month}-${day}`
  },

  parseDate(dateStr) {
    const parts = dateStr.split(/[-/]/)
    if (parts.length === 3) {
      const year = parseInt(parts[0])
      const month = parseInt(parts[1])
      const day = parseInt(parts[2])
      if (year > 2000 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return new Date(year, month - 1, day)
      }
    }
    return null
  },

  selectFlow(e) {
    const flow = e.currentTarget.dataset.flow
    this.setData({ flow })
  },

  toggleSymptom(e) {
    const symptom = e.currentTarget.dataset.symptom
    
    if (!symptom) {
      wx.showToast({
        title: '症状数据错误',
        icon: 'none'
      })
      return
    }
    
    // 根据症状类型切换对应的布尔变量
    const varName = 'symptom' + symptom.charAt(0).toUpperCase() + symptom.slice(1)
    const currentValue = this.data[varName]
    const newValue = !currentValue
    
    console.log('切换症状:', symptom, '从', currentValue, '到', newValue)
    
    // 更新布尔变量
    this.setData({ [varName]: newValue })
    
    // 更新症状数组
    let symptoms = this.data.symptoms || []
    const index = symptoms.indexOf(symptom)
    
    if (newValue) {
      // 选中：添加到数组
      if (index === -1) {
        symptoms.push(symptom)
      }
    } else {
      // 取消：从数组移除
      if (index > -1) {
        symptoms.splice(index, 1)
      }
    }
    
    this.setData({ symptoms })
    console.log('当前症状数组:', symptoms)
  },

  onNoteInput(e) {
    this.setData({
      note: e.detail.value
    })
  },

  saveRecord() {
    const { selectedDate, flow, symptoms, note } = this.data
    const today = selectedDate  // 使用选中的日期

    console.log('=== 开始保存 ===')
    console.log('日期:', today)
    console.log('流量:', flow)
    console.log('症状:', symptoms)
    console.log('备注:', note)

    // 显示加载提示
    wx.showToast({
      title: '保存中...',
      icon: 'loading',
      duration: 1000
    })

    // 获取当前记录（用于判断流量变化）
    const records = storage.getRecords()
    const oldRecord = records[today]
    const oldFlow = oldRecord ? oldRecord.flow : 'none'
    
    console.log('旧流量:', oldFlow, '新流量:', flow)

    // 逻辑优化：
    // 1. 从"无"改为"有流量" = 经期开始，自动填充后续 5 天
    // 2. 从"有流量"改为"无" = 经期结束，清除后面的标记
    
    // 情况 1：从"无"改为"有流量" → 标记为经期开始，自动填充 5 天
    if (oldFlow === 'none' && flow !== 'none') {
      console.log('检测到用户开始记录经期，自动填充后续 5 天')
      storage.markPeriodStart(today, flow)
    }
    
    // 情况 2：从"有流量"改为"无" → 清除后续经期标记
    if (oldFlow !== 'none' && flow === 'none') {
      console.log('检测到用户结束经期，清除后续标记')
      storage.clearPeriodAfter(today)
    }
    
    // 情况 3：流量不变或只是修改流量大小 → 只保存记录
    if (oldFlow !== 'none' && flow !== 'none') {
      console.log('更新经期记录（流量变化但非开始/结束）')
    }

    // 保存详细记录
    records[today] = {
      flow,
      symptoms,
      note,
      isPeriodStart: flow !== 'none',  // 自动推断：有流量=开始
      isPeriodEnd: flow === 'none',    // 自动推断：无流量=结束
      createdAt: oldRecord?.createdAt || Date.now(),
      updatedAt: Date.now()
    }
    const saveSuccess = storage.saveRecords(records)
    console.log('保存详细记录:', saveSuccess)

    // 延迟显示成功提示并跳转
    setTimeout(() => {
      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 2000
      })

      console.log('=== 保存完成 ===')

      // 延迟跳转到首页
      setTimeout(() => {
        console.log('跳转到首页')
        wx.switchTab({
          url: '/pages/index/index'
        })
      }, 1500)
    }, 500)
  }
})
