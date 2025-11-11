"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Pencil, Loader2, Building, User, Phone, Mail, MapPin, FileText, Calendar, CreditCard, Trash } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useGetSingleCustomerQuery, useDeleteCustomerMutation } from "@/redux/Service/customer"
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

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const customerId = params.id as string
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: customer, isLoading, error } = useGetSingleCustomerQuery(customerId)
  const [deleteCustomer] = useDeleteCustomerMutation()

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load customer details",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleDeleteCustomer = async () => {
    try {
      setIsDeleting(true)
      await deleteCustomer(customerId).unwrap()

      toast({
        title: "Success",
        description: "Customer deleted successfully",
      })

      router.push("/sales/customer")
      router.refresh()
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(parseFloat(amount))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" onClick={() => router.push("/sales/customer")} className="mb-4 sm:mb-6">
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

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" onClick={() => router.push("/sales/customer")} className="mb-4 sm:mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="mt-8 text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-red-600">Customer Not Found</h1>
          </div>
        </div>
      </div>
    )
  }

  const primaryContact = customer.contacts.find(contact => contact.is_primary) || customer.contacts[0]
  const billingAddress = customer.addresses.find(addr => addr.address_type === "Billing")
  const shippingAddress = customer.addresses.find(addr => addr.address_type === "Shipping")

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Button variant="outline" onClick={() => router.push("/sales/customer")} className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              size="sm" 
              onClick={() => router.push(`/sales/customer/${customerId}/edit`)} 
              className="flex-1 sm:flex-none"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="text-white flex-1 sm:flex-none">
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the customer
                    and all associated data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteCustomer}
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
                  {customer.customer_type === "Company" ? (
                    <Building className="h-6 w-6 text-blue-600" />
                  ) : (
                    <User className="h-6 w-6 text-blue-600" />
                  )}
                  {customer.customer_type === "Company" ? customer.company_name : `${primaryContact?.first_name} ${primaryContact?.last_name}`}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Customer since {formatDate(customer.created_at)}
                </p>
              </div>
              <Badge className={`${
                customer.customer_type === "Company" 
                  ? "bg-blue-100 text-blue-800 border-blue-200" 
                  : "bg-green-100 text-green-800 border-green-200"
              } text-sm sm:text-base px-3 py-1 whitespace-nowrap flex items-center gap-1.5`}>
                {customer.customer_type === "Company" ? (
                  <Building className="h-3.5 w-3.5" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
                {customer.customer_type}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Customer Details */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Customer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Customer Type</p>
                <p className="font-semibold text-sm sm:text-base">{customer.customer_type}</p>
              </div>
              {customer.gst_number && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">GST Number</p>
                  <p className="font-semibold text-sm sm:text-base">{customer.gst_number}</p>
                </div>
              )}
              {customer.pan_number && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">PAN Number</p>
                  <p className="font-semibold text-sm sm:text-base">{customer.pan_number}</p>
                </div>
              )}
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">GST State</p>
                <p className="font-semibold text-sm sm:text-base">{customer.gst_state}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">GST Type</p>
                <p className="font-semibold text-sm sm:text-base">{customer.gst_type}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Credit Terms</p>
                <p className="font-semibold text-sm sm:text-base">{customer.credit_terms_days} days</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Credit Limit</p>
                <p className="font-semibold text-sm sm:text-base">{formatCurrency(customer.credit_limit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary Contact & Addresses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Primary Contact */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                Primary Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {primaryContact ? (
                <>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-sm sm:text-base">
                      {primaryContact.title} {primaryContact.first_name} {primaryContact.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Designation</p>
                    <p className="font-semibold text-sm sm:text-base">{primaryContact.designation}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-sm sm:text-base flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {primaryContact.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-sm sm:text-base flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {primaryContact.phone}
                    </p>
                  </div>
                  {primaryContact.alternate_phone && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Alternate Phone</p>
                      <p className="font-semibold text-sm sm:text-base">{primaryContact.alternate_phone}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No contact information available</p>
              )}
            </CardContent>
          </Card>

          {/* Address Information */}
          <div className="space-y-4 sm:space-y-6">
            {billingAddress && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm break-words">{billingAddress.address_line1}</p>
                        {billingAddress.address_line2 && (
                          <p className="font-medium text-sm break-words">{billingAddress.address_line2}</p>
                        )}
                        <p className="text-sm text-gray-600">
                          {billingAddress.city}, {billingAddress.state} - {billingAddress.postal_code}
                        </p>
                        <p className="text-sm text-gray-600">{billingAddress.country}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {shippingAddress && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm break-words">{shippingAddress.address_line1}</p>
                        {shippingAddress.address_line2 && (
                          <p className="font-medium text-sm break-words">{shippingAddress.address_line2}</p>
                        )}
                        <p className="text-sm text-gray-600">
                          {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.postal_code}
                        </p>
                        <p className="text-sm text-gray-600">{shippingAddress.country}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Additional Contacts */}
        {customer.contacts.length > 1 && (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Additional Contacts</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-4">
              {/* Mobile View - Cards */}
              <div className="block sm:hidden space-y-3 p-3">
                {customer.contacts.filter(contact => !contact.is_primary).map((contact, index) => (
                  <div key={contact.id} className="border rounded-lg p-3 space-y-2 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm">
                        {contact.title} {contact.first_name} {contact.last_name}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-600">Designation</p>
                        <p className="font-medium truncate">{contact.designation || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Email</p>
                        <p className="font-medium truncate">{contact.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Phone</p>
                        <p className="font-medium">{contact.phone}</p>
                      </div>
                      {contact.alternate_phone && (
                        <div>
                          <p className="text-xs text-gray-600">Alt. Phone</p>
                          <p className="font-medium">{contact.alternate_phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Name</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Designation</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Email</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Phone</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Alt. Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.contacts.filter(contact => !contact.is_primary).map((contact, index) => (
                      <tr key={contact.id} className="border-b hover:bg-gray-50">
                        <td className="px-2 sm:px-3 md:px-4 py-2">
                          {contact.title} {contact.first_name} {contact.last_name}
                        </td>
                        <td className="px-2 sm:px-3 md:px-4 py-2">{contact.designation || "-"}</td>
                        <td className="px-2 sm:px-3 md:px-4 py-2 max-w-[150px] truncate">{contact.email}</td>
                        <td className="px-2 sm:px-3 md:px-4 py-2">{contact.phone}</td>
                        <td className="px-2 sm:px-3 md:px-4 py-2">{contact.alternate_phone || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/sales/customer/${customerId}/edit`)}
                className="flex items-center justify-center gap-2 h-12"
              >
                <Pencil className="w-4 h-4" />
                Edit Customer
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push("/sales/invoice/new")}
                className="flex items-center justify-center gap-2 h-12"
              >
                <FileText className="w-4 h-4" />
                Create Invoice
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push("/sales/customer")}
                className="flex items-center justify-center gap-2 h-12"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to List
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}