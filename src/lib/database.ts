import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface DbResult {
	success: boolean;
	results: Array<any>;
	meta: {
		served_by: string;
		duration: number;
		changes: number;
		last_row_id: number;
		changed_db: boolean;
		size_after: number;
		rows_read: number;
		rows_written: number;
	};
}

// 用户类型
interface User {
	id: number;
	email: string;
	password: string;
	name: string;
	github_id?: number;
	github_login?: string;
	created_at: string;
	updated_at: string;
}

// 模拟数据库类
class MockD1Database {
	private users: User[] = [];

	prepare(sql: string) {
		return new MockPreparedStatement(sql, this.users);
	}
}

// 模拟预备语句
class MockPreparedStatement {
	private sql: string;
	private params: unknown[] = [];
	private users: User[];

	constructor(sql: string, users: User[]) {
		this.sql = sql;
		this.users = users;
	}

	bind(...params: unknown[]): MockPreparedStatement {
		this.params = params;
		return this;
	}

	async first<T = unknown>(): Promise<T | null> {
		const sqlUpper = this.sql.toUpperCase();

		if (sqlUpper.includes('SELECT COUNT(*)')) {
			return { count: this.users.length } as unknown as T;
		}

		if (sqlUpper.includes('WHERE') && this.params.length === 1) {
			const email = this.params[0] as string;
			const user = this.users.find((u: User) => u.email === email);
			return user as unknown as T || null;
		}

		if (sqlUpper.includes('WHERE') && this.params.length === 2) {
			const email = this.params[0] as string;
			const githubId = this.params[1] as number;
			const user = this.users.find((u: User) => u.email === email || u.github_id === githubId);
			return user as unknown as T || null;
		}

		return this.users[0] as unknown as T || null;
	}

	async run(): Promise<{ success: boolean; results: any[]; meta?: { lastRowId?: number; changes?: number } }> {
		const sqlUpper = this.sql.toUpperCase();

		if (sqlUpper.includes('INSERT INTO USERS')) {
			const [email, password, name, github_id, github_login] = this.params as [string, string, string, number?, string?];
			const newUser: User = {
				id: Date.now(),
				email,
				password,
				name,
				github_id,
				github_login,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};
			this.users.push(newUser);
			return { success: true, results: [], meta: { lastRowId: newUser.id, changes: 1 } };
		}

		if (sqlUpper.includes('UPDATE USERS')) {
			if (this.params.length === 4) {
				const [name, github_id, github_login, userId] = this.params as [string, number, string, number];
				const userIndex = this.users.findIndex((u: User) => u.id === userId);
				if (userIndex !== -1) {
					this.users[userIndex] = {
						...this.users[userIndex],
						name,
						github_id,
						github_login,
						updated_at: new Date().toISOString()
					};
					return { success: true, results: [], meta: { changes: 1 } };
				}
			}
		}

		return { success: false, results: [] };
	}

	async all<T = unknown>(): Promise<{ success: boolean; results: T[] }> {
		return { success: true, results: this.users as T[] };
	}
}

// 全局模拟数据库实例
let mockDB: MockD1Database | null = null;

async function getDB(dbName: string = 'test_db'): Promise<any> {
	try {
		// 尝试获取 Cloudflare 上下文
		const { env } = await getCloudflareContext({ async: true });
		if (env && env[dbName as keyof typeof env]) {
			console.log('使用真实 D1 数据库');
			return env[dbName as keyof typeof env];
		}
	} catch (error) {
		// Cloudflare 上下文不可用，使用模拟数据库
		console.log('Cloudflare 上下文不可用，使用模拟数据库');
	}

	// 使用模拟数据库
	if (!mockDB) {
		mockDB = new MockD1Database();
	}
	return mockDB;
}

export async function query(sql: string, params: any[] = []): Promise<DbResult> {
	const db = await getDB();
	const result = await db.prepare(sql).bind(...params).all();
	return {
		success: result.success,
		results: result.results,
		meta: {
			served_by: 'mock',
			duration: 0,
			changes: result.meta?.changes || 0,
			last_row_id: result.meta?.lastRowId || 0,
			changed_db: result.meta?.changes ? true : false,
			size_after: 0,
			rows_read: result.results.length,
			rows_written: result.meta?.changes || 0
		}
	};
}

export async function insert(sql: string, params: any[] = []): Promise<DbResult> {
	const db = await getDB();
	const result = await db.prepare(sql).bind(...params).run();
	return {
		success: result.success,
		results: result.results,
		meta: {
			served_by: 'mock',
			duration: 0,
			changes: result.meta?.changes || 0,
			last_row_id: result.meta?.lastRowId || 0,
			changed_db: result.meta?.changes ? true : false,
			size_after: 0,
			rows_read: 0,
			rows_written: result.meta?.changes || 0
		}
	};
}

export async function update(sql: string, params: any[] = []): Promise<DbResult> {
	const db = await getDB();
	const result = await db.prepare(sql).bind(...params).run();
	return {
		success: result.success,
		results: result.results,
		meta: {
			served_by: 'mock',
			duration: 0,
			changes: result.meta?.changes || 0,
			last_row_id: 0,
			changed_db: result.meta?.changes ? true : false,
			size_after: 0,
			rows_read: 0,
			rows_written: result.meta?.changes || 0
		}
	};
}

// 导出 getDB 供其他模块使用
export { getDB };