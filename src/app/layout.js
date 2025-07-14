import "./globals.css";

export const metadata = {
  title: "匿名投票系统",
  description: "一个基于 Next.js 和 Redis 的匿名投票系统",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen bg-gray-50">{children}</div>
      </body>
    </html>
  );
}
