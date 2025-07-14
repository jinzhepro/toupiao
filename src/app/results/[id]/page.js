"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResultsPage({ params }) {
  const router = useRouter();
  const [poll, setPoll] = useState(null);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [params.id]);

  const fetchResults = async () => {
    try {
      const [pollResponse, resultsResponse] = await Promise.all([
        fetch(`/api/polls/${params.id}`),
        fetch(`/api/polls/${params.id}/results`),
      ]);

      if (pollResponse.ok && resultsResponse.ok) {
        const pollData = await pollResponse.json();
        const resultsData = await resultsResponse.json();
        setPoll(pollData);
        setResults(resultsData);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("获取投票结果失败:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (votes, total) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const getTotalVotes = () => {
    return Object.values(results).reduce((sum, votes) => sum + votes, 0);
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

  if (!poll) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">投票不存在</p>
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-700 mt-2 inline-block"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const totalVotes = getTotalVotes();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-700 transition-colors"
          >
            ← 返回首页
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {poll.question}
          </h1>
          <p className="text-gray-600 mb-6">总投票数: {totalVotes}</p>

          <div className="space-y-4 mb-6">
            {poll.options.map((option, index) => {
              const votes = results[option] || 0;
              const percentage = calculatePercentage(votes, totalVotes);

              return (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-800">{option}</span>
                    <span className="text-sm text-gray-600">
                      {votes} 票 ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalVotes === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">还没有人投票</p>
              <p className="text-gray-400 mt-2">快来投出第一票吧！</p>
            </div>
          )}

          <div className="flex space-x-4">
            <Link
              href={`/vote/${params.id}`}
              className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors"
            >
              参与投票
            </Link>
            <button
              onClick={fetchResults}
              className="flex-1 bg-gray-500 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              刷新结果
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
