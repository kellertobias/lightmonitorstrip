import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { WebSocketProvider } from "@/contexts/WebSocketContext";

import "@/app/globals.scss";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Light Assistant",
  description: "Light control assistant application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WebSocketProvider>{children}</WebSocketProvider>
      </body>
    </html>
  );
}
