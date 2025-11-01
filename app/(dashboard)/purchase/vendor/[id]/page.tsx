"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, Pencil } from "lucide-react"

export default function VendorDetailPage() {
  const [vendor, setVendor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/purchase/vendor/${params.id}`)

        if (!response.ok) throw new Error("Failed to fetch vendor")

        const data = await response.json()
        setVendor(data)
      } catch (error) {
        console.error("Error fetching vendor:", error)
        toast({
          title: "Error",
          description: "Failed to load vendor",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchVendor()
  }, [params.id, toast])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading vendor data...</p>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return <div>Vendor not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button asChild>
          <Link href={`/purchase/vendor/${vendor.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{vendor.name}</CardTitle>
          <CardDescription>Vendor Details</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Contact Person</h3>
                  <p>{vendor.contactName || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p>{vendor.email || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                  <p>{vendor.phone || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                  <p>{vendor.notes || "No notes available"}</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="address" className="space-y-4 pt-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                <p>{vendor.address || "N/A"}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">City</h3>
                  <p>{vendor.city || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">State/Province</h3>
                  <p>{vendor.state || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Postal Code</h3>
                  <p>{vendor.postalCode || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Country</h3>
                  <p>{vendor.country || "N/A"}</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="transactions" className="pt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Recent Purchase Orders</h3>
                  <p className="text-muted-foreground">No purchase orders found</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Recent Payments</h3>
                  <p className="text-muted-foreground">No payments found</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Recent Expenses</h3>
                  <p className="text-muted-foreground">No expenses found</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
