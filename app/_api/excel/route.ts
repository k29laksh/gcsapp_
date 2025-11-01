import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateExcel, parseExcel } from "@/lib/pdf-generator"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return new NextResponse(JSON.stringify({ message: "No file provided" }), { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const data = await parseExcel(buffer)

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error parsing Excel:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get("type")
    const id = searchParams.get("id")

    if (!type || !id) {
      return new NextResponse(JSON.stringify({ message: "Missing type or id parameter" }), { status: 400 })
    }

    // Fetch data based on type and id
    let data: any[] = []

    switch (type) {
      case "customers":
        const customers = await prisma.customer.findMany({
          include: {
            billingAddress: true,
            shippingAddress: true,
          },
        })
        data = customers.map((customer) => ({
          ID: customer.id,
          Type: customer.customerType,
          FirstName: customer.firstName,
          LastName: customer.lastName,
          CompanyName: customer.companyName,
          Email: customer.email,
          Phone: customer.phone,
          BillingAddress: customer.billingAddress?.addressLine1,
          BillingCity: customer.billingAddress?.city,
          BillingState: customer.billingAddress?.state,
          BillingPostalCode: customer.billingAddress?.postalCode,
          BillingCountry: customer.billingAddress?.country,
        }))
        break
      // Add other types as needed
      default:
        return new NextResponse(JSON.stringify({ message: "Invalid type" }), { status: 400 })
    }

    // Generate Excel
    const excelBuffer = await generateExcel(data)

    // Return Excel as response
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${type}-${Date.now()}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error generating Excel:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
