import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    }

    // Check if user has admin role
    if (session.user.role !== "ADMIN") {
      return new NextResponse(JSON.stringify({ message: "Forbidden" }), { status: 403 })
    }

    const formData = await req.formData()
    const headerImage = formData.get("headerImage") as File | null
    const footerImage = formData.get("footerImage") as File | null

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const companyProfile = await prisma.companyProfile.findFirst()
    const companyProfileData: any = {}

    // Process header image
    if (headerImage) {
      const headerImageExt = headerImage.name.split(".").pop()
      const headerImageFilename = `company-header-${uuidv4()}.${headerImageExt}`
      const headerImagePath = path.join(uploadsDir, headerImageFilename)

      const headerImageBuffer = Buffer.from(await headerImage.arrayBuffer())
      fs.writeFileSync(headerImagePath, headerImageBuffer)

      companyProfileData.headerImageUrl = `/uploads/${headerImageFilename}`
    }

    // Process footer image
    if (footerImage) {
      const footerImageExt = footerImage.name.split(".").pop()
      const footerImageFilename = `company-footer-${uuidv4()}.${footerImageExt}`
      const footerImagePath = path.join(uploadsDir, footerImageFilename)

      const footerImageBuffer = Buffer.from(await footerImage.arrayBuffer())
      fs.writeFileSync(footerImagePath, footerImageBuffer)

      companyProfileData.footerImageUrl = `/uploads/${footerImageFilename}`
    }

    // Update company profile with image URLs
    if (Object.keys(companyProfileData).length > 0) {
      if (companyProfile) {
        await prisma.companyProfile.update({
          where: { id: companyProfile.id },
          data: companyProfileData,
        })
      } else {
        await prisma.companyProfile.create({
          data: {
            ...companyProfileData,
            name: "GLOBAL CONSULTANCY SERVICES",
          },
        })
      }
    }

    return NextResponse.json({
      message: "Company images uploaded successfully",
      headerImageUrl: companyProfileData.headerImageUrl,
      footerImageUrl: companyProfileData.footerImageUrl,
    })
  } catch (error) {
    console.error("Error uploading company images:", error)
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })
  }
}
