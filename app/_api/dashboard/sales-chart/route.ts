import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Get current year
    const currentYear = new Date().getFullYear()

    // Initialize arrays for months
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Initialize data arrays
    const revenueData = Array(12).fill(0)
    const invoiceCountData = Array(12).fill(0)

    // Get all invoices for current year
    const invoices = await prisma.invoice.findMany({
      where: {
        date: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
      select: {
        date: true,
        total: true,
        status: true,
      },
    })

    // Process invoice data
    invoices.forEach((invoice) => {
      const month = new Date(invoice.date).getMonth()

      // Count all invoices
      invoiceCountData[month]++

      // Sum revenue for paid and partially paid invoices
      if (invoice.status === "PAID" || invoice.status === "PARTIALLY_PAID") {
        revenueData[month] += invoice.total
      }
    })

    // Format data for chart
    const data = {
      labels: months,
      datasets: [
        {
          label: "Revenue",
          data: revenueData,
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
          yAxisID: "y",
        },
        {
          label: "Invoices",
          data: invoiceCountData,
          backgroundColor: "rgba(249, 115, 22, 0.5)",
          borderColor: "rgb(249, 115, 22)",
          borderWidth: 1,
          type: "line",
          yAxisID: "y1",
        },
      ],
    }

    // Chart options
    const options = {
      responsive: true,
      interaction: {
        mode: "index" as const,
        intersect: false,
      },
      scales: {
        y: {
          type: "linear" as const,
          display: true,
          position: "left" as const,
          title: {
            display: true,
            text: "Revenue (₹)",
          },
        },
        y1: {
          type: "linear" as const,
          display: true,
          position: "right" as const,
          grid: {
            drawOnChartArea: false,
          },
          title: {
            display: true,
            text: "Number of Invoices",
          },
        },
      },
    }

    return NextResponse.json({
      data,
      options,
    })
  } catch (error) {
    console.error("Error fetching sales chart data:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
