import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";

export async function GET() {
    const db = getDB();
    
    try {
        // 查询所有用户
        const results = await db.prepare("SELECT * FROM users").run();
        
        // 如果是模拟数据库，直接返回内存中的数据
        const mockUsers = globalThis['__mock_users__'] || [];
        
        return NextResponse.json({
            users: mockUsers,
            count: mockUsers.length,
            source: 'mock_database'
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 });
    }
}