import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Check if user has permission to view sales reports
    if (!session.user.permissions?.includes("VIEW_SALES_REPORTS") && session.user.role !== "ADMIN") {
      return new NextResponse(JSON.stringify({ message: "Insufficient permissions" }), { status: 403 })
    }

    const url = new URL(req.url)
    const fromParam = url.searchParams.get("from")
    const toParam = url.searchParams.get("to")

    // Default to last 12 months if no dates provided
    const endDate = toParam ? new Date(toParam) : new Date()
    const startDate = fromParam ? new Date(fromParam) : subMonths(endDate, 11)

    // Generate array of months between start and end date
    const months = []
    let currentDate = startOfMonth(startDate)
    const lastDate = endOfMonth(endDate)

    while (currentDate <= lastDate) {
      months.push({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
        month: format(currentDate, "MMM yyyy"),
      })
      currentDate = startOfMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    // Get revenue targets
    const targets = await prisma.revenueForecast.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // Calculate revenue for each month
    const revenueData = await Promise.all(
      months.map(async (month) => {
        const invoices = await prisma.invoice.findMany({
          where: {
            date: {
              gte: month.start,
              lte: month.end,
            },
          },
          select: {
            total: true,
          },
        })

        const revenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0)

        // Find target for this month
        const monthTarget = targets.find((t) => {
          const targetDate = new Date(t.date)
          return (
            targetDate.getMonth() === month.start.getMonth() && targetDate.getFullYear() === month.start.getFullYear()
          )
        })

        return {
          month: month.month,
          revenue,
          target: monthTarget?.amount || 0,
        }
      }),
    )

    return NextResponse.json(revenueData)
  } catch (error) {
    console.error("Error fetching revenue trend:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
