import { getRedisClient } from "../../../lib/redis";

export async function GET() {
  try {
    const redis = await getRedisClient();

    // 获取所有投票ID
    const pollIds = await redis.sMembers("polls:all");

    if (pollIds.length === 0) {
      return Response.json([]);
    }

    // 获取所有投票详情
    const polls = await Promise.all(
      pollIds.map(async (id) => {
        const pollData = await redis.hGetAll(`poll:${id}`);
        if (pollData.question) {
          const totalVotes = await redis.hGetAll(`poll:${id}:votes`);
          const totalVoteCount = Object.values(totalVotes).reduce(
            (sum, votes) => sum + parseInt(votes || 0),
            0
          );

          return {
            id,
            question: pollData.question,
            options: JSON.parse(pollData.options || "[]"),
            createdAt: pollData.createdAt,
            totalVotes: totalVoteCount,
          };
        }
        return null;
      })
    );

    // 过滤空值并按创建时间排序
    const validPolls = polls
      .filter((poll) => poll !== null)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return Response.json(validPolls);
  } catch (error) {
    console.error("获取投票列表失败:", error);
    return Response.json({ error: "获取投票列表失败" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { question, options } = await request.json();

    if (!question || !options || options.length < 2) {
      return Response.json(
        { error: "问题和至少两个选项是必需的" },
        { status: 400 }
      );
    }

    const redis = await getRedisClient();

    // 生成唯一ID
    const id = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 存储投票信息
    await redis.hSet(`poll:${id}`, {
      question,
      options: JSON.stringify(options),
      createdAt: new Date().toISOString(),
    });

    // 初始化投票计数
    const voteData = {};
    options.forEach((option) => {
      voteData[option] = "0";
    });
    await redis.hSet(`poll:${id}:votes`, voteData);

    // 添加到投票列表
    await redis.sAdd("polls:all", id);

    return Response.json({
      id,
      question,
      options,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("创建投票失败:", error);
    return Response.json({ error: "创建投票失败" }, { status: 500 });
  }
}
