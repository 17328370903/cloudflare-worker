"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Globe, Menu, X, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
	const [user, setUser] = useState<{ email: string; nickname: string; id: number; avatar_url?: string } | null>(null);

	// 从 localStorage 或 cookie 中读取用户信息
	useEffect(() => {
		const getUserInfo = () => {
			// 方法1：从 localStorage 获取用户信息（优先）
			// 遍历 localStorage 查找以 "user_" 开头的键
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && key.startsWith('user_')) {
					const userInfo = localStorage.getItem(key);
					if (userInfo) {
						try {
							return JSON.parse(userInfo);
						} catch {
							return null;
						}
					}
				}
			}

			// 方法2：从 cookie 获取用户 ID（备用）
			const cookies = document.cookie.split(';');
			let userId = '';

			cookies.forEach(cookie => {
				const [name, value] = cookie.trim().split('=');
				if (name === 'user_id') userId = value;
			});

			if (userId) {
				const userInfo = localStorage.getItem(`user_${userId}`);
				if (userInfo) {
					return JSON.parse(userInfo);
				}
			}

			return null;
		};

		const userInfo = getUserInfo();
		setUser(userInfo);
	}, []);

	const navItems = [
		{ label: "首页", href: "/" },
		{ label: "博客", href: "/blog" },
		{ label: "API", href: "/api/users" },
	];

	// 登出功能
	const handleLogout = async () => {
		setShowLogoutConfirm(true);
	};

	const confirmLogout = async () => {
		setShowLogoutConfirm(false);
		try {
			// 清除所有 user_ 开头的 localStorage 数据
			for (let i = localStorage.length - 1; i >= 0; i--) {
				const key = localStorage.key(i);
				if (key && key.startsWith('user_')) {
					localStorage.removeItem(key);
				}
			}
			
			// 清除 cookie
			document.cookie = 'user_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
			document.cookie = 'user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
			
			setUser(null);
			window.location.href = '/';
		} catch (error) {
			console.error('登出失败:', error);
		}
	};

	return (
		<header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<Link href="/" className="flex items-center gap-2 group">
						<Globe className="h-8 w-8 text-blue-600 transition-transform group-hover:rotate-12" />
						<span className="text-xl font-bold text-gray-900">OpenNext Starter</span>
					</Link>

					<nav className="hidden md:flex items-center gap-8">
						{navItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
							>
								{item.label}
							</Link>
						))}
					</nav>

					<div className="hidden md:flex items-center gap-4">
						{user ? (
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-2 text-gray-700">
									{user.avatar_url ? (
										<img
											src={user.avatar_url}
											alt={user.nickname}
											className="w-8 h-8 rounded-full object-cover"
										/>
									) : (
										<div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
											<User className="h-4 w-4 text-gray-500" />
										</div>
									)}
									<span className="font-medium">{user.nickname}</span>
								</div>
								<Button
									variant="ghost"
									onClick={handleLogout}
									className="text-gray-600 hover:text-red-600"
								>
									<LogOut className="h-4 w-4 mr-2" />
									登出
								</Button>
							</div>
						) : (
							<>
								<Button variant="ghost" asChild className="text-gray-600">
									<Link href="/login">登录</Link>
								</Button>
								<Button className="bg-blue-600 hover:bg-blue-700" asChild>
									<Link href="/register">注册</Link>
								</Button>
							</>
						)}
					</div>

					<button
						className="md:hidden p-2 text-gray-600"
						onClick={() => setIsMenuOpen(!isMenuOpen)}
					>
						{isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
					</button>
				</div>

				{isMenuOpen && (
					<div className="md:hidden py-4 border-t border-gray-200">
						<nav className="flex flex-col gap-4">
							{navItems.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className="text-gray-600 hover:text-blue-600 font-medium transition-colors py-2"
									onClick={() => setIsMenuOpen(false)}
								>
									{item.label}
								</Link>
							))}
							<div className="flex flex-col gap-2 mt-4">
								{user ? (
									<>
										<div className="flex items-center gap-2 text-gray-700 py-2">
											{user.avatar_url ? (
												<img
													src={user.avatar_url}
													alt={user.nickname}
													className="w-8 h-8 rounded-full object-cover"
												/>
											) : (
												<div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
													<User className="h-4 w-4 text-gray-500" />
												</div>
											)}
											<span className="font-medium">{user.nickname}</span>
										</div>
										<Button
											variant="outline"
											onClick={handleLogout}
											className="w-full text-red-600 border-red-200 hover:bg-red-50"
										>
											<LogOut className="h-4 w-4 mr-2" />
											登出
										</Button>
									</>
								) : (
									<>
										<Button variant="outline" className="w-full" asChild>
											<Link href="/login" onClick={() => setIsMenuOpen(false)}>登录</Link>
										</Button>
										<Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
											<Link href="/register" onClick={() => setIsMenuOpen(false)}>注册</Link>
										</Button>
									</>
								)}
							</div>
						</nav>
					</div>
				)}
			</div>

			<ConfirmDialog
				isOpen={showLogoutConfirm}
				title="确认退出"
				message="确定要退出登录吗？"
				confirmText="退出"
				cancelText="取消"
				confirmVariant="danger"
				onConfirm={confirmLogout}
				onCancel={() => setShowLogoutConfirm(false)}
			/>
		</header>
	);
}