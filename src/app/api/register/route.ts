import { NextResponse } from "next/server";
import { codeStore } from "@/lib/store";
import { hashPassword } from "@/lib/crypto";
import { query,insert } from "@/lib/database";
import { log } from "console";

interface RegisterRequest {
	email: string;
	password: string;
	nickname: string;
	code: string;
}

export async function POST(request: Request) {
	try {
		const { email, password, nickname, code } = await request.json() as RegisterRequest;

		if (!email || !password || !nickname || !code) {
			return NextResponse.json({ message: "请填写完整信息" }, { status: 400 });
		}

		if (password.length < 6) {
			return NextResponse.json({ message: "密码长度至少为6位" }, { status: 400 });
		}

		// 验证验证码
		const storedCode = codeStore.get(email);
		if (!storedCode) {
			return NextResponse.json({ message: "请先获取验证码" }, { status: 400 });
		}

		if (Date.now() > storedCode.expiresAt) {
			codeStore.delete(email);
			return NextResponse.json({ message: "验证码已过期，请重新获取" }, { status: 400 });
		}

		if (storedCode.code !== code) {
			return NextResponse.json({ message: "验证码错误" }, { status: 400 });
		}

		// 使用 Web Crypto API 加密密码
		const hashedPassword = await hashPassword(password);

		// 获取数据库实例（自动检测环境）

		
		console.log(`开始注册用户: ${email}`);

		// 检查用户是否已存在
		const existingUser = await query(
			"SELECT * FROM users WHERE email = ?"
		,[email]);

		console.log(existingUser);
		if (existingUser.success && existingUser.results.length > 0) {
			return NextResponse.json({ message: "该邮箱已被注册" }, { status: 400 });
		}

		// 插入用户到数据库（使用 3 个参数的格式）
		const insertResult = await insert(
			"INSERT INTO users (email, password, name) VALUES (?, ?, ?)"
		,[email, hashedPassword, nickname]);


		console.log(insertResult);
		if (!insertResult.success) {
			return NextResponse.json({ message: "注册失败",result:insertResult }, { status: 500 });
		}

		// 删除已使用的验证码
		codeStore.delete(email);

		console.log(`用户注册成功: ${email}, 用户ID: ${insertResult.meta?.last_row_id}`);

		return NextResponse.json({ 
			success: true, 
			message: "注册成功",
			userId: insertResult.meta?.last_row_id
		});
	} catch (error: any) {
		console.error("注册失败:", error);
		return NextResponse.json({ message: error.message || "服务器错误" }, { status: 500 });
	}
}

export function GET() {
	return NextResponse.json({ message: "请使用POST方法注册" }, { status: 405 });
}