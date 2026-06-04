// utils/storage.js - 数据持久化管理模块

/**
 * 获取数据版本
 */
function getDataVersion() {
  try {
    return wx.getStorageSync('dataVersion') || '1.0'
  } catch (e) {
    return '1.0'
  }
}

/**
 * 数据迁移
 */
function migrateData() {
  const currentVersion = getDataVersion()

  if (currentVersion === '1.0') {
    console.log('开始数据迁移：1.0 -> 2.0')

    // 升级到 2.0：添加 isPeriodStart/isPeriodEnd 字段
    const records = getRecords()
    let modified = false

    Object.keys(records).forEach(date => {
      const record = records[date]
      if (!record.isPeriodStart && !record.isPeriodEnd) {
        record.isPeriodStart = false
        record.isPeriodEnd = false
        record.createdAt = Date.now()
        record.updatedAt = Date.now()
        modified = true
      }
    })

    if (modified) {
      saveRecords(records)
    }

    wx.setStorageSync('dataVersion', '2.0')
    console.log('数据迁移完成')
  }
}

// 应用启动时执行数据迁移
migrateData()

/**
 * 保存经期记录
 * @param {Array} periods - 经期记录数组
 */
function savePeriods(periods) {
  try {
    wx.setStorageSync('periods', periods)
    console.log('经期记录保存成功', periods)
    return true
  } catch (e) {
    console.error('保存经期记录失败', e)
    wx.showToast({
      title: '保存失败',
      icon: 'none'
    })
    return false
  }
}

/**
 * 获取经期记录
 * @returns {Array} 经期记录数组
 */
function getPeriods() {
  try {
    return wx.getStorageSync('periods') || []
  } catch (e) {
    console.error('读取经期记录失败', e)
    return []
  }
}

/**
 * 添加一条经期记录
 * @param {Object} record - 经期记录 {date, flow, isPeriodStart, isPeriodEnd}
 */
