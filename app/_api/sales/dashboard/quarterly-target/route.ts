import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfQuarter, endOfQuarter } from "date-fns"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Check if user has permission to view sales targets
    if (!session.user.permissions?.includes("VIEW_SALES_TARGETS") && session.user.role !== "ADMIN") {
      return new NextResponse(JSON.stringify({ message: "Insufficient permissions" }), { status: 403 })
    }

    // Get current quarter dates
    const today = new Date()
    const quarterStart = startOfQuarter(today)
    const quarterEnd = endOfQuarter(today)

    // Get quarterly target from revenue forecast
    const quarterlyTarget = await prisma.revenueForecast.findFirst({
      where: {
        period: "QUARTER",
        date: {
          gte: quarterStart,
          lte: quarterEnd,
        },
      },
    })

    // Get actual revenue for the current quarter
    const invoices = await prisma.invoice.findMany({
      where: {
        date: {
          gte: quarterStart,
          lte: today,
        },
      },
      select: {
        total: true,
      },
    })

    const currentRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0)

    // Use default target if none is set
    const targetAmount = quarterlyTarget?.amount || 500000

    return NextResponse.json({
      current: currentRevenue,
      target: targetAmount,
    })
  } catch (error) {
    console.error("Error fetching quarterly target:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
