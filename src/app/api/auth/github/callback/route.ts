import { NextResponse } from "next/server";
import { insert,update } from "@/lib/database";
import { getUserByGithubId } from "@/model/users";
import { getCloudflareContext } from '@opennextjs/cloudflare';

// 安全的 JSON 解析函数
async function safeJsonParse(response: Response): Promise<any> {
	try {
		const text = await response.text();
		if (!text) {
			throw new Error("响应为空");
		}
		try {
			return JSON.parse(text);
		} catch {
			console.error("JSON 解析失败，响应内容:", text.substring(0, 500));
			throw new Error(`无效的 JSON 响应: ${text.substring(0, 100)}...`);
		}
	} catch (error) {
		console.error("读取响应失败:", error);
		throw error;
	}
}

// 重试函数
async function fetchWithRetry(url: string, options: RequestInit, retries: number = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok || i === retries - 1) {
                return response;
            }
        } catch (error) {
            if (i === retries - 1) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    throw new Error("请求失败");
}

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const code = url.searchParams.get("code");
		const error = url.searchParams.get("error");
		const {env} = getCloudflareContext();

		if (error) {
			console.log(`GitHub OAuth 错误: ${error}`);
			return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
		}

		if (!code) {
			console.log("GitHub OAuth 缺少 code 参数");
			return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
		}

		const clientId = (env as any).GITHUB_CLIENT_ID;
		const clientSecret = (env as any).GITHUB_CLIENT_SECRET;

		if (!clientId || !clientSecret) {
			console.log("GitHub OAuth 配置未设置");
			return NextResponse.redirect(new URL("/login?error=config_error", request.url));
		}

		console.log("正在获取 GitHub access_token...");

		try {
			// 1. 使用 code 换取 access_token
			const tokenResponse = await fetchWithRetry("https://github.com/login/oauth/access_token", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Accept": "application/json",
					"User-Agent": "OpenNext-Starter/1.0.0",
				},
				body: JSON.stringify({
					client_id: clientId,
					client_secret: clientSecret,
					code: code,
					redirect_uri: (env as any).GITHUB_CALLBACK_URL,
				}),
			}, 3);

			// 使用安全的 JSON 解析
			const tokenData = await safeJsonParse(tokenResponse) as { access_token?: string };
			
			if (!tokenData.access_token) {
				console.log(`GitHub OAuth 获取 token 失败: ${JSON.stringify(tokenData)}`);
				return NextResponse.redirect(new URL("/login?error=token_error", request.url));
			}

			console.log("成功获取 GitHub access_token");

			// 2. 使用 access_token 获取用户信息
			console.log("正在获取 GitHub 用户信息...");
			const userResponse = await fetchWithRetry("https://api.github.com/user", {
				headers: {
					Authorization: `Bearer ${tokenData.access_token}`,
					"Accept": "application/json",
					"User-Agent": "OpenNext-Starter/1.0.0",
				},
			}, 3);

			// 使用安全的 JSON 解析
			const githubUser = await safeJsonParse(userResponse) as { id: number; login: string; name?: string; email?: string; avatar_url?: string };

			console.log("GitHub 用户信息:", githubUser);

			// 检查用户是否已存在
			const existingUser = await getUserByGithubId(githubUser.id)

			let userId: number | undefined;

			const ip = request.headers.get('x-forwarded-for') || '';
			if (existingUser) {
				await update(
					"UPDATE users SET name = ?, github_id = ?, updated_at = CURRENT_TIMESTAMP,last_login_at = CURRENT_TIMESTAMP,last_login_ip = ?,avatar_url = ? WHERE id = ?"
				,[ githubUser.name, githubUser.id, ip, githubUser.avatar_url, existingUser.id]);
				userId = existingUser.id;
			} else {
				const insertResult = await insert(
					"INSERT INTO users (email, password, name, github_id,last_login_ip,last_login_at,avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)"
				,['', "", githubUser.name || githubUser.login, githubUser.id, ip, new Date().toISOString(), githubUser.avatar_url]);
				userId = insertResult.meta?.last_row_id;
			}

			// 重定向到客户端回调页面
			const callbackUrl = new URL("/auth/callback", request.url);
			callbackUrl.searchParams.set("name", githubUser.name || githubUser.login || "GitHub用户");
			if (githubUser.login) {
				callbackUrl.searchParams.set("github_login", githubUser.login);
			}
			if (githubUser.avatar_url) {
				callbackUrl.searchParams.set("avatar_url", githubUser.avatar_url);
			}

			const response = NextResponse.redirect(callbackUrl.toString());
			
			response.cookies.set("user_id", String(userId), {
				httpOnly: false,
				secure: process.env.NODE_ENV === "production",
				maxAge: 24 * 60 * 60,
			});

			return response;

		} catch (networkError: any) {
			console.error("GitHub API 请求失败:", networkError);
			return NextResponse.redirect(new URL("/login?error=network_error", request.url));
		}

	} catch (error) {
		console.error("GitHub OAuth 回调失败:", error);
		return NextResponse.redirect(new URL("/login?error=server_error", request.url));
	}
}
