# 经期记录及预测小程序 - 项目索引

**项目名称：** Period Tracker (经期记录及预测小程序)  
**创建时间：** 2026-04-06  
**状态：** 设计阶段

---

## 📁 文档目录

### 核心文档
| 文档 | 路径 | 状态 |
|------|------|------|
| **产品需求文档 (PRD)** | `projects/period-tracker/PRD.md` | ✅ 已完成 |
| **架构设计文档** | `projects/period-tracker/ARCHITECTURE.md` | ✅ 已完成 |
| **API 接口文档** | `projects/period-tracker/docs/API.md` | ✅ 已完成 |
| **数据库设计** | `projects/period-tracker/database/schema.sql` | ✅ 已完成 |
| **UI 设计稿** | `projects/period-tracker/designs/UI_DESIGN.md` | ✅ 已完成 |

### 设计稿
| 文档 | 路径 | 状态 |
|------|------|------|
| **UI 设计稿** | `projects/period-tracker/designs/` | ⏳ 待设计 |
| **原型图** | `projects/period-tracker/designs/prototype/` | ⏳ 待设计 |

### 代码目录
| 目录 | 说明 | 状态 |
|------|------|------|
| `miniprogram/` | 微信小程序前端 | ⏳ 待开发 |
| `server/` | 后端服务 | ⏳ 待开发 |
| `ai-service/` | AI 预测服务 | ⏳ 待开发 |

---

## 📋 项目里程碑

```
第 1 周 (04-06 ~ 04-12)  需求评审 ✅
  └─ PRD 完成 ✅
  └─ 架构设计完成 ✅

第 2 周 (04-13 ~ 04-19)  架构设计 🟡 进行中
  └─ API 文档编写 ✅
  └─ 数据库设计 ✅
  └─ UI 设计稿 ✅
  └─ 技术选型确认 ⏳

第 3-4 周 (04-20 ~ 05-03) 前端开发
  └─ 小程序框架搭建
  └─ 核心页面开发
  └─ UI 组件库集成

第 5-6 周 (05-04 ~ 05-17) 后端开发
  └─ 用户服务
  └─ 记录服务
  └─ 预测服务
  └─ 提醒服务

第 7-8 周 (05-18 ~ 05-31) 联调测试
  └─ 前后端联调
  └─ 算法优化
  └─ 性能测试

第 9-10 周 (06-01 ~ 06-14) 灰度发布
  └─ 小范围测试
  └─ 问题修复
  └─ 正式上线
```

---

## 👥 团队分工

| 角色 | 职责 | 负责人 |
|------|------|--------|
| **产品经理** | 需求分析、原型设计 | 📦 Product Agent |
| **架构师** | 技术选型、架构设计 | 🏗️ Architect Agent |
| **前端开发** | 小程序开发 | 👨‍💻 Frontend Agent |
| **后端开发** | 服务端开发 | 👨‍💻 Backend Agent |
| **AI 工程师** | 预测算法开发 | 🤖 AI Agent |
| **测试工程师** | 质量保障 | 🧪 QA Agent |

---

## 🚀 快速开始

### 开发环境准备
```bash
# 1. 克隆项目
git clone <repo-url> period-tracker
cd period-tracker

# 2. 安装依赖
cd miniprogram && npm install
cd ../server && npm install
cd ../ai-service && pip install -r requirements.txt

# 3. 启动服务
# 小程序：用微信开发者工具打开 miniprogram 目录
# 后端：cd server && npm run dev
# AI 服务：cd ai-service && python predict.py
```

### 数据库初始化
```bash
# MySQL
mysql -u root -p < database/schema.sql

# MongoDB
mongo period_tracker database/periods.init.js
```

---

## 📞 联系方式

**项目负责人：** 老板  
**技术负责人：** 小智 🤖  
**反馈建议：** 飞书群聊

---

**最后更新：** 2026-04-07  
**文档版本：** v1.1  
**当前阶段：** 第 2 周 - 架构设计（进行中）
