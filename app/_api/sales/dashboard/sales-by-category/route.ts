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

    // Get all invoice items in the date range
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          date: {
            gte: new Date(fromDate),
            lte: new Date(toDate),
          },
        },
      },
      include: {
        product: true,
      },
    })

    // Group by product category
    const categoryMap = new Map()

    invoiceItems.forEach((item) => {
      const category = item.product?.category || "Uncategorized"
      const total = item.total || item.quantity * item.unitPrice

      if (categoryMap.has(category)) {
        categoryMap.set(category, categoryMap.get(category) + total)
      } else {
        categoryMap.set(category, total)
      }
    })

    // Convert to array format for chart
    const salesByCategory = Array.from(categoryMap, ([name, value]) => ({ name, value }))

    return NextResponse.json(salesByCategory)
  } catch (error) {
    console.error("Error fetching sales by category:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
