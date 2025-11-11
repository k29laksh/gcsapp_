import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const { type } = await req.json()

    const currentYear = new Date().getFullYear()
    let prefix = ""
    let model = ""

    switch (type) {
      case "po":
        prefix = `PO-${currentYear}-`
        model = "pO"
        break
      case "bill":
        prefix = `BILL-${currentYear}-`
        model = "bill"
        break
      case "expense":
        prefix = `EXP-${currentYear}-`
        model = "expense"
        break
      default:
        return new NextResponse(JSON.stringify({ message: "Invalid type" }), { status: 400 })
    }

    // Get the last record for this type
    const lastRecord = await (prisma as any)[model].findFirst({
      where: {
        [type === "po" ? "poNumber" : type === "bill" ? "billNumber" : "reference"]: {
          startsWith: prefix,
        },
      },
      orderBy: {
        [type === "po" ? "poNumber" : type === "bill" ? "billNumber" : "reference"]: "desc",
      },
    })

    let nextNumber = 1
    if (lastRecord) {
      const fieldName = type === "po" ? "poNumber" : type === "bill" ? "billNumber" : "reference"
      const lastNumber = Number.parseInt(lastRecord[fieldName].split("-")[2])
      nextNumber = lastNumber + 1
    }

    const generatedNumber = `${prefix}${nextNumber.toString().padStart(4, "0")}`

    return NextResponse.json({ number: generatedNumber })
  } catch (error) {
    console.error("Error generating number:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
