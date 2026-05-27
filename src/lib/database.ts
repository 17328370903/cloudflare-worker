// 数据库抽象层 - 支持开发环境和生产环境

// 模拟 D1 数据库结果类型
interface D1Result<T = unknown> {
	success: boolean;
	results: T[];
	meta?: {
		lastRowId?: number;
		changes?: number;
	};
}

// 用户类型
interface User {
	id: number;
	email: string;
	password: string;
	nickname: string;
	github_id?: number;
	github_login?: string;
	created_at: string;
	updated_at: string;
}

// 模拟 D1 预备语句
class MockPreparedStatement {
	private sql: string;
	private params: unknown[] = [];

	constructor(sql: string) {
		this.sql = sql;
		console.log('Mock DB - SQL:', sql);
	}

	bind(...params: unknown[]): MockPreparedStatement {
		this.params = params;
		console.log('Mock DB - Params:', params);
		return this;
	}

	async first<T = unknown>(): Promise<T | null> {
		const users = globalThis['__mock_users__'] || [];
		const sqlUpper = this.sql.toUpperCase();
		
		console.log('Mock DB first() - SQL:', this.sql);
		console.log('Mock DB first() - Params:', this.params);
		
		if (sqlUpper.includes('SELECT COUNT(*)')) {
			return { count: users.length } as unknown as T;
		}

		// 通过邮箱查询（检查是否有 email 参数）
		if (sqlUpper.includes('WHERE') && this.params.length === 1) {
			const email = this.params[0] as string;
			const user = users.find((u: User) => u.email === email);
			console.log('Mock DB first() - 通过邮箱查询:', email, '找到:', !!user);
			return user as unknown as T || null;
		}

		// 通过邮箱或 GitHub ID 查询（检查是否有两个参数）
		if (sqlUpper.includes('WHERE') && this.params.length === 2) {
			const email = this.params[0] as string;
			const githubId = this.params[1] as number;
			const user = users.find((u: User) => u.email === email || u.github_id === githubId);
			console.log('Mock DB first() - 通过邮箱或GitHub ID查询:', { email, githubId }, '找到:', !!user);
			return user as unknown as T || null;
		}

		return null;
	}

	async run(): Promise<D1Result> {
		console.log('Mock DB run() - SQL:', this.sql);
		console.log('Mock DB run() - Params:', this.params);
		
		if (!globalThis['__mock_users__']) {
			globalThis['__mock_users__'] = [];
		}

		const sqlUpper = this.sql.toUpperCase();

		// 插入用户（支持 GitHub 字段 - 5个参数）
		if (sqlUpper.includes('INSERT INTO USERS') && this.params.length >= 5) {
			console.log('Mock DB run() - 匹配 INSERT 5参数模式');
			const [email, password, nickname, github_id, github_login] = this.params as [string, string, string, number?, string?];
			const newUser: User = {
				id: Date.now(),
				email,
				password,
				nickname,
				github_id,
				github_login,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};
			globalThis['__mock_users__'].push(newUser);
			
			console.log('Mock DB - 插入用户（GitHub）成功:', { email, github_id, github_login });
			console.log('Mock DB - 当前用户总数:', globalThis['__mock_users__'].length);
			
			return {
				success: true,
				results: [],
				meta: { lastRowId: newUser.id, changes: 1 }
			};
		}

		// 插入用户（旧格式，兼容邮箱注册 - 3个参数）
		if (sqlUpper.includes('INSERT INTO USERS') && this.params.length === 3) {
			console.log('Mock DB run() - 匹配 INSERT 3参数模式');
			const [email, password, nickname] = this.params as [string, string, string];
			const newUser: User = {
				id: Date.now(),
				email,
				password,
				nickname,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};
			globalThis['__mock_users__'].push(newUser);
			
			console.log('Mock DB - 插入用户（邮箱）成功:', email);
			console.log('Mock DB - 当前用户总数:', globalThis['__mock_users__'].length);
			
			return {
				success: true,
				results: [],
				meta: { lastRowId: newUser.id, changes: 1 }
			};
		}

		// 更新用户（支持 GitHub 字段）
		if (sqlUpper.includes('UPDATE USERS') && this.sql.includes('nickname')) {
			const users = globalThis['__mock_users__'] as User[];
			
			// 新格式：更新 GitHub 信息（4个参数）
			if (this.params.length === 4) {
				console.log('Mock DB run() - 匹配 UPDATE 4参数模式');
				const [nickname, github_id, github_login, userId] = this.params as [string, number, string, number];
				const userIndex = users.findIndex((u: User) => u.id === userId);
				if (userIndex !== -1) {
					users[userIndex] = {
						...users[userIndex],
						nickname,
						github_id,
						github_login,
						updated_at: new Date().toISOString()
					};
					console.log('Mock DB - 更新用户成功:', users[userIndex].email);
					return { success: true, results: [], meta: { changes: 1 } };
				} else {
					console.log('Mock DB - 更新用户失败：未找到用户 ID:', userId);
				}
			}

			// 旧格式：仅更新 nickname（2个参数）
			if (this.params.length === 2) {
				console.log('Mock DB run() - 匹配 UPDATE 2参数模式');
				const [nickname, email] = this.params as [string, string];
				const userIndex = users.findIndex((u: User) => u.email === email);
				if (userIndex !== -1) {
					users[userIndex] = {
						...users[userIndex],
						nickname,
						updated_at: new Date().toISOString()
					};
					console.log('Mock DB - 更新用户成功:', email);
					return { success: true, results: [], meta: { changes: 1 } };
				} else {
					console.log('Mock DB - 更新用户失败：未找到用户 email:', email);
				}
			}
		}

		console.log('Mock DB run() - 未匹配任何操作模式');
		return { success: false, results: [] };
	}

	async all<T = unknown>(): Promise<D1Result<T>> {
		const users = globalThis['__mock_users__'] || [];
		return {
			success: true,
			results: users as T[],
			meta: { changes: users.length }
		};
	}
}

// 模拟 D1 数据库类
class MockD1Database {
	prepare(sql: string): MockPreparedStatement {
		return new MockPreparedStatement(sql);
	}
}

// 获取数据库实例（自动检测环境）
export function getDB() {
	// 生产环境：使用真实的 Cloudflare D1 绑定
	// 尝试多种可能的绑定名称
	// @ts-ignore
	const realDB = (globalThis as any).test_db || (globalThis as any).test;
	
	if (realDB && typeof realDB.prepare === 'function') {
		console.log('使用真实 D1 数据库');
		return realDB;
	}

	// 开发环境：使用模拟数据库
	console.log('使用模拟数据库（开发环境）');
	return new MockD1Database();
}

// 初始化模拟数据库（开发环境）
export function initMockDB() {
	if (!globalThis['__mock_users__']) {
		globalThis['__mock_users__'] = [];
		console.log('Mock DB 已初始化');
	}
}