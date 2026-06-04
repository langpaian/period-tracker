// app.js
App({
  onLaunch() {
    // 初始化本地存储
    const periods = wx.getStorageSync('periods') || []
    const symptoms = wx.getStorageSync('symptoms') || []

    if (!periods) {
      wx.setStorageSync('periods', [])
    }
    if (!symptoms) {
      wx.setStorageSync('symptoms', [])
    }

    console.log('经期记录小程序启动')
  },

  globalData: {
    userInfo: null,
    periods: [],
    symptoms: [],
    selectedRecordDate: null  // 用于从首页传递日期到记录页
  }
})
