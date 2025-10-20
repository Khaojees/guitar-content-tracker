import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App as AntdApp, ConfigProvider } from "antd";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "dYZ, Guitar Content Tracker",
  description:
    "แดชบอร์ดจัดการคอนเทนต์กีตาร์สำหรับครีเอเตอร์ ช่วยวางแผน ปล่อยเพลง และติดตามทุกไอเดียได้ในที่เดียว",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={plusJakarta.className}>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: "#6366f1",
                colorInfo: "#6366f1",
                borderRadius: 12,
                fontSize: 15,
                fontFamily: "'Plus Jakarta Sans', 'Kanit', sans-serif",
                colorBgLayout: "transparent",
                colorBgContainer: "rgba(255,255,255,0.92)",
                colorBorder: "rgba(99,102,241,0.16)",
                boxShadow:
                  "0 28px 50px -30px rgba(79,70,229,0.35), 0 16px 40px -35px rgba(15,23,42,0.45)",
              },
              components: {
                Card: {
                  borderRadiusLG: 22,
                  paddingLG: 24,
                  boxShadowTertiary:
                    "0 32px 70px -50px rgba(15,23,42,0.65)",
                },
                Button: {
                  controlHeightLG: 52,
                  borderRadiusLG: 14,
                },
                Layout: {
                  headerBg: "transparent",
                },
                Menu: {
                  borderRadiusLG: 16,
                  itemSelectedBg: "rgba(99,102,241,0.12)",
                  itemSelectedColor: "#312e81",
                  horizontalItemSelectedColor: "#312e81",
                  itemHoverColor: "#4338ca",
                },
              },
            }}
          >
            <AntdApp>
              <div className="relative min-h-screen overflow-hidden">
                <div className="pointer-events-none absolute inset-0 -z-10">
                  <div className="absolute -top-28 right-6 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22),transparent_65%)] blur-3xl" />
                  <div className="absolute bottom-[-5rem] left-[-10rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.2),transparent_70%)] blur-3xl" />
                </div>
                <NavBar />
                <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
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
