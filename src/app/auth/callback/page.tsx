"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
	const router = useRouter();

	useEffect(() => {
		// 从 URL 参数中获取用户信息
		const urlParams = new URLSearchParams(window.location.search);
		const nickname = urlParams.get('name') || '';
		const githubLogin = urlParams.get('github_login');
		const avatarUrl = urlParams.get('avatar_url');

		// 从 cookie 中读取用户 ID
		const cookies = document.cookie.split(';');
		let userId = '';

		cookies.forEach(cookie => {
			const [name, value] = cookie.trim().split('=');
			if (name === 'user_id') userId = value;
		});

		if (userId) {
			// 保存用户信息到 localStorage
			const userInfo: { email: string; nickname: string; id: number; github_login?: string; avatar_url?: string } = {
				email: '',
				nickname: nickname || 'GitHub用户',
				id: parseInt(userId),
			};
			if (githubLogin) {
				userInfo.github_login = githubLogin;
			}
			if (avatarUrl) {
				userInfo.avatar_url = avatarUrl;
			}
			localStorage.setItem(`user_${userId}`, JSON.stringify(userInfo));

			// 清除 URL 参数
			window.history.replaceState({}, document.title, '/');
		}

		// 延迟跳转到首页，确保 cookie 已设置
		setTimeout(() => {
			router.push('/');
		}, 100);
	}, [router]);

	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
				<p className="mt-4 text-gray-600">正在登录...</p>
			</div>
		</div>
	);
}