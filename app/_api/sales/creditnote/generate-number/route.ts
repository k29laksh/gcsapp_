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
    const prefix = `CN${currentYear}`

    const lastCreditNote = await prisma.creditNote.findFirst({
      where: {
        creditNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        creditNumber: "desc",
      },
    })

    let nextNumber = 1
    if (lastCreditNote) {
      const lastNumber = Number.parseInt(lastCreditNote.creditNumber.replace(prefix, ""))
      nextNumber = lastNumber + 1
    }

    const creditNumber = `${prefix}${nextNumber.toString().padStart(4, "0")}`

    return NextResponse.json({ creditNumber })
  } catch (error) {
    console.error("Error generating credit note number:", error)
    return NextResponse.json({ error: "Failed to generate credit note number" }, { status: 500 })
  }
}
