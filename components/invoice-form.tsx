"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { INDIAN_STATES, invoiceItemSchema, invoiceSchema } from "@/schema/invoiceSchema"



type InvoiceFormData = z.infer<typeof invoiceSchema>

interface InvoiceFormProps {
  onSubmit: (data: any) => void
  isSubmitting: boolean
  initialData?: any
  isEditing?: boolean
}

// Indian states for place of supply


export function InvoiceForm({ onSubmit, isSubmitting, initialData, isEditing = false }: InvoiceFormProps) {
  const [customers, setCustomers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [vessels, setVessels] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const { toast } = useToast()

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: "",
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      customerId: "",
      projectId: "",
      vesselName: "",
      poNumber: "",
      placeOfSupply: "",
      ourReference: "",
      contactPerson: "",
      paymentTerms: "Net 30",
      paymentDue: 30,
      items: [
        {
          description: "",
          quantity: 1,
          unitPrice: 0,
          hsn: "",
          sacCode: "",
        },
      ],
      notes: "",
      termsAndConditions: "",
      discountType: "PERCENTAGE",
      discountValue: 0,
      shippingAmount: 0,
      adjustmentLabel: "",
      adjustmentAmount: 0,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const watchedItems = form.watch("items")
  const watchedCustomerId = form.watch("customerId")
  const watchedPlaceOfSupply = form.watch("placeOfSupply")
  const watchedDiscountType = form.watch("discountType")
  const watchedDiscountValue = form.watch("discountValue")
  const watchedShippingAmount = form.watch("shippingAmount")
  const watchedAdjustmentAmount = form.watch("adjustmentAmount")

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (watchedCustomerId) {
      const customer = customers.find((c) => c.id === watchedCustomerId)
      setSelectedCustomer(customer)

      // Reset contact person when customer changes
      if (!isEditing) {
        form.setValue("contactPerson", "")
      }
    }
  }, [watchedCustomerId, customers, form, isEditing])

  useEffect(() => {
    if (initialData && !isLoadingData) {
      // Set form values from initial data
      form.reset({
        invoiceNumber: initialData.invoiceNumber || "",
        invoiceDate: initialData.invoiceDate ? new Date(initialData.invoiceDate) : new Date(),
        dueDate: initialData.dueDate ? new Date(initialData.dueDate) : new Date(),
        customerId: initialData.customerId || "",
        projectId: initialData.projectId || "",
        vesselName: initialData.vesselName || "",
        poNumber: initialData.poNumber || "",
        placeOfSupply: initialData.placeOfSupply || "",
        ourReference: initialData.ourReference || "",
        contactPerson: initialData.contactPerson || "",
        paymentTerms: initialData.paymentTerms || "Net 30",
        paymentDue: initialData.paymentDue || 30,
        items:
          initialData.items?.length > 0
            ? initialData.items.map((item: any) => ({
                description: item.description || item.name || "",
                quantity: Number(item.quantity) || 1,
                unitPrice: Number(item.unitPrice) || 0,
                hsn: item.hsn || "",
                sacCode: item.sacCode || "",
              }))
            : [
                {
                  description: "",
                  quantity: 1,
                  unitPrice: 0,
                  hsn: "",
                  sacCode: "",
                },
              ],
        notes: initialData.notes || "",
        termsAndConditions: initialData.termsAndConditions || initialData.terms || "",
        discountType: initialData.discountType || "PERCENTAGE",
        discountValue: Number(initialData.discountValue) || 0,
        shippingAmount: Number(initialData.shippingAmount) || 0,
        adjustmentLabel: initialData.adjustmentLabel || "",
        adjustmentAmount: Number(initialData.adjustmentAmount) || 0,
      })
    }
  }, [initialData, isLoadingData, form])

  const fetchInitialData = async () => {
    try {
      setIsLoadingData(true)

      // Fetch customers, projects, and vessels in parallel
      const [customersRes, projectsRes, vesselsRes, invoiceNumberRes] = await Promise.all([
        fetch("/api/sales/customer"),
        fetch("/api/projects"),
        fetch("/api/vessels"),
        !isEditing ? fetch("/api/sales/invoice/generate-number") : Promise.resolve(null),
      ])

      if (customersRes.ok) {
        const customersData = await customersRes.json()
        setCustomers(customersData)
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData)
      }

      if (vesselsRes.ok) {
        const vesselsData = await vesselsRes.json()
        setVessels(vesselsData)
      }

      if (invoiceNumberRes?.ok && !isEditing) {
        const { invoiceNumber } = await invoiceNumberRes.json()
        form.setValue("invoiceNumber", invoiceNumber)
      }
    } catch (error) {
      console.error("Error fetching initial data:", error)
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  const calculateItemTotal = (item: any) => {
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.unitPrice) || 0
    return quantity * unitPrice
  }

  const calculateTotals = () => {
    const itemsSubtotal = watchedItems.reduce((sum, item) => {
      return sum + calculateItemTotal(item)
    }, 0)

    // GST calculation based on place of supply
    const gstRate = 0.18 // 18% GST
    let cgst = 0
    let sgst = 0
    let igst = 0

    // Check if place of supply is same state (Karnataka - code 29) for CGST+SGST vs IGST
    if (watchedPlaceOfSupply === "27") {
      // Same state - CGST + SGST
      cgst = itemsSubtotal * 0.09 // 9% CGST
      sgst = itemsSubtotal * 0.09 // 9% SGST
    } else if (watchedPlaceOfSupply) {
      // Different state - IGST
      igst = itemsSubtotal * 0.18 // 18% IGST
    }

    const totalGst = cgst + sgst + igst

    let discountAmount = 0
    if (watchedDiscountType === "PERCENTAGE") {
      discountAmount = (itemsSubtotal * Number(watchedDiscountValue)) / 100
    } else {
      discountAmount = Number(watchedDiscountValue)
    }

    const shippingAmount = Number(watchedShippingAmount) || 0
    const adjustmentAmount = Number(watchedAdjustmentAmount) || 0

    const total = itemsSubtotal + totalGst - discountAmount + shippingAmount + adjustmentAmount

    return {
      subtotal: itemsSubtotal,
      cgst,
      sgst,
      igst,
      totalGst,
      discountAmount,
      shippingAmount,
      adjustmentAmount,
      total: Math.max(0, total),
    }
  }

  const totals = calculateTotals()

  const handleSubmit = (data: InvoiceFormData) => {
    const formattedData = {
      ...data,
      invoiceDate: data.invoiceDate.toISOString(),
      dueDate: data.dueDate.toISOString(),
      items: data.items.map((item) => ({
        ...item,
        amount: calculateItemTotal(item),
        tax: 0, // Tax is calculated at invoice level
      })),
      subtotal: totals.subtotal,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      tax: totals.totalGst,
      totalAmount: totals.total,
      discountAmount: totals.discountAmount,
      shippingAmount: totals.shippingAmount,
      adjustmentAmount: totals.adjustmentAmount,
    }

    onSubmit(formattedData)
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Invoice Header */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="GCS29/001/25-26" readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Date</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} onDateChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} onDateChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.companyName || `${customer.firstName} ${customer.lastName}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact person" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectedCustomer?.contacts?.map((contact: any) => (
                        <SelectItem key={contact.id} value={`${contact.firstName} ${contact.lastName}`}>
                          {contact.firstName} {contact.lastName} - {contact.designation}
                        </SelectItem>
                      )) || []}
                      {/* Fallback option if no contacts */}
                      {(!selectedCustomer?.contacts || selectedCustomer.contacts.length === 0) && (
                        <SelectItem value="No contacts available" disabled>
                          No contacts available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="placeOfSupply"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Place of Supply</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.code} - {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">No Project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vesselName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vessel Name (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter vessel name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="poNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PO Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Purchase order number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Item description" className="min-h-[80px]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-end">
                    <div className="w-full">
                      <FormLabel>Total</FormLabel>
                      <div className="h-10 px-3 py-2 border rounded-md bg-muted">
                        ₹{calculateItemTotal(watchedItems[index]).toFixed(2)}
                      </div>
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="ml-2"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    description: "",
                    quantity: 1,
                    unitPrice: 0,
                    hsn: "",
                    sacCode: "",
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Totals and Additional Charges */}
        <Card>
          <CardHeader>
            <CardTitle>Totals & Additional Charges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="discountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                            <SelectItem value="FIXED">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discountValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount {watchedDiscountType === "PERCENTAGE" ? "(%)" : "(₹)"}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="shippingAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Amount (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="adjustmentLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adjustment Label</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Rounding off" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adjustmentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adjustment Amount (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.cgst > 0 && (
                  <div className="flex justify-between">
                    <span>CGST (9%):</span>
                    <span>₹{totals.cgst.toFixed(2)}</span>
                  </div>
                )}
                {totals.sgst > 0 && (
                  <div className="flex justify-between">
                    <span>SGST (9%):</span>
                    <span>₹{totals.sgst.toFixed(2)}</span>
                  </div>
                )}
                {totals.igst > 0 && (
                  <div className="flex justify-between">
                    <span>IGST (18%):</span>
                    <span>₹{totals.igst.toFixed(2)}</span>
                  </div>
                )}
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>-₹{totals.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {totals.shippingAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>₹{totals.shippingAmount.toFixed(2)}</span>
                  </div>
                )}
                {totals.adjustmentAmount !== 0 && (
                  <div className="flex justify-between">
                    <span>Adjustment:</span>
                    <span>₹{totals.adjustmentAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>₹{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes and Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Internal notes..." className="min-h-[100px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termsAndConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Terms and conditions..." className="min-h-[100px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update Invoice" : "Create Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
