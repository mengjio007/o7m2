# o7m2 - 偶气满满

在线人气炒股软件 - 为喜爱的角色应援，获取人气值

## 项目架构

```
o7m2/
├── cmd/                    # 服务入口
│   ├── api/               # API 网关 (端口 8080)
│   ├── match/             # 撮合引擎 (端口 8081)
│   ├── miner/             # 挖矿服务 (端口 8082)
│   └── admin/             # 管理后台 (端口 8083)
├── internal/              # 核心业务逻辑
│   ├── domain/            # 领域模型
│   ├── engine/            # 撮合引擎
│   ├── service/           # 业务服务层
│   ├── handler/           # HTTP 处理器
│   └── repository/        # 数据访问层
├── pkg/                   # 公共包
├── proto/                 # gRPC 协议定义
├── web/                   # 前端项目
│   ├── trading/           # 交易前端 (端口 3000)
│   └── admin/             # 管理后台 (端口 3001)
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

# 4. 启动前端
cd web/trading && npm install && npm run dev
cd web/admin && npm install && npm run dev
```

## 核心功能

### 1. 人气值交易
- 支持限价单/市价单
- 高性能内存撮合引擎
- 实时行情推送

### 2. 应援挖矿 (Proof of Support)
- 动态难度调整
- 角色持仓加成
- 反作弊机制

### 3. 角色分类
- 二次元角色
- 明星艺人
- 政治人物
- 科学界人物

### 4. 全站大事件
- 市场异常预警
- 限时活动
- 系统公告

## API 端口

| 服务 | 端口 | 说明 |
|------|------|------|
| API | 8080 | 用户/交易接口 |
| Match | 8081 | 撮合引擎 gRPC |
| Miner | 8082 | 挖矿服务 |
| Admin | 8083 | 管理后台 |

## License

MIT
