"use client"; // 声明这是一个客户端组件，可以使用 useState 和 useEffect

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  // 1. 定义页面状态
  const [stats, setStats] = useState({ total_km: 0, total_rides: 0 });
  const [dataSource, setDataSource] = useState("");
  const [loading, setLoading] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    ride_date: new Date().toISOString().split("T")[0], // 默认今天
    distance_km: "",
    duration_mins: "",
    vehicle: "Merida Warrior 500",
  });

  // 2. 获取统计大盘数据的函数
  const fetchStats = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/stats");
      const result = await res.json();
      setStats(result.data);
      setDataSource(result.source); // 记录是 database 还是 redis
    } catch (error) {
      console.error("无法连接到后端API", error);
    }
  };

  // 3. 页面初次加载时，自动拉取一次数据
  useEffect(() => {
    fetchStats();
  }, []);

  // 4. 处理表单提交的函数
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 向 FastAPI 发送 POST 请求
      await fetch("http://127.0.0.1:8000/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ride_date: formData.ride_date,
          distance_km: parseFloat(formData.distance_km),
          duration_mins: parseInt(formData.duration_mins),
          vehicle: formData.vehicle,
        }),
      });

      // 提交成功后，清空输入框，并重新拉取大盘数据！
      setFormData({ ...formData, distance_km: "", duration_mins: "" });
      await fetchStats(); 
    } catch (error) {
      alert("提交失败，请检查后端是否运行");
    } finally {
      setLoading(false);
    }
  };

  // 5. 渲染 UI 界面 (使用了 Tailwind CSS 进行快速排版)
  return (
    <div className="min-h-screen bg-gray-900 text-white p-10 font-sans">
      <h1 className="text-4xl font-bold mb-10 text-center text-blue-400">
        骑行遥测数据看板
      </h1>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* 左侧：数据录入表单 */}
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-2xl font-semibold mb-6">新增骑行记录</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-400 mb-2">日期</label>
              <input
                type="date"
                value={formData.ride_date}
                onChange={(e) => setFormData({ ...formData, ride_date: e.target.value })}
                className="w-full bg-gray-700 rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-2">距离 (km)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.distance_km}
                  onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                  className="w-full bg-gray-700 rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: 115.29"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">耗时 (分钟)</label>
                <input
                  type="number"
                  value={formData.duration_mins}
                  onChange={(e) => setFormData({ ...formData, duration_mins: e.target.value })}
                  className="w-full bg-gray-700 rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: 320"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 mb-2">载具</label>
              <input
                type="text"
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                className="w-full bg-gray-700 rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              {loading ? "正在写入数据库..." : "同步数据"}
            </button>
          </form>
        </div>

        {/* 右侧：数据大盘与缓存状态 */}
        <div className="space-y-6">
          <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-2xl font-semibold mb-2">总里程 (Total Distance)</h2>
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              {stats.total_km.toFixed(2)} <span className="text-2xl text-gray-400">km</span>
            </div>
            <p className="text-gray-400 mt-4">总骑行次数: <span className="text-white font-bold">{stats.total_rides}</span> 次</p>
          </div>

          <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="text-lg text-gray-400 mb-1">当前数据来源</h3>
              <p className="text-sm text-gray-500">尝试刷新页面，观察数据从哪里读取</p>
            </div>
            <div className={`px-4 py-2 rounded-full font-bold text-sm tracking-widest uppercase ${
              dataSource === 'redis' ? 'bg-green-900 text-green-300 border border-green-700' : 
              dataSource === 'database' ? 'bg-blue-900 text-blue-300 border border-blue-700' : 'bg-gray-700 text-gray-400'
            }`}>
              {dataSource || "LOADING..."}
            </div>
          </div>
          
          <button 
            onClick={fetchStats}
            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-3 px-4 rounded border border-gray-600 transition-colors"
          >
            手动刷新数据 (测试缓存)
          </button>
          {/* ✨ 新增的跳转按钮：使用 mt-4 (margin-top) 增加一点间距 */}
          <Link 
            href="/debug" 
            className="block w-full text-center bg-gray-950 hover:bg-gray-900 text-green-500 font-mono font-bold py-3 px-4 rounded border border-green-900/50 transition-colors mt-4"
          >
            {">"}_ 进入系统数据探查器
          </Link>
        </div>
      </div>
    </div>
  );
}