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
