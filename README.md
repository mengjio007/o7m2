# o7m2 - 偶气满满 ✨

> 二次元人气交易所 - 为喜爱的角色应援，获取人气值

## 项目简介

偶气满满是一个二次元人气炒股平台，用户可以：
- 📈 **交易角色股份** - 买卖喜欢的角色，低买高卖
- ⛏️ **应援挖矿** - 为角色应援，获取人气值奖励
- 📖 **角色百科** - 查看角色详细信息和走势

## 项目架构

```
o7m2/
├── cmd/                    # 服务入口
│   ├── api/               # API 网关 (端口 8080)
│   ├── match/             # 撮合引擎 (端口 8081)
│   ├── miner/             # 挖矿服务 (端口 8082)
│   ├── admin/             # 管理后台 (端口 8083)
│   └── chat/              # AI聊天服务 (端口 8084)
├── internal/              # 核心业务逻辑
│   ├── domain/            # 领域模型
│   ├── engine/            # 撮合引擎
│   ├── service/           # 业务服务层
│   ├── handler/           # HTTP 处理器
│   ├── repository/        # 数据访问层
│   └── chat/              # AI聊天服务
│       ├── server.go      # WebSocket/HTTP 服务器
│       ├── engine*.go     # ONNX 推理引擎
│       ├── prompt.go      # 提示词构建
│       ├── trend.go       # 行情趋势分析
│       └── ...            # 会话管理、并发控制等
├── pkg/                   # 公共包
├── proto/                 # gRPC 协议定义
├── web/                   # 前端项目
│   ├── trading/           # 交易前端 (端口 3000)
│   └── admin/             # 管理后台 (端口 3001)
├── models/                # AI 模型文件
├── migrations/            # 数据库迁移
└── docker-compose.yml     # Docker 配置
```

## 技术栈

### 后端
- Go 1.23
- Gin (HTTP 框架)
- gRPC (服务间通信)
- MySQL 8.0 (数据存储)
- Redis 7 (缓存/消息)
- ONNX Runtime (AI 推理引擎)

### 前端
- React 18
- TypeScript
- Tailwind CSS
- Vite
- lightweight-charts (K线图)

## 快速开始

### 使用 Docker

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 重新编译并启动 chat 服务
docker-compose up -d --build chat
```

### 本地开发

```bash
# 1. 启动基础设施
docker-compose up -d mysql redis

# 2. 初始化数据库
mysql -u root -p < migrations/001_init.sql

# 3. 启动后端服务
make run-api      # API 服务
make run-match    # 撮合引擎
make run-miner    # 挖矿服务
make run-admin    # 管理后台
make run-chat     # AI 聊天服务

