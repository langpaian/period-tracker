# 经期记录及预测小程序 - 架构设计文档

**版本号：** v1.0  
**创建时间：** 2026-04-06  
**架构师：** 🏗️ Architect Agent  
**状态：** 待评审

---

## 1. 架构概述

### 1.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      用户层 (微信小程序)                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ 经期记录 │  │ 预测结果 │  │ 数据统计 │  │ 个人中心 │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      网关层                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  微信 API 网关 + 自定义业务网关 (鉴权/限流/日志)        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      业务服务层                               │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │ 用户服务   │  │ 记录服务   │  │ 预测服务   │               │
│  │ (User)    │  │ (Record)  │  │ (Predict) │               │
│  └───────────┘  └───────────┘  └───────────┘               │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │ 提醒服务   │  │ 统计服务   │  │ 内容服务   │               │
│  │ (Reminder)│  │ (Stats)   │  │ (Content) │               │
│  └───────────┘  └───────────┘  └───────────┘               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据层                                  │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │ 用户数据库 │  │ 记录数据库 │  │ 缓存 Redis │               │
│  │ (MySQL)   │  │ (MongoDB) │  │           │               │
│  └───────────┘  └───────────┘  └───────────┘               │
│  ┌───────────┐  ┌───────────┐                              │
│  │ 对象存储   │  │ AI 模型文件 │                              │
│  │ (OSS/COS) │  │ (ONNX)    │                              │
│  └───────────┘  └───────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 技术栈选型

### 2.1 前端技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **框架** | 微信小程序原生 | 最新 | 或 Taro 3.x 多端 |
| **UI 库** | TDesign | 最新 | 腾讯官方设计体系 |
| **图表** | F2 | 4.x | 蚂蚁金服图表库 |
| **状态管理** | MobX-miniprogram | 最新 | 响应式状态管理 |
| **构建工具** | 微信开发者工具 | 最新 | 官方 IDE |

### 2.2 后端技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **运行环境** | Node.js | 20 LTS | 或 微信云开发 |
| **Web 框架** | Koa / Express | 最新 | 轻量级框架 |
| **API 规范** | RESTful + OpenAPI | 3.0 | 接口文档 |
| **认证** | JWT + 微信登录 | - | 无状态认证 |

### 2.3 数据库选型

| 用途 | 技术 | 说明 |
|------|------|------|
| **用户数据** | MySQL 8.0 | 结构化数据（用户信息、配置） |
| **记录数据** | MongoDB 6.0 | 文档型数据（经期记录、症状） |
| **缓存** | Redis 7.0 | 会话、热点数据、限流 |
| **对象存储** | 阿里云 OSS / 腾讯云 COS | 头像、备份文件 |

### 2.4 AI 预测服务

| 组件 | 技术 | 说明 |
|------|------|------|
| **框架** | Python + scikit-learn | 传统 ML 算法 |
| **深度学习** | PyTorch / TensorFlow | LSTM 时间序列预测 |
| **模型部署** | ONNX Runtime | 跨平台推理 |
| **API 服务** | FastAPI | 高性能 Python API |

---

## 3. 核心模块设计

### 3.1 用户服务 (User Service)

**职责：** 用户认证、信息管理、隐私设置

**API 接口：**
```
POST   /api/v1/auth/wechat-login    # 微信登录
GET    /api/v1/user/profile         # 获取用户信息
PUT    /api/v1/user/profile         # 更新用户信息
PUT    /api/v1/user/privacy         # 隐私设置
DELETE /api/v1/user/account         # 注销账号
```

**数据表结构：**
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(64) UNIQUE NOT NULL,      -- 微信 openid
  unionid VARCHAR(64),                      -- 微信 unionid
  nickname VARCHAR(64),                     -- 昵称
  avatar_url VARCHAR(255),                  -- 头像
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_openid (openid)
);

