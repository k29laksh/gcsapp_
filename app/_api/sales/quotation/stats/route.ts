import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get all quotations
    const quotations = await prisma.quotation.findMany({
      select: {
        status: true,
        total: true,
      },
    })

    // Calculate stats
    const stats = {
      totalQuotations: quotations.length,
      draftQuotations: quotations.filter((q) => q.status === "DRAFT").length,
      sentQuotations: quotations.filter((q) => q.status === "SENT").length,
      acceptedQuotations: quotations.filter((q) => q.status === "ACCEPTED").length,
      rejectedQuotations: quotations.filter((q) => q.status === "REJECTED").length,
      expiredQuotations: quotations.filter((q) => q.status === "EXPIRED").length,
      totalValue: quotations.reduce((sum, q) => sum + (Number(q.total) || 0), 0),
      acceptedValue: quotations
        .filter((q) => q.status === "ACCEPTED")
        .reduce((sum, q) => sum + (Number(q.total) || 0), 0),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching quotation stats:", error)
    return NextResponse.json({ message: "Failed to fetch stats" }, { status: 500 })
  }
}
