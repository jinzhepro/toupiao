"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VotePage({ params }) {
  const router = useRouter();
  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    fetchPoll();
    checkVoteStatus();
  }, [params.id]);

  const fetchPoll = async () => {
    try {
      const response = await fetch(`/api/polls/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setPoll(data);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("获取投票信息失败:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const checkVoteStatus = () => {
    const votedPolls = JSON.parse(localStorage.getItem("votedPolls") || "[]");
    setHasVoted(votedPolls.includes(params.id));
  };

  const handleVote = async () => {
    if (!selectedOption) {
      alert("请选择一个选项");
      return;
    }

    if (hasVoted) {
      alert("您已经参与过这个投票了");
      return;
    }

    setVoting(true);

    try {
      const response = await fetch(`/api/polls/${params.id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          option: selectedOption,
        }),
      });

      if (response.ok) {
        // 记录已投票状态到本地存储
        const votedPolls = JSON.parse(
          localStorage.getItem("votedPolls") || "[]"
        );
        votedPolls.push(params.id);
        localStorage.setItem("votedPolls", JSON.stringify(votedPolls));

        setHasVoted(true);
        alert("投票成功！");
        router.push(`/results/${params.id}`);
      } else {
        const data = await response.json();
        alert(data.error || "投票失败");
      }
    } catch (error) {
      console.error("投票失败:", error);
      alert("投票失败，请重试");
    } finally {
      setVoting(false);
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
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            {poll.question}
          </h1>

          {hasVoted ? (
            <div className="text-center py-8">
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                您已经参与过这个投票了
              </div>
              <Link
                href={`/results/${params.id}`}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                查看投票结果
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {poll.options.map((option, index) => (
                  <label
                    key={index}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="vote-option"
                      value={option}
                      checked={selectedOption === option}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      className="mr-3 h-4 w-4 text-blue-600"
                    />
                    <span className="text-lg">{option}</span>
                  </label>
                ))}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleVote}
                  disabled={voting || !selectedOption}
                  className="flex-1 bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  {voting ? "投票中..." : "提交投票"}
                </button>
                <Link
                  href={`/results/${params.id}`}
                  className="flex-1 bg-gray-500 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors"
                >
                  查看结果
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
