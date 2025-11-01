// app/sales/customer/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Pencil, Loader2, Building, User, Phone, Mail, MapPin, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useGetSingleCustomerQuery } from "@/redux/Service/customer"

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const customerId = params.id as string

  const { data: customer, isLoading, error } = useGetSingleCustomerQuery(customerId)

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load customer details",
        variant: "destructive",
      })
    }
  }, [error, toast])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Loading customer details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {error ? "Failed to load customer details." : "Customer not found."}
          </p>
          <Button onClick={() => router.push("/sales/customer")}>
            Back to Customers
          </Button>
        </div>
      </div>
    )
  }

  const primaryContact = customer.contacts.find(contact => contact.is_primary) || customer.contacts[0]
  const billingAddress = customer.addresses.find(addr => addr.address_type === "Billing")
  const shippingAddress = customer.addresses.find(addr => addr.address_type === "Shipping")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/sales/customer">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {customer.customer_type === "Company" ? customer.company_name : `${primaryContact?.first_name} ${primaryContact?.last_name}`}
            </h1>
            <p className="text-muted-foreground">Customer Details</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/sales/customer/${customer.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Complete customer profile and details</CardDescription>
            </div>
            <Badge variant={customer.customer_type === "Company" ? "default" : "secondary"}>
              {customer.customer_type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    {customer.customer_type === "Company" ? <Building className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    Basic Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer Type:</span>
                      <span className="font-medium">{customer.customer_type}</span>
                    </div>
                    {customer.company_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Company Name:</span>
                        <span className="font-medium">{customer.company_name}</span>
                      </div>
                    )}
                    {customer.gst_number && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">GST Number:</span>
                        <span className="font-medium">{customer.gst_number}</span>
                      </div>
                    )}
                    {customer.pan_number && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">PAN Number:</span>
                        <span className="font-medium">{customer.pan_number}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST State:</span>
                      <span className="font-medium">{customer.gst_state}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST Type:</span>
                      <span className="font-medium">{customer.gst_type}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Primary Contact
                  </h3>
                  {primaryContact ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">
                          {primaryContact.title} {primaryContact.first_name} {primaryContact.last_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Designation:</span>
                        <span className="font-medium">{primaryContact.designation}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {primaryContact.email}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {primaryContact.phone}
                        </span>
                      </div>
                      {primaryContact.alternate_phone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Alt. Phone:</span>
                          <span className="font-medium">{primaryContact.alternate_phone}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No contact information available</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="space-y-6 pt-4">
              <div className="space-y-4">
                {customer.contacts.map((contact, index) => (
                  <Card key={contact.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">
                              {contact.title} {contact.first_name} {contact.last_name}
                            </h4>
                            {contact.is_primary && (
                              <Badge variant="default">Primary</Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground">{contact.designation}</p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{contact.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{contact.phone}</span>
                            </div>
                            {contact.alternate_phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{contact.alternate_phone} (Alternate)</span>
                              </div>
                            )}
                          </div>
                          {contact.notes && (
                            <div>
                              <p className="text-sm text-muted-foreground">{contact.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Address Tab */}
            <TabsContent value="address" className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {billingAddress && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Billing Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p>{billingAddress.address_line1}</p>
                            {billingAddress.address_line2 && <p>{billingAddress.address_line2}</p>}
                            <p>{billingAddress.city}, {billingAddress.state}</p>
                            <p>{billingAddress.postal_code}, {billingAddress.country}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {shippingAddress && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Shipping Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p>{shippingAddress.address_line1}</p>
                            {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
                            <p>{shippingAddress.city}, {shippingAddress.state}</p>
                            <p>{shippingAddress.postal_code}, {shippingAddress.country}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Credit Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Credit Terms:</span>
                        <span className="font-medium">{customer.credit_terms_days} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Credit Limit:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR'
                          }).format(parseFloat(customer.credit_limit))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Customer Since</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {new Date(customer.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}