# 4. 启动前端
cd web/trading && npm install && npm run dev
cd web/admin && npm install && npm run dev
```

## 核心功能

### 1. 人气值交易
- 支持限价单/市价单
- 高性能内存撮合引擎
- 实时行情推送
- 分时线/K线图

### 2. 角色分类
- 🎮 **虚拟人物** - 虚拟偶像、游戏角色等
- 📜 **历史人物** - 历史人物、名人
- 📖 **小说人物** - 小说、影视角色

### 3. 咖位评级系统

根据角色当前价格自动计算咖位：

| 等级 | 图标 | 价格区间 | 头像特效 |
|------|------|----------|----------|
| 夯 | 💎 | > 50,000 | 🔥 火焰燃烧 |
| 顶级 | 🔥 | 15,000 - 50,000 | ⭐ 星光闪耀 |
| 人上人 | 😎 | 5,000 - 15,000 | 💎 霓虹光环 |
| NPC | 😐 | 1,000 - 5,000 | 普通边框 |
| 拉 | 💀 | < 1,000 | 🦇 蝙蝠围绕 |

> 区间可通过后台 `system_config` 表中的 `rank_*` 配置调整

### 4. 应援挖矿 (Proof of Support) ⛏️

#### 挖矿原理

应援挖矿采用 **Proof of Support (PoS)** 机制，用户通过计算哈希值来证明对角色的支持，成功后获得人气值奖励。

#### 挖矿流程

```
1. 用户选择要应援的角色（需持有该角色股份）
2. 系统生成 Challenge（随机字符串）
3. 用户客户端计算 SHA256(SessionID + Nonce)
4. 当哈希值前N位为0时（N=难度），提交到服务器
5. 服务器验证通过后发放奖励
```

#### 难度系统

| 难度 | 要求 | 基础奖励 |
|------|------|----------|
| 4 | 哈希前4位为0 | 50 人气值 |
| 5 | 哈希前5位为0 | 75 人气值 |
| 6 | 哈希前6位为0 | 110 人气值 |
| 7 | 哈希前7位为0 | 160 人气值 |
| 8 | 哈希前8位为0 | 230 人气值 |

#### 难度调整机制

- **全站每小时产出上限**: 10,000 人气值
- **动态调整**: 当全站产出超过目标时，自动提高难度
- **难度范围**: 4-8（可通过后台配置）

#### 持仓加成

持有角色份额越多，挖矿奖励加成越高：

| 持仓数量 | 加成比例 |
|----------|----------|
| ≥ 1000 | +50% |
| ≥ 500 | +25% |
| ≥ 100 | +10% |
| < 100 | 0% |

**最终奖励计算公式**：
```
最终奖励 = 基础奖励 × (1 + 持仓加成比例)
```

**示例**：
- 难度4，持仓800：最终奖励 = 50 × (1 + 25%) = 62 人气值
- 难度6，持仓1200：最终奖励 = 110 × (1 + 50%) = 165 人气值

#### 反作弊机制

- **Session 验证**: 每个挖矿会话有效期10分钟
- **频率限制**: 防止刷单行为
- **哈希验证**: 服务器端验证哈希值合法性
- **IP 限制**: 防止多开刷矿

#### 挖矿 API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/mining/session` | POST | 创建挖矿会话 |
| `/api/mining/submit` | POST | 提交挖矿结果 |
| `/api/mining/stats` | GET | 获取挖矿统计 |

#### 前端挖矿实现

前端使用 Web Worker 进行哈希计算，不影响页面主线程：

```javascript
// 挖矿 Worker 核心逻辑
const mine = (sessionId, difficulty) => {
  const target = '0'.repeat(difficulty)
  let nonce = 0
  
  while (true) {
    const hash = sha256(sessionId + nonce)
    if (hash.startsWith(target)) {
      return { nonce, hash }
    }
    nonce++
  }
}
```

### 5. AI 角色聊天 (Chat) 💬

基于 ONNX Runtime 的本地 AI 推理引擎，用户可以与虚拟角色进行实时对话。

#### 核心特性

- **本地 AI 推理**：使用 ONNX Runtime 运行量化模型，无需依赖外部 API
- **实时 WebSocket 通信**：支持双向实时聊天，低延迟响应
- **HTTP API 兼容**：同时支持 HTTP POST 请求进行聊天
- **会话管理**：支持会话持久化、空闲超时、自动续期
- **趋势感知**：角色回复会参考实时行情数据，体现"股票化人格"
- **并发控制**：通过租赁机制和队列管理，防止服务器过载
- **提示词工程**：构建包含角色设定、行情快照、对话历史的智能提示词

#### 系统提示词规则

角色聊天遵循严格的"股票化人格"规则：
1. 角色用第一人称回答，保持角色设定
2. 聊天范围限定：角色设定、行情走势/交易情绪、互动建议
3. 无关话题会被礼貌拒绝并引导回角色/走势
4. 行情数据以提供的"行情快照"为准，不编造硬数据

#### 技术架构

```
用户请求
    ↓
WebSocket/HTTP Server (端口 8084)
    ↓
会话管理 (Redis 存储)
    ↓
租赁机制 (并发控制)
    ↓
趋势分析 (K线数据 → 行情快照)
    ↓
提示词构建 (系统提示 + 角色设定 + 行情 + 历史)
    ↓
ONNX 推理引擎 (本地模型推理)
    ↓
响应清理 (去重、格式化)
    ↓
返回用户
```

