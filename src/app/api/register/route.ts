import { NextResponse } from "next/server";
import { codeStore } from "@/lib/store";

export async function POST(request: Request) {
	try {
		const { email, password, nickname, code } = await request.json();

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

		// 尝试连接数据库
		let success = false;
		try {
			// @ts-ignore - Cloudflare D1 binding
			if (typeof test_db !== 'undefined') {
				// 使用 Cloudflare D1 数据库
				const result = await test_db.prepare(
					"INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)"
				).bind(email, password, nickname).run();

				if (result.success) {
					success = true;
					console.log(`用户注册成功(数据库): ${email}`);
				}
			}
		} catch (dbError) {
			console.warn("数据库存储失败，使用内存存储:", dbError);
		}

		// 如果数据库存储失败，使用内存存储作为备用
		if (!success) {
			// 使用内存存储（已在 store.ts 中定义）
			const users = require('@/lib/store').users;
			users.set(email, { password, nickname });
			console.log(`用户注册成功(内存): ${email}`);
		}

		// 删除已使用的验证码
		codeStore.delete(email);

		return NextResponse.json({ success: true, message: "注册成功" });
	} catch (error: any) {
		console.error("注册失败:", error);
		return NextResponse.json({ message: error.message || "服务器错误" }, { status: 500 });
	}
}

export function GET() {
	return NextResponse.json({ message: "请使用POST方法注册" }, { status: 405 });
}