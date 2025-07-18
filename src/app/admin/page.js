"use client";

import { useState, useEffect } from "react";
import { membersList } from "../../utils/memberList";
import d from "../../utils/d";
import * as XLSX from "xlsx";

export default function AdminPage() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [overallAverage, setOverallAverage] = useState(0);
  const [averageData, setAverageData] = useState([]);

  const ADMIN_PASSWORD = "erty";

  useEffect(() => {
    // 检查本地存储是否已经认证过
    const savedAuth = localStorage.getItem("adminAuthenticated");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
      loadAllPolls();
    } else {
      setLoading(false);
    }
  }, []);

  const loadAllPolls = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/polls");
      if (!response.ok) {
        throw new Error("获取投票数据失败");
      }
      const data = await response.json();
      console.log("data", data);

      setPolls(data);

      // 计算所有成员的平均成绩
      calculateAndSetOverallAverage(data);
    } catch (err) {
      console.error("加载投票数据失败:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理密码验证
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError("");
      localStorage.setItem("adminAuthenticated", "true");
      loadAllPolls();
    } else {
      setPasswordError("密码错误，请重试");
      setPassword("");
    }
  };

  // 退出登录
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    setPasswordError("");
    localStorage.removeItem("adminAuthenticated");
  };

  // 计算成员总分
  const calculateMemberTotal = (scores) => {
    if (!scores || !Array.isArray(scores)) return 0;
    return scores.reduce((sum, score) => sum + (score || 0), 0);
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

  // 计算并设置所有成员的平均分
  const calculateAndSetOverallAverage = (pollsData) => {
    const completedPolls = pollsData.filter(
      (poll) => poll.status === "completed" && poll.scores
    );
    if (completedPolls.length === 0) {
      setOverallAverage(0);
      return;
    }

    let totalScore = 0;
    let totalMembers = 0;

    const calculateData = [];
    const all = {};

    completedPolls.forEach((poll) => {
      Object.keys(poll.scores).forEach((memberName) => {
        const scores = poll.scores[memberName];
        if (all[memberName]) {
          all[memberName] = all[memberName].map((score, index) => {
            return score + (scores[index] || 0);
          });
        } else {
          all[memberName] = [...scores];
        }
      });
    });
    Object.keys(all).forEach((memberName) => {
      calculateData.push({
        name: memberName,
        scores: all[memberName].map((score) =>
          (score / completedPolls.length).toFixed(2)
        ),
        total: Number(
          calculateMemberTotal(
            all[memberName].map((score) => score / completedPolls.length)
          ).toFixed(2)
        ),
      });
    });
    console.log("all", all);

    console.log("calculateData", calculateData);

    // 按总分排序并保存到状态
    calculateData.sort((a, b) => b.total - a.total);
    setAverageData(calculateData);
  };

  // 导出平均得分数据到Excel
  const exportAverageData = () => {
    if (averageData.length === 0) {
      alert("暂无数据可导出");
      return;
    }

    // 准备导出数据
    const exportData = averageData.map((member, index) => {
      const row = {
        排名: index + 1,
        成员姓名: member.name,
        平均总分: member.total,
      };

      // 添加各项评分
      d.forEach((item, itemIndex) => {
        row[item.name] = member.scores[itemIndex] || 0;
      });

      return row;
    });

    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "成员平均得分统计");

    // 生成文件名
    const fileName = `成员平均得分统计_${new Date()
      .toLocaleDateString("zh-CN")
      .replace(/\//g, "-")}.xlsx`;

    // 导出文件
    XLSX.writeFile(wb, fileName);
  };

  // 导出单个投票数据到Excel
  const exportPollData = (poll) => {
    const sortedMembers = sortMembersByScore(poll);

    if (sortedMembers.length === 0) {
      alert("该投票暂无数据可导出");
      return;
    }

    // 准备导出数据
    const exportData = sortedMembers.map((member, index) => {
      const row = {
        排名: index + 1,
        成员姓名: member.name,
        总分: member.total,
      };

      // 添加各项评分
      d.forEach((item, itemIndex) => {
        row[item.name] = member.scores[itemIndex] || 0;
      });

      return row;
    });

    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${poll.id}`);

    // 生成文件名
    const fileName = `投票${poll.id}_得分统计_${new Date(poll.createdAt)
      .toLocaleDateString("zh-CN")
      .replace(/\//g, "-")}.xlsx`;

    // 导出文件
    XLSX.writeFile(wb, fileName);
  };

  // 导出所有投票数据到Excel
  const exportAllData = () => {
    if (polls.length === 0) {
      alert("暂无数据可导出");
      return;
    }

    // 获取所有已完成的投票
    const completedPolls = polls.filter(
      (poll) => poll.status === "completed" && poll.scores
    );

    if (completedPolls.length === 0) {
      alert("暂无已完成的投票数据可导出");
      return;
    }

    // 获取所有成员名单
    const allMembers = new Set();
    completedPolls.forEach((poll) => {
      Object.keys(poll.scores).forEach((memberName) => {
        allMembers.add(memberName);
      });
    });

    // 转换为数组并排序
    const membersList = Array.from(allMembers).sort();

    // 准备导出数据
    const exportData = membersList.map((memberName, index) => {
      const row = {
        编号: index + 1,
        成员姓名: memberName,
      };

      // 为每个投票添加该成员的总分
      completedPolls.forEach((poll) => {
        const pollName = `投票${poll.id}`;
        const memberScores = poll.scores[memberName];

        if (memberScores && Array.isArray(memberScores)) {
          row[pollName] = calculateMemberTotal(memberScores);
        } else {
          row[pollName] = 0;
        }
      });

      return row;
    });

    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "所有投票总分统计");

    // 生成文件名
    const fileName = `所有投票总分统计_${new Date()
      .toLocaleDateString("zh-CN")
      .replace(/\//g, "-")}.xlsx`;

    // 导出文件
    XLSX.writeFile(wb, fileName);
  };

  // 如果未认证，显示密码输入页面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              管理后台登录
            </h1>
            <p className="text-gray-600">请输入管理员密码</p>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入密码"
                required
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-600">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              登录
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← 返回主页
            </a>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">投票管理后台</h1>
              <p className="text-gray-600 mt-2">
                查看所有投票数据和成员得分统计
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              退出登录
            </button>
          </div>
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

        {/* 导出操作区 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">数据导出</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={exportAverageData}
              disabled={averageData.length === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                averageData.length === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              导出平均得分统计
            </button>
            <button
              onClick={exportAllData}
              disabled={
                polls.filter((poll) => poll.status === "completed").length === 0
              }
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                polls.filter((poll) => poll.status === "completed").length === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              导出所有投票总分对比
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            导出的Excel文件将包含详细的评分数据和统计信息。"导出所有投票总分对比"将各投票的成员总分汇总到一个表格中便于横向对比。
          </p>
        </div>

        {/* 平均得分统计 */}
        {averageData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                成员平均得分统计
              </h2>
              <button
                onClick={exportAverageData}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                导出Excel
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              基于 {polls.filter((poll) => poll.status === "completed").length}{" "}
              次已完成投票的平均数据
            </p>

            {/* <div className="flex justify-end mb-4">
              <button
                onClick={exportAverageData}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
              >
                导出平均得分数据
              </button>
            </div> */}

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
                      平均总分
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {averageData.map((member, index) => (
                    <tr key={member.name} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {member.name}
                      </td>
                      {member.scores.map((score, scoreIndex) => (
                        <td
                          key={scoreIndex}
                          className="px-2 py-4 whitespace-nowrap text-sm text-center"
                        >
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              parseFloat(score) >= 9
                                ? "bg-green-100 text-green-800"
                                : parseFloat(score) >= 8
                                ? "bg-blue-100 text-blue-800"
                                : parseFloat(score) >= 7
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {score}
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-semibold">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            member.total >= 80
                              ? "bg-green-100 text-green-800"
                              : member.total >= 70
                              ? "bg-blue-100 text-blue-800"
                              : member.total >= 60
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {member.total}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            poll.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {poll.status === "completed" ? "已完成" : "进行中"}
                        </span>
                        {sortedMembers.length > 0 && (
                          <button
                            onClick={() => exportPollData(poll)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1 text-sm"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            导出
                          </button>
                        )}
                      </div>
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
                    <div>
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
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {sortedMembers.map((member, index) => {
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
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
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
