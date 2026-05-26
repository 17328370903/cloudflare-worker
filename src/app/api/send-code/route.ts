import { NextResponse } from "next/server";
import { Resend } from "resend";
import { codeStore } from "@/lib/store";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
	try {
		const { email } = await request.json();

		if (!email) {
			return NextResponse.json({ message: "邮箱地址不能为空" }, { status: 400 });
		}

		// 生成6位验证码
		const code = Math.floor(100000 + Math.random() * 900000).toString();
		const expiresAt = Date.now() + 5 * 60 * 1000; // 5分钟过期

		// 存储验证码
		codeStore.set(email, { code, expiresAt });

		// 发送邮件（仅在配置了 API Key 时发送）
		if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "your_resend_api_key_here") {
			const fromEmail = process.env.RESEND_FROM_EMAIL || "verification@example.com";
			
			await resend.emails.send({
				from: fromEmail,
				to: email,
				subject: "您的验证码",
				html: `
					<!DOCTYPE html>
					<html>
					<head>
						<style>
							.container {
								max-width: 400px;
								margin: 0 auto;
								padding: 20px;
								border: 1px solid #eee;
								border-radius: 8px;
								font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
							}
							.code {
								font-size: 32px;
								font-weight: bold;
								letter-spacing: 4px;
								text-align: center;
								color: #333;
								margin: 20px 0;
								padding: 15px;
								background: #f8f9fa;
								border-radius: 8px;
							}
							.note {
								font-size: 14px;
								color: #666;
								text-align: center;
							}
						</style>
					</head>
					<body>
						<div class="container">
							<h2>您好！</h2>
							<p>感谢您的注册，以下是您的验证码：</p>
							<div class="code">${code}</div>
							<p class="note">此验证码5分钟内有效，请尽快使用。</p>
							<p class="note">如果这不是您的操作，请忽略此邮件。</p>
						</div>
					</body>
					</html>
				`,
				text: `您的验证码是：${code}\n\n此验证码5分钟内有效，请尽快使用。`,
			});

			console.log(`验证码邮件已发送到 ${email}`);
		} else {
			// 开发模式：打印验证码到控制台
			console.log(`开发模式 - 验证码: ${code} (发送到: ${email})`);
		}

		return NextResponse.json({ 
			success: true, 
			message: "验证码已发送，请注意查收邮箱" 
		});
	} catch (error: any) {
		console.error("发送验证码失败:", error);
		return NextResponse.json({ 
			message: error.message || "发送验证码失败，请稍后重试" 
		}, { status: 500 });
	}
}

export function GET() {
	return NextResponse.json({ message: "请使用POST方法发送验证码" }, { status: 405 });
}