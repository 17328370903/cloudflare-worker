import { NextResponse } from "next/server";

export async function GET() {
   return NextResponse.json({
    users: [],
    count: 0,
    source: 'mock_database'
   })
}