#### 环境配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `CHAT_MODEL_PATH` | - | 模型目录路径 |
| `CHAT_ONNXRUNTIME_SHARED_LIBRARY_PATH` | - | ONNX Runtime 库路径 |
| `CHAT_MAX_SESSIONS` | 200 | 最大并发会话数 |
| `CHAT_LEASE_TTL_SEC` | 45 | 会话租赁超时(秒) |
| `CHAT_IDLE_TIMEOUT_SEC` | 900 | 空闲超时(15分钟) |
| `CHAT_MAX_HISTORY_TURNS` | 20 | 最大历史轮次 |
| `CHAT_MAX_MESSAGE_CHARS` | 2000 | 单条消息最大字符数 |
| `CHAT_INFER_TIMEOUT_MS` | 120000 | 推理超时(2分钟) |

#### API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/ws/chat` | WebSocket | 实时聊天连接 |
| `/api/chat` | POST | HTTP 聊天接口 |
| `/health` | GET | 健康检查 |

#### WebSocket 协议

**初始化消息**：
```json
{
  "type": "init",
  "token": "用户JWT令牌",
  "character_id": "角色ID",
  "session_id": "会话ID(可选)"
}
```

**用户消息**：
```json
{
  "type": "user_message",
  "text": "聊天内容",
  "client_msg_id": "客户端消息ID(可选)"
}
```

**服务器响应**：
- `ready`：会话就绪，包含角色信息和限制
- `assistant_delta`：AI 回复内容
- `assistant_done`：回复完成
- `error`：错误信息
- `queued`：排队等待

#### 行情快照数据

聊天时会实时获取角色行情数据，包括：
- 最新价格、1h/24h 涨跌幅
- 1h 最高/最低价、成交量
- MA5/MA20 均线
- 趋势标签：上行/下行/震荡

#### 并发控制机制

1. **租赁机制**：每个会话需要获取租赁才能进行推理
2. **队列等待**：超出并发限制时，请求进入等待队列
3. **超时管理**：租赁超时自动释放，防止死锁
4. **心跳保活**：定期刷新租赁，保持会话活跃

### 6. 全站大事件
- 市场异常预警
- 限时活动
- 系统公告

## 页面说明

| 路径 | 说明 | 需要登录 |
|------|------|----------|
| `/` | 首页（未登录=官网，登录=交易） | ❌ |
| `/login` | 登录页 | ❌ |
| `/register` | 注册页 | ❌ |
| `/wiki` | 角色百科 | ❌ |
| `/wiki?id=v001` | 角色详情 | ❌ |
| `/trading` | 交易面板 | ✅ |
| `/mining` | 应援挖矿 | ✅ |
| `/profile` | 用户中心 | ✅ |
| `/listing` | 申请上市 | ✅ |

## API 端口

| 服务 | 端口 | 说明 |
|------|------|------|
| API | 8080 | 用户/交易接口 |
| Match | 8081 | 撮合引擎 gRPC |
| Miner | 8082 | 挖矿服务 |
| Admin | 8083 | 管理后台 |
| Chat | 8084 | AI 聊天服务 |
| Trading Web | 3000 | 交易前端 |
| Admin Web | 3001 | 管理后台前端 |

## 数据库配置

核心配置表 `system_config`：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `daily_login_reward` | 100 | 每日登录奖励 |
| `trade_tax_rate` | 0.001 | 交易税率 |
| `mining_base_difficulty` | 4 | 基础挖矿难度 |
| `mining_max_difficulty` | 8 | 最大挖矿难度 |
| `mining_hourly_target` | 10000 | 每小时产出目标 |
| `rank_la` | 1000 | 拉-最大价值 |
| `rank_npc` | 5000 | NPC-最大价值 |
| `rank_ren` | 15000 | 人上人-最大价值 |
| `rank_ding` | 50000 | 顶级-最大价值 |

## License

MIT
