# 经期助手 (Period Tracker)

一个简洁美观的经期记录与预测 Web 应用。

## 功能

- 📅 **经期日历** - 可视化查看月经周期
- 📝 **经期记录** - 记录开始/结束日期、症状、流量
- 🔮 **智能预测** - 基于平均28天周期预测下次经期
- 📊 **数据统计** - 平均周期、经期长度统计
- ⚙️ **个性化设置** - 自定义周期参数

## 技术栈

- Vue 3 + Vite
- Pinia (状态管理)
- Vue Router (路由)
- LocalStorage (本地存储)

## 开发

```bash
cd web-app
npm install
npm run dev
```

## 构建

```bash
npm run build
```

构建输出在 `dist/` 目录。

## 部署

### GitHub Pages
1. 创建 GitHub 仓库
2. 推送到 main 分支
3. 在仓库设置中启用 GitHub Pages
4. Source 选择 "Deploy from a branch"
5. Branch 选择 "main"，文件夹选择 "/ (root)"
6. 访问 `https://username.github.io/repo-name`

### 微信小程序
使用 uni-app 或 Taro 框架可直接转换为微信小程序。

## 许可证

MIT