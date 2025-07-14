# 匿名投票系统

一个基于 Next.js 和 Redis 的匿名投票系统，支持创建投票、参与投票和查看实时结果。

## 功能特性

- 🗳️ 创建自定义投票问题和选项
- 🔒 匿名投票，保护用户隐私
- 📊 实时投票结果显示
- 📱 响应式设计，支持移动端
- ⚡ 基于 Redis 的高性能数据存储
- 🎨 现代化的 UI 设计

## 技术栈

- **前端**: Next.js 14, React 18, Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Redis
- **语言**: JavaScript

## 安装和运行

### 前置要求

1. Node.js 16+
2. Redis 服务器

### 安装步骤

1. 安装依赖：

   ```bash
   npm install
   ```

2. 安装 Tailwind CSS 和相关依赖：

   ```bash
   npm install -D tailwindcss postcss autoprefixer
   ```

3. 启动 Redis 服务器：

   ```bash
   # macOS (使用 Homebrew)
   brew services start redis

   # 或者直接运行
   redis-server
   ```

4. 配置环境变量：
   复制 `.env.local` 文件并根据需要修改 Redis 连接配置。

5. 启动开发服务器：

   ```bash
   npm run dev
   ```

6. 打开浏览器访问 `http://localhost:3000`

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   └── polls/          # API 路由
│   ├── create/             # 创建投票页面
│   ├── vote/[id]/          # 投票页面
│   ├── results/[id]/       # 结果页面
│   ├── globals.css         # 全局样式
│   ├── layout.js           # 根布局
│   └── page.js             # 首页
└── lib/
    └── redis.js            # Redis 连接配置
```

## 使用说明

1. **创建投票**: 点击首页的"创建新投票"按钮，输入问题和选项
2. **参与投票**: 选择一个选项并提交投票
3. **查看结果**: 实时查看投票结果和统计信息
4. **防重复投票**: 使用本地存储防止重复投票

## API 接口

- `GET /api/polls` - 获取所有投票
- `POST /api/polls` - 创建新投票
- `GET /api/polls/[id]` - 获取单个投票信息
- `POST /api/polls/[id]/vote` - 提交投票
- `GET /api/polls/[id]/results` - 获取投票结果

## 部署

### Redis 云服务

推荐使用 Redis 云服务（如 Redis Cloud, AWS ElastiCache）：

1. 获取 Redis 连接 URL
2. 在 `.env.local` 中设置 `REDIS_URL`

### Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 设置环境变量 `REDIS_URL`
4. 部署

## 开发说明

- 投票数据存储在 Redis 中，使用 Hash 数据结构
- 防重复投票机制基于浏览器本地存储
- 响应式设计支持各种屏幕尺寸
- 使用 Tailwind CSS 进行样式设计

## 许可证

MIT License
