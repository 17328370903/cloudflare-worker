import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/crypto";
import { query, insert, getDB } from "@/lib/database";

interface LoginRequest {
	email: string;
	password: string;
}

export async function POST(request: Request) {
	try {
		const { email, password } = await request.json() as LoginRequest;

		if (!email || !password) {
			return NextResponse.json({ message: "请填写邮箱和密码" }, { status: 400 });
		}

		if (password.length < 6) {
			return NextResponse.json({ message: "密码长度至少为6位" }, { status: 400 });
		}

		console.log(`用户登录: ${email}`);

		// 从数据库查询用户
		const user = await query(
			"SELECT * FROM users WHERE email = ?",
			[email]
		);

		if (!user.results.length || !user.success) {
			console.log(`登录失败: 用户不存在 - ${email}`);
			return NextResponse.json({ message: "邮箱或密码错误" }, { status: 401 });
		}

		const userData = user.results[0];

		// 检查是否是 GitHub 用户（GitHub 用户不能通过邮箱密码登录）
		if (userData.password === "github_oauth") {
			console.log(`登录失败: GitHub 用户不能通过邮箱密码登录 - ${email}`);
			return NextResponse.json({ message: "该账号通过 GitHub 登录，请使用 GitHub 登录按钮" }, { status: 401 });
		}

		// 使用 Web Crypto API 验证密码（密码已加密存储）
		const isPasswordValid = await verifyPassword(password, userData.password);

		if (!isPasswordValid) {
			console.log(`登录失败: 密码错误 - ${email}`);
			return NextResponse.json({ message: "邮箱或密码错误" }, { status: 401 });
		}

		console.log(`用户登录成功: ${email}, 用户ID: ${userData.id}, 昵称: ${userData.name}`);

		// 设置会话 cookie（与 GitHub 登录保持一致，只保存 user_id）
		const response = NextResponse.json({
			success: true,
			message: "登录成功",
			data: { 
				email, 
				nickname: userData.name,
				id: userData.id,
				github_login: userData.github_login,
				avatar_url: userData.avatar_url
			}
		});

		response.cookies.set("user_id", String(userData.id), {
			httpOnly: false,
			secure: true,
			maxAge: 24 * 60 * 60,
			sameSite: "strict"
		});

		return response;
	} catch (error: any) {
		console.error("登录失败:", error);
		return NextResponse.json({ message: "服务器错误" }, { status: 500 });
	}
}

export function GET() {
	return NextResponse.json({ message: "请使用POST方法登录" }, { status: 405 });
}