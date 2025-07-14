import { getRedisClient } from "../../../../../lib/redis";

export async function POST(request, { params }) {
  try {
    const { option } = await request.json();

    if (!option) {
      return Response.json({ error: "选项是必需的" }, { status: 400 });
    }

    const redis = await getRedisClient();

    // 检查投票是否存在
    const pollExists = await redis.exists(`poll:${params.id}`);
    if (!pollExists) {
      return Response.json({ error: "投票不存在" }, { status: 404 });
    }

    // 增加投票计数
    await redis.hIncrBy(`poll:${params.id}:votes`, option, 1);

    return Response.json({ success: true });
  } catch (error) {
    console.error("投票失败:", error);
    return Response.json({ error: "投票失败" }, { status: 500 });
  }
}
