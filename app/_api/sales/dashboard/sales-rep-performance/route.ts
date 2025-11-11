import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    const fromDate =
      url.searchParams.get("from") || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const toDate = url.searchParams.get("to") || new Date().toISOString()

    // Get all sales reps (employees with sales roles)
    const salesReps = await prisma.employee.findMany({
      where: {
        position: {
          contains: "Sales",
        },
      },
      include: {
        user: true,
      },
    })

    // Get performance data for each sales rep
    const salesRepPerformance = await Promise.all(
      salesReps.map(async (rep) => {
        // Get invoices assigned to this sales rep
        const invoices = await prisma.invoice.findMany({
          where: {
            salesRepId: rep.id,
            date: {
              gte: new Date(fromDate),
              lte: new Date(toDate),
            },
          },
        })

        // Get quotations assigned to this sales rep
        const quotations = await prisma.quotation.findMany({
          where: {
            salesRepId: rep.id,
            date: {
              gte: new Date(fromDate),
              lte: new Date(toDate),
            },
          },
        })

        // Calculate metrics
        const revenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0)
        const deals = invoices.length

        // Calculate conversion rate (invoices / quotations)
        const totalQuotations = quotations.length
        const conversionRate = totalQuotations > 0 ? Math.round((deals / totalQuotations) * 100) : 0

        // Calculate average deal size
        const avgDealSize = deals > 0 ? Math.round(revenue / deals) : 0

        // Calculate commission (assuming 5% commission rate for this example)
        const commissionRate = 0.05
        const commission = Math.round(revenue * commissionRate)

        return {
          id: rep.id,
          name: `${rep.firstName} ${rep.lastName}`,
          revenue,
          deals,
          conversionRate,
          avgDealSize,
          commission,
        }
      }),
    )

    // Sort by revenue (highest first)
    salesRepPerformance.sort((a, b) => b.revenue - a.revenue)

    return NextResponse.json(salesRepPerformance)
  } catch (error) {
    console.error("Error fetching sales rep performance:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
