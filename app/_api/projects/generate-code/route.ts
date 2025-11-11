import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const currentYear = new Date().getFullYear()
    const prefix = `PRJ-${currentYear}-`

    // Find the last project code for the current year
    const lastProject = await prisma.project.findFirst({
      where: {
        projectCode: {
          startsWith: prefix,
        },
      },
      orderBy: {
        projectCode: "desc",
      },
    })

    let nextNumber = 1
    if (lastProject) {
      const lastNumber = Number.parseInt(lastProject.projectCode.split("-")[2])
      nextNumber = lastNumber + 1
    }

    const projectCode = `${prefix}${nextNumber.toString().padStart(4, "0")}`

    return NextResponse.json({ projectCode })
  } catch (error) {
    console.error("Error generating project code:", error)
    return NextResponse.json({ message: "Failed to generate project code" }, { status: 500 })
  }
}
