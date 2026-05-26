"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			const response = await fetch("/api/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			interface ApiResponse {
				success?: boolean;
				message?: string;
				data?: { email: string; nickname: string };
			}

			const data = await response.json() as ApiResponse;

			if (response.ok) {
				alert("登录成功！");
				window.location.href = "/";
			} else {
				setError(data.message || "登录失败");
			}
		} catch (err) {
			setError("网络错误，请稍后重试");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">欢迎回来</h1>
					<p className="text-gray-500">请登录您的账户</p>
				</div>

				<div className="bg-white rounded-2xl shadow-lg p-8">
					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								邮箱地址
							</label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="请输入邮箱"
									className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
									required
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								密码
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="请输入密码"
									className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
								>
									{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
								</button>
							</div>
						</div>

						{error && (
							<div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
								{error}
							</div>
						)}

						<Button
							type="submit"
							className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-all"
							disabled={isLoading}
						>
							{isLoading ? "登录中..." : "登录"}
						</Button>
					</form>

					<div className="mt-6 text-center">
						<p className="text-gray-500 text-sm">
							还没有账户？{" "}
							<Link
								href="/register"
								className="text-blue-600 hover:text-blue-700 font-medium"
							>
								立即注册
							</Link>
						</p>
					</div>
				</div>

				<div className="mt-6 flex items-center justify-center gap-2">
					<div className="h-px bg-gray-300 flex-1"></div>
					<span className="text-gray-400 text-sm">或者</span>
					<div className="h-px bg-gray-300 flex-1"></div>
				</div>

				<div className="mt-6">
					<Button
						variant="outline"
						className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
					>
						<ArrowRight className="mr-2 h-5 w-5" />
						使用 GitHub 登录
					</Button>
				</div>
			</div>
		</div>
	);
}