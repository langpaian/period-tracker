# 🚀 微信小程序 Demo - 快速启动

## ✅ 项目已就绪！

**项目位置：** `/home/xf/.openclaw/workspace/projects/period-tracker/miniprogram`

**文件清单：**
- ✅ app.js - 小程序入口
- ✅ app.json - 全局配置（含 TabBar）
- ✅ app.wxss - 全局样式
- ✅ pages/index/ - 首页（经期状态 + 预测）
- ✅ pages/record/ - 记录页（经血 + 症状）
- ✅ pages/stats/ - 统计页（周期 + 症状统计）
- ✅ pages/profile/ - 我的页（关于 + 设置）
- ✅ project.config.json - 项目配置
- ✅ sitemap.json - 搜索配置
- ✅ RUNME.md - 详细文档

---

## 📱 三步启动

### 1️⃣ 打开微信开发者工具

下载地址：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

### 2️⃣ 导入项目

- 选择目录：`/home/xf/.openclaw/workspace/projects/period-tracker/miniprogram`
- AppID：选择「测试号」
- 开发模式：小程序

### 3️⃣ 点击「编译」

🎉 立即看到小程序运行效果！

---

## 🎯 核心功能演示

### 首页
- 显示经期状态（经期中/排卵期/安全期）
- 预测下次经期和排卵日
- 快捷入口：记录、统计、我的

### 记录页
- 选择经血量：无/少量/中量/大量
- 选择症状：腹痛、头痛、乳房胀痛等
- 添加备注

### 统计页
- 周期统计：平均/最短/最长
- 症状统计：频次排序
- 清空数据

### 我的页
- 关于、设置、反馈

---

## 💾 数据存储

- 使用 `wx.setStorageSync` 本地存储
- 无需后端服务器
- 数据持久化在微信中

---

## ⚠️ 注意事项

### TabBar 图标
当前 `images/` 目录为空，TabBar 图标会显示空白。

**解决方案：**
1. 临时注释 `app.json` 中的 `tabBar` 配置
2. 或从 iconfont.cn 下载图标

### AppID
- 测试使用「测试号」即可
- 正式发布需替换为正式 AppID

---

## 📞 完整文档

查看 `RUNME.md` 获取详细说明。

---

**🎉 立即开始体验！**
