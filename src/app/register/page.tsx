"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock, User, Send } from "lucide-react";
import { Toast, ToastType } from "@/components/Toast";

export default function RegisterPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [nickname, setNickname] = useState("");
	const [code, setCode] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isSendingCode, setIsSendingCode] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [countdown, setCountdown] = useState(0);
	const [error, setError] = useState("");
	const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

	// 发送验证码
	const handleSendCode = async () => {
		if (!email) {
			setError("请先输入邮箱地址");
			return;
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			setError("请输入有效的邮箱地址");
			return;
		}

		setIsSendingCode(true);

		try {
			const response = await fetch("/api/send-code", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			interface SendCodeResponse {
				success?: boolean;
				message?: string;
			}
			const data = await response.json() as SendCodeResponse;

			if (response.ok) {
				setCountdown(60);
				setToast({ message: "验证码已发送，请注意查收邮箱", type: "success" });
			} else {
				setError(data.message || "发送失败");
			}
		} catch (err) {
			setError("网络错误，请稍后重试");
		} finally {
			setIsSendingCode(false);
		}
	};

	// 倒计时
	useEffect(() => {
		if (countdown > 0) {
			const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [countdown]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError("两次输入的密码不一致");
			return;
		}

		if (password.length < 6) {
			setError("密码长度至少为6位");
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch("/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password, nickname, code }),
			});

			interface RegisterResponse {
				success?: boolean;
				message?: string;
				userId?: number;
			}
			const data = await response.json() as RegisterResponse;

			if (response.ok) {
				// 注册成功后保存用户信息到 localStorage
				if (data.userId) {
					const userInfo = {
						email: email,
						nickname: nickname,
						id: data.userId,
					};
					localStorage.setItem(`user_${data.userId}`, JSON.stringify(userInfo));
					
					// 设置 cookie（模拟登录状态）
					document.cookie = `user_email=${encodeURIComponent(email)}; path=/; max-age=${24 * 60 * 60}`;
					document.cookie = `user_id=${data.userId}; path=/; max-age=${24 * 60 * 60}`;
				}
				
				// 显示成功提示
				setToast({ message: "注册成功！", type: "success" });
				
				// 延迟跳转到首页
				setTimeout(() => {
					window.location.href = "/";
				}, 1500);
			} else {
				setError(data.message || "注册失败");
			}
		} catch (err) {
			setError("网络错误，请稍后重试");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			{toast && (
				<Toast 
					message={toast.message} 
					type={toast.type} 
					onClose={() => setToast(null)} 
				/>
			)}
			
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">创建账户</h1>
					<p className="text-gray-500">请填写以下信息完成注册</p>
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
								昵称
							</label>
							<div className="relative">
								<User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
								<input
									type="text"
									value={nickname}
									onChange={(e) => setNickname(e.target.value)}
									placeholder="请输入昵称"
									className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
									required
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								验证码
							</label>
							<div className="flex gap-3">
								<div className="relative flex-1">
									<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
									<input
										type="text"
										value={code}
										onChange={(e) => setCode(e.target.value)}
										placeholder="请输入验证码"
										className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
										required
									/>
								</div>
								<Button
									type="button"
									onClick={handleSendCode}
									disabled={isSendingCode || countdown > 0}
									className="px-4 bg-green-600 hover:bg-green-700"
								>
									{countdown > 0 ? (
										<span>{countdown}s</span>
									) : (
										<>
											<Send className="h-4 w-4 mr-1" />
											发送
										</>
									)}
								</Button>
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

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								确认密码
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
								<input
									type={showPassword ? "text" : "password"}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder="请再次输入密码"
									className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
									required
								/>
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
							{isLoading ? "注册中..." : "注册"}
						</Button>
					</form>

					<div className="mt-6 text-center">
						<p className="text-gray-500 text-sm">
							已有账户？{" "}
							<Link
								href="/login"
								className="text-blue-600 hover:text-blue-700 font-medium"
							>
								立即登录
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}