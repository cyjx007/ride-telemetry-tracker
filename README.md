# 🚴 Ride Telemetry Tracker (个人骑行遥测数据看板)

一个现代化的全栈骑行数据追踪与遥测看板系统。通过前后端分离架构实现，底层采用 PostgreSQL 持久化存储与 Redis 高频缓存，提供极速的数据读写体验。

## ✨ 核心特性

- **现代 UI 界面:** 基于 Next.js (App Router) + Tailwind CSS 构建的极客风深色数据看板。
- **高性能 API:** 基于 FastAPI 构建的纯异步后端，使用 `asyncpg` 驱动。
- **高频缓存机制:** 核心大盘数据接入 Redis，利用 TTL 过期策略与写入时失效机制，保障数据一致性。
- **系统探查器 (Debug Dashboard):** 内置开发者专属 Debug 面板，实时透视 PostgreSQL 底层数据与 Redis 缓存状态。
- **容器化部署:** 数据库与缓存中间件均通过 Docker Compose 一键编排，环境隔离，开箱即用。

---

## 🛠️ 技术栈 (Tech Stack)

- **前端 (Frontend):** React 18, Next.js 14, Tailwind CSS, TypeScript
- **后端 (Backend):** Python 3.x, FastAPI, SQLAlchemy (Async), Pydantic
- **基础设施 (Infra):** PostgreSQL 15, Redis 7, Docker & Docker Compose

---

## 🚀 本地运行指南 (Getting Started)

### 前置要求

请确保您的计算机已安装以下环境：

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows 推荐开启 WSL2)
- [Python 3.10+](https://www.python.org/)
- [Node.js 18+](https://nodejs.org/)

### 1. 克隆项目与启动底层设施

```bash
git clone [https://github.com/cyjx007/ride-telemetry-tracker.git](https://github.com/cyjx007/ride-telemetry-tracker.git)
cd ride-telemetry-tracker

# 一键拉起 PostgreSQL 和 Redis 容器
docker-compose up -d
```

### 2. 启动 FastAPI 后端

```bash
cd backend

# 创建并激活虚拟环境 (Windows)
python -m venv venv
.\venv\Scripts\activate

# 安装依赖
pip install fastapi uvicorn sqlalchemy asyncpg redis pydantic

# 启动服务
uvicorn main:app --reload
```

> **💡 提示：** 启动成功后，API 交互文档地址为 http://127.0.0.1:8000/docs

### 3. 启动 Next.js 前端

请打开一个**新的终端窗口**：

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

> **💡 提示：** 打开浏览器访问 http://localhost:3000 即可看到主看板。

---

## 📊 数据结构示例 (Data Schema)

系统支持记录详细的骑行载具与耗时信息。前端发往后端的示例 JSON 数据如下：

```json
{
  "ride_date": "2026-04-15",
  "distance_km": 115.29,
  "duration_mins": 320,
  "vehicle": "Merida Warrior 500"
}
```

---

## 🤝 参与贡献 (Contributing)

欢迎提交 Pull Request 或发起 Issue 讨论！

## 📄 开源协议 (License)

This project is licensed under the MIT License.