// 模拟数据存储（实际应用中应使用数据库）

export interface User {
	password: string;
	nickname: string;
}

export interface StoredCode {
	code: string;
	expiresAt: number;
}

// 用户存储
export const users = new Map<string, User>();

// 验证码存储
export const codeStore = new Map<string, StoredCode>();