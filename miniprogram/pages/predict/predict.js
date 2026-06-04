// pages/predict/predict.js
Page({
  data: {
    nextPeriodDate: '',
    daysToNext: 0,
    confidence: 85,
    ovulationDate: '',
    daysToOvulation: 0,
    isEasyPregnant: false,
    fertileTip: '备孕/避孕',
    fertileWindow: null,
    fertilityPurpose: 'contraception', // pregnancy/contraception
    cycleLength: 28,
    periodLength: 5,
    tips: []
  },

  onLoad() {
    // 加载用户设置
    this.loadUserSettings();
    // 计算预测
    this.calculatePrediction();
  },

  onShow() {
    // 每次显示时刷新预测
    this.calculatePrediction();
  },

  // 加载用户设置
  loadUserSettings() {
    const settings = wx.getStorageSync('userSettings');
    if (settings) {
      this.setData({
        cycleLength: settings.cycleLength || 28,
        periodLength: settings.periodLength || 5,
        fertilityPurpose: settings.fertilityPurpose || 'contraception'
      });
    }
  },

  // 计算预测
  calculatePrediction() {
    // 获取最后一次经期记录
    const lastPeriod = this.getLastPeriodRecord();
    
    if (!lastPeriod) {
      // 没有记录，显示默认提示
      this.setData({
        tips: [
          { icon: '📝', content: '请先记录至少一次经期数据' },
          { icon: '📊', content: '记录越多，预测越准确' }
        ]
      });
      return;
    }

    const { cycleLength, periodLength } = this.data;
    const lastPeriodDate = new Date(lastPeriod.date);
    const today = new Date();

    // 计算下次经期
    const nextPeriod = new Date(lastPeriodDate);
    nextPeriod.setDate(nextPeriod.getDate() + cycleLength);
    const daysToNext = Math.ceil((nextPeriod - today) / (1000 * 60 * 60 * 24));

    // 计算排卵日（下次经期前 14 天）
    const ovulationDate = new Date(nextPeriod);
    ovulationDate.setDate(ovulationDate.getDate() - 14);
    const daysToOvulation = Math.ceil((ovulationDate - today) / (1000 * 60 * 60 * 24));

    // 计算易孕期（排卵日前 5 天至后 4 天）
    const fertileStart = new Date(ovulationDate);
    fertileStart.setDate(fertileStart.getDate() - 5);
    const fertileEnd = new Date(ovulationDate);
    fertileEnd.setDate(fertileEnd.getDate() + 4);

    // 判断是否在易孕期
    const isEasyPregnant = today >= fertileStart && today <= fertileEnd;

    // 计算置信度（基于记录数量）
    const recordCount = this.getRecordCount();
    const confidence = Math.min(95, 60 + recordCount * 5);

    // 生成温馨提示
    const tips = this.generateTips(daysToNext, daysToOvulation, isEasyPregnant);

    this.setData({
      nextPeriodDate: this.formatDate(nextPeriod),
      daysToNext: daysToNext > 0 ? daysToNext : 0,
      confidence,
      ovulationDate: this.formatDate(ovulationDate),
      daysToOvulation: daysToOvulation > 0 ? daysToOvulation : 0,
      isEasyPregnant,
      fertileTip: this.data.fertilityPurpose === 'pregnancy' ? '祝您好孕' : '请注意避孕',
      fertileWindow: {
        start: this.formatDate(fertileStart),
        end: this.formatDate(fertileEnd)
      },
      tips
    });
  },

  // 获取最后一次经期记录
  getLastPeriodRecord() {
    const records = [];
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = this.formatDate(date);
      const record = wx.getStorageSync(`record_${dateStr}`);
      if (record && record.isPeriod) {
        records.push(record);
      }
    }
    return records.length > 0 ? records[0] : null;
  },

  // 获取记录数量
  getRecordCount() {
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = this.formatDate(date);
      const record = wx.getStorageSync(`record_${dateStr}`);
      if (record) count++;
    }
    return count;
  },

  // 格式化日期
  formatDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  },

  // 生成温馨提示
  generateTips(daysToNext, daysToOvulation, isEasyPregnant) {
    const tips = [];

    // 经期前提示
    if (daysToNext <= 7 && daysToNext > 0) {
      tips.push({ icon: '🩸', content: `经期快到了（还有${daysToNext}天），请提前准备卫生用品` });
      tips.push({ icon: '🍵', content: '避免生冷辛辣食物，注意保暖' });
      tips.push({ icon: '😴', content: '保证充足睡眠，避免剧烈运动' });
    }

    // 排卵期提示
    if (daysToOvulation <= 3 && daysToOvulation > 0) {
      if (this.data.fertilityPurpose === 'pregnancy') {
        tips.push({ icon: '💕', content: '排卵期临近，是备孕的最佳时机' });
      } else {
        tips.push({ icon: '⚠️', content: '排卵期临近，请注意避孕措施' });
      }
    }

    // 易孕期提示
    if (isEasyPregnant) {
      if (this.data.fertilityPurpose === 'pregnancy') {
        tips.push({ icon: '🌸', content: '当前是易孕期，祝您好孕！' });
      } else {
        tips.push({ icon: '🛡️', content: '当前是易孕期，请务必做好避孕措施' });
      }
    }

    // 默认提示
    if (tips.length === 0) {
      tips.push({ icon: '💪', content: '身体状态良好，保持健康生活方式' });
      tips.push({ icon: '📝', content: '记得每天记录身体状况哦' });
    }

    return tips;
  },

  // 刷新预测
  refreshPrediction() {
    wx.showLoading({ title: '计算中...' });
    setTimeout(() => {
      this.calculatePrediction();
      wx.hideLoading();
      wx.showToast({ title: '已刷新', icon: 'success' });
    }, 500);
  },

  // 跳转到设置页
  goToSettings() {
    wx.showToast({ title: '开发中...', icon: 'none' });
    // TODO: 跳转到设置页
    // wx.navigateTo({ url: '/pages/settings/settings' });
  }
});
