import { NextResponse } from "next/server";
import { users } from "@/lib/store";

export async function POST(request: Request) {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return NextResponse.json({ message: "请填写邮箱和密码" }, { status: 400 });
		}

		let user = null;

		// 首先尝试从数据库查询
		try {
			// @ts-ignore - Cloudflare D1 binding
			if (typeof test_db !== 'undefined') {
				const result = await test_db.prepare(
					"SELECT * FROM users WHERE email = ?"
				).bind(email).first();

				if (result) {
					user = {
						password: result.password,
						nickname: result.nickname
					};
					console.log(`用户登录成功(数据库): ${email}`);
				}
			}
		} catch (dbError) {
			console.warn("数据库查询失败:", dbError);
		}

		// 如果数据库查询失败，尝试从内存存储查询
		if (!user) {
			user = users.get(email);
			if (user) {
				console.log(`用户登录成功(内存): ${email}`);
			}
		}

		if (!user) {
			return NextResponse.json({ message: "邮箱或密码错误" }, { status: 401 });
		}

		if (user.password !== password) {
			return NextResponse.json({ message: "邮箱或密码错误" }, { status: 401 });
		}

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