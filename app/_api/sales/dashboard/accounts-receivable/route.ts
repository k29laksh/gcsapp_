import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { differenceInDays } from "date-fns"

export const dynamic = "force-dynamic"

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

    // Get all unpaid or partially paid invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: ["SENT", "PARTIALLY_PAID", "OVERDUE"],
        },
      },
      include: {
        customer: true,
        payments: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    })

    const today = new Date()

    // Calculate remaining amount and days overdue for each invoice
    const accountsReceivable = invoices.map((invoice) => {
      const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0)
      const remainingAmount = invoice.total - totalPaid

      const dueDate = new Date(invoice.dueDate)
      const daysOverdue = dueDate < today ? differenceInDays(today, dueDate) : 0

      // Determine status
      let status = invoice.status
      if (daysOverdue > 0 && status !== "PARTIALLY_PAID") {
        status = "OVERDUE"
      }

      return {
        id: invoice.id,
        customer: invoice.customer.companyName || `${invoice.customer.firstName} ${invoice.customer.lastName}`,
        invoiceNumber: invoice.invoiceNumber,
        amount: remainingAmount,
        dueDate: invoice.dueDate,
        status,
        daysOverdue,
      }
    })

    return NextResponse.json(accountsReceivable)
  } catch (error) {
    console.error("Error fetching accounts receivable:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
