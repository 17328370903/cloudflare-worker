import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
	title: "OpenNext Starter",
	description: "基于 Next.js 和 Cloudflare Workers 构建的现代化 Web 应用",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="zh-CN">
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml"></link>
			</head>
			<body className="antialiased bg-gray-50 font-sans">
				<Header />
				<main className="min-h-screen pt-16">{children}</main>
				<Footer />
			</body>
		</html>
	);
}