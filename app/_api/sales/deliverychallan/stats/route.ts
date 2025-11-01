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

    const [totalChallans, thisMonthChallans, pendingChallans, deliveredChallans] = await Promise.all([
      prisma.deliveryChallan.count(),
      prisma.deliveryChallan.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),
      prisma.deliveryChallan.count({
        where: {
          status: "PENDING",
        },
      }),
      prisma.deliveryChallan.count({
        where: {
          status: "DELIVERED",
        },
      }),
    ])

    return NextResponse.json({
      totalChallans,
      thisMonthChallans,
      pendingChallans,
      deliveredChallans,
    })
  } catch (error) {
    console.error("Error fetching delivery challan stats:", error)
    return NextResponse.json({ error: "Failed to fetch delivery challan stats" }, { status: 500 })
  }
}
