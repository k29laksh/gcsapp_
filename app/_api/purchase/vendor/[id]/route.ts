import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const vendor = await prisma.vendor.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!vendor) {
      return new NextResponse(JSON.stringify({ message: "Vendor not found" }), { status: 404 })
    }

    return NextResponse.json(vendor)
  } catch (error) {
    console.error("Error fetching vendor:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return new NextResponse(JSON.stringify({ message: "Insufficient permissions" }), { status: 403 })
    }

    const body = await req.json()

    const vendor = await prisma.vendor.update({
      where: {
        id: params.id,
      },
      data: body,
    })

    return NextResponse.json(vendor)
  } catch (error) {
    console.error("Error updating vendor:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return new NextResponse(JSON.stringify({ message: "Insufficient permissions" }), { status: 403 })
    }

    await prisma.vendor.delete({
      where: {
        id: params.id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting vendor:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
