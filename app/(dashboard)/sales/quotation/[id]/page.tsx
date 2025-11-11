"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Download, 
  Edit, 
  Send, 
  Eye, 
  ArrowLeft, 
  FileText, 
  Calendar, 
  User, 
  Building, 
  MapPin, 
  Clock,
  Loader2,
  Printer,
  CheckCircle,
  AlertCircle,
  Ban,
  Trash
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { 
  useGetSingleQuotationQuery, 
  useUpdateQuotationMutation,
  useDeleteQuotationMutation 
} from "@/redux/Service/quotation"

// Add AlertDialog import
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
  status: string
  items: QuotationItem[]
}

export default function QuotationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  // RTK Query hooks
  const { data: quotation, isLoading, error } = useGetSingleQuotationQuery(id)
  const [updateQuotation] = useUpdateQuotationMutation()
  const [deleteQuotation] = useDeleteQuotationMutation() // Add delete mutation

  const [updating, setUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false) // Add deleting state

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

  // Add delete quotation handler
  const handleDeleteQuotation = async () => {
    try {
      setIsDeleting(true)
      await deleteQuotation(id).unwrap()

      toast({
        title: "Success",
        description: "Quotation deleted successfully",
      })

      router.push("/sales/quotation")
      router.refresh()
    } catch (error) {
      console.error("Error deleting quotation:", error)
      toast({
        title: "Error",
        description: "Failed to delete quotation. Please try again.",
        variant: "destructive",
      })
      setIsDeleting(false)
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
      "Draft": "bg-gray-100 text-gray-800 border-gray-200",
      "Sent": "bg-blue-100 text-blue-800 border-blue-200",
      "Accepted": "bg-green-100 text-green-800 border-green-200",
      "Rejected": "bg-red-100 text-red-800 border-red-200",
      "Expired": "bg-orange-100 text-orange-800 border-orange-200",
    }
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Draft":
        return <FileText className="h-4 w-4" />;
      case "Sent":
        return <Send className="h-4 w-4" />;
      case "Accepted":
        return <CheckCircle className="h-4 w-4" />;
      case "Rejected":
        return <Ban className="h-4 w-4" />;
      case "Expired":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
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
    if (!dateString) return "N/A";
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
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
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" onClick={() => router.push("/sales/quotation")} className="mb-4 sm:mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="md:col-span-2 h-64 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" onClick={() => router.push("/sales/quotation")} className="mb-4 sm:mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="mt-8 text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-red-600">Quotation Not Found</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Button variant="outline" onClick={() => router.push("/sales/quotation")} className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.print()} 
              className="flex-1 sm:flex-none"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button 
              size="sm" 
              onClick={() => router.push(`/sales/quotation/${id}/edit`)} 
              className="flex-1 sm:flex-none"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            {/* Delete Button with AlertDialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex-1 sm:flex-none text-white">
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the quotation 
                    #{quotation.quotation_number} and remove it from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteQuotation}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Main Header */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl truncate flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Quotation #{quotation.quotation_number}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Created on {formatDate(quotation.date)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(quotation.status)} text-sm sm:text-base px-3 py-1 whitespace-nowrap flex items-center gap-1.5`}>
                  {getStatusIcon(quotation.status)}
                  {quotation.status}
                </Badge>
                <Select value={quotation.status} onValueChange={updateStatus} disabled={updating}>
                  <SelectTrigger className="w-32">
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
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
          </CardHeader>
        </Card>

        {/* Quotation Details */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Quotation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Quotation Date</p>
                <p className="font-semibold text-sm sm:text-base">{formatDate(quotation.date)}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Valid Until</p>
                <p className="font-semibold text-sm sm:text-base">{formatDate(quotation.valid_until)}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Total Amount</p>
                <p className="font-semibold text-sm sm:text-base">{formatCurrency(getQuotationTotal())}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Customer</p>
                <p className="font-semibold text-sm sm:text-base truncate">{quotation.customer}</p>
              </div>
              {quotation.project && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Project</p>
                  <p className="font-semibold text-sm sm:text-base">{quotation.project}</p>
                </div>
              )}
              {quotation.place_of_supply && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Place of Supply</p>
                  <p className="font-semibold text-sm sm:text-base">{quotation.place_of_supply}</p>
                </div>
              )}
              {quotation.delivery_location && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Delivery Location</p>
                  <p className="font-semibold text-sm sm:text-base">{quotation.delivery_location}</p>
                </div>
              )}
              {quotation.revision_rounds && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Revision Rounds</p>
                  <p className="font-semibold text-sm sm:text-base">{quotation.revision_rounds}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer & Company Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Customer ID</p>
                <p className="font-semibold text-sm sm:text-base truncate">{quotation.customer}</p>
              </div>
              {quotation.project && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Project ID</p>
                  <p className="font-semibold text-sm sm:text-base">{quotation.project}</p>
                </div>
              )}
              {quotation.vessel && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Vessel ID</p>
                  <p className="font-semibold text-sm sm:text-base">{quotation.vessel}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base">From</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Company</p>
                <p className="font-semibold text-sm sm:text-base">GCS Services</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Address</p>
                <p className="font-semibold text-sm sm:text-base break-words">
                  123 Business Park, Suite 456<br />
                  Mumbai, Maharashtra 400001<br />
                  India
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">GSTIN</p>
                <p className="font-semibold text-sm sm:text-base">27AABCG1234A1Z5</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quotation Items */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Quotation Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-4">
            {/* Mobile View - Cards */}
            <div className="block sm:hidden space-y-3 p-3">
              {quotation.items?.map((item: QuotationItem, index: number) => (
                <div key={item.id} className="border rounded-lg p-3 space-y-2 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm">Item {index + 1}</span>
                    <Badge variant="outline">{item.plan_type}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-600">Description</p>
                      <p className="font-medium truncate">{item.description || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Quantity</p>
                      <p className="font-medium">{item.quantity || "0"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Unit Price</p>
                      <p className="font-medium">{formatCurrency(item.unit_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Tax %</p>
                      <p className="font-medium">{item.tax_percent}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Delivery Days</p>
                      <p className="font-medium">{item.delivery_days} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total</p>
                      <p className="font-medium">{formatCurrency(item.total)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">#</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Description</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Plan Type</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Quantity</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Unit Price</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Tax %</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Delivery Days</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items?.map((item: QuotationItem, index: number) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="px-2 sm:px-3 md:px-4 py-2">{index + 1}</td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 max-w-[200px] truncate">{item.description || "-"}</td>
                      <td className="px-2 sm:px-3 md:px-4 py-2">
                        <Badge variant="outline" className="text-xs">{item.plan_type}</Badge>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2">{item.quantity || "0"}</td>
                      <td className="px-2 sm:px-3 md:px-4 py-2">{formatCurrency(item.unit_price)}</td>
                      <td className="px-2 sm:px-3 md:px-4 py-2">{item.tax_percent}%</td>
                      <td className="px-2 sm:px-3 md:px-4 py-2">{item.delivery_days} days</td>
                      <td className="px-2 sm:px-3 md:px-4 py-2">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Quotation Summary */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Quotation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(getQuotationSubtotal())}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">{formatCurrency(getTotalTax())}</span>
                </div>

                <Separator />

                <div className="flex justify-between font-medium text-base">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(getQuotationTotal())}</span>
                </div>
              </div>

              {/* Additional Information */}
              {(quotation.design_scope || quotation.notes || quotation.terms_and_conditions) && (
                <div className="mt-6 space-y-4">
                  {quotation.design_scope && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Design Scope</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{quotation.design_scope}</p>
                    </div>
                  )}
                  {quotation.notes && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Notes</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{quotation.notes}</p>
                    </div>
                  )}
                  {quotation.terms_and_conditions && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Terms & Conditions</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{quotation.terms_and_conditions}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/sales/quotation/${id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Quotation
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/sales/invoice/new?quotationId=${id}`)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Convert to Invoice
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/sales/quotation/new?duplicateId=${id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Duplicate Quotation
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open(`/sales/quotation/${id}/preview`, "_blank")}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800 font-medium text-sm">PDF Available</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={downloadPDF}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}