import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get inquiry counts by status
    const inquiryCounts = await prisma.inquiry.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    })

    // Initialize stats
    let totalInquiries = 0
    let newInquiries = 0
    let inProgressInquiries = 0
    let convertedInquiries = 0
    let closedInquiries = 0

    // Process the grouped data
    inquiryCounts.forEach((group) => {
      const count = group._count.id
      totalInquiries += count

      switch (group.status) {
        case "NEW":
          newInquiries += count
          break
        case "IN_PROGRESS":
          inProgressInquiries += count
          break
        case "CONVERTED":
          convertedInquiries += count
          break
        case "CLOSED":
          closedInquiries += count
          break
      }
    })

    return NextResponse.json({
      totalInquiries,
      newInquiries,
      inProgressInquiries,
      convertedInquiries,
      closedInquiries,
    })
  } catch (error) {
    console.error("Error fetching inquiry stats:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
