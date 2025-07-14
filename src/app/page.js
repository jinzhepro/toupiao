"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await fetch("/api/polls");
      const data = await response.json();
      setPolls(data);
    } catch (error) {
      console.error("获取投票列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">匿名投票系统</h1>
        <p className="text-gray-600 mb-6">创建投票、参与投票、查看结果</p>
        <Link
          href="/create"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          创建新投票
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">当前活跃的投票</h2>

        {polls.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">暂无活跃投票</p>
            <p className="text-gray-400 mt-2">点击上方按钮创建第一个投票吧！</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {polls.map((poll) => (
              <div
                key={poll.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-3 text-gray-800">
                  {poll.question}
                </h3>
                <p className="text-gray-600 mb-4">
                  选项: {poll.options.length} 个
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  总投票数: {poll.totalVotes || 0}
                </p>
                <div className="flex space-x-2">
                  <Link
                    href={`/vote/${poll.id}`}
                    className="flex-1 bg-blue-500 hover:bg-blue-700 text-white text-center font-bold py-2 px-4 rounded transition-colors"
                  >
                    参与投票
                  </Link>
                  <Link
                    href={`/results/${poll.id}`}
                    className="flex-1 bg-gray-500 hover:bg-gray-700 text-white text-center font-bold py-2 px-4 rounded transition-colors"
                  >
                    查看结果
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
