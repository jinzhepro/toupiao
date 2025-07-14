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
        if (pollData.id) {
          // 获取评分数据
          const scores = pollData.scores ? JSON.parse(pollData.scores) : null;

          return {
            id,
            question: pollData.question || "国贸集团2025年半年度民主测评票",
            createdAt: pollData.createdAt,
            completedAt: pollData.completedAt || null,
            status: pollData.status || (scores ? "completed" : "active"),
            scores: scores,
            totalMembers: pollData.totalMembers
              ? parseInt(pollData.totalMembers)
              : null,
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
    const redis = await getRedisClient();

    // 生成唯一ID
    const id = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 存储投票信息
    const pollData = {
      id: id,
      createdAt: new Date().toISOString(),
    };

    await redis.hSet(`poll:${id}`, pollData);

    // 添加到投票列表
    await redis.sAdd("polls:all", id);

    const response = {
      id,
      createdAt: new Date().toISOString(),
    };

    return Response.json(response);
  } catch (error) {
    console.error("创建投票失败:", error);
    return Response.json({ error: "创建投票失败" }, { status: 500 });
  }
}
