import {NextResponse} from "next/server"


export async function GET(request) {
    return NextResponse.json({
        code: 100,
        msg: "success"
    })
}