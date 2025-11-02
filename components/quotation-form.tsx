"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useAddQuotationMutation, useUpdateQuotationMutation, useGetSingleQuotationQuery } from "@/redux/Service/quotation"
import { useGetCustomersQuery } from "@/redux/Service/customer"
import { useGetVesselsQuery } from "@/redux/Service/vessel"

// Define the schema for form validation
const formSchema = z.object({
  quotation_number: z.string().min(1, "Quotation number is required"),
  date: z.string().min(1, "Date is required"),
  valid_until: z.string().min(1, "Valid until date is required"),
  project: z.string().optional(),
  place_of_supply: z.string().min(1, "Place of Supply is required"),
  design_scope: z.string().optional(),
  delivery_location: z.string().optional(),
  revision_rounds: z.number().min(1, "Revision rounds must be at least 1").default(1),
  notes: z.string().optional(),
  terms_and_conditions: z.string().optional(),
  customer: z.string().min(1, "Customer is required"),
  vessel: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        quantity: z.number().positive("Quantity must be positive"),
        unit_price: z.string().or(z.number()).transform(val => typeof val === 'string' ? parseFloat(val) : val),
        tax_percent: z.string().or(z.number()).transform(val => typeof val === 'string' ? parseFloat(val) : val),
        total: z.string().or(z.number()).transform(val => typeof val === 'string' ? parseFloat(val) : val),
        plan_type: z.string().optional(),
        delivery_days: z.number().min(1, "Delivery days must be at least 1").default(30),
      }),
    )
    .min(1, "At least one item is required"),
})

type FormValues = z.infer<typeof formSchema>

interface QuotationFormProps {
  quotationId?: string
  isEditing?: boolean
}

export function QuotationForm({ quotationId, isEditing = false }: QuotationFormProps) {
  const router = useRouter()
  
  // RTK Query hooks
  const { data: quotationData, isLoading: isLoadingQuotation } = useGetSingleQuotationQuery(quotationId!, { 
    skip: !isEditing || !quotationId 
  })
  const [addQuotation, { isLoading: isAdding }] = useAddQuotationMutation()
  const [updateQuotation, { isLoading: isUpdating }] = useUpdateQuotationMutation()
  
  // Fetch customers and vessels using RTK Query
  const { data: customers = [], isLoading: isLoadingCustomers } = useGetCustomersQuery({})
  const { data: vessels = [], isLoading: isLoadingVessels } = useGetVesselsQuery({})
console.log("Vessels data:", vessels);
  const isLoading = isAdding || isUpdating

  const [subtotal, setSubtotal] = useState<number>(0)
  const [tax, setTax] = useState<number>(0)
  const [total, setTotal] = useState<number>(0)
  const [filteredVessels, setFilteredVessels] = useState<any[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quotation_number: "",
      date: new Date().toISOString().split('T')[0],
      valid_until: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
      project: "",
      place_of_supply: "",
      design_scope: "",
      delivery_location: "",
      revision_rounds: 1,
      notes: "",
      terms_and_conditions: "",
      customer: "",
      vessel: "",
      items: [
        {
          description: "",
          quantity: 1,
          unit_price: 0,
          tax_percent: 18,
          total: 0,
          plan_type: "",
          delivery_days: 30,
        },
      ],
    },
  })

  const { watch, setValue, reset } = form
 const watchCustomer = useWatch({ control: form.control, name: "customer" });
const watchItems = useWatch({ control: form.control, name: "items" });


  // Set form data when quotation data is loaded for editing - FIXED INFINITE LOOP
  useEffect(() => {
    if (isEditing && quotationData && !isInitialized) {
      const formattedData = {
        quotation_number: quotationData.quotation_number || "",
        date: quotationData.date || new Date().toISOString().split('T')[0],
        valid_until: quotationData.valid_until || new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        project: quotationData.project || "",
        place_of_supply: quotationData.place_of_supply || "",
        design_scope: quotationData.design_scope || "",
        delivery_location: quotationData.delivery_location || "",
        revision_rounds: quotationData.revision_rounds || 1,
        notes: quotationData.notes || "",
        terms_and_conditions: quotationData.terms_and_conditions || "",
        customer: quotationData.customer || "",
        vessel: quotationData.vessel || "",
        items: quotationData.items?.map(item => ({
          description: item.description || "",
          quantity: item.quantity || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          tax_percent: parseFloat(item.tax_percent) || 18,
          total: parseFloat(item.total) || 0,
          plan_type: item.plan_type || "",
          delivery_days: item.delivery_days || 30,
        })) || [],
      }

      reset(formattedData)
      setIsInitialized(true)
    }
  }, [quotationData, isEditing, reset, isInitialized])

  // Filter vessels when customer changes
