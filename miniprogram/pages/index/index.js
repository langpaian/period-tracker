// pages/index/index.js
const storage = require('../../utils/storage.js')
const device = require('../../utils/device.js')

Page({
  data: {
    isPeriod: false,
    isOvulation: false,
    periodDay: 0,
    ovulationDays: 0,
    nextPeriodDays: 0,
    nextPeriodDate: '-',
    ovulationDate: '-',
    avgCycle: 28,
    avgPeriod: 5,
    
    // 日历相关
    currentYear: 0,
    currentMonth: 0,
    calendarDays: [],
    selectedDate: '',

    // 备注弹窗相关
    noteModalVisible: false,
    noteModalDate: '',
    noteModalContent: '',
    
    // 拖拽选择相关
    dragStart: null,
    dragEnd: null,
    isDragging: false,
    dragRange: []
  },

  // 双击相关变量（不在 data 中）
  lastClickDate: '',
  lastClickTime: 0,
  
  // 拖拽相关变量
  dragStart: null,
  dragEnd: null,
  isDragging: false,
  dragRange: [],
  touchStartTime: 0,
  longPressTimer: null,

  onLoad() {
    const today = new Date()
    
    // 设备检测与适配
    const deviceInfo = device.getDeviceInfo()
    const isXiao = device.isXiaoNote7Pro()
    const touchSettings = device.getTouchSensitivity()
    
    console.log('[onLoad] 设备信息:', deviceInfo.model, 'Xiao Note 7 Pro:', isXiao)
    
    this.setData({
      currentYear: today.getFullYear(),
      currentMonth: today.getMonth() + 1,
      selectedDate: '',
      isXiaoNote7Pro: isXiao,
      deviceModel: deviceInfo.model,
      touchSettings
    })
    
    this.loadPeriodData()
    this.generateCalendar()
  },

  onShow() {
    this.loadPeriodData()
    this.generateCalendar()
  },

  loadPeriodData() {
    const settings = storage.getSettings()
    const periods = storage.getPeriods()
    
    if (periods.length > 0) {
      const lastPeriod = periods[periods.length - 1]
      const today = new Date()
      const lastDate = new Date(lastPeriod.date)
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24))
      
      const isPeriod = diffDays < 5
      const periodDay = isPeriod ? diffDays + 1 : 0
      const nextPeriodDays = Math.max(0, 28 - diffDays)
      const nextPeriodDate = this.formatDate(new Date(today.getTime() + nextPeriodDays * 24 * 60 * 60 * 1000))
      const ovulationDays = Math.max(0, nextPeriodDays - 14)
      const ovulationDate = this.formatDate(new Date(today.getTime() + (nextPeriodDays - 14) * 24 * 60 * 60 * 1000))
      const isOvulation = ovulationDays <= 3 && ovulationDays >= 0
      
      let avgCycle = settings.avgCycle
      if (periods.length > 1) {
        let totalCycle = 0
        for (let i = 1; i < periods.length; i++) {
          const d1 = new Date(periods[i].date)
          const d2 = new Date(periods[i-1].date)
          totalCycle += Math.floor((d1 - d2) / (1000 * 60 * 60 * 24))
        }
        avgCycle = Math.round(totalCycle / (periods.length - 1))
      }
      
      // 检查是否需要提醒
      this.checkReminder(periods, settings)
      
      this.setData({
        isPeriod,
        isOvulation,
        periodDay,
        nextPeriodDays,
        nextPeriodDate,
        ovulationDays,
        ovulationDate,
        avgCycle
      })
    }
  },

  generateCalendar() {
    const { currentYear, currentMonth, selectedDate, dragRange } = this.data
    const periods = storage.getPeriods()
    const records = storage.getRecords()
    const today = new Date()

    console.log('[generateCalendar] currentYear:', currentYear, 'currentMonth:', currentMonth, 'selectedDate:', selectedDate, 'dragRange:', dragRange)

    const firstDay = new Date(currentYear, currentMonth - 1, 1)
    const lastDay = new Date(currentYear, currentMonth, 0)
    const startWeekday = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const calendarDays = []

    // 计算平均周期和经期长度，用于预测
    const avgCycle = storage.calculateAvgCycle(periods)
    const avgPeriod = storage.calculateAvgPeriodLength(periods, records)

    // 找到最后一次经期开始日期
    const lastPeriod = periods.length > 0 ? periods[periods.length - 1] : null

    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(currentYear, currentMonth - 1, i)
      const dateStr = this.formatDate(date)

      const isToday = dateStr === this.formatDate(today)

      let isPeriod = false
      let isPredictedPeriod = false  // 预测的经期
      let isOvulation = false
      let isPredictedOvulation = false  // 预测的排卵期
      let hasSymptoms = false

      // 检查实际记录的经期
      periods.forEach(period => {
        const periodDate = new Date(period.date)
        const diff = Math.floor((date - periodDate) / (1000 * 60 * 60 * 24))
        if (diff >= 0 && diff < avgPeriod) {
          isPeriod = true
        }
        // 排卵期：经期开始后第 10-15 天
        if (diff >= 10 && diff < 15) {
          isOvulation = true
        }
      })

      // 如果没有实际记录，使用预测
      if (!isPeriod && lastPeriod) {
        const lastPeriodDate = new Date(lastPeriod.date)
        const daysSinceLastPeriod = Math.floor((date - lastPeriodDate) / (1000 * 60 * 60 * 24))

        // 预测下次经期
        if (daysSinceLastPeriod >= avgCycle && daysSinceLastPeriod < avgCycle + avgPeriod) {
          isPredictedPeriod = true
        }

        // 预测排卵期（下次经期前 14 天）
        const predictedNextPeriod = avgCycle - daysSinceLastPeriod
        if (predictedNextPeriod > 0 && predictedNextPeriod <= 5) {
          isPredictedOvulation = true
        }
      }

      // 检查是否有症状记录
      const dayRecord = records[dateStr]
      if (dayRecord && dayRecord.symptoms && dayRecord.symptoms.length > 0) {
        hasSymptoms = true
      }

      // 检查是否有备注
      const hasNote = dayRecord && dayRecord.note && dayRecord.note.trim() !== ''

      const isSelected = dateStr === selectedDate
      if (isSelected) {
        console.log('[generateCalendar] 选中日期:', dateStr)
      }
      
      // 检查是否在拖拽范围内
      let isRangeSelected = false
      let isRangeStart = false
      let isRangeEnd = false
      
      if (dragRange && dragRange.length > 0) {
        isRangeSelected = dragRange.includes(dateStr)
        isRangeStart = dragRange[0] === dateStr
        isRangeEnd = dragRange[dragRange.length - 1] === dateStr
      }
      if (isRangeSelected) {
        console.log('[generateCalendar] 范围选中:', dateStr, 'start:', isRangeStart, 'end:', isRangeEnd)
      }

      calendarDays.push({
        day: i,
        date: dateStr,
        isToday,
        isPeriod,
        isPredictedPeriod,
        isOvulation,
        isPredictedOvulation,
        hasSymptoms,
        hasNote,
        isSelected,
        isRangeSelected,
        isRangeStart,
        isRangeEnd
      })
    }

    this.setData({ calendarDays })
    console.log('[generateCalendar] calendarDays 已设置')
  },

  prevMonth() {
    let { currentYear, currentMonth } = this.data
    if (currentMonth === 1) {
      currentMonth = 12
      currentYear--
    } else {
      currentMonth--
    }
    this.setData({ currentYear, currentMonth })
    this.generateCalendar()
  },

  nextMonth() {
    let { currentYear, currentMonth } = this.data
    if (currentMonth === 12) {
      currentMonth = 1
      currentYear++
    } else {
      currentMonth++
    }
    this.setData({ currentYear, currentMonth })
    this.generateCalendar()
  },

  /**
   * 选择月份
   */
  selectMonth() {
    const that = this
    const months = []
    for (let i = 1; i <= 12; i++) {
      months.push(i + '月')
    }
    
    wx.showActionSheet({
      itemList: months,
      success: (res) => {
        const selectedMonth = res.tapIndex + 1
        that.setData({ currentMonth: selectedMonth })
        that.generateCalendar()
      }
    })
  },

  onDayTap(e) {
    const date = e.currentTarget.dataset.date
    const now = Date.now()

    console.log('点击日期:', date, '时间:', now, '上次点击:', this.lastClickDate, this.lastClickTime)

    // 检查是否是双击（500ms 内点击同一日期）
    const isDoubleClick = (date === this.lastClickDate) && (now - this.lastClickTime < 500)

    if (isDoubleClick) {
      console.log('双击 detected，跳转记录页')
      console.log('准备设置全局变量，日期为:', date)

      // 双击：跳转到记录页
      getApp().globalData.selectedRecordDate = date
      console.log('全局变量已设置:', getApp().globalData.selectedRecordDate)

      wx.switchTab({
        url: '/pages/record/record',
        fail: (err) => {
          console.error('switchTab 失败:', err)
        }
      })

      // 重置双击状态
      this.lastClickDate = ''
      this.lastClickTime = 0
    } else {
      // 单击：切换选中状态
      console.log('单击，切换选中状态到', date)

      const { selectedDate } = this.data
      let newSelectedDate = date
      if (selectedDate === date) {
        // 如果点击的是已选中的日期，取消选中
        newSelectedDate = ''
        wx.showToast({
          title: '已取消选中',
          icon: 'none',
          duration: 800
        })
      } else {
        // 选中新的日期
        wx.showToast({
          title: '再点一次记录',
          icon: 'none',
          duration: 800
        })
      }

      // 记录点击信息，用于判断双击
      this.lastClickDate = date
      this.lastClickTime = now

      // 更新选中状态并重新生成日历（使用回调确保顺序）
      this.setData({ selectedDate: newSelectedDate }, () => {
        this.generateCalendar()
      })
    }
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
      if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return new Date(year, month - 1, day)
      }
    }
    return null
  },

  goToRecord() {
    // 如果有选中的日期，跳转到记录页并传递日期
    if (this.data.selectedDate) {
      wx.navigateTo({
        url: '/pages/record/record?date=' + this.data.selectedDate
      })
    } else {
      wx.switchTab({
        url: '/pages/record/record'
      })
    }
  },

  goToStats() {
    wx.switchTab({
      url: '/pages/stats/stats'
    })
  },

  goToProfile() {
    wx.switchTab({
      url: '/pages/profile/profile'
    })
  },

  goToHistory() {
    wx.navigateTo({
      url: '/pages/history/history'
    })
  },

  /**
   * 检查提醒
   */
  checkReminder(periods, settings) {
    if (!settings.reminderEnabled) return

    const today = new Date()
    const lastPeriod = periods[periods.length - 1]
    if (!lastPeriod) return

    const lastDate = new Date(lastPeriod.date)
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24))
    const nextPeriodDays = Math.max(0, settings.avgCycle - diffDays)

    // 经期即将来临（3 天内）
    if (nextPeriodDays <= 3 && nextPeriodDays > 0) {
      wx.showModal({
        title: '💡 温馨提醒',
        content: `您的经期预计${nextPeriodDays}天后来临，请提前做好准备哦~`,
        showCancel: false,
        confirmText: '知道了'
      })
    }

    // 排卵期提醒
    const ovulationDays = Math.max(0, nextPeriodDays - 14)
    if (ovulationDays <= 2 && ovulationDays >= 0 && nextPeriodDays > 14) {
      wx.showModal({
        title: '🌸 排卵期提醒',
        content: '未来 3 天是您的排卵期，请注意身体变化哦~',
        showCancel: false,
        confirmText: '知道了'
      })
    }

    // 智能提示：异常周期检测（周期间隔<21 天或>35 天）
    if (periods.length >= 2) {
      const lastCycle = []
      for (let i = 1; i < periods.length; i++) {
        const d1 = new Date(periods[i].date)
        const d2 = new Date(periods[i - 1].date)
        const cycleDays = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24))
        lastCycle.push(cycleDays)
      }
      // 检查最近一次周期
      const latestCycle = lastCycle[lastCycle.length - 1]
      if (latestCycle < 21 || latestCycle > 35) {
        let tipContent = ''
        if (latestCycle < 21) {
          tipContent = `您的最近周期为${latestCycle}天，短于 21 天。周期过短可能与压力、作息变化有关，如持续异常建议咨询医生。`
        } else {
          tipContent = `您的最近周期为${latestCycle}天，超过 35 天。周期过长可能与压力、体重变化或多囊卵巢综合征有关，如持续异常建议咨询医生。`
        }

        wx.showModal({
          title: '⚠️ 周期提示',
          content: tipContent,
          showCancel: false,
          confirmText: '知道了'
        })
      }
    }

    // 智能提示：长经期检测（经期>7 天）
    const records = storage.getRecords()
    const avgPeriod = storage.calculateAvgPeriodLength(periods, records)
    if (avgPeriod > 7) {
      wx.showModal({
        title: '📊 经期长度提示',
        content: `您的平均经期长度为${Math.round(avgPeriod)}天，超过 7 天。经期过长可能导致贫血或疲劳，建议适度休息、补充营养，如持续异常可咨询医生。`,
        showCancel: false,
        confirmText: '知道了'
      })
    }
  },

  startRecord() {
    wx.switchTab({
      url: '/pages/record/record'
    })
  },

  openCommunity() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  /**
   * 点击备注图标 - 显示备注弹窗
   */
  onNoteTap(e) {
    const date = e.currentTarget.dataset.date
    console.log('点击备注图标:', date)

    const records = storage.getRecords()
    const record = records[date]

    if (record && record.note && record.note.trim() !== '') {
      this.setData({
        noteModalVisible: true,
        noteModalDate: date,
        noteModalContent: record.note
      })
    } else {
      wx.showToast({
        title: '该日期没有备注',
        icon: 'none'
      })
    }
  },

  /**
   * 隐藏备注弹窗
   */
  hideNoteModal() {
    this.setData({
      noteModalVisible: false
    })
  },

  /**
   * 编辑备注 - 跳转到记录页面
   */
  editNote() {
    const { noteModalDate } = this.data
    this.setData({ noteModalVisible: false })

    // 跳转到记录页面
    getApp().globalData.selectedRecordDate = noteModalDate
    wx.switchTab({
      url: '/pages/record/record'
    })
  },

  /**
   * 点击症状图标
   */
  onSymptomTap(e) {
    const date = e.currentTarget.dataset.date
    console.log('点击症状图标:', date)

    // 跳转到记录页面查看症状
    getApp().globalData.selectedRecordDate = date
    wx.switchTab({
      url: '/pages/record/record'
    })
  },

  /**
   * 触摸开始 - 长按或拖拽的起点
   */
  onTouchStart(e) {
    const touch = e.touches[0]
    const element = this.getElementFromPoint(touch.clientX, touch.clientY)
    const date = element?.dataset?.date
    
    if (!date) return
    
    console.log('[onTouchStart] 日期:', date)
    
    // 记录触摸开始时间（用于判断长按）
    this.touchStartTime = Date.now()
    
    // 设置拖拽起始点
    this.setData({
      dragStart: date,
      dragEnd: date,
      isDragging: true,
      selectedDate: date,
      dragRange: [date]
    })
    
    // 长按检测（500ms 后进入拖拽模式）
    this.longPressTimer = setTimeout(() => {
      if (this.touchStartTime > 0) {
        wx.vibrateShort({ type: 'light' }) // 震动反馈
        wx.showToast({
          title: '滑动选择日期范围',
          icon: 'none',
          duration: 1500
        })
      }
    }, 500)
  },

  /**
   * 触摸移动 - 拖拽过程
   */
  onTouchMove(e) {
    if (!this.data.isDragging) return
    
    const touch = e.touches[0]
    const element = this.getElementFromPoint(touch.clientX, touch.clientY)
    const date = element?.dataset?.date
    
    if (date && date !== this.data.dragEnd) {
      // 清除长按定时器（已经开始拖拽）
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer)
        this.longPressTimer = null
      }
      
      this.setData({ dragEnd: date })
      this.updateDragRange()
    }
  },

  /**
   * 触摸结束 - 完成选择
   */
  onTouchEnd(e) {
    // 清除长按定时器
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    
    const touchDuration = Date.now() - this.touchStartTime
    
    // 如果触摸时间小于 300ms，视为普通点击，不处理拖拽
    if (touchDuration < 300 && this.data.dragStart === this.data.dragEnd) {
      this.resetDragState()
      return
    }
    
    if (!this.data.isDragging) return
    
    const { dragStart, dragEnd, dragRange } = this.data
    
    console.log('[onTouchEnd] 起始:', dragStart, '结束:', dragEnd, '范围:', dragRange.length)
    
    // 如果选择了多个日期，提示批量操作
    if (dragRange.length > 1) {
      wx.showModal({
        title: '批量记录',
        content: `已选择 ${dragRange.length} 天 (${dragStart} 至 ${dragEnd})，是否记录相同的症状和流量？`,
        confirmText: '批量记录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.batchRecord()
          }
        }
      })
    }
    
    this.resetDragState()
  },

  /**
   * 触摸取消
   */
  onTouchCancel(e) {
    // 清除长按定时器
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    this.resetDragState()
  },

  /**
   * 根据坐标获取元素
   */
  getElementFromPoint(x, y) {
    // 小程序中无法直接使用 document.elementFromPoint
    // 通过 systemInfo 和布局计算近似位置
    // 这里简化处理，返回 null，由 touchmove 的事件代理处理
    return {}
  },

  /**
   * 更新拖拽范围
   */
  updateDragRange() {
    const { dragStart, dragEnd } = this.data
    if (!dragStart || !dragEnd) return
    
    const startDate = new Date(dragStart)
    const endDate = new Date(dragEnd)
    
    // 确保 startDate <= endDate
    if (startDate > endDate) {
      [startDate, endDate] = [endDate, startDate]
    }
    
    // 计算范围内的所有日期
    const range = []
    const current = new Date(startDate)
    
    while (current <= endDate) {
      range.push(this.formatDate(current))
      current.setDate(current.getDate() + 1)
    }
    
    this.setData({ 
      dragRange: range,
      selectedDate: dragEnd // 更新选中日期为当前拖拽位置
    })
    
    // 重新生成日历以显示范围高亮
    this.generateCalendar()
  },

  /**
   * 重置拖拽状态
   */
  resetDragState() {
    this.setData({
      dragStart: null,
      dragEnd: null,
      isDragging: false,
      dragRange: []
    })
    this.touchStartTime = 0
    this.generateCalendar()
  },

  /**
   * 批量记录 - 将当前选中日期的记录应用到范围内所有日期
   */
  batchRecord() {
    const { dragRange, selectedDate } = this.data
    
    if (dragRange.length === 0) {
      wx.showToast({
        title: '未选择日期范围',
        icon: 'none'
      })
      return
    }
    
    // 获取选中日期的记录
    const records = storage.getRecords()
    const sourceRecord = records[selectedDate]
    
    if (!sourceRecord) {
      wx.showToast({
        title: '源日期无记录，请先记录',
        icon: 'none'
      })
      return
    }
    
    // 批量应用到范围内所有日期
    let count = 0
    dragRange.forEach(date => {
      if (date !== selectedDate) { // 跳过源日期
        records[date] = {
          ...sourceRecord,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        count++
      }
    })
    
    storage.saveRecords(records)
    
    wx.showToast({
      title: `已批量记录 ${count + 1} 天`,
      icon: 'success',
      duration: 2000
    })
    
    // 刷新日历显示
    setTimeout(() => {
      this.generateCalendar()
    }, 1500)
  }
})
