-- ============================================
-- 经期记录及预测小程序 - 数据库设计
-- ============================================
-- 版本：v1.0
-- 创建时间：2026-04-07
-- 数据库：MySQL 8.0 + MongoDB 6.0
-- ============================================

-- ============================================
-- MySQL 部分 - 用户数据与配置
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS period_tracker 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE period_tracker;

-- ============================================
-- 1. 用户表
-- ============================================
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    openid VARCHAR(64) NOT NULL UNIQUE COMMENT '微信 openid',
    unionid VARCHAR(64) DEFAULT NULL COMMENT '微信 unionid',
    nickname VARCHAR(64) DEFAULT NULL COMMENT '昵称',
    avatar_url VARCHAR(255) DEFAULT NULL COMMENT '头像 URL',
    phone VARCHAR(20) DEFAULT NULL COMMENT '手机号（可选）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常 0-禁用',
    
    INDEX idx_openid (openid),
    INDEX idx_unionid (unionid),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 用户设置表
-- ============================================
CREATE TABLE user_settings (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    cycle_length TINYINT UNSIGNED DEFAULT 28 COMMENT '平均周期长度（天）',
    period_length TINYINT UNSIGNED DEFAULT 5 COMMENT '平均经期长度（天）',
    reminder_days TINYINT UNSIGNED DEFAULT 3 COMMENT '提前提醒天数',
    reminder_time TIME DEFAULT '08:00:00' COMMENT '提醒时间',
    privacy_level TINYINT UNSIGNED DEFAULT 1 COMMENT '隐私级别：1-普通 2-加密 3-隐藏',
    language VARCHAR(10) DEFAULT 'zh-CN' COMMENT '语言',
    notifications_enabled TINYINT(1) DEFAULT 1 COMMENT '是否开启通知',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_privacy (privacy_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设置表';

-- ============================================
-- 3. 订阅消息表
-- ============================================
CREATE TABLE subscriptions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    template_id VARCHAR(64) NOT NULL COMMENT '微信订阅消息模板 ID',
    type VARCHAR(32) NOT NULL COMMENT '订阅类型：period_coming/ovulation/medication',
    enabled TINYINT(1) DEFAULT 1 COMMENT '是否启用',
    days_before TINYINT UNSIGNED DEFAULT 3 COMMENT '提前几天',
    time TIME DEFAULT '08:00:00' COMMENT '发送时间',
    custom_message VARCHAR(255) DEFAULT NULL COMMENT '自定义消息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_type (user_id, type),
    INDEX idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订阅消息表';

-- ============================================
-- 4. 消息发送记录表
-- ============================================
CREATE TABLE message_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    type VARCHAR(32) NOT NULL COMMENT '消息类型',
    status VARCHAR(16) DEFAULT 'pending' COMMENT '状态：pending/sent/failed',
    sent_at TIMESTAMP NULL DEFAULT NULL,
    error_message TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息发送记录表';

-- ============================================
-- 5. 管理员表
-- ============================================
CREATE TABLE admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(32) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(16) DEFAULT 'operator' COMMENT '角色：admin/operator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- ============================================
-- 6. 系统配置表
-- ============================================
CREATE TABLE system_configs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(64) NOT NULL UNIQUE,
    config_value TEXT DEFAULT NULL,
    config_type VARCHAR(16) DEFAULT 'string' COMMENT '类型：string/number/json',
    description VARCHAR(255) DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 插入默认配置
INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES
('app_version', '1.0.0', 'string', '应用版本号'),
('min_supported_version', '1.0.0', 'string', '最低支持版本'),
('maintenance_mode', '0', 'number', '维护模式：0-关闭 1-开启'),
('max_records_per_user', '1000', 'number', '单用户最大记录数');

-- ============================================
-- MongoDB 部分 - 经期记录数据
-- ============================================
-- 说明：经期记录使用 MongoDB 存储，因为：
-- 1. 记录结构灵活，可能随版本迭代变化
-- 2. 查询模式以时间范围查询为主
-- 3. 需要支持复杂症状数组存储

-- ============================================
-- MongoDB 集合设计
-- ============================================

/*
-- MongoDB 连接信息
-- 数据库：period_tracker
-- 集合：periods

-- 创建集合
db.createCollection("periods", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "start_date"],
      properties: {
        user_id: { bsonType: "long", description: "用户 ID，必填" },
        start_date: { bsonType: "date", description: "开始日期，必填" },
        end_date: { bsonType: "date", description: "结束日期" },
        flow_level: { 
          bsonType: "string", 
          enum: ["light", "medium", "heavy"],
          description: "流量级别"
        },
        symptoms: { 
          bsonType: "array", 
          items: { bsonType: "string" },
          description: "症状列表"
        },
        mood: { 
          bsonType: "string",
          enum: ["bad", "normal", "good"],
          description: "情绪状态"
        },
        temperature: { bsonType: "double", description: "基础体温" },
        weight: { bsonType: "double", description: "体重" },
        note: { bsonType: "string", description: "备注" },
        created_at: { bsonType: "date", description: "创建时间" },
        updated_at: { bsonType: "date", description: "更新时间" }
      }
    }
  }
});

-- 创建索引
db.periods.createIndex({ user_id: 1, start_date: -1 });
db.periods.createIndex({ user_id: 1, created_at: -1 });
db.periods.createIndex({ start_date: 1 });
*/

-- ============================================
-- MongoDB 文档示例
-- ============================================

/*
{
  "_id": ObjectId("..."),
  "user_id": NumberLong(10001),
  "start_date": ISODate("2026-04-01T00:00:00Z"),
  "end_date": ISODate("2026-04-05T00:00:00Z"),
  "flow_level": "medium",
  "symptoms": ["痛经", "头痛", "情绪波动"],
  "mood": "normal",
  "temperature": 36.5,
  "weight": 50.5,
  "note": "这次经期比较正常",
  "created_at": ISODate("2026-04-01T08:00:00Z"),
  "updated_at": ISODate("2026-04-05T20:00:00Z")
}
*/

-- ============================================
-- 数据备份与恢复
-- ============================================

-- MySQL 备份命令
-- mysqldump -u root -p period_tracker > period_tracker_backup_$(date +%Y%m%d).sql

-- MongoDB 备份命令
-- mongodump --db period_tracker --collection periods --out /backup/mongodb/

-- ============================================
-- 数据迁移脚本（可选）
-- ============================================

-- 从旧版本迁移用户数据
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL;

-- ============================================
-- 结束
-- ============================================
