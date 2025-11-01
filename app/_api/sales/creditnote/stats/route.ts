import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalCreditNotes, thisMonthCreditNotes, totalAmountResult, thisMonthAmountResult] = await Promise.all([
      prisma.creditNote.count(),
      prisma.creditNote.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),
      prisma.creditNote.aggregate({
        _sum: {
          amount: true,
        },
      }),
      prisma.creditNote.aggregate({
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
      totalCreditNotes,
      thisMonthCreditNotes,
      totalAmount: totalAmountResult._sum.amount || 0,
      thisMonthAmount: thisMonthAmountResult._sum.amount || 0,
    })
  } catch (error) {
    console.error("Error fetching credit note stats:", error)
    return NextResponse.json({ error: "Failed to fetch credit note stats" }, { status: 500 })
  }
}