// ✅ Fix vessel filtering (use 'owner' instead of 'customer')
useEffect(() => {
  if (!vessels.length) return;

  const filtered = watchCustomer
    ? vessels.filter((v: any) => v.owner === watchCustomer)
    : [];

  setFilteredVessels(filtered);

  const currentVessel = form.getValues("vessel");
  if (currentVessel && !filtered.some((v: any) => v.id === currentVessel)) {
    form.setValue("vessel", "");
  }
}, [watchCustomer, vessels]);



  // Generate quotation number for new quotations - FIXED INFINITE LOOP
  useEffect(() => {
    if (!isEditing && !isInitialized) {
      const prefix = "Q"
      const year = new Date().getFullYear()
      const randomNumber = Math.floor(Math.random() * 1000)
      const quotationNumber = `${prefix}-${year}-${randomNumber.toString().padStart(3, "0")}`
      setValue("quotation_number", quotationNumber)
      setIsInitialized(true)
    }
  }, [isEditing, setValue, isInitialized])

  // Calculate totals when items change - OPTIMIZED
  useEffect(() => {
    if (!watchItems || watchItems.length === 0) return

    let calculatedSubtotal = 0
    let calculatedTax = 0

    watchItems.forEach(item => {
      const unitPrice = typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price
      const taxPercent = typeof item.tax_percent === 'string' ? parseFloat(item.tax_percent) : item.tax_percent
      
      const itemSubtotal = item.quantity * unitPrice
      const itemTax = itemSubtotal * (taxPercent / 100)
      
      calculatedSubtotal += itemSubtotal
      calculatedTax += itemTax
    })

    const calculatedTotal = calculatedSubtotal + calculatedTax

    setSubtotal(calculatedSubtotal)
    setTax(calculatedTax)
    setTotal(calculatedTotal)
  }, [watchItems])

  // Add a new item to the form
  const addItem = useCallback(() => {
    const currentItems = form.getValues("items") || []
    setValue("items", [
      ...currentItems,
      {
        description: "",
        quantity: 1,
        unit_price: 0,
        tax_percent: 18,
        total: 0,
        plan_type: "",
        delivery_days: 30,
      },
    ])
  }, [form, setValue])

  // Remove an item from the form
  const removeItem = useCallback((index: number) => {
    const currentItems = form.getValues("items")
    if (currentItems.length > 1) {
      setValue(
        "items",
        currentItems.filter((_, i) => i !== index),
      )
    } else {
      toast({
        title: "Error",
        description: "You must have at least one item",
        variant: "destructive",
      })
    }
  }, [form, setValue])

  // Update item total when quantity, unit price, or tax changes
  const updateItemTotal = useCallback((index: number) => {
    const currentItems = form.getValues("items")
    const item = currentItems[index]

    if (item) {
      const unitPrice = typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price
      const taxPercent = typeof item.tax_percent === 'string' ? parseFloat(item.tax_percent) : item.tax_percent
      
      const itemSubtotal = item.quantity * unitPrice
      const itemTax = itemSubtotal * (taxPercent / 100)
      const itemTotal = itemSubtotal + itemTax
      
      setValue(`items.${index}.total`, Number.parseFloat(itemTotal.toFixed(2)))
    }
  }, [form, setValue])

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      // Prepare items data with proper formatting
      const itemsData = data.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: typeof item.unit_price === 'string' ? item.unit_price : item.unit_price.toFixed(2),
        tax_percent: typeof item.tax_percent === 'string' ? item.tax_percent : item.tax_percent.toFixed(2),
        total: typeof item.total === 'string' ? item.total : item.total.toFixed(2),
        plan_type: item.plan_type || "",
        delivery_days: item.delivery_days,
      }))

      const quotationData = {
        ...data,
        items: itemsData,
        status: "Draft",
      }

      if (isEditing && quotationId) {
        await updateQuotation({
          id: quotationId,
          ...quotationData
        }).unwrap()
        
        toast({
          title: "Success",
          description: "Quotation updated successfully",
        })
      } else {
        await addQuotation(quotationData).unwrap()
        
        toast({
          title: "Success",
          description: "Quotation created successfully",
        })
      }

      router.push("/sales/quotation")
      router.refresh()
    } catch (error) {
      console.error("Error saving quotation:", error)
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} quotation`,
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getCustomerDisplayName = (customer: any) => {
    if (!customer) return ""
    return customer.company_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
  }

  if (isEditing && isLoadingQuotation) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading quotation...</span>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quotation Details */}
              <FormField
                control={form.control}
                name="quotation_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quotation Number</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-gray-50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_until"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Until</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Customer Selection */}
              <FormField
                control={form.control}
                name="customer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCustomers}>
                      <FormControl>
                        <SelectTrigger>
                          {isLoadingCustomers ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading customers...
                            </div>
                          ) : (
                            <SelectValue placeholder="Select customer" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.length === 0 ? (
                          <SelectItem value="no-customers" disabled>
                            No customers available
                          </SelectItem>
                        ) : (
                          customers.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {getCustomerDisplayName(customer)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vessel Selection */}
             {/* Vessel Selection */}
<FormField
  control={form.control}
  name="vessel"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Vessel (Optional)</FormLabel>
      <Select
        onValueChange={field.onChange}
        value={field.value}
        disabled={isLoadingVessels || !watchCustomer}
      >
        <FormControl>
          <SelectTrigger>
            {isLoadingVessels ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading vessels...
              </div>
            ) : (
              <SelectValue
                placeholder={watchCustomer ? "Select vessel" : "Select customer first"}
              />
            )}
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {!watchCustomer ? (
            <SelectItem value="no-customer" disabled>
              Please select a customer first
            </SelectItem>
          ) : filteredVessels.length === 0 ? (
            <SelectItem value="no-vessels" disabled>
              No vessels found for this customer
            </SelectItem>
          ) : (
            filteredVessels.map((vessel: any) => (
              <SelectItem key={vessel.id} value={vessel.id}>
                {vessel.name} ({vessel.type})
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>


              {/* Project */}
              <FormField
                control={form.control}
                name="project"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter project name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Place of Supply */}
              <FormField
                control={form.control}
                name="place_of_supply"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Place of Supply *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Mumbai, Maharashtra" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Marine Specific Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="design_scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Design Scope (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., General Arrangement Plans" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delivery_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Location (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Mumbai Port" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="revision_rounds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revision Rounds</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Items Table */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Items</h3>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[100px]">Quantity</TableHead>
                        <TableHead className="w-[120px]">Unit Price (₹)</TableHead>
                        <TableHead className="w-[100px]">Tax (%)</TableHead>
                        <TableHead className="w-[120px]">Total (₹)</TableHead>
                        <TableHead className="w-[120px]">Plan Type</TableHead>
                        <TableHead className="w-[100px]">Delivery Days</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {form.watch("items")?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              placeholder="Item description"
                              {...form.register(`items.${index}.description`)}
                              onChange={(e) => {
                                form.setValue(`items.${index}.description`, e.target.value)
                              }}
                            />
                            {form.formState.errors.items?.[index]?.description && (
                              <p className="text-sm text-red-500 mt-1">
                                {form.formState.errors.items[index]?.description?.message}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              {...form.register(`items.${index}.quantity`, {
                                valueAsNumber: true,
                              })}
                              onChange={(e) => {
                                form.setValue(`items.${index}.quantity`, Number.parseFloat(e.target.value) || 1)
                                updateItemTotal(index)
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...form.register(`items.${index}.unit_price`, {
                                valueAsNumber: true,
                              })}
                              onChange={(e) => {
                                form.setValue(`items.${index}.unit_price`, Number.parseFloat(e.target.value) || 0)
                                updateItemTotal(index)
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...form.register(`items.${index}.tax_percent`, {
                                valueAsNumber: true,
                              })}
                              onChange={(e) => {
                                form.setValue(`items.${index}.tax_percent`, Number.parseFloat(e.target.value) || 0)
                                updateItemTotal(index)
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              {...form.register(`items.${index}.total`, {
                                valueAsNumber: true,
                              })}
                              readOnly
                              className="bg-gray-50"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Plan type"
                              {...form.register(`items.${index}.plan_type`)}
                              onChange={(e) => {
                                form.setValue(`items.${index}.plan_type`, e.target.value)
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              {...form.register(`items.${index}.delivery_days`, {
                                valueAsNumber: true,
                              })}
                              onChange={(e) => {
                                form.setValue(`items.${index}.delivery_days`, Number.parseInt(e.target.value) || 30)
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
              {form.formState.errors.items?.message && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.items.message}</p>
              )}
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Subtotal</h4>
                <p className="text-2xl font-bold">{formatCurrency(subtotal)}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Tax</h4>
                <p className="text-2xl font-bold">{formatCurrency(tax)}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Total</h4>
                <p className="text-2xl font-bold">{formatCurrency(total)}</p>
              </div>
            </div>

            {/* Notes and Terms & Conditions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add notes here..." className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terms_and_conditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms & Conditions</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add terms and conditions here..." className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Saving..." : isEditing ? "Update Quotation" : "Create Quotation"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