CREATE TABLE user_settings (
  user_id BIGINT PRIMARY KEY,
  cycle_length INT DEFAULT 28,              -- 平均周期长度
  period_length INT DEFAULT 5,              -- 平均经期长度
  reminder_days INT DEFAULT 3,              -- 提前提醒天数
  privacy_level TINYINT DEFAULT 1,          -- 隐私级别 1-3
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3.2 记录服务 (Record Service)

**职责：** 经期记录 CRUD、数据验证

**API 接口：**
```
POST   /api/v1/records              # 创建记录
GET    /api/v1/records              # 获取记录列表
GET    /api/v1/records/:id          # 获取单条记录
PUT    /api/v1/records/:id          # 更新记录
DELETE /api/v1/records/:id          # 删除记录
GET    /api/v1/records/stats        # 统计数据
```

**数据表结构 (MongoDB)：**
```javascript
// periods 集合
{
  _id: ObjectId,
  user_id: Number,           // 用户 ID
  start_date: Date,          // 开始日期
  end_date: Date,            // 结束日期
  flow_level: String,        // 流量：light/medium/heavy
  symptoms: [String],        // 症状列表
  mood: String,              // 情绪
  temperature: Number,       // 体温（可选）
  weight: Number,            // 体重（可选）
  note: String,              // 备注
  created_at: Date,
  updated_at: Date
}

// 索引
db.periods.createIndex({ user_id: 1, start_date: -1 });
```

### 3.3 预测服务 (Predict Service)

**职责：** 经期预测、排卵期计算、预测准确率优化

**API 接口：**
```
POST   /api/v1/predict/period         # 预测下次经期
POST   /api/v1/predict/ovulation      # 预测排卵期
GET    /api/v1/predict/accuracy       # 预测准确率
POST   /api/v1/predict/train          # 重新训练模型（管理员）
```

**预测算法设计：**

```python
# 1. 基础算法：周期平均法
def predict_by_average(cycles):
    avg_cycle = sum(cycles) / len(cycles)
    return last_period_date + timedelta(days=avg_cycle)

# 2. 进阶算法：LSTM 时间序列预测
class PeriodPredictor(nn.Module):
    def __init__(self, input_size=1, hidden_size=64, num_layers=2):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, 1)
    
    def forward(self, x):
        out, _ = self.lstm(x)
        out = self.fc(out[:, -1, :])
        return out

# 3. 融合算法：加权平均
def ensemble_predict(predictions, weights):
    return sum(p * w for p, w in zip(predictions, weights)) / sum(weights)
```

### 3.4 提醒服务 (Reminder Service)

**职责：** 定时任务、消息推送、提醒模板

**技术实现：**
- **定时任务：** 微信订阅消息 + 云函数定时触发器
- **消息队列：** Redis Stream / RabbitMQ
- **推送渠道：** 微信订阅消息、模板消息

**提醒类型：**
```javascript
const reminderTypes = {
  PERIOD_COMING: 'period_coming',      // 经期来临提醒
  OVULATION: 'ovulation',              // 排卵期提醒
  RECORD_REMINDER: 'record_reminder',  // 记录提醒
  MEDICATION: 'medication'             // 服药提醒（自定义）
};
```

### 3.5 统计服务 (Stats Service)

**职责：** 数据统计、图表数据生成、趋势分析

**API 接口：**
```
GET /api/v1/stats/overview          # 概览统计
GET /api/v1/stats/trend             # 趋势数据
GET /api/v1/stats/symptom-analysis  # 症状分析
GET /api/v1/stats/export            # 导出数据
```

---

## 4. 数据库设计

### 4.1 ER 图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │   periods   │       │  reminders  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)     │    ┌──│ id (PK)     │
│ openid      │  │    │ user_id (FK)│────┤  │ user_id (FK)│
│ nickname    │  └───▶│ start_date  │    │  │ type        │
│ avatar_url  │       │ end_date    │    │  │ time        │
│ created_at  │       │ flow_level  │    │  │ enabled     │
└─────────────┘       │ symptoms    │    │  └─────────────┘
                      │ note        │
                      └─────────────┘
```

### 4.2 数据字典

详见：`/home/xf/.openclaw/workspace/projects/period-tracker/database/schema.sql`

---

## 5. 安全设计

### 5.1 数据安全
- **传输加密：** HTTPS + TLS 1.3
- **存储加密：** AES-256 加密敏感字段
- **访问控制：** RBAC 权限模型

### 5.2 隐私保护
- **数据脱敏：** 展示时隐藏敏感信息
- **最小权限：** 仅收集必要数据
- **用户控制：** 支持数据导出和删除

### 5.3 合规要求
- 符合《个人信息保护法》
- 符合《数据安全法》
- 遵循微信小程序运营规范

---

## 6. 部署架构

### 6.1 开发环境
```
本地开发 → 微信开发者工具 → 本地 Mock 服务
```

### 6.2 测试环境
```
测试服务器 (1 台 2C4G)
├── Nginx (反向代理)
├── Node.js 应用
├── MySQL (Docker)
├── MongoDB (Docker)
└── Redis (Docker)
```

### 6.3 生产环境
```
云服务架构（推荐微信云开发）
├── 云函数 (自动扩缩容)
├── 云数据库 (高可用)
├── 云存储 (CDN 加速)
└── 云调用 (微信 API)
```

---

## 7. 项目目录结构

```
period-tracker/
├── miniprogram/              # 小程序前端
│   ├── pages/                # 页面
│   ├── components/           # 组件
│   ├── utils/                # 工具函数
│   ├── api/                  # API 封装
│   └── styles/               # 样式
├── server/                   # 后端服务
│   ├── src/
│   │   ├── controllers/      # 控制器
│   │   ├── services/         # 业务逻辑
│   │   ├── models/           # 数据模型
│   │   ├── middlewares/      # 中间件
│   │   └── utils/            # 工具
│   ├── tests/                # 测试
│   └── package.json
├── ai-service/               # AI 预测服务
│   ├── models/               # 模型文件
│   ├── train.py              # 训练脚本
│   └── predict.py            # 预测服务
├── docs/                     # 文档
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   └── API.md
└── database/                 # 数据库
    ├── schema.sql
    └── migrations/
```

---

## 8. 开发计划

| 阶段 | 时间 | 任务 | 负责人 |
|------|------|------|--------|
| **Phase 1** | 第 1-2 周 | 前端框架搭建 + 用户服务 | 前端开发 |
| **Phase 2** | 第 3-4 周 | 记录服务 + 预测服务 | 后端开发 |
| **Phase 3** | 第 5-6 周 | 提醒服务 + 统计服务 | 后端开发 |
| **Phase 4** | 第 7-8 周 | UI 完善 + 联调测试 | 全员 |
| **Phase 5** | 第 9-10 周 | 灰度测试 + 优化 | 全员 |

---

## 9. 风险评估

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| 预测算法准确率低 | 中 | 高 | 多算法融合，持续优化 |
| 微信审核不通过 | 低 | 高 | 提前沟通，准备备选方案 |
| 数据安全问题 | 低 | 高 | 加密存储，定期审计 |
| 开发资源不足 | 中 | 中 | 优先核心功能，迭代开发 |

---

## 10. 附录

### 10.1 API 文档
详见：`/home/xf/.openclaw/workspace/projects/period-tracker/docs/API.md`

### 10.2 参考资源
- 微信小程序开发文档：https://developers.weixin.qq.com/miniprogram/dev/framework/
- 经期预测算法论文：https://arxiv.org/search/?query=period+prediction
- FHIR 女性健康数据标准：https://www.hl7.org/fhir/

---

**文档路径：** `/home/xf/.openclaw/workspace/projects/period-tracker/ARCHITECTURE.md`

**下一步：** UI 设计 → 开发实施