function addPeriodRecord(record) {
  const periods = getPeriods()

  // 检查是否已存在该日期的记录
  const exists = periods.findIndex(p => p.date === record.date)

  if (exists >= 0) {
    // 更新已有记录
    periods[exists] = { ...periods[exists], ...record, updatedAt: Date.now() }
  } else {
    // 添加新记录
    periods.push({
      ...record,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
  }

  // 按日期排序
  periods.sort((a, b) => new Date(a.date) - new Date(b.date))

  return savePeriods(periods)
}

/**
 * 保存每日记录（含症状）
 * @param {Object} records - 记录对象 {date: {flow, symptoms, note, isPeriodStart, isPeriodEnd}}
 */
function saveRecords(records) {
  try {
    wx.setStorageSync('records', records)
    console.log('每日记录保存成功', records)
    return true
  } catch (e) {
    console.error('保存每日记录失败', e)
    wx.showToast({
      title: '保存失败',
      icon: 'none'
    })
    return false
  }
}

/**
 * 获取每日记录
 * @returns {Object} 记录对象
 */
function getRecords() {
  try {
    return wx.getStorageSync('records') || {}
  } catch (e) {
    console.error('读取每日记录失败', e)
    return {}
  }
}

/**
 * 获取单个日期的记录
 * @param {String} date - 日期字符串
 * @returns {Object} 记录对象
 */
function getRecordByDate(date) {
  const records = getRecords()
  return records[date] || null
}

/**
 * 更新单个日期的记录
 * @param {String} date - 日期字符串
 * @param {Object} data - 要更新的数据
 * @returns {Boolean} 是否成功
 */
function updateRecordByDate(date, data) {
  const records = getRecords()
  records[date] = {
    ...(records[date] || {}),
    ...data,
    updatedAt: Date.now()
  }
  return saveRecords(records)
}

/**
 * 标记经期开始
 * @param {String} date - 日期字符串
 * @param {String} flow - 经血量
 * @returns {Boolean} 是否成功
 */
function markPeriodStart(date, flow = 'medium') {
  const periods = getPeriods()

  // 检查是否已存在该日期的经期开始标记
  const exists = periods.findIndex(p => p.date === date)

  if (exists >= 0) {
    periods[exists] = {
      ...periods[exists],
      flow,
      isPeriodStart: true,
      updatedAt: Date.now()
    }
  } else {
    periods.push({
      date,
      flow,
      isPeriodStart: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
  }

  periods.sort((a, b) => new Date(a.date) - new Date(b.date))
  return savePeriods(periods)
}

/**
 * 清除结束日期之后的所有经期标记
 * @param {String} endDateStr - 结束日期字符串
 * @returns {Boolean} 是否成功
 */
function clearPeriodAfter(endDateStr) {
  const records = getRecords()
  const periods = getPeriods()
  
  console.log('=== 清除结束日期后的标记 ===')
  console.log('结束日期:', endDateStr)
  
  const endDate = new Date(endDateStr)
  let clearedCount = 0
  
  // 1. 清除结束日期之后的所有经期标记
  Object.keys(records).forEach(recordDate => {
    const record = records[recordDate]
    const recordDateObj = new Date(recordDate)
    
    // 如果这个日期在结束日期之后，清除经期标记
    if (recordDateObj > endDate) {
      console.log('清除经期标记:', recordDate)
      if (record.flow && record.flow !== 'none') {
        record.flow = 'none'
        clearedCount++
      }
      if (record.isPeriodStart) {
        record.isPeriodStart = false
      }
      if (record.isPeriodEnd) {
        record.isPeriodEnd = false
      }
      record.updatedAt = Date.now()
    }
  })
  
  console.log('清除了', clearedCount, '天的经期标记')
  
  // 2. 更新 periods 数组，清除结束日期之后的经期记录
  periods.forEach((period, index) => {
    const periodDate = new Date(period.date)
    if (periodDate > endDate) {
      console.log('从 periods 清除:', period.date)
      periods.splice(index, 1)
    }
  })
  
  // 3. 保存
  saveRecords(records)
  savePeriods(periods)
  
  console.log('=== 清除完成 ===')
  
  return true
}

/**
 * 标记经期结束（旧函数，保留兼容性）
 * @param {String} date - 日期字符串
 * @returns {Boolean} 是否成功
 */
function markPeriodEnd(date) {
  const records = getRecords()
  
  if (!records[date]) {
    records[date] = {
      flow: 'medium',
      symptoms: [],
      note: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }
  
  records[date].isPeriodEnd = true
  records[date].updatedAt = Date.now()
  saveRecords(records)
  
  // 调用新的清除函数
  return clearPeriodAfter(date)
}

/**
 * 保存用户设置
 * @param {Object} settings - 设置对象
 */
function saveSettings(settings) {
  try {
    wx.setStorageSync('settings', settings)
    console.log('设置保存成功', settings)
    return true
  } catch (e) {
    console.error('保存设置失败', e)
    return false
  }
}

/**
 * 获取用户设置
 * @returns {Object} 设置对象 {avgCycle: 28, avgPeriod: 5, reminderEnabled: true}
 */
function getSettings() {
  try {
    const defaultSettings = {
      avgCycle: 28,
      avgPeriod: 5,
      reminderEnabled: true,
      reminderTime: '08:00'
    }
    return { ...defaultSettings, ...wx.getStorageSync('settings') }
  } catch (e) {
    console.error('读取设置失败', e)
    return {
      avgCycle: 28,
      avgPeriod: 5,
      reminderEnabled: true,
      reminderTime: '08:00'
    }
  }
}

/**
 * 获取统计数据
 * @returns {Object} 统计数据
 */
function getStats() {
  const periods = getPeriods()
  const records = getRecords()
  const settings = getSettings()

  // 计算平均周期 - 使用动态算法
  const avgCycle = calculateAvgCycle(periods)

  // 统计症状频率
  const symptomStats = {}
  Object.values(records).forEach(record => {
    if (record.symptoms) {
      record.symptoms.forEach(symptom => {
        symptomStats[symptom] = (symptomStats[symptom] || 0) + 1
      })
    }
  })

  return {
    totalRecords: Object.keys(records).length,
    totalPeriods: periods.length,
    avgCycle,
    avgPeriod: settings.avgPeriod,
    symptomStats
  }
}

/**
 * 计算平均周期 - 使用最近 3 次实际周期，权重递减
 * @param {Array} periods - 经期记录数组
 * @returns {Number} 平均周期天数
 */
function calculateAvgCycle(periods) {
  if (periods.length < 2) {
    return 28
  }

  // 计算所有周期间隔
  const cycles = []
  for (let i = 1; i < periods.length; i++) {
    const diff = Math.floor((new Date(periods[i].date) - new Date(periods[i - 1].date)) / (1000 * 60 * 60 * 24))
    // 过滤异常数据（周期<15 天或>45 天视为异常）
    if (diff >= 15 && diff <= 45) {
      cycles.push(diff)
    }
  }

  if (cycles.length === 0) {
    return 28
  }

  // 使用最近 3 次周期，权重递减
  const maxCycles = Math.min(3, cycles.length)
  let weightedSum = 0
  let totalWeight = 0

  for (let i = 0; i < maxCycles; i++) {
    const weight = maxCycles - i // 最近的权重高
    weightedSum += cycles[cycles.length - 1 - i] * weight
    totalWeight += weight
  }

  return Math.round(weightedSum / totalWeight)
}

/**
 * 计算平均经期长度 - 使用实际记录的有流量天数
 * @param {Array} periods - 经期记录数组
 * @param {Object} records - 每日记录对象
 * @returns {Number} 平均经期天数
 */
function calculateAvgPeriodLength(periods, records) {
  if (periods.length === 0) {
    return 5
  }

  // 统计每次经期的长度（有流量的天数）
  const periodLengths = []
  const sortedPeriods = [...periods].sort((a, b) => new Date(a.date) - new Date(b.date))

  for (let i = 0; i < sortedPeriods.length; i++) {
    const period = sortedPeriods[i]
    const periodDate = new Date(period.date)
    let length = 0
    let hasRecord = true

    // 从经期开始日期往后数，直到遇到无流量的日期
    for (let day = 0; day < 10 && hasRecord; day++) {
      const checkDate = new Date(periodDate.getTime() + day * 24 * 60 * 60 * 1000)
      const dateStr = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}`
      const record = records[dateStr]

      if (record && record.flow && record.flow !== 'none') {
        length++
      } else if (day > 0) {
        // 如果不是第一天且遇到无流量，结束统计
        hasRecord = false
      }
    }

    if (length > 0) {
      periodLengths.push(length)
    }
  }

  if (periodLengths.length === 0) {
    return 5
  }

  // 返回平均值
  const sum = periodLengths.reduce((acc, val) => acc + val, 0)
  return sum / periodLengths.length
}

/**
 * 导出数据
 * @returns {String} JSON 格式数据
 */
function exportData() {
  const data = {
    version: '1.0.0',
    exportTime: new Date().toISOString(),
    periods: getPeriods(),
    records: getRecords(),
    settings: getSettings(),
    stats: getStats()
  }
  return JSON.stringify(data, null, 2)
}

/**
 * 导入数据
 * @param {String} jsonData - JSON 格式数据
 * @returns {Boolean} 是否成功
 */
function importData(jsonData) {
  try {
    const data = JSON.parse(jsonData)
    
    if (data.periods) savePeriods(data.periods)
    if (data.records) saveRecords(data.records)
    if (data.settings) saveSettings(data.settings)
    
    return true
  } catch (e) {
    console.error('导入数据失败', e)
    return false
  }
}

/**
 * 清空所有数据
 * @returns {Boolean} 是否成功
 */
function clearAllData() {
  try {
    wx.removeStorageSync('periods')
    wx.removeStorageSync('records')
    wx.removeStorageSync('settings')
    console.log('所有数据已清空')
    return true
  } catch (e) {
    console.error('清空数据失败', e)
    return false
  }
}

module.exports = {
  savePeriods,
  getPeriods,
  addPeriodRecord,
  saveRecords,
  getRecords,
  getRecordByDate,
  updateRecordByDate,
  markPeriodStart,
  markPeriodEnd,
  clearPeriodAfter,
  saveSettings,
  getSettings,
  getStats,
  calculateAvgCycle,
  calculateAvgPeriodLength,
  exportData,
  importData,
  clearAllData,
  getDataVersion
}
