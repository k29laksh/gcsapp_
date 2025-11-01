"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Edit, Send, Eye, ArrowLeft, FileText, Calendar, User, Building, MapPin, Clock } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useGetSingleQuotationQuery, useUpdateQuotationMutation } from "@/redux/Service/quotation"

interface QuotationItem {
  id: string
  description: string
  quantity: number
  unit_price: string
  tax_percent: string
  total: string
  plan_type: string
  delivery_days: number
  quotation: string
}

interface Quotation {
  id: string
  quotation_number: string
  date: string
  valid_until: string
  project: string
  place_of_supply: string
  design_scope: string
  delivery_location: string
  revision_rounds: number
  notes: string
  terms_and_conditions: string
  customer: string
  vessel: string
  items: QuotationItem[]
}

export default function QuotationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  // RTK Query hooks
  const { data: quotation, isLoading, error } = useGetSingleQuotationQuery(id)
  const [updateQuotation] = useUpdateQuotationMutation()

  const [updating, setUpdating] = useState(false)

  // Handle errors from RTK Query
  useEffect(() => {
    if (error) {
      console.error("Error fetching quotation:", error)
      toast({
        title: "Error",
        description: "Failed to fetch quotation details",
        variant: "destructive",
      })
    }
  }, [error])

  const updateStatus = async (newStatus: string) => {
    if (!quotation) return
    
    setUpdating(true)
    try {
      await updateQuotation({
        id: quotation.id,
        status: newStatus
      }).unwrap()

      toast({
        title: "Success",
        description: `Quotation status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update quotation status",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const downloadPDF = async () => {
    try {
      const response = await fetch(`/api/sales/quotation/${id}/pdf`)
      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `quotation-${quotation?.quotation_number}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      })
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    const statusColors = {
      "Draft": "bg-gray-100 text-gray-800",
      "Sent": "bg-blue-100 text-blue-800",
      "Accepted": "bg-green-100 text-green-800",
      "Rejected": "bg-red-100 text-red-800",
      "Expired": "bg-orange-100 text-orange-800",
    }
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
  }

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(numAmount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getQuotationTotal = () => {
    if (!quotation) return 0
    return quotation.items.reduce((sum, item) => sum + parseFloat(item.total), 0)
  }

  const getQuotationSubtotal = () => {
    if (!quotation) return 0
    return quotation.items.reduce((sum, item) => sum + parseFloat(item.unit_price) * item.quantity, 0)
  }

  const getTotalTax = () => {
    if (!quotation) return 0
    return quotation.items.reduce((sum, item) => {
      const itemTotal = parseFloat(item.unit_price) * item.quantity
      const itemTax = itemTotal * (parseFloat(item.tax_percent) / 100)
      return sum + itemTax
    }, 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading quotation...</p>
        </div>
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Quotation not found</h2>
        <p className="mt-2 text-gray-600">The quotation you're looking for doesn't exist.</p>
        <Button onClick={() => router.push("/sales/quotation")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quotations
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push("/sales/quotation")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Quotation {quotation.quotation_number}</h1>
            <p className="text-gray-600">View and manage quotation details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(quotation.status)}>{quotation.status}</Badge>
          <Select value={quotation.status} onValueChange={updateStatus} disabled={updating}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Sent">Sent</SelectItem>
              <SelectItem value="Accepted">Accepted</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button onClick={() => router.push(`/sales/quotation/${id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button variant="outline" onClick={downloadPDF}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
        <Button variant="outline">
          <Send className="mr-2 h-4 w-4" />
          Send Email
        </Button>
        <Button variant="outline" onClick={() => window.open(`/sales/quotation/${id}/preview`, "_blank")}>
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quotation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Quotation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Quotation Number</label>
                  <p className="text-lg font-semibold">{quotation.quotation_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Project</label>
                  <p className="text-lg font-semibold">{quotation.project}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                    {formatDate(quotation.date)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Valid Until</label>
                  <p className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                    {formatDate(quotation.valid_until)}
                  </p>
                </div>
              </div>
              
              {quotation.place_of_supply && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Place of Supply</label>
                  <p className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                    {quotation.place_of_supply}
                  </p>
                </div>
              )}

              {quotation.delivery_location && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Delivery Location</label>
                  <p className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                    {quotation.delivery_location}
                  </p>
                </div>
              )}

              {quotation.design_scope && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Design Scope</label>
                  <p className="text-gray-700 whitespace-pre-wrap">{quotation.design_scope}</p>
                </div>
              )}

              {quotation.revision_rounds && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Revision Rounds</label>
                  <p className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-gray-400" />
                    {quotation.revision_rounds} rounds included
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Plan Type</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-center">Tax %</TableHead>
                    <TableHead className="text-center">Delivery Days</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotation.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-[200px]">
                        <div>
                          <p className="font-medium">{item.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.plan_type}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-center">{item.tax_percent}%</TableCell>
                      <TableCell className="text-center">{item.delivery_days} days</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(getQuotationSubtotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(getTotalTax())}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(getQuotationTotal())}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          {(quotation.notes || quotation.terms_and_conditions) && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quotation.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{quotation.notes}</p>
                  </div>
                )}
                {quotation.terms_and_conditions && (
                  <div>
                    <h4 className="font-medium mb-2">Terms & Conditions</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{quotation.terms_and_conditions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Customer ID</p>
                  <p className="font-semibold">{quotation.customer.slice(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vessel ID</p>
                  <p className="font-semibold">{quotation.vessel.slice(0, 8)}...</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/sales/invoice/new?quotationId=${id}`)}
              >
                Convert to Invoice
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/sales/quotation/new?duplicateId=${id}`)}
              >
                Duplicate Quotation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}