import { getRedisClient } from "../../../../../lib/redis";

export async function GET(request, { params }) {
  try {
    const redis = await getRedisClient();

    // 检查投票是否存在
    const pollExists = await redis.exists(`poll:${params.id}`);
    if (!pollExists) {
      return Response.json({ error: "投票不存在" }, { status: 404 });
    }

    // 获取投票结果
    const results = await redis.hGetAll(`poll:${params.id}:votes`);

    // 将字符串转换为数字
    const processedResults = {};
    Object.keys(results).forEach((option) => {
      processedResults[option] = parseInt(results[option] || 0);
    });

    return Response.json(processedResults);
  } catch (error) {
    console.error("获取投票结果失败:", error);
    return Response.json({ error: "获取投票结果失败" }, { status: 500 });
  }
}
