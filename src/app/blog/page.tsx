// 后端测试页面 - 演示如何操作数据库
import { getDB, initMockDB } from "@/lib/database";

export default async function Blog() {
	// 初始化模拟数据库（仅开发环境需要）
	initMockDB();
	
	// 获取数据库实例（自动检测环境）
	const db = getDB();
	
	let dbResult: string = '';
	let userCount: number = 0;

	try {
		// 示例1: 查询用户数量
		const countResult = await db.prepare("SELECT COUNT(*) as count FROM users").first();
		userCount = countResult?.count || 0;
		
		// 示例2: 插入测试用户（仅当用户数为0时插入）
		if (userCount === 0) {
			// 注意：实际密码应该加密，这里仅作为演示
			const insertResult = await db.prepare(
				"INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)"
			).bind('test@example.com', 'hashed_password_demo', '测试用户').run();
			
			if (insertResult.success) {
				dbResult = `成功插入测试用户，ID: ${insertResult.meta?.lastRowId}`;
			} else {
				dbResult = '插入失败';
			}
		} else {
			dbResult = `当前用户数: ${userCount}`;
		}
	} catch (error) {
		dbResult = `数据库操作失败: ${(error as Error).message}`;
	}

	return (
		<div className="p-8 max-w-2xl mx-auto">
			<h1 className="text-2xl font-bold mb-4">数据库操作测试</h1>
			<div className="bg-gray-50 rounded-lg p-6">
				<h2 className="text-lg font-semibold mb-2">操作结果</h2>
				<p className="text-gray-700">{dbResult}</p>
				<p className="text-gray-500 mt-2">用户总数: {userCount}</p>
			</div>
			
			<div className="mt-6 bg-blue-50 rounded-lg p-6">
				<h2 className="text-lg font-semibold mb-2">使用说明</h2>
				<ul className="text-gray-700 space-y-2">
					<li>• 使用 `getDB()` 获取数据库实例</li>
					<li>• 开发环境自动使用模拟数据库</li>
					<li>• 生产环境自动使用 Cloudflare D1 数据库</li>
				</ul>
			</div>

			<div className="mt-6 bg-green-50 rounded-lg p-6">
				<h2 className="text-lg font-semibold mb-2">核心代码示例</h2>
				<pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`// 导入数据库工具
import { getDB } from "@/lib/database";

// 获取数据库实例
const db = getDB();

// 查询用户数量
const result = await db.prepare(
    "SELECT COUNT(*) as count FROM users"
).first();

// 插入用户
const insertResult = await db.prepare(
    "INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)"
).bind(email, hashedPassword, nickname).run();`}
				</pre>
			</div>
		</div>
	);
}