import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";

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
		const clientId = process.env.GITHUB_CLIENT_ID;
		const clientSecret = process.env.GITHUB_CLIENT_SECRET;
		const callbackUrl = process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/api/auth/github/callback";

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
					redirect_uri: callbackUrl,
				}),
			}, 3);

			const tokenData = await tokenResponse.json();
			
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

			const githubUser = await userResponse.json();
			console.log(`GitHub 用户信息: ${JSON.stringify({ id: githubUser.id, login: githubUser.login, name: githubUser.name })}`);

			// 3. 获取用户邮箱
			console.log("正在获取 GitHub 用户邮箱...");
			const emailResponse = await fetchWithRetry("https://api.github.com/user/emails", {
				headers: {
					Authorization: `Bearer ${tokenData.access_token}`,
				},
			}, 3);

			const emails = await emailResponse.json();
			
			// 检查 emails 是否是数组
			let primaryEmail: string | undefined;
			if (Array.isArray(emails)) {
				// 从数组中查找主要且已验证的邮箱
				const verifiedEmail = emails.find((e: { primary: boolean; verified: boolean }) => e.primary && e.verified);
				primaryEmail = verifiedEmail?.email || githubUser.email;
				console.log(`从邮箱列表找到邮箱: ${primaryEmail}`);
			} else {
				// 如果不是数组，输出调试信息并尝试其他方式获取邮箱
				console.log(`邮箱响应不是数组，类型: ${typeof emails}`);
				console.log(`邮箱响应内容: ${JSON.stringify(emails)}`);
				console.log(`githubUser.email: ${githubUser.email}`);
				primaryEmail = githubUser.email;
			}

			// 如果仍然没有邮箱，使用 GitHub login 作为邮箱（创建一个虚拟邮箱）
			if (!primaryEmail) {
				console.log("用户没有公开邮箱，使用 GitHub login 创建虚拟邮箱");
				primaryEmail = `${githubUser.login}@github.local`;
			}

			console.log(`GitHub 用户邮箱: ${primaryEmail}`);

			// 4. 在数据库中创建或更新用户
			const db = getDB();
			
			// 检查用户是否已存在（通过邮箱或 GitHub ID）
			const existingUser = await db.prepare(
				"SELECT * FROM users WHERE email = ? OR github_id = ?"
			).bind(primaryEmail, githubUser.id).first();

			let userId: number | undefined;
			let isNewUser = false;

			if (existingUser) {
				console.log(`用户已存在，更新信息: ${primaryEmail}`);
				const updateResult = await db.prepare(
					"UPDATE users SET nickname = ?, github_id = ?, github_login = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
				).bind(githubUser.login || githubUser.name || "GitHub用户", githubUser.id, githubUser.login, existingUser.id).run();
				userId = existingUser.id;
			} else {
				console.log(`创建新用户: ${primaryEmail}`);
				const insertResult = await db.prepare(
					"INSERT INTO users (email, password, nickname, github_id, github_login) VALUES (?, ?, ?, ?, ?)"
				).bind(primaryEmail, "github_oauth", githubUser.login || githubUser.name || "GitHub用户", githubUser.id, githubUser.login).run();
				userId = insertResult.meta?.lastRowId;
				isNewUser = true;
			}

			console.log(`${isNewUser ? '新用户注册' : '用户登录'}成功: ${primaryEmail}, 用户ID: ${userId}`);

			// 5. 重定向到首页
			const response = NextResponse.redirect(new URL("/", request.url));
			
			response.cookies.set("user_email", primaryEmail, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				maxAge: 24 * 60 * 60,
			});
			
			response.cookies.set("user_id", String(userId), {
				httpOnly: true,
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