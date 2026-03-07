# TrackYourMarket — 项目报告

**版本**: v1.0 (Checkpoint 2397e253)
**日期**: 2026年3月7日
**项目类型**: 金融科技 Web 应用
**在线预览**: [trackmarket-ajvh3qxx.manus.space](https://trackmarket-ajvh3qxx.manus.space)

---

## 一、项目概述与核心理念

### 1.1 项目定位

TrackYourMarket 是一款面向个人投资者的**智能金融新闻聚合与市场追踪平台**。与传统金融信息平台不同，TrackYourMarket 不以时间顺序排列新闻，而是通过自研的 **Relevance Index（相关性指数）** 算法对新闻进行智能排序，帮助投资者在信息过载的时代快速定位最具投资价值的市场动态。

### 1.2 核心价值主张

传统金融新闻平台（如 Yahoo Finance、Bloomberg Terminal）的信息呈现方式存在以下痛点：

| 痛点 | 传统平台 | TrackYourMarket 解决方案 |
|------|----------|--------------------------|
| 信息过载 | 按时间排列，重要新闻被淹没 | Relevance Index 智能排序，重要新闻优先展示 |
| 理解门槛高 | 原始新闻需要专业背景解读 | AI 自动生成投资者视角的新闻摘要 |
| 分散的信息源 | 需要在多个平台间切换 | 聚合 Yahoo Finance、CNBC、Reuters 等主流财经媒体 |
| 缺乏个性化 | 千人一面的信息流 | 自定义 Watchlist 追踪个人关注的股票 |
| 数据可视化不足 | 简单的价格列表 | Google Finance 风格的交互式图表 |

### 1.3 目标用户

TrackYourMarket 的目标用户群体为**美股个人投资者**，特别是：

- 日常需要追踪多只股票动态的活跃交易者
- 希望快速了解市场概况的兼职投资者
- 需要 AI 辅助理解复杂财经新闻的新手投资者
- 管理多个投资组合的资产配置者

---

## 二、产品功能详解

### 2.1 Daily Brief — 智能新闻聚合（核心功能）

Daily Brief 是 TrackYourMarket 的核心功能模块，提供经过智能排序的每日市场新闻简报。

**Relevance Index 算法**：每篇新闻被赋予 0-100 的相关性评分，评分依据包括：

| 评分因子 | 权重 | 说明 |
|----------|------|------|
| 财报相关关键词 | 高（+15/词） | earnings, revenue, profit, beat, miss, guidance |
| 分析师动态关键词 | 中（+8/词） | upgrade, downgrade, target, analyst, rating |
| 市场通用关键词 | 低（+3/词） | stock, market, trading, shares, price |
| 特定股票提及 | 中（+10） | 标题中直接提及追踪的股票代码 |

**新闻来源**：系统通过 Google News RSS 实时聚合以下来源的新闻：

- Yahoo Finance
- CNBC
- Reuters
- Bloomberg
- The Wall Street Journal
- Seeking Alpha
- Investor's Business Daily
- 以及其他主流财经媒体

**自动刷新机制**：后台调度器每 15 分钟自动从 Google News RSS 获取最新新闻，覆盖 AAPL、NVDA、MSFT、TSLA、GOOGL、AMZN、META 七大科技股以及整体市场动态。

### 2.2 AI 新闻详情页

点击任意新闻标题，用户将进入站内新闻详情页，而非跳转至外部链接。详情页的核心特性包括：

**AI 生成摘要**：系统调用大语言模型（LLM），基于新闻标题、来源、关键数据点，自动生成 2-3 段专业的投资者视角分析摘要。摘要以段落形式呈现，涵盖：事件核心要点、关键财务数据、对投资者的潜在影响。

**摘要缓存机制**：AI 生成的摘要会持久化存储到数据库中（`aiSummary` 字段），避免重复调用 LLM，既节省成本又提升响应速度。首次访问时生成，后续访问直接从数据库读取。

**原文链接**：详情页底部提供"View Original"按钮，用户可随时跳转至原始新闻来源查看完整报道。

### 2.3 实时股票数据与图表

系统通过 Yahoo Finance API 提供实时股票行情和历史价格图表。

**股票行情数据**包括：当前价格、涨跌幅、日内高低点、成交量、前收盘价、52 周高低点、市值等核心指标。

**交互式图表**采用 Google Finance 风格设计，支持 8 个时间维度的切换：

| 时间范围 | 数据间隔 | 适用场景 |
|----------|----------|----------|
| 1D（日内） | 5 分钟 | 日内交易监控 |
| 5D（5 天） | 15 分钟 | 短期趋势分析 |
| 1M（1 个月） | 1 天 | 近期走势回顾 |
| 6M（6 个月） | 1 天 | 中期趋势判断 |
| YTD（年初至今） | 1 天 | 年度表现评估 |
| 1Y（1 年） | 1 周 | 长期趋势分析 |
| 5Y（5 年） | 1 月 | 历史周期研究 |
| MAX（全部） | 1 月 | 完整历史回顾 |

图表使用 Recharts 库实现，支持鼠标悬停显示精确数据点、价格参考线、涨跌颜色区分等交互功能。

### 2.4 股票搜索

系统内置**全美股票数据库**，包含来自 NASDAQ 官方数据的 7,169 只股票，覆盖 NYSE、NASDAQ、AMEX 三大交易所。用户可通过股票代码或公司名称进行模糊搜索，搜索结果实时展示。

### 2.5 Watchlist — 自选股管理

Watchlist 功能支持用户创建和管理多个自选股列表：

- **多列表管理**：用户可创建多个 Watchlist（如"科技股"、"价值股"等），每个列表独立管理
- **完整 CRUD 操作**：支持创建、重命名、删除 Watchlist，以及添加/移除股票
- **折叠展开**：每个 Watchlist 支持折叠/展开，方便管理大量股票
- **本地持久化**：当前版本使用 localStorage 存储，无需登录即可使用
- **数据库支持**：已预留数据库表结构（`watchlists` + `watchlist_stocks`），支持未来登录后的云端同步

### 2.6 财经日历

Calendar 功能提供月历视图的财经事件管理：

- **事件类型**：支持 5 种事件类型 — 财报发布（earnings）、分红（dividend）、经济数据（economic）、IPO、自定义事件
- **重要性标记**：每个事件可标记为高/中/低重要性
- **股票关联**：事件可关联特定股票代码，方便追踪
- **完整 CRUD**：支持创建、编辑、删除事件

---

## 三、技术架构

### 3.1 技术栈概览

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| **前端框架** | React 19 + TypeScript | 最新版 React，类型安全 |
| **样式方案** | Tailwind CSS 4 + shadcn/ui | 原子化 CSS + 高质量组件库 |
| **路由** | Wouter | 轻量级客户端路由 |
| **图表** | Recharts | 基于 React 的声明式图表库 |
| **后端框架** | Express 4 + tRPC 11 | 类型安全的 API 层，端到端类型推导 |
| **数据库** | MySQL (TiDB) + Drizzle ORM | 云原生数据库 + 类型安全 ORM |
| **认证** | Manus OAuth | 内置 OAuth 认证流程 |
| **AI 集成** | 内置 LLM API | 用于生成新闻摘要 |
| **数据源** | Yahoo Finance API + Google News RSS | 实时行情 + 新闻聚合 |
| **构建工具** | Vite 7 | 极速开发服务器和构建 |
| **测试框架** | Vitest | 与 Vite 深度集成的测试框架 |
| **包管理** | pnpm | 高效的 Node.js 包管理器 |

### 3.2 架构设计

系统采用**全栈一体化架构**，前后端共享类型定义，通过 tRPC 实现端到端类型安全：

```
┌─────────────────────────────────────────────────────┐
│                    客户端 (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Dashboard │  │ Calendar │  │   NewsDetail     │   │
│  │  (首页)   │  │ (日历)   │  │  (新闻详情)      │   │
│  └─────┬─────┘  └─────┬────┘  └────────┬─────────┘  │
│        │              │                │             │
│  ┌─────┴──────────────┴────────────────┴──────────┐  │
│  │              tRPC Client Hooks                  │  │
│  │     (useQuery / useMutation / 类型推导)          │  │
│  └─────────────────────┬───────────────────────────┘  │
└────────────────────────┼─────────────────────────────┘
                         │ HTTP (JSON-RPC)
┌────────────────────────┼─────────────────────────────┐
│                    服务端 (Express)                    │
│  ┌─────────────────────┴───────────────────────────┐  │
│  │              tRPC Router                         │  │
│  │  stocks / news / calendar / watchlist / auth     │  │
│  └──┬──────────┬──────────┬──────────┬─────────────┘  │
│     │          │          │          │                 │
│  ┌──┴───┐  ┌──┴───┐  ┌──┴────┐  ┌──┴──────────┐     │
│  │Yahoo │  │Google│  │ LLM   │  │ News        │     │
│  │Finance│  │News  │  │ API   │  │ Scheduler   │     │
│  │ API  │  │ RSS  │  │       │  │ (15min)     │     │
│  └──────┘  └──────┘  └───────┘  └─────────────┘     │
│                         │                             │
│  ┌──────────────────────┴──────────────────────────┐  │
│  │           MySQL (TiDB) + Drizzle ORM            │  │
│  │  users / news_articles / calendar_events /      │  │
│  │  watchlists / watchlist_stocks                   │  │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

### 3.3 数据模型

系统包含 5 张核心数据表：

**users — 用户表**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT (PK) | 自增主键 |
| openId | VARCHAR(64) | Manus OAuth 唯一标识 |
| name | TEXT | 用户名 |
| email | VARCHAR(320) | 邮箱 |
| role | ENUM(user, admin) | 角色 |
| createdAt / updatedAt / lastSignedIn | TIMESTAMP | 时间戳 |

**news_articles — 新闻文章表**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT (PK) | 自增主键 |
| title | TEXT | 新闻标题 |
| url | TEXT | 原文链接 |
| source | VARCHAR(128) | 来源（Yahoo Finance, CNBC 等） |
| publishedAt | TIMESTAMP | 发布时间 |
| summary | TEXT | 关键要点摘要（bullet points） |
| aiSummary | TEXT | AI 生成的段落式详细摘要 |
| companies | TEXT | 关联股票代码（JSON 数组） |
| relevanceIndex | INT | 相关性指数（0-100） |
| eventType | VARCHAR(64) | 事件类型 |

**calendar_events — 日历事件表**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT (PK) | 自增主键 |
| title | VARCHAR(256) | 事件标题 |
| description | TEXT | 事件描述 |
| eventDate | TIMESTAMP | 事件日期 |
| eventType | ENUM | 类型（earnings/dividend/economic/ipo/custom） |
| symbol | VARCHAR(16) | 关联股票代码 |
| importance | ENUM | 重要性（low/medium/high） |

**watchlists — 自选股列表表**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT (PK) | 自增主键 |
| userId | INT | 关联用户 ID |
| name | VARCHAR(128) | 列表名称 |
| description | TEXT | 描述 |
| isDefault | INT | 是否为默认列表 |

**watchlist_stocks — 自选股关联表**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT (PK) | 自增主键 |
| watchlistId | INT | 关联 Watchlist ID |
| symbol | VARCHAR(16) | 股票代码 |
| addedAt | TIMESTAMP | 添加时间 |

---

## 四、API 接口清单

系统通过 tRPC 提供类型安全的 API 接口，共 5 个路由模块、20+ 个端点：

### 4.1 stocks — 股票数据接口

| 端点 | 类型 | 认证 | 说明 |
|------|------|------|------|
| `stocks.getQuote` | Query | 公开 | 获取单只股票实时行情 |
| `stocks.getChart` | Query | 公开 | 获取股票历史价格图表数据 |
| `stocks.search` | Query | 公开 | 按代码/名称搜索股票 |

### 4.2 news — 新闻接口

| 端点 | 类型 | 认证 | 说明 |
|------|------|------|------|
| `news.getByRelevance` | Query | 公开 | 按相关性指数排序获取新闻 |
| `news.getById` | Query | 公开 | 获取单篇新闻详情 |
| `news.getAiSummary` | Query | 公开 | 获取/生成 AI 新闻摘要 |
| `news.search` | Query | 公开 | 搜索新闻 |
| `news.refresh` | Mutation | 公开 | 手动触发新闻刷新 |
| `news.schedulerStatus` | Query | 公开 | 查询调度器运行状态 |

### 4.3 calendar — 日历接口

| 端点 | 类型 | 认证 | 说明 |
|------|------|------|------|
| `calendar.getAll` | Query | 公开 | 获取所有日历事件 |
| `calendar.getByMonth` | Query | 公开 | 按月份获取事件 |
| `calendar.getUpcoming` | Query | 公开 | 获取未来 N 天事件 |
| `calendar.getById` | Query | 公开 | 获取单个事件详情 |
| `calendar.create` | Mutation | 公开 | 创建事件 |
| `calendar.update` | Mutation | 公开 | 更新事件 |
| `calendar.delete` | Mutation | 公开 | 删除事件 |

### 4.4 watchlist — 自选股接口

| 端点 | 类型 | 认证 | 说明 |
|------|------|------|------|
| `watchlist.getAll` | Query | 登录 | 获取用户所有 Watchlist |
| `watchlist.getById` | Query | 登录 | 获取单个 Watchlist |
| `watchlist.getDefault` | Query | 登录 | 获取/创建默认 Watchlist |
| `watchlist.create` | Mutation | 登录 | 创建 Watchlist |
| `watchlist.update` | Mutation | 登录 | 更新 Watchlist |
| `watchlist.delete` | Mutation | 登录 | 删除 Watchlist |
| `watchlist.addStock` | Mutation | 登录 | 添加股票到 Watchlist |
| `watchlist.removeStock` | Mutation | 登录 | 从 Watchlist 移除股票 |
| `watchlist.setDefault` | Mutation | 登录 | 设置默认 Watchlist |

### 4.5 auth — 认证接口

| 端点 | 类型 | 认证 | 说明 |
|------|------|------|------|
| `auth.me` | Query | 公开 | 获取当前登录用户信息 |
| `auth.logout` | Mutation | 公开 | 登出 |

---

## 五、项目文件结构

```
trackyourmarket/
├── client/                          # 前端代码
│   ├── index.html                   # HTML 入口
│   ├── public/                      # 静态资源
│   └── src/
│       ├── App.tsx                  # 路由配置（3 个页面路由）
│       ├── main.tsx                 # 应用入口（Provider 配置）
│       ├── index.css                # 全局样式（主题色、字体）
│       ├── pages/
│       │   ├── Dashboard.tsx        # 首页（新闻 + Watchlist + 股票详情）
│       │   ├── NewsDetail.tsx       # 新闻详情页（AI 摘要）
│       │   ├── Calendar.tsx         # 财经日历页
│       │   ├── Home.tsx             # 备用首页
│       │   └── NotFound.tsx         # 404 页面
│       ├── components/
│       │   ├── StockDetail.tsx      # 股票详情组件（图表 + 指标）
│       │   ├── DashboardLayout.tsx  # 仪表盘布局组件
│       │   ├── AIChatBox.tsx        # AI 聊天组件（预置）
│       │   ├── Map.tsx              # 地图组件（预置）
│       │   └── ui/                  # shadcn/ui 组件库（40+ 组件）
│       ├── contexts/
│       │   └── ThemeContext.tsx      # 主题上下文
│       ├── hooks/                   # 自定义 Hooks
│       └── lib/
│           ├── trpc.ts              # tRPC 客户端配置
│           └── utils.ts             # 工具函数
│
├── server/                          # 后端代码
│   ├── routers.ts                   # tRPC 路由定义（所有 API 端点）
│   ├── db.ts                        # 数据库连接与查询辅助
│   ├── yahooFinance.ts              # Yahoo Finance API 集成
│   ├── newsService.ts               # 新闻服务（CRUD + AI 摘要生成）
│   ├── newsScheduler.ts             # 新闻自动刷新调度器
│   ├── calendarService.ts           # 日历事件服务
│   ├── watchlistService.ts          # Watchlist 服务
│   ├── usStocks.ts                  # 全美股票数据库（7,169 只）
│   ├── storage.ts                   # S3 文件存储
│   ├── stocks.test.ts               # 股票 & 新闻测试（6 个测试用例）
│   ├── calendar.test.ts             # 日历测试（6 个测试用例）
│   ├── auth.logout.test.ts          # 认证测试（1 个测试用例）
│   └── _core/                       # 框架核心（OAuth、tRPC、LLM 等）
│
├── drizzle/                         # 数据库迁移
│   ├── schema.ts                    # 数据表定义（5 张表）
│   ├── relations.ts                 # 表关系定义
│   ├── 0000-0004*.sql               # 5 次迁移文件
│   └── meta/                        # 迁移元数据
│
├── shared/                          # 前后端共享代码
│   ├── types.ts                     # 共享类型定义
│   └── const.ts                     # 共享常量
│
├── package.json                     # 项目依赖（70+ 包）
├── tsconfig.json                    # TypeScript 配置
├── vite.config.ts                   # Vite 构建配置
├── vitest.config.ts                 # 测试配置
├── drizzle.config.ts                # Drizzle ORM 配置
└── todo.md                          # 功能追踪清单
```

---

## 六、测试覆盖

项目包含 **13 个自动化测试用例**，全部通过：

| 测试文件 | 测试用例数 | 覆盖范围 |
|----------|-----------|----------|
| `stocks.test.ts` | 6 | 股票行情获取、图表数据、搜索功能、新闻刷新、新闻排序、新闻搜索 |
| `calendar.test.ts` | 6 | 事件创建、读取、更新、删除、按月查询、即将到来事件 |
| `auth.logout.test.ts` | 1 | 用户登出流程 |

---

## 七、UI 设计风格

TrackYourMarket 的 UI 设计经历了多次迭代，最终采用了受 **Scholar Inbox** 启发的清爽专业风格：

- **配色方案**：白色背景 + 红色/珊瑚色主色调 + 灰色文字层级
- **字体**：Inter（Google Fonts），支持 300-700 字重
- **布局**：顶部水平导航栏 + 内容区域自适应布局
- **卡片设计**：白色卡片 + 微妙阴影 + 左侧彩色边框（hover 效果）
- **数据可视化**：绿色表示上涨、红色表示下跌的直觉化配色

---

## 八、已完成的开发里程碑

以下是按时间顺序排列的主要开发里程碑：

| 阶段 | 里程碑 | 状态 |
|------|--------|------|
| 1 | 项目初始化、数据库设计、基础 API 搭建 | 已完成 |
| 2 | Yahoo Finance API 集成（行情 + 图表） | 已完成 |
| 3 | 新闻聚合系统（RSS + 相关性评分） | 已完成 |
| 4 | 前端 Dashboard 页面（新闻 + Watchlist + 股票详情） | 已完成 |
| 5 | Google Finance 风格交互式图表 | 已完成 |
| 6 | Scholar Inbox 风格 UI 重设计 | 已完成 |
| 7 | 全美股票搜索（7,169 只股票） | 已完成 |
| 8 | 多 Watchlist 管理系统 | 已完成 |
| 9 | 财经日历（月历视图 + CRUD） | 已完成 |
| 10 | Google News RSS 自动新闻刷新（15 分钟间隔） | 已完成 |
| 11 | AI 新闻摘要生成（LLM 集成） | 已完成 |
| 12 | 站内新闻详情页 | 已完成 |
| 13 | 自动化测试（13 个测试用例） | 已完成 |

---

## 九、未来开发路线图

### 9.1 短期计划（1-2 周）

| 优先级 | 功能 | 说明 |
|--------|------|------|
| P0 | Relevance Index 算法升级 | 引入 NLP 模型替代关键词匹配，提升排序准确性 |
| P0 | 新闻去重优化 | 解决同一事件多篇报道的去重问题 |
| P1 | 股票标签过滤 | 点击新闻卡片上的股票标签，过滤只显示该股票相关新闻 |
| P1 | 新闻来源多样化 | 接入更多新闻源（Bloomberg、Reuters API） |
| P2 | 手动刷新按钮 | 在 UI 上添加手动触发新闻刷新的按钮 |

### 9.2 中期计划（1-2 个月）

| 优先级 | 功能 | 说明 |
|--------|------|------|
| P0 | 用户注册/登录系统完善 | 完善 OAuth 登录流程，支持 Watchlist 云端同步 |
| P0 | 个性化新闻推送 | 基于用户 Watchlist 定制新闻流 |
| P1 | 推送通知 | 重要新闻（Relevance Index > 80）实时推送 |
| P1 | 新闻收藏/书签 | 用户可保存感兴趣的新闻文章 |
| P2 | 社交分享 | 新闻详情页添加分享功能 |
| P2 | 移动端适配优化 | 针对手机端的响应式布局优化 |

### 9.3 长期愿景（3-6 个月）

| 优先级 | 功能 | 说明 |
|--------|------|------|
| P0 | AI 投资助手 | 基于用户持仓和市场动态的 AI 对话式分析 |
| P0 | 全球市场扩展 | 支持港股、A 股、欧洲市场 |
| P1 | 投资组合分析 | 持仓管理、收益追踪、风险评估 |
| P1 | 财报自动解读 | 财报发布后自动生成分析报告 |
| P2 | 社区功能 | 用户讨论、观点分享、投票 |

---

## 十、竞争优势与差异化

| 维度 | Yahoo Finance | Bloomberg Terminal | TrackYourMarket |
|------|---------------|-------------------|-----------------|
| 定价 | 免费/Premium | $24,000/年 | 免费（计划 Freemium） |
| 新闻排序 | 时间顺序 | 时间顺序 | **Relevance Index 智能排序** |
| AI 摘要 | 无 | 有限 | **每篇新闻自动生成** |
| 个性化 | 基础 | 高度定制 | **基于 Watchlist 定制** |
| 学习曲线 | 低 | 极高 | **极低** |
| 目标用户 | 大众 | 专业机构 | **个人投资者** |

---

## 十一、总结

TrackYourMarket 目前已完成核心功能的 MVP 版本开发，具备完整的新闻聚合、智能排序、AI 摘要、实时行情、交互式图表、自选股管理和财经日历等功能。项目采用现代化的全栈技术架构，代码质量有自动化测试保障，UI 设计专业清爽。

项目的核心差异化在于 **Relevance Index 智能排序** 和 **AI 新闻摘要** 两大特性，这两项功能直接解决了个人投资者在信息过载时代的核心痛点。随着 NLP 算法的持续优化和用户数据的积累，Relevance Index 的准确性将不断提升，形成数据飞轮效应。

下一阶段的重点将放在用户系统完善、个性化推送、以及 AI 投资助手的开发上，逐步从工具型产品向智能投资平台演进。
