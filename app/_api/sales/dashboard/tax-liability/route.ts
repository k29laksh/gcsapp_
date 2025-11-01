import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Check if user has permission to view financial data
    if (!session.user.permissions?.includes("VIEW_FINANCIAL_DATA") && session.user.role !== "ADMIN") {
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

    // Calculate tax collected for each month
    const taxLiability = await Promise.all(
      months.map(async (month) => {
        const invoices = await prisma.invoice.findMany({
          where: {
            date: {
              gte: month.start,
              lte: month.end,
            },
          },
          select: {
            tax: true,
          },
        })

        const taxAmount = invoices.reduce((sum, invoice) => sum + invoice.tax, 0)

        return {
          month: month.month,
          taxAmount,
        }
      }),
    )

    return NextResponse.json(taxLiability)
  } catch (error) {
    console.error("Error fetching tax liability:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
