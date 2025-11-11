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

    // Check if user has permission to view sales metrics
    if (!session.user.permissions?.includes("VIEW_SALES_REPORTS") && session.user.role !== "ADMIN") {
      return new NextResponse(JSON.stringify({ message: "Insufficient permissions" }), { status: 403 })
    }

    const url = new URL(req.url)
    const fromDate =
      url.searchParams.get("from") || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const toDate = url.searchParams.get("to") || new Date().toISOString()

    // Get previous period for comparison
    const currentFrom = new Date(fromDate)
    const currentTo = new Date(toDate)
    const daysDiff = Math.ceil((currentTo.getTime() - currentFrom.getTime()) / (1000 * 60 * 60 * 24))

    const previousFrom = new Date(currentFrom)
    previousFrom.setDate(previousFrom.getDate() - daysDiff)
    const previousTo = new Date(currentFrom)
    previousTo.setDate(previousTo.getDate() - 1)

    // Current period metrics
    const [currentInvoices, currentCustomers, overdueInvoices] = await Promise.all([
      // Get all invoices in current period
      prisma.invoice.findMany({
        where: {
          date: {
            gte: new Date(fromDate),
            lte: new Date(toDate),
          },
        },
        include: {
          items: true,
          customer: true,
        },
      }),

      // Get new customers in current period
      prisma.customer.count({
        where: {
          createdAt: {
            gte: new Date(fromDate),
            lte: new Date(toDate),
          },
        },
      }),

      // Get overdue invoices
      prisma.invoice.count({
        where: {
          dueDate: {
            lt: new Date(),
          },
          status: {
            in: ["SENT", "PARTIALLY_PAID", "OVERDUE"],
          },
        },
      }),
    ])

    // Previous period metrics
    const previousInvoices = await prisma.invoice.findMany({
      where: {
        date: {
          gte: previousFrom,
          lte: previousTo,
        },
      },
      include: {
        items: true,
      },
    })

    // Calculate current period metrics
    const totalRevenue = currentInvoices.reduce((sum, invoice) => sum + invoice.total, 0)
    const totalCost = currentInvoices.reduce((sum, invoice) => {
      return (
        sum +
        invoice.items.reduce((itemSum, item) => {
          // Assuming cost is 60% of price for this example
          const estimatedCost = item.unitPrice * 0.6 * item.quantity
          return itemSum + estimatedCost
        }, 0)
      )
    }, 0)

    const grossProfit = totalRevenue - totalCost
    const profitMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0

    const taxCollected = currentInvoices.reduce((sum, invoice) => sum + invoice.tax, 0)

    const avgDealSize = currentInvoices.length > 0 ? totalRevenue / currentInvoices.length : 0

    // Calculate previous period metrics for comparison
    const previousRevenue = previousInvoices.reduce((sum, invoice) => sum + invoice.total, 0)
    const previousCost = previousInvoices.reduce((sum, invoice) => {
      return (
        sum +
        invoice.items.reduce((itemSum, item) => {
          const estimatedCost = item.unitPrice * 0.6 * item.quantity
          return itemSum + estimatedCost
        }, 0)
      )
    }, 0)

    const previousProfit = previousRevenue - previousCost
    const previousMargin = previousRevenue > 0 ? (previousProfit / previousRevenue) * 100 : 0
    const previousTax = previousInvoices.reduce((sum, invoice) => sum + invoice.tax, 0)
    const previousDealSize = previousInvoices.length > 0 ? previousRevenue / previousInvoices.length : 0

    // Calculate percentage changes
    const revenueChange =
      previousRevenue > 0 ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100) : 100

    const profitChange = previousProfit > 0 ? Math.round(((grossProfit - previousProfit) / previousProfit) * 100) : 100

    const marginChange = previousMargin > 0 ? Math.round(profitMargin - previousMargin) : profitMargin

    const taxChange = previousTax > 0 ? Math.round(((taxCollected - previousTax) / previousTax) * 100) : 100

    const dealSizeChange =
      previousDealSize > 0 ? Math.round(((avgDealSize - previousDealSize) / previousDealSize) * 100) : 100

    // Get previous period customer count for comparison
    const previousCustomers = await prisma.customer.count({
      where: {
        createdAt: {
          gte: previousFrom,
          lte: previousTo,
        },
      },
    })

    const customerChange =
      previousCustomers > 0 ? Math.round(((currentCustomers - previousCustomers) / previousCustomers) * 100) : 100

    // Get previous period overdue invoices for comparison
    const previousOverdue = await prisma.invoice.count({
      where: {
        dueDate: {
          lt: previousTo,
        },
        status: {
          in: ["SENT", "PARTIALLY_PAID", "OVERDUE"],
        },
      },
    })

    const overdueChange =
      previousOverdue > 0
        ? Math.round(((overdueInvoices - previousOverdue) / previousOverdue) * 100)
        : overdueInvoices > 0
          ? 100
          : 0

    // Calculate average sales cycle (days from quotation to invoice)
    const salesCycleData = await prisma.invoice.findMany({
      where: {
        date: {
          gte: new Date(fromDate),
          lte: new Date(toDate),
        },
        quotation: {
          isNot: null,
        },
      },
      include: {
        quotation: {
          select: {
            date: true,
          },
        },
      },
    })

    let totalDays = 0
    salesCycleData.forEach((invoice) => {
      if (invoice.quotation?.date) {
        const quotationDate = new Date(invoice.quotation.date)
        const invoiceDate = new Date(invoice.date)
        const days = Math.ceil((invoiceDate.getTime() - quotationDate.getTime()) / (1000 * 60 * 60 * 24))
        totalDays += days
      }
    })

    const salesCycle = salesCycleData.length > 0 ? Math.round(totalDays / salesCycleData.length) : 0

    // Get previous period sales cycle for comparison
    const previousSalesCycleData = await prisma.invoice.findMany({
      where: {
        date: {
          gte: previousFrom,
          lte: previousTo,
        },
        quotation: {
          isNot: null,
        },
      },
      include: {
        quotation: {
          select: {
            date: true,
          },
        },
      },
    })

    let previousTotalDays = 0
    previousSalesCycleData.forEach((invoice) => {
      if (invoice.quotation?.date) {
        const quotationDate = new Date(invoice.quotation.date)
        const invoiceDate = new Date(invoice.date)
        const days = Math.ceil((invoiceDate.getTime() - quotationDate.getTime()) / (1000 * 60 * 60 * 24))
        previousTotalDays += days
      }
    })

    const previousSalesCycle =
      previousSalesCycleData.length > 0 ? Math.round(previousTotalDays / previousSalesCycleData.length) : 0

    const cycleChange =
      previousSalesCycle > 0
        ? -Math.round(((salesCycle - previousSalesCycle) / previousSalesCycle) * 100) // Negative because shorter is better
        : 0

    return NextResponse.json({
      totalRevenue,
      grossProfit,
      profitMargin,
      newCustomers: currentCustomers,
      avgDealSize,
      taxCollected,
      overdueInvoices,
      salesCycle,
      revenueChange,
      profitChange,
      marginChange,
      customerChange,
      dealSizeChange,
      taxChange,
      overdueChange,
      cycleChange,
    })
  } catch (error) {
    console.error("Error fetching sales metrics:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
