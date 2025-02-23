import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/lib/prisma"
import { createObjectCsvStringifier } from "csv-writer"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  let data
  switch (type) {
    case "users":
      data = await prisma.user.findMany({
        where: {
          createdAt: {
            gte: from ? new Date(from) : undefined,
            lte: to ? new Date(to) : undefined
          }
        }
      })
      break
    case "servers":
      data = await prisma.server.findMany({
        where: {
          createdAt: {
            gte: from ? new Date(from) : undefined,
            lte: to ? new Date(to) : undefined
          }
        }
      })
      break
    default:
      return new NextResponse("Invalid report type", { status: 400 })
  }

  const csvStringifier = createObjectCsvStringifier({
    header: Object.keys(data[0]).map(id => ({ id, title: id }))
  })

  const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(data)
  
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=${type}-report.csv`
    }
  })
} 