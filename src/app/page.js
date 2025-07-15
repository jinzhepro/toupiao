"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { membersList } from "../utils/memberList";
import d from "../utils/d";

export default function HomePage() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [currentPoll, setCurrentPoll] = useState(null);
  const [completedPoll, setCompletedPoll] = useState(null);
  const [votedMembers, setVotedMembers] = useState([]);
  const router = useRouter();

  useEffect(() => {
    checkAndValidatePoll();
  }, []);

  // 检查并验证投票ID
  const checkAndValidatePoll = async () => {
    try {
      // 先检查本地存储
      const savedPoll = localStorage.getItem("currentPoll");
      const savedResults = localStorage.getItem("pollResults");

      if (savedPoll || savedResults) {
        const pollId = savedPoll
          ? JSON.parse(savedPoll).id
          : JSON.parse(savedResults).pollId;

        if (pollId) {
          // 验证服务器上是否存在该投票ID
          const response = await fetch(`/api/polls/${pollId}`);

          if (response.ok) {
            // 投票ID存在，继续正常流程
            checkCurrentPoll();
            checkCompletedPoll();
            loadVotedMembers();
          } else if (response.status === 404) {
            // 投票ID不存在，重置本地状态
            console.log("投票ID不存在于服务器，重置本地状态");
            resetLocalState();
            // 可选：显示提示信息
          } else {
            // 其他错误，继续使用本地数据
            checkCurrentPoll();
            checkCompletedPoll();
            loadVotedMembers();
          }
        } else {
          // 没有有效的投票ID，重置状态
          resetLocalState();
        }
      } else {
        // 没有本地数据，直接加载
        loadVotedMembers();
      }

      // 获取所有投票列表
      await fetchPolls();
    } catch (error) {
      console.error("验证投票ID失败:", error);
      // 出错时继续使用本地数据
      checkCurrentPoll();
      checkCompletedPoll();
      loadVotedMembers();
      await fetchPolls();
    }
  };

  // 重置本地状态
  const resetLocalState = () => {
    localStorage.removeItem("currentPoll");
    localStorage.removeItem("pollScores");
    localStorage.removeItem("pollResults");
    setCurrentPoll(null);
    setCompletedPoll(null);
    setVotedMembers([]);
  };

  // 加载已投票成员
  const loadVotedMembers = () => {
    try {
      const savedScores = localStorage.getItem("pollScores");
      if (savedScores) {
        const scoresData = JSON.parse(savedScores);
        // 只有当成员的评分数组长度等于评分项数量且没有null值时才算完成
        const completedMembers = Object.keys(scoresData).filter((member) => {
          const memberScores = scoresData[member];
          return (
            Array.isArray(memberScores) &&
            memberScores.length === d.length &&
            memberScores.every((score) => score !== null && score !== undefined)
          );
        });
        setVotedMembers(completedMembers);
      } else {
        setVotedMembers([]);
      }
    } catch (error) {
      console.error("读取已投票成员失败:", error);
      setVotedMembers([]);
    }
  };

  // 检查本地存储中是否有当前投票
  const checkCurrentPoll = () => {
    try {
      const savedPoll = localStorage.getItem("currentPoll");
      if (savedPoll) {
        const pollData = JSON.parse(savedPoll);

        // 从 pollScores 计算实际进度
        const savedScores = localStorage.getItem("pollScores");
        let actualProgress = 1;
        if (savedScores) {
          const scoresData = JSON.parse(savedScores);
          // 只计算完整完成的成员数量
          const completedMembers = Object.keys(scoresData).filter((member) => {
            const memberScores = scoresData[member];
            return (
              Array.isArray(memberScores) &&
              memberScores.length === d.length &&
              memberScores.every(
                (score) => score !== null && score !== undefined
              )
            );
          });
          actualProgress = completedMembers.length + 1;
        }

        pollData.currentMember = actualProgress;
        setCurrentPoll(pollData);
      }
    } catch (error) {
      console.error("读取本地投票数据失败:", error);
    }
  };

  // 检查本地存储中是否有已完成的投票
  const checkCompletedPoll = () => {
    try {
      const savedResults = localStorage.getItem("pollResults");
      if (savedResults) {
        const resultsData = JSON.parse(savedResults);
        setCompletedPoll(resultsData);
      }
    } catch (error) {
      console.error("读取已完成投票数据失败:", error);
    }
  };

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

  // 创建新的投票
  const createNewPoll = async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const newPoll = await response.json();

        // 保存到本地存储
        const pollData = {
          ...newPoll,
          currentMember: 1,
          startTime: new Date().toISOString(),
        };
        localStorage.setItem("currentPoll", JSON.stringify(pollData));
        setCurrentPoll(pollData);

        // 创建成功后直接跳转到第一位成员评分页面
        router.push(`/poll/1`);
      } else {
        alert("创建投票失败，请重试");
      }
    } catch (error) {
      console.error("创建投票失败:", error);
      alert("创建投票失败，请重试");
    } finally {
      setCreating(false);
    }
  };

  // 继续投票
  const continuePoll = () => {
    if (currentPoll) {
      const currentMember = currentPoll.currentMember || 1;
      router.push(`/poll/${currentMember}`);
    }
  };

  // 重新开始投票
  const restartPoll = () => {
    localStorage.removeItem("currentPoll");
    localStorage.removeItem("pollScores");
    setCurrentPoll(null);
    setVotedMembers([]);
  };

  // 查看投票结果
  const viewResults = () => {
    router.push("/results");
  };

  // 开始新投票（清除所有本地数据）
  const startNewPoll = () => {
    localStorage.removeItem("currentPoll");
    localStorage.removeItem("pollScores");
    localStorage.removeItem("pollResults");
    setCurrentPoll(null);
    setCompletedPoll(null);
    setVotedMembers([]);
  };

  // 复制评分详情
  const copyScoresDetail = async (event) => {
    try {
      const savedScores = localStorage.getItem("pollScores");

      if (!savedScores) {
        alert("暂无评分数据可复制");
        return;
      }

      const scoresData = JSON.parse(savedScores);

      // 获取已完成评分的成员
      const completedMembers = Object.keys(scoresData).filter((member) => {
        const memberScores = scoresData[member];
        return (
          Array.isArray(memberScores) &&
          memberScores.length === d.length &&
          memberScores.every((score) => score !== null && score !== undefined)
        );
      });

      if (completedMembers.length === 0) {
        alert("暂无已完成的评分数据可复制");
        return;
      }

      // 生成表格格式的评分数据
      let copyText = "";

      // 数据行：每个成员的评分
      completedMembers.forEach((member) => {
        const memberScores = scoresData[member];
        const totalScore = memberScores.reduce(
          (sum, score) => sum + (score || 0),
          0
        );

        copyText += `${member}\t`;
        memberScores.forEach((score) => {
          copyText += `${score || 0}\t`;
        });
      });

      await navigator.clipboard.writeText(copyText);

      // 显示成功提示
      const button = event.target.closest("button");
      const originalText = button.textContent;
      button.textContent = "已复制！";
      button.className = button.className.replace(
        "bg-green-500 hover:bg-green-600",
        "bg-blue-500"
      );

      setTimeout(() => {
        button.textContent = originalText;
        button.className = button.className.replace(
          "bg-blue-500",
          "bg-green-500 hover:bg-green-600"
        );
      }, 2000);
    } catch (error) {
      console.error("复制评分详情失败:", error);
      alert("复制失败，请手动复制评分详情");
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
        <h1 className="text-4xl mb-2 font-bold text-gray-800 text-center">
          国贸集团2025年半年度民主测评票
        </h1>
        <p className="text-gray-600 mb-6">
          个人绩效考评得分共100分，其中95&le;优秀&le;100分，85分&le;良好&lt;95分，75分&le;合格&lt;85分，
          65分&le;基本合格&lt;75分，65分以下为不合格；优秀7人，良好、合格33人；基本合格、不合格4人
        </p>

        {completedPoll ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  🎉 投票已完成
                </h3>
                <p className="text-green-700 text-sm mb-3">
                  完成时间:{" "}
                  {new Date(completedPoll.completedAt).toLocaleString()}
                </p>
                <p className="text-green-700 text-sm">
                  已评分成员: {completedPoll.totalMembers} 位
                </p>
              </div>
            </div>
          </div>
        ) : currentPoll ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  检测到未完成的投票
                </h3>
                <p className="text-yellow-700 text-sm mb-3">
                  开始时间: {new Date(currentPoll.startTime).toLocaleString()}
                </p>
                <p className="text-yellow-700 text-sm">
                  当前进度: 第 {currentPoll.currentMember} 位成员
                </p>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={continuePoll}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                继续投票
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={createNewPoll}
            disabled={creating}
            className={`font-bold py-3 px-6 rounded-lg transition-colors ${
              creating
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-blue-500 hover:bg-blue-700 text-white"
            }`}
          >
            {creating ? "创建中..." : "参与投票"}
          </button>
        )}

        {/* 已投票成员列表 */}
        {(currentPoll || completedPoll) && votedMembers.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              已投票成员 ({votedMembers.length}/{membersList.length})
            </h3>

            {/* 提示信息 */}
            <div className="mb-4 text-center text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
              💡 提示：点击{" "}
              <span className="font-semibold text-blue-700">已完成</span>、
              <span className="font-semibold text-orange-700">进行中</span> 或
              <span className="font-semibold text-blue-700">当前</span>{" "}
              的成员可以查看或编辑评分
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {membersList.map((member, index) => {
                const isVoted = votedMembers.includes(member);
                const isCurrent =
                  currentPoll && index + 1 === currentPoll.currentMember;

                // 检查是否正在进行中（有数据但未完成）
                const savedScores = localStorage.getItem("pollScores");
                let isInProgress = false;
                let memberTotalScore = 0;

                if (savedScores) {
                  const scoresData = JSON.parse(savedScores);
                  const memberScores = scoresData[member];

                  if (memberScores && Array.isArray(memberScores)) {
                    // 计算总分
                    memberTotalScore = memberScores.reduce(
                      (sum, score) => sum + (score || 0),
                      0
                    );

                    // 检查是否进行中
                    isInProgress =
                      memberScores.length < d.length ||
                      memberScores.some(
                        (score) => score === null || score === undefined
                      );
                  }
                }

                // 处理成员卡片点击事件
                const handleMemberClick = () => {
                  if (isVoted || isInProgress) {
                    // 已投票或进行中的成员，跳转到该成员的投票页面进行查看/编辑
                    router.push(`/poll/${index + 1}`);
                  } else if (isCurrent) {
                    // 当前成员，直接继续投票
                    router.push(`/poll/${index + 1}`);
                  }
                  // 未开始的成员不可点击
                };

                const isClickable = isVoted || isInProgress || isCurrent;

                return (
                  <div
                    key={member}
                    onClick={isClickable ? handleMemberClick : undefined}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      isVoted
                        ? "bg-green-50 border-green-200 text-green-800 cursor-pointer hover:bg-green-100"
                        : isInProgress
                        ? "bg-orange-50 border-orange-200 text-orange-800 cursor-pointer hover:bg-orange-100"
                        : isCurrent
                        ? "bg-blue-50 border-blue-200 text-blue-800 cursor-pointer hover:bg-blue-100"
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {index + 1}. {member}
                    </div>
                    <div className="text-xs mt-1">
                      {isVoted
                        ? "✓ 已完成"
                        : isInProgress
                        ? "◐ 进行中"
                        : isCurrent
                        ? "● 当前"
                        : "○ 待评分"}
                    </div>
                    {/* 显示总分 */}
                    {(isVoted || isInProgress) && memberTotalScore > 0 && (
                      <div className="text-xs mt-1 font-semibold">
                        总分: {memberTotalScore}
                      </div>
                    )}
                    {isClickable && (
                      <div className="text-xs text-gray-500 mt-1">点击查看</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 进度条 */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>投票进度</span>
                <span>
                  {votedMembers.length}/{membersList.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (votedMembers.length / membersList.length) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 投票ID显示 */}
      {(currentPoll || completedPoll) && (
        <div className="mt-8 text-center">
          <div className="bg-gray-100 rounded-lg p-4 inline-block">
            <div className="text-sm text-gray-600 mb-1">投票ID</div>
            <div className="text-lg font-mono font-bold text-gray-800 mb-3">
              {completedPoll ? completedPoll.pollId : currentPoll?.id}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {votedMembers.length > 0 && (
                <button
                  onClick={copyScoresDetail}
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 justify-center"
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
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0"
                    />
                  </svg>
                  复制评分数据
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
