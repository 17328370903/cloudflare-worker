import { NextResponse } from "next/server";
import { insert,update } from "@/lib/database";
import { getUserByGithubId } from "@/model/users";
import { getCloudflareContext } from '@opennextjs/cloudflare';

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
            // 等待后重试
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

		// 检查是否有错误
		if (error) {
			console.log(`GitHub OAuth 错误: ${error}`);
			return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
		}

		if (!code) {
			console.log("GitHub OAuth 缺少 code 参数");
			return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
		}

		// 获取 GitHub OAuth 配置
		const clientId = (env as any).GITHUB_CLIENT_ID;
		const clientSecret = process.env.GITHUB_CLIENT_SECRET;

		if (!clientId || !clientSecret) {
			console.log("GitHub OAuth 配置未设置");
			return NextResponse.redirect(new URL("/login?error=config_error", request.url));
		}

		console.log("正在获取 GitHub access_token...");

		try {
			// 1. 使用 code 换取 access_token（带重试）
			const tokenResponse = await fetchWithRetry("https://github.com/login/oauth/access_token", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Accept": "application/json",
				},
				body: JSON.stringify({
					client_id: clientId,
					client_secret: clientSecret,
					code: code,
					redirect_uri: (env as any).GITHUB_CALLBACK_URL,
				}),
			}, 3);

			const tokenData = await tokenResponse.json() as { access_token?: string };
			
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
				},
			}, 3);

			const githubUser = await userResponse.json() as { id: number; login: string; name?: string; email?: string; avatar_url?: string };

			console.log(githubUser)

			// 检查用户是否已存在（通过邮箱或 GitHub ID）
			const existingUser = await getUserByGithubId(githubUser.id)

			let isNewUser = false;
			let userId: number | undefined;

			const ip  = request.headers.get('x-forwarded-for') || '';
			if (existingUser) {
				const updateResult = await update(
					"UPDATE users SET name = ?, github_id = ?, updated_at = CURRENT_TIMESTAMP,last_login_at = CURRENT_TIMESTAMP,last_login_ip = ?,avatar_url = ?  WHERE id = ?"
				,[ githubUser.name, githubUser.id, ip,githubUser.avatar_url, existingUser.id]);
				 userId = existingUser.id;
			} else {
				const insertResult = await insert(
					"INSERT INTO users (email, password, name, github_id,last_login_ip,last_login_at,avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)"
				,['', "",  githubUser.name , githubUser.id, ip, new Date().toISOString(),githubUser.avatar_url]);
				 userId = insertResult.meta?.last_row_id;
				isNewUser = true;
			}


			// 5. 重定向到客户端回调页面（传递用户信息）
			const callbackUrl = new URL("/auth/callback", request.url);
			callbackUrl.searchParams.set("name", githubUser.name || "GitHub用户");
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