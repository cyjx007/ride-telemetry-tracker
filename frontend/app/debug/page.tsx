"use client";

import { useState, useEffect } from "react";
import Link from "next/link"; // 用于页面跳转

export default function DebugDashboard() {
  const [rides, setRides] = useState<any[]>([]);
  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      // 同时发起两个请求：查 PG 数据库 和 查 Redis 缓存
      const [ridesRes, cacheRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/rides/all"),
        fetch("http://127.0.0.1:8000/api/debug/cache")
      ]);
      
      setRides(await ridesRes.json());
      setCacheStatus(await cacheRes.json());
    } catch (error) {
      console.error("抓取 Debug 数据失败", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 p-8 font-mono">
      <div className="max-w-6xl mx-auto">
        
        {/* 顶部导航 */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold text-green-400">系统数据探查器 (Debug 面板)</h1>
          <div className="space-x-4">
            <button onClick={fetchDebugData} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors border border-gray-700">
              🔄 刷新底层数据
            </button>
            <Link href="/" className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-blue-200 rounded text-sm transition-colors border border-blue-700">
              返回大盘看板
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-xl animate-pulse">正在穿透抓取底层数据...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 左侧：Redis 缓存状态 (占 1 列) */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gray-900 border border-red-900/50 rounded-lg overflow-hidden shadow-2xl">
                <div className="bg-red-950/30 px-4 py-3 border-b border-red-900/50 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-red-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                    Redis Cache
                  </h2>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Key (键名)</div>
                    <code className="text-pink-400 bg-gray-950 px-2 py-1 rounded block">{cacheStatus?.cache_key}</code>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Status (状态)</div>
                    {cacheStatus?.is_cached ? (
                      <span className="text-green-400 border border-green-800 bg-green-950 px-2 py-1 rounded text-xs">HIT (缓存存在)</span>
                    ) : (
                      <span className="text-yellow-400 border border-yellow-800 bg-yellow-950 px-2 py-1 rounded text-xs">MISS (缓存为空)</span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">TTL (剩余过期时间)</div>
                    <div className="text-xl font-bold text-white">{cacheStatus?.ttl_seconds} <span className="text-sm font-normal text-gray-500">秒</span></div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Raw Value (原始 JSON 值)</div>
                    <pre className="bg-black text-green-300 p-3 rounded text-xs overflow-x-auto border border-gray-800">
                      {JSON.stringify(cacheStatus?.raw_value, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：PostgreSQL 数据库表格 (占 2 列) */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900 border border-blue-900/50 rounded-lg overflow-hidden shadow-2xl">
                <div className="bg-blue-950/30 px-4 py-3 border-b border-blue-900/50 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-blue-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                    PostgreSQL Database (rides 表)
                  </h2>
                  <span className="text-xs text-gray-500">共 {rides.length} 条记录</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-950/50 text-gray-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">ID (主键)</th>
                        <th className="px-4 py-3 font-medium">Date (日期)</th>
                        <th className="px-4 py-3 font-medium">Vehicle (载具)</th>
                        <th className="px-4 py-3 font-medium text-right">Dist (km)</th>
                        <th className="px-4 py-3 font-medium text-right">Time (min)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {rides.map((ride) => (
                        <tr key={ride.id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3 text-gray-500">#{ride.id}</td>
                          <td className="px-4 py-3 text-purple-300">{ride.ride_date}</td>
                          <td className="px-4 py-3">{ride.vehicle}</td>
                          <td className="px-4 py-3 text-right font-bold text-white">{ride.distance_km}</td>
                          <td className="px-4 py-3 text-right text-gray-400">{ride.duration_mins}</td>
                        </tr>
                      ))}
                      {rides.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-600">数据库空空如也</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}