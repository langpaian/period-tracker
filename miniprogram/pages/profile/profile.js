// pages/profile/profile.js
const storage = require('../../utils/storage.js')

Page({
  data: {
    stats: {
      totalRecords: 0,
      totalPeriods: 0,
      avgCycle: 28,
      symptomStats: {}
    },
    symptomCount: 0,
    settings: {
      avgCycle: 28,
      avgPeriod: 5,
      reminderEnabled: true,
      reminderTime: '08:00'
    }
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  /**
   * 加载数据
   */
  loadData() {
    const stats = storage.getStats()
    const settings = storage.getSettings()
    const symptomCount = Object.keys(stats.symptomStats || {}).length
    
    this.setData({
      stats,
      symptomCount,
      settings
    })
  },

  /**
   * 打开周期设置
   */
  openCycleSettings() {
    const that = this
    wx.showModal({
      title: '周期设置',
      editable: true,
      placeholderText: '输入平均周期天数（20-45）',
      content: `当前平均周期：${this.data.settings.avgCycle}天`,
      success(res) {
        if (res.confirm) {
          const cycle = parseInt(res.content)
          if (cycle >= 20 && cycle <= 45) {
            const newSettings = { ...that.data.settings, avgCycle: cycle }
            storage.saveSettings(newSettings)
            that.setData({ settings: newSettings })
            wx.showToast({
              title: '设置已保存',
              icon: 'success'
            })
          } else {
            wx.showToast({
              title: '请输入 20-45 之间的数字',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  /**
   * 切换提醒功能
   */
  toggleReminder(e) {
    const enabled = e.detail.value
    const newSettings = { ...this.data.settings, reminderEnabled: enabled }
    storage.saveSettings(newSettings)
    this.setData({ settings: newSettings })
    
    wx.showToast({
      title: enabled ? '提醒已开启' : '提醒已关闭',
      icon: 'success'
    })
  },

  /**
   * 打开关于
   */
  openAbout() {
    wx.showModal({
      title: '关于经期记录',
      content: '经期记录小程序 v1.0.0 正式版\n\n功能：\n• 经期记录与预测\n• 排卵期计算\n• 症状追踪\n• 数据统计\n• 数据导出/导入\n• 提醒功能\n\n本应用使用本地存储，保护您的隐私安全。',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  /**
   * 导出数据
   */
  exportData() {
    const data = storage.exportData()
    const fileName = `period_data_${new Date().toISOString().split('T')[0]}.json`
    
    // 保存到临时文件
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
    const fs = wx.getFileSystemManager()
    
    fs.writeFile({
      filePath,
      data,
      encoding: 'utf8',
      success: () => {
        wx.showModal({
          title: '导出成功',
          content: `数据已导出到：${fileName}\n\n请在文件管理中找到此文件进行备份。`,
          showCancel: false,
          confirmText: '好的'
        })
      },
      fail: (err) => {
        wx.showToast({
          title: '导出失败',
          icon: 'none'
        })
        console.error('导出失败', err)
      }
    })
  },

  /**
   * 导入数据
   */
  importData() {
    const that = this
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json'],
      success: (res) => {
        const filePath = res.tempFiles[0].path
        const fs = wx.getFileSystemManager()
        
        fs.readFile({
          filePath,
          encoding: 'utf8',
          success: (readRes) => {
            wx.showModal({
              title: '确认导入',
              content: '导入数据将覆盖当前所有数据，确定继续吗？',
              success: (confirmRes) => {
                if (confirmRes.confirm) {
                  const success = storage.importData(readRes.data)
                  if (success) {
                    wx.showToast({
                      title: '导入成功',
                      icon: 'success'
                    })
                    that.loadData()
                  } else {
                    wx.showToast({
                      title: '导入失败：文件格式错误',
                      icon: 'none'
                    })
                  }
                }
              }
            })
          },
          fail: () => {
            wx.showToast({
              title: '读取文件失败',
              icon: 'none'
            })
          }
        })
      },
      fail: (err) => {
        if (err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({
            title: '选择文件失败',
            icon: 'none'
          })
        }
      }
    })
  },

  /**
   * 清空数据
   */
  clearData() {
    const that = this
    wx.showModal({
      title: '⚠️ 警告',
      content: '确定要清空所有数据吗？此操作不可恢复！\n\n建议先导出数据备份。',
      confirmColor: '#FF4444',
      success: (res) => {
        if (res.confirm) {
          // 二次确认
          wx.showModal({
            title: '再次确认',
            content: '真的要清空所有数据吗？\n\n• 所有经期记录\n• 所有症状记录\n• 所有设置\n\n都将被删除！',
            confirmColor: '#FF4444',
            success: (res2) => {
              if (res2.confirm) {
                const success = storage.clearAllData()
                if (success) {
                  wx.showToast({
                    title: '已清空',
                    icon: 'success'
                  })
                  that.loadData()
                } else {
                  wx.showToast({
                    title: '清空失败',
                    icon: 'none'
                  })
                }
              }
            }
          })
        }
      }
    })
  }
})
