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

    const vendors = await prisma.vendor.findMany()

    return NextResponse.json(vendors)
  } catch (error) {
    console.error("Error fetching vendors:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const body = await req.json()

    // Validate required fields
    if (!body.name) {
      return new NextResponse(JSON.stringify({ message: "Missing required field: name is required" }), { status: 400 })
    }

    try {
      const vendor = await prisma.vendor.create({
        data: {
          name: body.name,
          contactName: body.contactName || "",
          email: body.email || "",
          phone: body.phone || "",
          address: body.address || "",
          city: body.city || "",
          state: body.state || "",
          postalCode: body.postalCode || "",
          country: body.country || "",
          notes: body.notes || "",
        },
      })

      return NextResponse.json(vendor)
    } catch (createError) {
      console.error("Error creating vendor:", createError)
      return new NextResponse(
        JSON.stringify({ message: "Failed to create vendor in database. Please check your database connection." }),
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in vendor creation:", error)
    return new NextResponse(JSON.stringify({ message: "Internal server error. Please try again later." }), {
      status: 500,
    })
  }
}
