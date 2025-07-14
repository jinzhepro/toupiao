"use client";

import { useState, useEffect } from "react";
import { membersList } from "../../utils/memberList";
import d from "../../utils/d";

export default function AdminPage() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAllPolls();
  }, []);

  const loadAllPolls = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/polls");
      if (!response.ok) {
        throw new Error("获取投票数据失败");
      }
      const data = await response.json();
      setPolls(data);
    } catch (err) {
      console.error("加载投票数据失败:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 计算成员总分
  const calculateMemberTotal = (scores) => {
    if (!scores || !Array.isArray(scores)) return 0;
    return scores.reduce((sum, score) => sum + (score || 0), 0);
  };

  // 获取等级
  const getGradeLevel = (totalScore) => {
    if (totalScore >= 90)
      return { level: "优秀", color: "text-green-600 bg-green-100" };
    if (totalScore >= 80)
      return { level: "良好", color: "text-blue-600 bg-blue-100" };
    if (totalScore >= 70)
      return { level: "合格", color: "text-yellow-600 bg-yellow-100" };
    return { level: "待改进", color: "text-red-600 bg-red-100" };
  };

  // 排序成员（按总分降序）
  const sortMembersByScore = (pollData) => {
    if (!pollData.scores) return [];

    return Object.entries(pollData.scores)
      .map(([memberName, scores]) => ({
        name: memberName,
        scores,
        total: calculateMemberTotal(scores),
      }))
      .sort((a, b) => b.total - a.total);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">加载失败</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={loadAllPolls}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            投票管理后台
          </h1>
          <p className="text-gray-600 text-center mt-2">
            查看所有投票数据和成员得分统计
          </p>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {polls.length}
              </div>
              <div className="text-gray-600">总投票数</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {polls.filter((poll) => poll.status === "completed").length}
              </div>
              <div className="text-gray-600">已完成投票</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {membersList.length}
              </div>
              <div className="text-gray-600">参评成员数</div>
            </div>
          </div>
        </div>

        {/* 投票列表 */}
        {polls.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-500 text-lg">暂无投票数据</div>
          </div>
        ) : (
          <div className="space-y-6">
            {polls.map((poll) => {
              const sortedMembers = sortMembersByScore(poll);

              return (
                <div
                  key={poll.id}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  {/* 投票基本信息 */}
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">
                        投票 #{poll.id}
                      </h2>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          poll.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {poll.status === "completed" ? "已完成" : "进行中"}
                      </span>
                    </div>
                    <div className="text-gray-600 text-sm space-y-1">
                      <div>
                        创建时间:{" "}
                        {new Date(poll.createdAt).toLocaleString("zh-CN")}
                      </div>
                      {poll.completedAt && (
                        <div>
                          完成时间:{" "}
                          {new Date(poll.completedAt).toLocaleString("zh-CN")}
                        </div>
                      )}
                      {poll.question && <div>投票主题: {poll.question}</div>}
                    </div>
                  </div>

                  {/* 成员得分表格 */}
                  {sortedMembers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              排名
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              成员姓名
                            </th>
                            {d.map((item) => (
                              <th
                                key={item.name}
                                className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {item.name}
                              </th>
                            ))}
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              总分
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              等级
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sortedMembers.map((member, index) => {
                            const grade = getGradeLevel(member.total);
                            return (
                              <tr
                                key={member.name}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  #{index + 1}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {member.name}
                                </td>
                                {member.scores &&
                                  member.scores.map((score, scoreIndex) => (
                                    <td
                                      key={scoreIndex}
                                      className="px-2 py-4 whitespace-nowrap text-sm text-center"
                                    >
                                      <span
                                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                          score >= 9
                                            ? "bg-green-100 text-green-800"
                                            : score >= 8
                                            ? "bg-blue-100 text-blue-800"
                                            : score >= 7
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {score || 0}
                                      </span>
                                    </td>
                                  ))}
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-semibold">
                                  {member.total}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${grade.color}`}
                                  >
                                    {grade.level}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      该投票暂无评分数据
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 返回按钮 */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            ← 返回主页
          </a>
        </div>
      </div>
    </div>
  );
}
