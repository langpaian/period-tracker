// utils/device.js - 设备信息检测与适配

/**
 * 获取设备详细信息
 */
function getDeviceInfo() {
  try {
    const systemInfo = wx.getSystemInfoSync()
    
    return {
      model: systemInfo.model,
      brand: systemInfo.brand,
      platform: systemInfo.platform,
      system: systemInfo.system,
      pixelRatio: systemInfo.pixelRatio,
      screenWidth: systemInfo.screenWidth,
      screenHeight: systemInfo.screenHeight,
      windowWidth: systemInfo.windowWidth,
      windowHeight: systemInfo.windowHeight,
      statusBarHeight: systemInfo.statusBarHeight,
      safeArea: systemInfo.safeArea,
      SDKVersion: systemInfo.SDKVersion,
      version: systemInfo.version,
      isIOS: systemInfo.platform === 'ios',
      isAndroid: systemInfo.platform === 'android'
    }
  } catch (e) {
    console.error('[getDeviceInfo] error:', e)
    return null
  }
}

/**
 * 检测是否为 Xiao Note 7 Pro 机型
 */
function isXiaoNote7Pro() {
  const systemInfo = wx.getSystemInfoSync()
  const model = systemInfo.model.toLowerCase()
  const brand = (systemInfo.brand || '').toLowerCase()
  
  // 检测 Xiao Note 7 Pro 及其变体
  const isXiao = brand.includes('xiao') || model.includes('xiao')
  const isNote7 = model.includes('note 7') || model.includes('note7') || model.includes('note-7')
  const isPro = model.includes('pro') || model.includes('pro+')
  
  return isXiao && isNote7 && isPro
}

/**
 * 检测是否为特殊屏幕（刘海屏、挖孔屏等）
 */
function hasNotch() {
  const systemInfo = wx.getSystemInfoSync()
  return systemInfo.safeArea && systemInfo.safeArea.top > 20
}

/**
 * 获取屏幕适配参数
 */
function getScreenAdapter() {
  const systemInfo = wx.getSystemInfoSync()
  const { screenWidth, screenHeight, pixelRatio } = systemInfo
  
  // 标准屏幕参考（iPhone 8 为基准）
  const standardWidth = 375
  const standardHeight = 667
  
  // 计算缩放比例
  const scaleWidth = screenWidth / standardWidth
  const scaleHeight = screenHeight / standardHeight
  const scale = Math.min(scaleWidth, scaleHeight)
  
  return {
    scale,
    scaleWidth,
    scaleHeight,
    isWide: screenWidth / screenHeight > 0.5625, // 宽屏设备
    isSmall: screenWidth < 360, // 小屏设备
    isLarge: screenWidth > 414 // 大屏设备
  }
}

/**
 * 根据设备类型调整触摸灵敏度
 */
function getTouchSensitivity() {
  const deviceInfo = getDeviceInfo()
  
  // Xiao Note 7 Pro 可能需要更高的触摸灵敏度
  if (isXiaoNote7Pro()) {
    return {
      threshold: 8, // 像素阈值
      delay: 100, // 拖拽延迟（毫秒）
      longPressDelay: 400 // 长按延迟
    }
  }
  
  // 默认设置
  return {
    threshold: 10,
    delay: 150,
    longPressDelay: 500
  }
}

/**
 * 获取设备特定的样式类名
 */
function getDeviceClass() {
  const deviceInfo = getDeviceInfo()
  const classes = []
  
  // 添加平台类
  if (deviceInfo.isIOS) {
    classes.push('ios-device')
  } else if (deviceInfo.isAndroid) {
    classes.push('android-device')
  }
  
  // 添加机型特定类
  if (isXiaoNote7Pro()) {
    classes.push('xiao-note-7-pro')
  }
  
  // 添加屏幕类型类
  if (hasNotch()) {
    classes.push('notch-screen')
  }
  
  // 添加尺寸类
  const adapter = getScreenAdapter()
  if (adapter.isSmall) {
    classes.push('small-screen')
  } else if (adapter.isLarge) {
    classes.push('large-screen')
  }
  
  return classes.join(' ')
}

/**
 * 初始化设备适配
 */
function initDeviceAdapter(page) {
  const deviceInfo = getDeviceInfo()
  const isXiao = isXiaoNote7Pro()
  const touchSettings = getTouchSensitivity()
  
  if (page && page.setData) {
    page.setData({
      deviceInfo,
      isXiaoNote7Pro: isXiao,
      hasNotch: hasNotch(),
      screenAdapter: getScreenAdapter(),
      touchSettings
    })
  }
  
  console.log('[DeviceAdapter] 初始化完成', {
    model: deviceInfo?.model,
    isXiaoNote7Pro: isXiao,
    screen: `${deviceInfo?.screenWidth}x${deviceInfo?.screenHeight}`,
    touchSettings
  })
  
  return {
    deviceInfo,
    isXiaoNote7Pro: isXiao,
    hasNotch: hasNotch(),
    screenAdapter: getScreenAdapter(),
    touchSettings
  }
}

module.exports = {
  getDeviceInfo,
  isXiaoNote7Pro,
  hasNotch,
  getScreenAdapter,
  getTouchSensitivity,
  getDeviceClass,
  initDeviceAdapter
}
