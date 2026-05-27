import { NextResponse } from "next/server";
import { users } from "@/lib/store";
import { verifyPassword } from "@/lib/crypto";

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

		let user = null;
		let fromDatabase = false;

		// 优先从数据库查询（使用 globalThis 避免 TypeScript 类型错误）
		try {
			// @ts-ignore - Cloudflare D1 binding via globalThis
			const db = (globalThis as any).test_db;
			if (db) {
				const result = await db.prepare(
					"SELECT * FROM users WHERE email = ?"
				).bind(email).first();

				if (result) {
					user = {
						password: result.password,
						nickname: result.nickname
					};
					fromDatabase = true;
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

		// 使用Web Crypto API验证密码（密码已加密存储）
		const isPasswordValid = await verifyPassword(password, user.password);

		if (!isPasswordValid) {
			return NextResponse.json({ message: "邮箱或密码错误" }, { status: 401 });
		}

		return NextResponse.json({
			success: true,
			message: "登录成功",
			data: { email, nickname: user.nickname },
			fromDatabase: fromDatabase
		});
	} catch (error: any) {
		console.error("登录失败:", error);
		return NextResponse.json({ message: "服务器错误" }, { status: 500 });
	}
}

export function GET() {
	return NextResponse.json({ message: "请使用POST方法登录" }, { status: 405 });
}