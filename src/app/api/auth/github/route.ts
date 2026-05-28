import { NextResponse } from "next/server";
import { getCloudflareContext } from '@opennextjs/cloudflare';


export async function GET() {
	const {env} = await getCloudflareContext();
	// 获取 GitHub OAuth 配置
	const clientId = (env as any).GITHUB_CLIENT_ID;
	const callbackUrl = (env as any).GITHUB_CALLBACK_URL;

	if (!clientId) {
		return NextResponse.json({ error: "GitHub Client ID 未配置" }, { status: 500 });
	}

	// GitHub OAuth 授权 URL
	const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
	githubAuthUrl.searchParams.set("client_id", clientId);
	githubAuthUrl.searchParams.set("redirect_uri", callbackUrl || "");
	githubAuthUrl.searchParams.set("scope", "user:email"); // 请求用户邮箱权限

	// 重定向到 GitHub 授权页面
	return NextResponse.redirect(githubAuthUrl.toString());
}