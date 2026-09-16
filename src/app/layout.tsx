import type { Metadata } from "next";
import "./globals.css";
import "./delivery.css";
export const metadata: Metadata = {
  title: "취향렌즈 · 내 입맛에 딱 맞는 배달",
  description:
    "10번의 선택으로 발견하는 내 입맛. 취향부터 음식, 식당까지 이어지는 나만의 한 끼.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
