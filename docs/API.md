# 经期记录及预测小程序 - API 接口文档

**版本号：** v1.0  
**创建时间：** 2026-04-07  
**状态：** 初稿

---

## 📋 接口概览

### 基础信息
- **Base URL:** `https://api.periodtracker.com/v1`
- **认证方式:** JWT + 微信登录
- **数据格式:** JSON
- **字符编码:** UTF-8

### 接口分类
| 分类 | 前缀 | 说明 |
|------|------|------|
| 用户服务 | `/auth`, `/user` | 登录、用户信息管理 |
| 记录服务 | `/records` | 经期记录 CRUD |
| 预测服务 | `/predict` | 经期/排卵期预测 |
| 提醒服务 | `/reminders` | 提醒设置与管理 |
| 统计服务 | `/stats` | 数据统计与分析 |

---

## 🔐 一、用户服务

### 1.1 微信登录
**接口:** `POST /auth/wechat-login`

**请求参数:**
```json
{
  "code": "string",        // 微信登录 code
  "encryptedData": "string", // 加密用户数据
  "iv": "string"           // 加密向量
}
```

**响应:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "userInfo": {
      "userId": 10001,
      "nickname": "用户昵称",
      "avatarUrl": "https://...",
      "isNewUser": true
    }
  }
}
```

---

### 1.2 获取用户信息
**接口:** `GET /user/profile`

**请求头:** `Authorization: Bearer <token>`

**响应:**
```json
{
  "code": 200,
  "data": {
    "userId": 10001,
    "nickname": "用户昵称",
    "avatarUrl": "https://...",
    "settings": {
      "cycleLength": 28,
      "periodLength": 5,
      "reminderDays": 3,
      "privacyLevel": 1
    }
  }
}
```

---

### 1.3 更新用户设置
**接口:** `PUT /user/settings`

**请求参数:**
```json
{
  "cycleLength": 28,
  "periodLength": 5,
  "reminderDays": 3,
  "privacyLevel": 1
}
```

---

## 📝 二、记录服务

### 2.1 创建经期记录
**接口:** `POST /records`

**请求参数:**
```json
{
  "startDate": "2026-04-01",
  "endDate": "2026-04-05",
  "flowLevel": "medium",      // light/medium/heavy
  "symptoms": ["痛经", "头痛"],
  "mood": "normal",           // normal/bad/good
  "temperature": 36.5,        // 可选
  "weight": 50.5,             // 可选
  "note": "备注信息"          // 可选
}
```

**响应:**
```json
{
  "code": 200,
  "data": {
    "recordId": 50001,
    "startDate": "2026-04-01",
    "endDate": "2026-04-05"
  }
}
```

---

### 2.2 获取记录列表
**接口:** `GET /records`

**请求参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 20 |
| startDate | string | 否 | 开始日期筛选 |
| endDate | string | 否 | 结束日期筛选 |

**响应:**
```json
{
  "code": 200,
  "data": {
    "total": 12,
    "page": 1,
    "pageSize": 20,
    "list": [
      {
        "recordId": 50001,
        "startDate": "2026-04-01",
        "endDate": "2026-04-05",
        "flowLevel": "medium",
        "symptoms": ["痛经"],
        "duration": 5
      }
    ]
  }
}
```

---

### 2.3 更新记录
**接口:** `PUT /records/{recordId}`

**请求参数:** 同创建记录（部分字段可选）

---

### 2.4 删除记录
**接口:** `DELETE /records/{recordId}`

**响应:**
```json
{
  "code": 200,
  "message": "删除成功"
}
```

---

## 🔮 三、预测服务

### 3.1 预测下次经期
**接口:** `POST /predict/period`

**响应:**
```json
{
  "code": 200,
  "data": {
    "predictedDate": "2026-05-01",
    "confidence": 0.85,       // 置信度 0-1
    "cycleLength": 28,
    "periodLength": 5,
    "fertileWindow": {
      "start": "2026-04-27",
      "end": "2026-05-03"
    }
  }
}
```

---

### 3.2 预测排卵期
**接口:** `POST /predict/ovulation`

**响应:**
```json
{
  "code": 200,
  "data": {
    "ovulationDate": "2026-04-30",
    "fertileWindow": {
      "start": "2026-04-27",
      "end": "2026-05-03"
    },
    "confidence": 0.80
  }
}
```

---

## ⏰ 四、提醒服务

### 4.1 创建提醒
**接口:** `POST /reminders`

**请求参数:**
```json
{
  "type": "period_coming",    // period_coming/ovulation/medication
  "time": "08:00",
  "enabled": true,
  "customMessage": "记得准备卫生巾哦~"
}
```

---

### 4.2 获取提醒列表
**接口:** `GET /reminders`

**响应:**
```json
{
  "code": 200,
  "data": [
    {
      "reminderId": 3001,
      "type": "period_coming",
      "time": "08:00",
      "enabled": true,
      "daysBefore": 3
    }
  ]
}
```

---

### 4.3 更新提醒
**接口:** `PUT /reminders/{reminderId}`

---

### 4.4 删除提醒
**接口:** `DELETE /reminders/{reminderId}`

---

## 📊 五、统计服务

### 5.1 获取概览统计
**接口:** `GET /stats/overview`

**响应:**
```json
{
  "code": 200,
  "data": {
    "avgCycleLength": 28.5,
    "avgPeriodLength": 5.2,
    "totalRecords": 12,
    "lastPeriodDate": "2026-04-01",
    "nextPeriodDate": "2026-05-01"
  }
}
```

---

### 5.2 获取趋势数据
**接口:** `GET /stats/trend`

**请求参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| metric | string | cycle_length/period_length/flow |
| months | int | 查询月数，默认 6 |

**响应:**
```json
{
  "code": 200,
  "data": {
    "metric": "cycle_length",
    "trend": [
      { "month": "2025-11", "value": 29 },
      { "month": "2025-12", "value": 28 },
      { "month": "2026-01", "value": 27 },
      { "month": "2026-02", "value": 28 },
      { "month": "2026-03", "value": 29 },
      { "month": "2026-04", "value": 28 }
    ]
  }
}
```

---

### 5.3 症状分析
**接口:** `GET /stats/symptom-analysis`

**响应:**
```json
{
  "code": 200,
  "data": {
    "symptoms": [
      { "name": "痛经", "count": 8, "percentage": 0.67 },
      { "name": "头痛", "count": 5, "percentage": 0.42 },
      { "name": "情绪波动", "count": 6, "percentage": 0.50 }
    ]
  }
}
```

---

## ❌ 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token 过期 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

**文档版本：** v1.0  
**最后更新：** 2026-04-07
