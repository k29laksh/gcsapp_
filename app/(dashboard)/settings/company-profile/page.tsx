import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { ImageIcon, Pencil } from "lucide-react"

export default async function CompanyProfilePage() {
  const companyProfile = await prisma.companyProfile.findFirst()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Company Profile</h2>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/settings/company-profile/edit">
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/settings/company-profile/images">
              <ImageIcon className="mr-2 h-4 w-4" />
              Manage Images
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Basic information about your company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Company Name</h3>
              <p>{companyProfile?.name || "GLOBAL CONSULTANCY SERVICES"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
              <p>{companyProfile?.address || "016, Loha Bhavan 93, P D'Mello Road, Carnac Bunder"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">City</h3>
                <p>{companyProfile?.city || "Mumbai"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">State</h3>
                <p>{companyProfile?.state || "Maharashtra"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Postal Code</h3>
                <p>{companyProfile?.postalCode || "400 009"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Country</h3>
                <p>{companyProfile?.country || "India"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Contact details for your company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
              <p>{companyProfile?.email || "admin@globalconsultancyservices.net"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
              <p>{companyProfile?.phone || "+919869990250"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Website</h3>
              <p>{companyProfile?.website || "www.globalconsultancyservices.net"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax & Registration Information</CardTitle>
            <CardDescription>Tax and legal registration details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">GST Number</h3>
              <p>{companyProfile?.gstNumber || "27AINPA9487A1Z4"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">PAN Number</h3>
              <p>{companyProfile?.panNumber || "AINPA9487A"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">MSME Number</h3>
              <p>{companyProfile?.msmeNumber || "UDYAM-MH-19-0015824"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bank Information</CardTitle>
            <CardDescription>Banking details for your company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Bank Name</h3>
              <p>{companyProfile?.bankName || "ICICI BANK LTD."}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Branch Name</h3>
              <p>{companyProfile?.branchName || "VIKHROLI (EAST)"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">IFSC Code</h3>
              <p>{companyProfile?.ifscCode || "ICIC0001249"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Account Number</h3>
              <p>
                {companyProfile?.accountNumber ? "•••• •••• " + companyProfile.accountNumber.slice(-4) : "••••••••••"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Document Images</CardTitle>
            <CardDescription>Images used in quotations, invoices, and other documents</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Header Image</h3>
              {companyProfile?.headerImageUrl ? (
                <div className="relative h-24 w-full overflow-hidden rounded-md border">
                  <img
                    src={companyProfile.headerImageUrl || "/placeholder.svg"}
                    alt="Company Header"
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center rounded-md border border-dashed">
                  <p className="text-sm text-muted-foreground">No header image uploaded</p>
                </div>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Footer Image</h3>
              {companyProfile?.footerImageUrl ? (
                <div className="relative h-24 w-full overflow-hidden rounded-md border">
                  <img
                    src={companyProfile.footerImageUrl || "/placeholder.svg"}
                    alt="Company Footer"
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center rounded-md border border-dashed">
                  <p className="text-sm text-muted-foreground">No footer image uploaded</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/settings/company-profile/images">Manage Document Images</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
