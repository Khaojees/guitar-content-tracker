import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App as AntdApp, ConfigProvider } from "antd";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  display: "swap",
  variable: "--font-thai",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Guitar Content Tracker",
  description: "จัดการคอนเทนต์กีตาร์ของคุณ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={`${inter.variable} ${notoSansThai.variable}`}>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: "#6366f1",
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "var(--font-thai), var(--font-inter), sans-serif",
              },
            }}
          >
            <AntdApp>
              <div className="min-h-screen bg-gray-50">
                <NavBar />
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                  {children}
                </main>
              </div>
            </AntdApp>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
