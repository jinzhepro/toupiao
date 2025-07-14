import { getRedisClient } from "../../../../lib/redis";

export async function GET(request, { params }) {
  try {
    const redis = await getRedisClient();
    const pollData = await redis.hGetAll(`poll:${params.id}`);

    if (!pollData.question) {
      return Response.json({ error: "投票不存在" }, { status: 404 });
    }

    return Response.json({
      id: params.id,
      question: pollData.question,
      options: JSON.parse(pollData.options || "[]"),
      createdAt: pollData.createdAt,
    });
  } catch (error) {
    console.error("获取投票失败:", error);
    return Response.json({ error: "获取投票失败" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { scores, completedAt } = await request.json();
    const redis = await getRedisClient();

    // 检查投票是否存在
    const pollExists = await redis.exists(`poll:${params.id}`);
    if (!pollExists) {
      return Response.json({ error: "投票不存在" }, { status: 404 });
    }

    // 更新投票的评分数据
    await redis.hSet(`poll:${params.id}`, {
      scores: JSON.stringify(scores),
      completedAt,
    });

    return Response.json({
      success: true,
      message: "投票结果已成功保存",
    });
  } catch (error) {
    console.error("更新投票失败:", error);
    return Response.json({ error: "更新投票失败" }, { status: 500 });
  }
}
