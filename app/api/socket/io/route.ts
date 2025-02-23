// このファイルは削除して、server/socket.tsのみを使用することを推奨

import { NextResponse } from "next/server"

export async function GET() {
  return new NextResponse("Socket server is handled by server/socket.ts")
}

export { GET as POST }