import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { UserNav } from "@/components/UserNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "iEventer — Find Your Fun",
  description: "AI-powered activity and event finder. Never be bored again.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="bg-gradient-to-r from-primary via-primary-light to-indigo-400 text-white px-4 py-2.5 flex items-center justify-between text-sm">
          <Link href="/" className="font-bold tracking-tight">
            🎉 iEventer
          </Link>
          <UserNav />
        </div>
        {children}
      </body>
    </html>
  );
}
