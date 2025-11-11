import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalPayments, thisMonthPayments, totalAmountResult, thisMonthAmountResult] = await Promise.all([
      prisma.customerPayment.count(),
      prisma.customerPayment.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),
      prisma.customerPayment.aggregate({
        _sum: {
          amount: true,
        },
      }),
      prisma.customerPayment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),
    ])

    return NextResponse.json({
      totalPayments,
      thisMonthPayments,
      totalAmount: totalAmountResult._sum.amount || 0,
      thisMonthAmount: thisMonthAmountResult._sum.amount || 0,
    })
  } catch (error) {
    console.error("Error fetching payment stats:", error)
    return NextResponse.json({ error: "Failed to fetch payment stats" }, { status: 500 })
  }
}
