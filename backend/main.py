from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware # 新增这一行
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, Float, String, Date, select
from datetime import date
import redis.asyncio as redis
import json

# ==========================================
# 1. 数据库配置 (PostgreSQL & Redis)
# ==========================================
# 连接刚才用 Docker 启动的本地 5432 端口
DATABASE_URL = "postgresql+asyncpg://admin:password123@localhost/telemetry_db"
engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

# 连接 Docker 启动的本地 Redis 6379 端口
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# ==========================================
# 2. SQLAlchemy 数据模型 (自动映射成数据库表)
# ==========================================
class RideRecord(Base):
    __tablename__ = "rides"
    id = Column(Integer, primary_key=True, index=True)
    ride_date = Column(Date, nullable=False)
    distance_km = Column(Float, nullable=False)
    duration_mins = Column(Integer, nullable=False)
    vehicle = Column(String, nullable=False)

# ==========================================
# 3. Pydantic 模型 (用于校验前端传来的数据)
# ==========================================
class RideCreate(BaseModel):
    ride_date: date
    distance_km: float = Field(..., example=115.29)
    duration_mins: int = Field(..., example=320)
    vehicle: str = Field(default="Merida Warrior 500")

class RideResponse(RideCreate):
    id: int
    class Config:
        orm_mode = True

# ==========================================
# 4. FastAPI 实例与生命周期
# ==========================================
app = FastAPI(title="Ride Telemetry API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 允许所有端口访问 (生产环境建议写死前端域名)
    allow_credentials=True,
    allow_methods=["*"], # 允许 GET, POST 等所有方法
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # 程序启动时，自动去 PostgreSQL 里建表
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# 获取数据库 Session 的依赖函数
async def get_db():
    async with SessionLocal() as session:
        yield session

# ==========================================
# 5. 核心 API 路由 (录入与查询大盘)
# ==========================================
@app.post("/api/rides", response_model=RideResponse)
async def create_ride(ride: RideCreate, db: AsyncSession = Depends(get_db)):
    # 1. 将前端发来的数据存入 PostgreSQL
    db_ride = RideRecord(**ride.dict())
    db.add(db_ride)
    await db.commit()
    await db.refresh(db_ride)
    
    # 2. 关键：有新数据入库，立刻清空过期的 Redis 缓存！
    await redis_client.delete("stats:total_distance")
    
    return db_ride

@app.get("/api/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    # 1. 查询统计数据时，先看 Redis 里有没有现成的
    cached_stats = await redis_client.get("stats:total_distance")
    if cached_stats:
        print("⚡ 命中 Redis 缓存！直接返回。")
        return {"source": "redis", "data": json.loads(cached_stats)}

    # 2. 如果 Redis 里没有，就去 PostgreSQL 里老老实实算一遍
    print("🐌 缓存未命中，执行 PostgreSQL 查询...")
    result = await db.execute(select(RideRecord))
    rides = result.scalars().all()
    
    total_dist = sum(r.distance_km for r in rides)
    total_rides = len(rides)
    stats_data = {"total_km": total_dist, "total_rides": total_rides}
    
    # 3. 算完之后，顺手把结果扔进 Redis，设置 60 秒过期
    await redis_client.setex("stats:total_distance", 60, json.dumps(stats_data))
    
    return {"source": "database", "data": stats_data}

# ==========================================
# 6. Debug 面板专属接口 (探查底层数据)
# ==========================================

@app.get("/api/rides/all", response_model=list[RideResponse])
async def get_all_rides(db: AsyncSession = Depends(get_db)):
    """获取 PostgreSQL 中的所有原始记录，按时间倒序排"""
    # 执行查询，按 ID 倒序排列，最新的在最前面
    result = await db.execute(select(RideRecord).order_by(RideRecord.id.desc()))
    return result.scalars().all()

@app.get("/api/debug/cache")
async def get_cache_status():
    """获取 Redis 缓存的原始状态和过期时间"""
    key = "stats:total_distance"
    raw_value = await redis_client.get(key)
    ttl = await redis_client.ttl(key) # 获取剩余存活时间 (Time To Live)
    
    return {
        "cache_key": key,
        "is_cached": raw_value is not None,
        "raw_value": json.loads(raw_value) if raw_value else "Null (缓存已清空或过期)",
        "ttl_seconds": ttl if ttl > 0 else "N/A"
    }