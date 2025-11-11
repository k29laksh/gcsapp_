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

    // Get current date to determine financial year
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1 // JavaScript months are 0-indexed
    const currentYear = currentDate.getFullYear()

    // Financial year in India runs from April 1 to March 31
    let financialYearStart: number
    let financialYearEnd: number

    if (currentMonth >= 4) {
      // April to December - current financial year
      financialYearStart = currentYear
      financialYearEnd = currentYear + 1
    } else {
      // January to March - previous financial year
      financialYearStart = currentYear - 1
      financialYearEnd = currentYear
    }

    const financialYear = `${financialYearStart.toString().slice(-2)}-${financialYearEnd.toString().slice(-2)}`

    // Get the latest invoice number for the current financial year
    const latestInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          contains: `GCS29/`,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        invoiceNumber: true,
      },
    })

    let nextNumber = 1
    if (latestInvoice?.invoiceNumber) {
      // Extract number from invoice number (format: GCS29/001/25-26)
      const match = latestInvoice.invoiceNumber.match(/GCS29\/(\d+)\//)
      if (match) {
        nextNumber = Number.parseInt(match[1]) + 1
      }
    }

    // Generate new invoice number with format: GCS29/001/25-26
    const invoiceNumber = `GCS29/${nextNumber.toString().padStart(3, "0")}/${financialYear}`

    return NextResponse.json({ invoiceNumber })
  } catch (error) {
    console.error("Error generating invoice number:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
