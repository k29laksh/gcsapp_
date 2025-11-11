import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Get the latest quotation number
    const latestQuotation = await prisma.quotation.findFirst({
      orderBy: {
        quotationNumber: "desc",
      },
      select: {
        quotationNumber: true,
      },
    })

    let nextNumber = 1
    if (latestQuotation?.quotationNumber) {
      // Extract number from quotation number (assuming format like QTN-0001)
      const match = latestQuotation.quotationNumber.match(/(\d+)$/)
      if (match) {
        nextNumber = Number.parseInt(match[1]) + 1
      }
    }

    // Generate new quotation number
    const quotationNumber = `QTN-${nextNumber.toString().padStart(4, "0")}`

    return NextResponse.json({ number: quotationNumber })
  } catch (error) {
    console.error("Error generating quotation number:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
