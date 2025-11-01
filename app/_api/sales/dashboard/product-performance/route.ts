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

    // Get all products with their invoice items in the date range
    const products = await prisma.product.findMany({
      include: {
        invoiceItems: {
          where: {
            invoice: {
              date: {
                gte: new Date(fromDate),
                lte: new Date(toDate),
              },
            },
          },
        },
      },
    })

    // Calculate performance metrics for each product
    const productPerformance = products.map((product) => {
      const totalQuantity = product.invoiceItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalRevenue = product.invoiceItems.reduce((sum, item) => {
        return sum + (item.total || item.quantity * item.unitPrice)
      }, 0)

      // Estimate cost and profit (assuming cost is 60% of price for this example)
      const estimatedCost = product.invoiceItems.reduce((sum, item) => {
        return sum + item.unitPrice * 0.6 * item.quantity
      }, 0)

      const profit = totalRevenue - estimatedCost
      const profitMargin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0

      return {
        id: product.id,
        productName: product.name,
        revenue: Math.round(totalRevenue * 100) / 100,
        quantity: totalQuantity,
        profit: Math.round(profit * 100) / 100,
        profitMargin,
      }
    })

    // Filter out products with no sales and sort by revenue
    const filteredPerformance = productPerformance
      .filter((product) => product.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)

    return NextResponse.json(filteredPerformance)
  } catch (error) {
    console.error("Error fetching product performance:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
