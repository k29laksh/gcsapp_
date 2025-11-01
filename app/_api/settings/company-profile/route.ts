import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Get the first company profile (there should only be one)
    const companyProfile = await prisma.companyProfile.findFirst()

    return NextResponse.json(companyProfile)
  } catch (error) {
    console.error("Error fetching company profile:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const data = await req.json()

    // Check if a company profile already exists
    const existingProfile = await prisma.companyProfile.findFirst()

    if (existingProfile) {
      return new NextResponse(JSON.stringify({ message: "Company profile already exists. Use PUT to update." }), {
        status: 400,
      })
    }

    // Create new company profile
    const companyProfile = await prisma.companyProfile.create({
      data,
    })

    return NextResponse.json(companyProfile)
  } catch (error) {
    console.error("Error creating company profile:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    const data = await req.json()
    const { id, ...updateData } = data

    if (!id) {
      return new NextResponse(JSON.stringify({ message: "ID is required for update" }), { status: 400 })
    }

    // Update company profile
    const companyProfile = await prisma.companyProfile.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(companyProfile)
  } catch (error) {
    console.error("Error updating company profile:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
