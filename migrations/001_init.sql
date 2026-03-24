-- o7m2 Database Migration
-- 偶气满满 - 人气炒股系统

CREATE DATABASE IF NOT EXISTS o7m2
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE o7m2;

-- 用户表
CREATE TABLE users (
    id VARCHAR(32) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT '',
    role ENUM('user', 'admin', 'superadmin') DEFAULT 'user',
    status ENUM('active', 'banned', 'deleted') DEFAULT 'active',
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB;

-- 角色表（可交易标的）
CREATE TABLE characters (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category ENUM('virtual', 'historical', 'novel') NOT NULL COMMENT '分类: 虚拟人物/历史人物/小说人物',
    avatar VARCHAR(255) DEFAULT '',
    description TEXT,
    initial_price BIGINT NOT NULL DEFAULT 1000,
    status ENUM('active', 'paused', 'delisted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- 插入示例角色数据
INSERT INTO characters (id, name, category, avatar, description, initial_price) VALUES
-- 虚拟人物
('char_v001', '初音未来', 'virtual', '/avatars/miku.png', '世界第一公主殿下', 1500),
('char_v002', '洛天依', 'virtual', '/avatars/tianyi.png', '中国首位虚拟歌姬', 1200),
('char_v003', '雷电将军', 'virtual', '/avatars/raiden.png', '原神-稻妻雷神', 2000),
('char_v004', '甘雨', 'virtual', '/avatars/ganyu.png', '原神-璃月秘书', 1800),
('char_v005', '琪亚娜', 'virtual', '/avatars/kiana.png', '崩坏3-空之律者', 1600),
('char_v006', '嘉然', 'virtual', '/avatars/diana.png', 'A-SOUL-顶流虚拟偶像', 2500),
-- 历史人物
('char_h001', '李白', 'historical', '/avatars/libai.png', '诗仙-大唐剑客', 1800),
('char_h002', '苏轼', 'historical', '/avatars/sushi.png', '东坡居士-美食家', 1500),
('char_h003', '武则天', 'historical', '/avatars/wuzetian.png', '千古女帝', 2200),
('char_h004', '诸葛亮', 'historical', '/avatars/kongming.png', '卧龙先生', 2000),
('char_h005', '秦始皇', 'historical', '/avatars/qinshihuang.png', '千古一帝', 2500),
-- 小说人物
('char_n001', '林黛玉', 'novel', '/avatars/lindaiyu.png', '红楼梦-绛珠仙子', 1600),
('char_n002', '孙悟空', 'novel', '/avatars/wukong.png', '西游记-齐天大圣', 2200),
('char_n003', '诸葛亮', 'novel', '/avatars/kongming2.png', '三国演义-智绝', 2000),
('char_n004', '武松', 'novel', '/avatars/wusong.png', '水浒传-行者', 1400),
('char_n005', '贾宝玉', 'novel', '/avatars/jiabaoyu.png', '红楼梦-怡红公子', 1500);

-- 账户表
CREATE TABLE accounts (
    id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL UNIQUE,
    balance BIGINT NOT NULL DEFAULT 0 COMMENT '可用余额（人气值）',
    frozen BIGINT NOT NULL DEFAULT 0 COMMENT '冻结金额',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- 持仓表
CREATE TABLE holdings (
    id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    character_id VARCHAR(32) NOT NULL,
    quantity BIGINT NOT NULL DEFAULT 0 COMMENT '持有份额',
    avg_cost BIGINT NOT NULL DEFAULT 0 COMMENT '平均成本',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (character_id) REFERENCES characters(id),
    UNIQUE KEY uk_user_char (user_id, character_id),
    INDEX idx_user (user_id),
    INDEX idx_character (character_id)
) ENGINE=InnoDB;

-- 订单表
CREATE TABLE orders (
    id VARCHAR(32) PRIMARY KEY,
    client_order_id VARCHAR(64) COMMENT '客户端订单ID（幂等）',
    user_id VARCHAR(32) NOT NULL,
    character_id VARCHAR(32) NOT NULL,
    side ENUM('buy', 'sell') NOT NULL,
    type ENUM('limit', 'market') NOT NULL,
    price BIGINT NOT NULL,
    quantity BIGINT NOT NULL,
    filled_qty BIGINT NOT NULL DEFAULT 0,
    status ENUM('pending', 'partial', 'filled', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (character_id) REFERENCES characters(id),
    INDEX idx_user_status (user_id, status),
    INDEX idx_char_status (character_id, status),
    INDEX idx_client_order (client_order_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- 成交记录表
CREATE TABLE trades (
    id VARCHAR(32) PRIMARY KEY,
    character_id VARCHAR(32) NOT NULL,
    buy_order_id VARCHAR(32) NOT NULL,
    sell_order_id VARCHAR(32) NOT NULL,
    buy_user_id VARCHAR(32) NOT NULL,
    sell_user_id VARCHAR(32) NOT NULL,
    price BIGINT NOT NULL,
    quantity BIGINT NOT NULL,
    tax BIGINT NOT NULL DEFAULT 0 COMMENT '交易税',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (character_id) REFERENCES characters(id),
    INDEX idx_char_time (character_id, created_at),
    INDEX idx_buy_user (buy_user_id, created_at),
    INDEX idx_sell_user (sell_user_id, created_at)
) ENGINE=InnoDB;

-- 账本流水表
CREATE TABLE ledger (
    id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    type ENUM('login_reward', 'trade_cost', 'trade_income', 'trade_tax', 'mining_reward', 'admin_adjust') NOT NULL,
    amount BIGINT NOT NULL COMMENT '变动金额（正增负减）',
    balance BIGINT NOT NULL COMMENT '变动后余额',
    ref_id VARCHAR(32) COMMENT '关联ID',
    remark VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_time (user_id, created_at),
    INDEX idx_type (type),
    INDEX idx_ref (ref_id)
) ENGINE=InnoDB;

-- K线数据表
CREATE TABLE klines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    character_id VARCHAR(32) NOT NULL,
    period ENUM('1m', '5m', '15m', '1h', '1d') NOT NULL,
    open_time TIMESTAMP NOT NULL,
    open_price BIGINT NOT NULL,
    high_price BIGINT NOT NULL,
    low_price BIGINT NOT NULL,
    close_price BIGINT NOT NULL,
    volume BIGINT NOT NULL DEFAULT 0,
    FOREIGN KEY (character_id) REFERENCES characters(id),
    UNIQUE KEY uk_char_period_time (character_id, period, open_time),
    INDEX idx_char_period (character_id, period)
) ENGINE=InnoDB;

-- 大事件表
CREATE TABLE events (
    id VARCHAR(32) PRIMARY KEY,
    type ENUM('crash', 'pump', 'activity', 'system') NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    affected_chars JSON COMMENT '影响的角色ID列表',
    severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
    start_at TIMESTAMP NULL,
    end_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active, start_at, end_at)
) ENGINE=InnoDB;

-- 系统配置表
CREATE TABLE system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    value_type ENUM('string', 'int', 'float', 'bool', 'json') DEFAULT 'string',
    description VARCHAR(255) DEFAULT '',
    updated_by VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 挖矿会话表
CREATE TABLE mining_sessions (
    id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    character_id VARCHAR(32) NOT NULL,
    challenge VARCHAR(64) NOT NULL,
    difficulty INT NOT NULL,
    status ENUM('pending', 'completed', 'expired') DEFAULT 'pending',
    nonce VARCHAR(64),
    hash_rate BIGINT,
    reward BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (character_id) REFERENCES characters(id),
    INDEX idx_user_time (user_id, created_at),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- 登录签到表
CREATE TABLE daily_logins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    login_date DATE NOT NULL,
    reward BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY uk_user_date (user_id, login_date)
) ENGINE=InnoDB;

-- 操作日志表（审计）
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(32),
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    resource_id VARCHAR(32),
    detail JSON,
    ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_time (user_id, created_at),
    INDEX idx_action (action)
) ENGINE=InnoDB;

-- 初始化系统配置
INSERT INTO system_config (config_key, config_value, value_type, description) VALUES
('daily_login_reward', '100', 'int', '每日登录奖励人气值'),
('trade_tax_rate', '0.001', 'float', '交易税率'),
('mining_base_reward_4', '50', 'int', '难度4基础奖励'),
('mining_base_reward_5', '75', 'int', '难度5基础奖励'),
('mining_base_reward_6', '110', 'int', '难度6基础奖励'),
('mining_base_reward_7', '160', 'int', '难度7基础奖励'),
('mining_base_reward_8', '230', 'int', '难度8基础奖励'),
('mining_hourly_target', '10000', 'int', '每小时全站挖矿产出目标'),
('mining_base_difficulty', '4', 'int', '基础挖矿难度'),
('mining_max_difficulty', '8', 'int', '最大挖矿难度'),
('holding_bonus_100', '0.10', 'float', '持仓100加成率'),
('holding_bonus_500', '0.25', 'float', '持仓500加成率'),
('holding_bonus_1000', '0.50', 'float', '持仓1000加成率'),
('rank_la', '1000', 'int', '拉-最大价值'),
('rank_npc', '5000', 'int', 'NPC-最大价值'),
('rank_ren', '15000', 'int', '人上人-最大价值'),
('rank_ding', '50000', 'int', '顶级-最大价值');

-- 创建默认管理员账号（密码需要在运行时通过bcrypt生成）
-- INSERT INTO users (id, username, email, password_hash, role) VALUES
-- ('admin001', 'admin', 'admin@o7m2.com', '$2a$10$xxx...', 'superadmin');

-- INSERT INTO accounts (id, user_id, balance) VALUES
-- ('acc_admin001', 'admin001', 1000000);
