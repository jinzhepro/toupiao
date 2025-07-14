"use client";

import { membersList } from "../../../utils/memberList";
import { use, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import d from "../../../utils/d";

export default function ToupiaoPage() {
  // 保存每位成员的所有评分项状态
  const [scores, setScores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { id } = useParams();
  const router = useRouter();

  // 从本地存储加载数据
  useEffect(() => {
    loadScoresFromStorage();
  }, []);

  // 从本地存储加载评分数据
  const loadScoresFromStorage = () => {
    try {
      const savedScores = localStorage.getItem("pollScores");
      if (savedScores) {
        const arrayFormatScores = JSON.parse(savedScores);

        // 将数组格式转换为对象格式用于UI显示
        const objectFormatScores = {};
        Object.keys(arrayFormatScores).forEach((memberName) => {
          objectFormatScores[memberName] = {};
          arrayFormatScores[memberName].forEach((score, index) => {
            if (score !== null && d[index]) {
              objectFormatScores[memberName][d[index].name] = score;
            }
          });
        });

        setScores(objectFormatScores);
      }
    } catch (error) {
      console.error("加载评分数据失败:", error);
    }
  };

  // 保存评分数据到本地存储
  const saveScoresToStorage = (newScores) => {
    try {
      localStorage.setItem("pollScores", JSON.stringify(newScores));
    } catch (error) {
      console.error("保存评分数据失败:", error);
    }
  };

  // 处理评分选择
  const handleScoreSelect = (member, itemName, score) => {
    const newScores = {
      ...scores,
      [member]: {
        ...(scores[member] || {}),
        [itemName]: score,
      },
    };

    setScores(newScores);

    // 转换为数组格式保存到本地存储
    const arrayFormatScores = {};
    Object.keys(newScores).forEach((memberName) => {
      arrayFormatScores[memberName] = d.map((item) =>
        newScores[memberName][item.name] !== undefined
          ? newScores[memberName][item.name]
          : null
      );
    });

    saveScoresToStorage(arrayFormatScores);
  };

  // 检查当前成员是否完成所有评分
  const isCurrentMemberComplete = () => {
    const currentMember = membersList[id - 1];
    const memberScores = scores[currentMember];

    if (!memberScores) return false;

    // 检查是否所有评分项都有分数
    return d.every((item) => memberScores[item.name] !== undefined);
  };

  // 更新本地存储中的当前成员进度
  const updateCurrentMemberInStorage = (memberId) => {
    try {
      const savedPoll = localStorage.getItem("currentPoll");
      if (savedPoll) {
        const pollData = JSON.parse(savedPoll);
        pollData.currentMember = memberId;
        localStorage.setItem("currentPoll", JSON.stringify(pollData));
      }
    } catch (error) {
      console.error("更新本地存储失败:", error);
    }
  };

  // 导航到下一位成员
  const handleNextMember = () => {
    const currentId = parseInt(id);

    if (currentId < membersList.length && isCurrentMemberComplete()) {
      const nextId = currentId + 1;
      updateCurrentMemberInStorage(nextId);
      router.push(`/poll/${nextId}`);
    }
  };

  // 导航到上一位成员或返回主页
  const handlePrevMember = () => {
    const currentId = parseInt(id);
    if (currentId > 1) {
      const prevId = currentId - 1;
      updateCurrentMemberInStorage(prevId);
      router.push(`/poll/${prevId}`);
    } else {
      router.push("/");
    }
  };

  // 完成投票
  const completePoll = async () => {
    if (isSubmitting) return; // 防止重复提交

    setIsSubmitting(true);
    try {
      // 获取当前poll信息
      const currentPollData = JSON.parse(
        localStorage.getItem("currentPoll") || "{}"
      );
      const pollId = currentPollData.id;

      if (!pollId) {
        alert("未找到当前投票信息");
        return;
      }

      // 转换为数组格式保存最终结果
      const arrayFormatResults = {};
      Object.keys(scores).forEach((memberName) => {
        arrayFormatResults[memberName] = d.map((item) =>
          scores[memberName][item.name] !== undefined
            ? scores[memberName][item.name]
            : null
        );
      });

      // 推送评分数据到服务器
      const response = await fetch(`/api/polls/${pollId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scores: arrayFormatResults,
          completedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("推送数据到服务器失败");
      }

      // 保存最终结果到本地存储
      const finalResults = {
        pollId,
        scores: arrayFormatResults,
        completedAt: new Date().toISOString(),
        totalMembers: membersList.length,
      };

      localStorage.setItem("pollResults", JSON.stringify(finalResults));

      // 清除当前投票进度和评分数据
      localStorage.removeItem("currentPoll");
      localStorage.removeItem("pollScores");

      router.push("/");
    } catch (error) {
      console.error("完成投票失败:", error);
      alert(`保存结果失败：${error.message}，请重试`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentId = parseInt(id);
  const isFirstMember = currentId === 1;
  const isLastMember = currentId === membersList.length;
  const isComplete = isCurrentMemberComplete();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-1">
        {/* 导航栏 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-500 text-white hover:bg-gray-600"
              >
                🏠 返回主页
              </button>
              <button
                onClick={handlePrevMember}
                className="px-4 py-2 rounded-lg font-medium transition-colors bg-blue-500 text-white hover:bg-blue-600"
              >
                {isFirstMember ? "← 上一位" : "← 上一位成员"}
              </button>
            </div>

            <div className="text-center">
              <span className="text-lg font-semibold text-gray-700">
                {currentId} / {membersList.length}
              </span>
              <div className="text-sm text-gray-500">
                {membersList[currentId - 1]}
              </div>
            </div>

            <button
              onClick={handleNextMember}
              disabled={isLastMember || !isComplete}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isLastMember || !isComplete
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              下一位成员 →
            </button>
          </div>
        </div>

        {/* 成员名单 */}
        <div className="bg-white rounded-lg shadow-md p-2">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            成员评分
          </h2>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 transition-colors">
              <div className="text-gray-800 font-medium mb-3">
                {id}. {membersList[id - 1]}
              </div>
              <div className="space-y-4">
                {d.map((item, i) => (
                  <div key={item.name}>
                    <div
                      key={item.name}
                      className="bg-white rounded-lg p-3 border border-gray-200"
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {item.name} (请选择分数)
                        {item.description && (
                          <span className="ml-2 text-xs text-gray-400">
                            {item.description}
                          </span>
                        )}
                      </label>
                      {item.details && (
                        <ul className="mb-2 text-xs text-gray-500 list-disc pl-5">
                          {item.details.map((desc, idx) => (
                            <li key={idx}>{desc}</li>
                          ))}
                        </ul>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {item.scores.map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() =>
                              handleScoreSelect(
                                membersList[id - 1],
                                item.name,
                                score
                              )
                            }
                            className={`px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors w-[60px] h-[30px] ${
                              scores[membersList[id - 1]]?.[item.name] === score
                                ? "bg-blue-500 text-white border-blue-500"
                                : "border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                            }`}
                          >
                            {score}分
                          </button>
                        ))}
                      </div>
                    </div>
                    {i === d.length - 1 && (
                      <div className="mt-2 text-md text-gray-600">
                        总分：
                        {scores[membersList[id - 1]]
                          ? Object.values(scores[membersList[id - 1]]).reduce(
                              (sum, score) => sum + score,
                              0
                            )
                          : 0}{" "}
                        分
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 下一位成员预览 */}
        {!isLastMember && (
          <div
            onClick={isComplete ? handleNextMember : undefined}
            className={`bg-white rounded-lg shadow-md p-6 mt-6 transition-all ${
              isComplete
                ? "cursor-pointer hover:shadow-lg hover:bg-blue-50 border-2 border-transparent hover:border-blue-200"
                : "opacity-60 cursor-not-allowed"
            }`}
          >
            <h3 className="text-lg font-semibold text-gray-700 text-center mb-4">
              下一位成员
            </h3>
            <div
              className={`border rounded-lg p-4 transition-colors ${
                isComplete
                  ? "border-blue-200 bg-blue-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="text-center">
                <div className="text-gray-800 font-medium text-lg mb-2">
                  {currentId + 1}. {membersList[currentId]}
                </div>
                <div className="text-sm text-gray-500 mb-3">
                  {isComplete ? "点击开始评分 →" : "请先完成当前成员的评分"}
                </div>
                {isComplete && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                    准备就绪
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 完成提示 */}
        {isLastMember && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
            <div className="text-center">
              <div className="text-green-700 font-semibold text-lg mb-2">
                所有成员评分完成，请提交！
              </div>
              <div className="justify-center flex">
                {isComplete && (
                  <button
                    onClick={completePoll}
                    disabled={isSubmitting}
                    className={`font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center min-w-[120px] ${
                      isSubmitting
                        ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                        : "bg-green-500 hover:bg-green-700 text-white"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        提交中...
                      </>
                    ) : (
                      "提交表单"
                    )}
                  </button>
                )}
              </div>

              {!isComplete && (
                <div className="text-orange-600 text-sm">
                  请先完成当前成员的所有评分项
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          共{" "}
          <span className="font-semibold text-blue-600">
            {currentId} / {membersList.length}
          </span>{" "}
          位成员
        </p>
      </div>
    </div>
  );
}
