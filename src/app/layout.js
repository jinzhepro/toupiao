import "./globals.css";

export const metadata = {
  title: "国贸集团2025年半年度民主测评票",
  description: "国贸集团2025年半年度民主测评票",
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
