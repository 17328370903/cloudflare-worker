"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Globe, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const navItems = [
		{ label: "首页", href: "/" },
		{ label: "博客", href: "/blog" },
		{ label: "API", href: "/api/users" },
	];

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
						<Button variant="ghost" asChild className="text-gray-600">
							<Link href="/login">登录</Link>
						</Button>
						<Button className="bg-blue-600 hover:bg-blue-700" asChild>
							<Link href="/register">注册</Link>
						</Button>
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
								<Button variant="outline" className="w-full" asChild>
									<Link href="/login" onClick={() => setIsMenuOpen(false)}>登录</Link>
								</Button>
								<Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
									<Link href="/register" onClick={() => setIsMenuOpen(false)}>注册</Link>
								</Button>
							</div>
						</nav>
					</div>
				)}
			</div>
		</header>
	);
}