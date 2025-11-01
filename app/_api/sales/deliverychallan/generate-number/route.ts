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

    const currentYear = new Date().getFullYear()
    const prefix = `DC${currentYear}`

    const lastChallan = await prisma.deliveryChallan.findFirst({
      where: {
        challanNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        challanNumber: "desc",
      },
    })

    let nextNumber = 1
    if (lastChallan) {
      const lastNumber = Number.parseInt(lastChallan.challanNumber.replace(prefix, ""))
      nextNumber = lastNumber + 1
    }

    const challanNumber = `${prefix}${nextNumber.toString().padStart(4, "0")}`

    return NextResponse.json({ challanNumber })
  } catch (error) {
    console.error("Error generating delivery challan number:", error)
    return NextResponse.json({ error: "Failed to generate delivery challan number" }, { status: 500 })
  }
}
