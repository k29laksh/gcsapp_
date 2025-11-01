import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const latestInquiry = await prisma.salesInquiry.findFirst({
      orderBy: {
        inquiryNumber: "desc",
      },
    });

    let newInquiryNumber = 1;

    if (latestInquiry) {
      newInquiryNumber = latestInquiry.inquiryNumber + 1;
    }

    return NextResponse.json({ inquiryNumber: newInquiryNumber });
  } catch (error) {
    console.error("Error generating inquiry number:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
