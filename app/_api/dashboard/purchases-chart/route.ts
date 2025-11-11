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
    const purchaseOrderData = Array(12).fill(0)
    const expensesData = Array(12).fill(0)

    // Get all purchase orders for current year
    const purchaseOrders = await prisma.pO.findMany({
      where: {
        date: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
      select: {
        date: true,
        total: true,
      },
    })

    // Get all expenses for current year
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
      select: {
        date: true,
        amount: true,
      },
    })

    // Process purchase order data
    purchaseOrders.forEach((po) => {
      const month = new Date(po.date).getMonth()
      purchaseOrderData[month] += po.total
    })

    // Process expense data
    expenses.forEach((expense) => {
      const month = new Date(expense.date).getMonth()
      expensesData[month] += expense.amount
    })

    // Format data for chart
    const data = {
      labels: months,
      datasets: [
        {
          label: "Purchase Orders",
          data: purchaseOrderData,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Other Expenses",
          data: expensesData,
          borderColor: "rgb(249, 115, 22)",
          backgroundColor: "rgba(249, 115, 22, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    }

    // Chart options
    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: "top" as const,
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              let label = context.dataset.label || ""
              if (label) {
                label += ": "
              }
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                }).format(context.parsed.y)
              }
              return label
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Amount (₹)",
          },
        },
      },
    }

    return NextResponse.json({
      data,
      options,
    })
  } catch (error) {
    console.error("Error fetching purchases chart data:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
