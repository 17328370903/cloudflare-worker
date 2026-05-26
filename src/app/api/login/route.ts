import { NextResponse } from "next/server";
import { users } from "@/lib/store";

interface LoginRequest {
	email: string;
	password: string;
}
/**
 * 登录接口
 * @param request 
 * @returns 
 */
export async function POST(request: Request) {
	try {
		const { email, password } = await request.json() as LoginRequest;

		if (!email || !password) {
			return NextResponse.json({ message: "请填写邮箱和密码" }, { status: 400 });
		}

		// 使用内存存储验证用户
		const user = users.get(email);

		if (!user) {
			return NextResponse.json({ message: "邮箱或密码错误" }, { status: 401 });
		}

		if (user.password !== password) {
			return NextResponse.json({ message: "邮箱或密码错误" }, { status: 401 });
		}

		console.log(`用户登录成功: ${email}`);

		return NextResponse.json({
			success: true,
			message: "登录成功",
			data: { email, nickname: user.nickname },
		});
	} catch (error: any) {
		console.error("登录失败:", error);
		return NextResponse.json({ message: "服务器错误" }, { status: 500 });
	}
}

export function GET() {
	return NextResponse.json({ message: "请使用POST方法登录" }, { status: 405 });
}