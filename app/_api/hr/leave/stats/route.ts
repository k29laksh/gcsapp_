import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Mock stats data
    const stats = {
      totalRequests: 15,
      pendingRequests: 5,
      approvedRequests: 8,
      rejectedRequests: 2,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching leave stats:", error)
    return NextResponse.json({ message: "Failed to fetch leave statistics" }, { status: 500 })
  }
}
