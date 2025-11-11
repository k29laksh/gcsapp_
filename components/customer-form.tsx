// components/customer-form.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Trash2, UserCircle, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  useAddCustomerMutation,
  useUpdateCustomerMutation,
} from "@/redux/Service/customer"

interface CustomerFormProps {
  customer?: any
  isEditing?: boolean
}

interface Contact {
  id?: string
  title: string
  first_name: string
  last_name: string
  designation: string
  email: string
  phone: string
  alternate_phone: string
  is_primary: boolean
  notes: string
}

interface Address {
  id?: string
  address_type: string
  address_line1: string
  address_line2: string
  country: string
  state: string
  city: string
  postal_code: string
}

export function CustomerForm({ customer, isEditing = false }: CustomerFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  // RTK Query hooks
  const [addCustomer, { isLoading: isAdding }] = useAddCustomerMutation()
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation()

  const [countries, setCountries] = useState<Array<{ code: string; name: string }>>([])
  const [states, setStates] = useState<Array<{ code: string; name: string }>>([])
  const [cities, setCities] = useState<Array<string>>([])
  const [shippingStates, setShippingStates] = useState<Array<{ code: string; name: string }>>([])
  const [shippingCities, setShippingCities] = useState<Array<string>>([])
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [currentContact, setCurrentContact] = useState<Contact | null>(null)
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    customer_type: customer?.customer_type || "Company",
    company_name: customer?.company_name || "",
    gst_number: customer?.gst_number || "",
    pan_number: customer?.pan_number || "",
    gst_state: customer?.gst_state || "",
    gst_type: customer?.gst_type || "Regular",
    credit_terms_days: customer?.credit_terms_days || 30,
    credit_limit: customer?.credit_limit || 0,
    contacts: customer?.contacts || [],
    addresses: customer?.addresses || [
      {
        address_type: "Billing",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
      },
      {
        address_type: "Shipping",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
      }
    ],
    same_as_billing: true,
  })

  const isLoading = isAdding || isUpdating

  // Transform customer data for form
  useEffect(() => {
    if (customer) {
      setFormData({
        customer_type: customer.customer_type,
        company_name: customer.company_name || "",
        gst_number: customer.gst_number || "",
        pan_number: customer.pan_number || "",
        gst_state: customer.gst_state || "",
        gst_type: customer.gst_type || "Regular",
        credit_terms_days: customer.credit_terms_days,
        credit_limit: parseFloat(customer.credit_limit),
        contacts: customer.contacts,
        addresses: customer.addresses,
        same_as_billing: customer.addresses.find(addr => addr.address_type === "Billing")?.address_line1 === 
                       customer.addresses.find(addr => addr.address_type === "Shipping")?.address_line1,
      })
    }
  }, [customer])

  // Fetch countries on component mount
  useEffect(() => {
    fetchCountries()
  }, [])

  const fetchCountries = async () => {
    try {
      // For now, we'll use static data. Replace with API call if needed
      setCountries([
        { code: "IN", name: "India" },
        { code: "US", name: "United States" },
        { code: "UK", name: "United Kingdom" },
      ])
    } catch (error) {
      console.error("Error fetching countries:", error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: Number.parseFloat(value) || 0 }))
  }

  const handleAddressChange = (addressType: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      addresses: prev.addresses.map(addr =>
        addr.address_type === addressType ? { ...addr, [field]: value } : addr
      )
    }))

    if (formData.same_as_billing && addressType === "Billing") {
      setFormData((prev) => ({
        ...prev,
        addresses: prev.addresses.map(addr =>
          addr.address_type === "Shipping" ? { ...addr, [field]: value } : addr
        )
      }))
    }
  }

  const handleSameAsBillingChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      same_as_billing: checked,
      addresses: checked 
        ? prev.addresses.map(addr =>
            addr.address_type === "Shipping" 
              ? { ...prev.addresses.find(a => a.address_type === "Billing")!, address_type: "Shipping" }
              : addr
          )
        : prev.addresses
    }))
  }

  const openContactDialog = (contact?: Contact, index?: number) => {
    if (contact) {
      setCurrentContact(contact)
      setEditingContactIndex(index !== undefined ? index : null)
    } else {
      setCurrentContact({
        title: "Mr.",
        first_name: "",
        last_name: "",
        designation: "",
        email: "",
        phone: "",
        alternate_phone: "",
        is_primary: formData.contacts.length === 0,
        notes: "",
      })
      setEditingContactIndex(null)
    }
    setContactDialogOpen(true)
  }

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCurrentContact((prev) => (prev ? { ...prev, [name]: value } : null))
  }

  const handleContactSelectChange = (name: string, value: string) => {
    setCurrentContact((prev) => (prev ? { ...prev, [name]: value } : null))
  }

  const handleContactCheckboxChange = (name: string, checked: boolean) => {
    setCurrentContact((prev) => (prev ? { ...prev, [name]: checked } : null))
  }

  const saveContact = () => {
    if (!currentContact) return

    const updatedContacts = [...formData.contacts]

    if (editingContactIndex !== null) {
      updatedContacts[editingContactIndex] = currentContact
    } else {
      updatedContacts.push(currentContact)
    }

    if (currentContact.is_primary) {
      updatedContacts.forEach((contact, index) => {
        if (editingContactIndex !== index) {
          contact.is_primary = false
        }
      })
    }

    setFormData((prev) => ({ ...prev, contacts: updatedContacts }))
    setContactDialogOpen(false)
    setCurrentContact(null)
    setEditingContactIndex(null)
  }

  const deleteContact = (index: number) => {
    const updatedContacts = [...formData.contacts]
    updatedContacts.splice(index, 1)

    if (formData.contacts[index].is_primary && updatedContacts.length > 0) {
      updatedContacts[0].is_primary = true
    }

    setFormData((prev) => ({ ...prev, contacts: updatedContacts }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Prepare the data in exact format required by API
      const payload = {
        customer_type: formData.customer_type,
        company_name: formData.customer_type === "Company" ? formData.company_name : null,
        gst_number: formData.gst_number || null,
        pan_number: formData.pan_number || null,
        gst_state: formData.gst_state,
        gst_type: formData.gst_type,
        credit_terms_days: formData.credit_terms_days,
        credit_limit: formData.credit_limit,
        contacts: formData.contacts.map(contact => ({
          ...contact,
          alternate_phone: contact.alternate_phone || null,
          notes: contact.notes || null,
        })),
        addresses: formData.addresses.map(address => ({
          ...address,
          address_line2: address.address_line2 || null,
        })),
      }

      console.log("Submitting customer data:", payload)

      if (isEditing && customer?.id) {
        await updateCustomer({ id: customer.id, ...payload }).unwrap()
        toast({
          title: "Success",
          description: "Customer updated successfully",
        })
      } else {
        await addCustomer(payload).unwrap()
        toast({
          title: "Success",
          description: "Customer created successfully",
        })
      }

      router.push("/sales/customer")
      router.refresh()
    } catch (error: any) {
      console.error("Error saving customer:", error)
      
      let errorMessage = `Failed to ${isEditing ? "update" : "create"} customer`
      
      if (error?.data) {
        if (typeof error.data === 'string') {
          errorMessage = error.data
        } else if (error.data.message) {
          errorMessage = error.data.message
        } else if (error.data.detail) {
          errorMessage = error.data.detail
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const billingAddress = formData.addresses.find(addr => addr.address_type === "Billing")
  const shippingAddress = formData.addresses.find(addr => addr.address_type === "Shipping")

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Customer" : "New Customer"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4">
              <div>
                <Label>Customer Type</Label>
                <RadioGroup
                  name="customer_type"
                  value={formData.customer_type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, customer_type: value }))}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Individual" id="individual" />
                    <Label htmlFor="individual">Individual</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Company" id="company" />
                    <Label htmlFor="company">Company</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.customer_type === "Company" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gst_number">GST Number</Label>
                      <Input
                        id="gst_number"
                        name="gst_number"
                        value={formData.gst_number}
                        onChange={handleChange}
                        placeholder="e.g., 22AAAAA0000A1Z5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pan_number">PAN Number</Label>
                      <Input
                        id="pan_number"
                        name="pan_number"
                        value={formData.pan_number}
                        onChange={handleChange}
                        placeholder="e.g., ABCDE1234F"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gst_state">GST State</Label>
                      <Select
                        value={formData.gst_state}
                        onValueChange={(value) => handleSelectChange("gst_state", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select GST State" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                          <SelectItem value="Delhi">Delhi</SelectItem>
                          <SelectItem value="Karnataka">Karnataka</SelectItem>
                          <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                          <SelectItem value="Gujarat">Gujarat</SelectItem>
                          <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="gst_type">GST Type</Label>
                      <Select value={formData.gst_type} onValueChange={(value) => handleSelectChange("gst_type", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select GST Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Regular">Regular</SelectItem>
                          <SelectItem value="Composition">Composition</SelectItem>
                          <SelectItem value="Unregistered">Unregistered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="credit_terms_days">Credit Terms (Days)</Label>
                  <Input
                    id="credit_terms_days"
                    name="credit_terms_days"
                    type="number"
                    value={formData.credit_terms_days}
                    onChange={handleNumberChange}
                  />
                </div>
                <div>
                  <Label htmlFor="credit_limit">Credit Limit</Label>
                  <Input
                    id="credit_limit"
                    name="credit_limit"
                    type="number"
                    value={formData.credit_limit}
                    onChange={handleNumberChange}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Contact Persons</h3>
                <Button type="button" variant="outline" onClick={() => openContactDialog()}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>

              {formData.contacts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.contacts.map((contact, index) => (
                      <TableRow key={contact.id || index}>
                        <TableCell>
                          {contact.title} {contact.first_name} {contact.last_name}
                        </TableCell>
                        <TableCell>{contact.designation}</TableCell>
                        <TableCell>
                          <div>{contact.email}</div>
                          <div>{contact.phone}</div>
                        </TableCell>
                        <TableCell>{contact.is_primary && <Badge>Primary</Badge>}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openContactDialog(contact, index)}
                            >
                              Edit
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => deleteContact(index)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 border rounded-md bg-muted/20">
                  <UserCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No contacts added yet</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => openContactDialog()}
                  >
                    Add Contact
                  </Button>
                </div>
              )}

              {/* Contact Dialog */}
              <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{editingContactIndex !== null ? "Edit Contact" : "Add Contact"}</DialogTitle>
                  </DialogHeader>

                  {currentContact && (
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="title">Title</Label>
                          <Select
                            value={currentContact.title}
                            onValueChange={(value) => handleContactSelectChange("title", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select title" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mr.">Mr.</SelectItem>
                              <SelectItem value="Mrs.">Mrs.</SelectItem>
                              <SelectItem value="Ms.">Ms.</SelectItem>
                              <SelectItem value="Dr.">Dr.</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="first_name">First Name</Label>
                          <Input
                            id="first_name"
                            name="first_name"
                            value={currentContact.first_name}
                            onChange={handleContactChange}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="last_name">Last Name</Label>
                          <Input
                            id="last_name"
                            name="last_name"
                            value={currentContact.last_name}
                            onChange={handleContactChange}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="designation">Designation</Label>
                        <Input
                          id="designation"
                          name="designation"
                          value={currentContact.designation}
                          onChange={handleContactChange}
                          placeholder="e.g., Procurement Manager"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={currentContact.email}
                          onChange={handleContactChange}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={currentContact.phone}
                            onChange={handleContactChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="alternate_phone">Alternate Phone</Label>
                          <Input
                            id="alternate_phone"
                            name="alternate_phone"
                            type="tel"
                            value={currentContact.alternate_phone}
                            onChange={handleContactChange}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          value={currentContact.notes}
                          onChange={handleContactChange}
                          placeholder="Additional information about this contact"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_primary"
                          checked={currentContact.is_primary}
                          onCheckedChange={(checked) => handleContactCheckboxChange("is_primary", checked as boolean)}
                        />
                        <label
                          htmlFor="is_primary"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Primary Contact
                        </label>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="button" onClick={saveContact}>
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Address Tab */}
            <TabsContent value="address" className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Billing Address</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="billingAddressLine1">Address Line 1</Label>
                    <Input
                      id="billingAddressLine1"
                      value={billingAddress?.address_line1 || ""}
                      onChange={(e) => handleAddressChange("Billing", "address_line1", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingAddressLine2">Address Line 2</Label>
                    <Input
                      id="billingAddressLine2"
                      value={billingAddress?.address_line2 || ""}
                      onChange={(e) => handleAddressChange("Billing", "address_line2", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="billingCountry">Country</Label>
                      <Select
                        value={billingAddress?.country || "India"}
                        onValueChange={(value) => handleAddressChange("Billing", "country", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.name}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="billingState">State</Label>
                      <Input
                        id="billingState"
                        value={billingAddress?.state || ""}
                        onChange={(e) => handleAddressChange("Billing", "state", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingCity">City</Label>
                      <Input
                        id="billingCity"
                        value={billingAddress?.city || ""}
                        onChange={(e) => handleAddressChange("Billing", "city", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="billingPostalCode">Postal Code</Label>
                    <Input
                      id="billingPostalCode"
                      value={billingAddress?.postal_code || ""}
                      onChange={(e) => handleAddressChange("Billing", "postal_code", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="same_as_billing"
                    checked={formData.same_as_billing}
                    onCheckedChange={handleSameAsBillingChange}
                  />
                  <label
                    htmlFor="same_as_billing"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Same as Billing Address
                  </label>
                </div>
                <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="shippingAddressLine1">Address Line 1</Label>
                    <Input
                      id="shippingAddressLine1"
                      value={shippingAddress?.address_line1 || ""}
                      onChange={(e) => handleAddressChange("Shipping", "address_line1", e.target.value)}
                      disabled={formData.same_as_billing}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingAddressLine2">Address Line 2</Label>
                    <Input
                      id="shippingAddressLine2"
                      value={shippingAddress?.address_line2 || ""}
                      onChange={(e) => handleAddressChange("Shipping", "address_line2", e.target.value)}
                      disabled={formData.same_as_billing}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="shippingCountry">Country</Label>
                      <Select
                        value={shippingAddress?.country || "India"}
                        onValueChange={(value) => handleAddressChange("Shipping", "country", value)}
                        disabled={formData.same_as_billing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.name}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="shippingState">State</Label>
                      <Input
                        id="shippingState"
                        value={shippingAddress?.state || ""}
                        onChange={(e) => handleAddressChange("Shipping", "state", e.target.value)}
                        disabled={formData.same_as_billing}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="shippingCity">City</Label>
                      <Input
                        id="shippingCity"
                        value={shippingAddress?.city || ""}
                        onChange={(e) => handleAddressChange("Shipping", "city", e.target.value)}
                        disabled={formData.same_as_billing}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="shippingPostalCode">Postal Code</Label>
                    <Input
                      id="shippingPostalCode"
                      value={shippingAddress?.postal_code || ""}
                      onChange={(e) => handleAddressChange("Shipping", "postal_code", e.target.value)}
                      disabled={formData.same_as_billing}
                      required
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditing ? "Update Customer" : "Create Customer"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}