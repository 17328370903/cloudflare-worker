import { NextResponse } from "next/server";
import { codeStore, users } from "@/lib/store";

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

		// 使用内存存储用户（避免构建时访问数据库绑定）
		users.set(email, { password, nickname });
		console.log(`用户注册成功(内存): ${email}`);

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