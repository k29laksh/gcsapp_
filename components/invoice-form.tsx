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
import { useGetCustomersQuery } from "@/redux/Service/customer"
import { useGetVesselsQuery } from "@/redux/Service/vessel"
import { useGetProjectsQuery } from "@/redux/Service/projects"
import { 
  useAddInvoiceMutation, 
  useUpdateInvoiceMutation,
  useGetSingleInvoiceQuery 
} from "@/redux/Service/invoice"
import { useRouter } from "next/navigation"

// Enhanced schema with better validation
const invoiceSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  project: z.string().min(1, "Project is required"),
  vessel: z.string().min(1, "Vessel is required"),
  invoice_date: z.date({
    required_error: "Invoice date is required",
  }),
  due_date: z.date({
    required_error: "Due date is required",
  }),
  status: z.string().default("Draft"),
  place_of_supply: z.string().min(1, "Place of supply is required"),
  // These fields are now interpreted as monetary amounts (₹)
  sgst: z.number().min(0, "SGST cannot be negative").default(0),
  cgst: z.number().min(0, "CGST cannot be negative").default(0),
  igst: z.number().min(0, "IGST cannot be negative").default(0),
  po_no: z.string().optional().default(""),
  our_ref: z.string().optional().default(""),
  items: z.array(
    z.object({
      description: z.string().min(1, "Description is required"),
      quantity: z.number().min(0.01, "Quantity must be at least 0.01").default(1),
      unit_price: z.number().min(0, "Unit price must be positive").default(0),
    })
  ).min(1, "At least one item is required"),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface InvoiceFormProps {
  initialData?: any
  isEditing?: boolean
  invoiceId?: string
  onSuccess?: () => void
}

const INDIAN_STATES = [
  { code: "27", name: "Maharashtra" },
  { code: "07", name: "Delhi" },
  { code: "33", name: "Tamil Nadu" },
  { code: "21", name: "Odisha" },
  { code: "24", name: "Gujarat" },
]

export function InvoiceForm({ initialData, isEditing = false, invoiceId, onSuccess }: InvoiceFormProps) {
  const { toast } = useToast()
  const { data: customersData = [], isLoading: customersLoading } = useGetCustomersQuery({})
  const { data: vesselsData = [], isLoading: vesselsLoading } = useGetVesselsQuery({})
  const { data: projectsData = [], isLoading: projectsLoading } = useGetProjectsQuery({})
  
  // RTK Query mutations and queries
  const [addInvoice, { isLoading: isAdding }] = useAddInvoiceMutation()
  const [updateInvoice, { isLoading: isUpdating }] = useUpdateInvoiceMutation()
  
  // Fetch invoice data if editing
  const { data: existingInvoice, isLoading: isInvoiceLoading } = useGetSingleInvoiceQuery(
    invoiceId || '',
    { skip: !isEditing || !invoiceId }
  )

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customer: "",
      project: "",
      vessel: "",
      invoice_date: new Date(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "Draft",
      place_of_supply: "",
      sgst: 0,
      cgst: 0,
      igst: 0,
      po_no: "",
      our_ref: "",
      items: [
        {
          description: "",
          quantity: 1,
          unit_price: 0,
        },
      ],
    },
    mode: "onChange", // Validate on change for better UX
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const watchedItems = form.watch("items")
  // These watched fields now represent the direct monetary amount entered by the user
  const watchedSgst = form.watch("sgst")
  const watchedCgst = form.watch("cgst")
  const watchedIgst = form.watch("igst")

  const router = useRouter()

  // Effect for initial data (prop)
  useEffect(() => {
    if (initialData) {
      populateFormWithData(initialData)
    }
  }, [initialData])

  // Effect for existing invoice data (from API)
  useEffect(() => {
    if (existingInvoice && isEditing) {
      populateFormWithData(existingInvoice)
    }
  }, [existingInvoice, isEditing])

  const populateFormWithData = (data: any) => {
    console.log("Populating form with data:", data)
    form.reset({
      customer: data.customer?.id?.toString() || data.customer?.toString() || "",
      project: data.project?.id?.toString() || data.project?.toString() || "",
      vessel: data.vessel?.id?.toString() || data.vessel?.toString() || "",
      invoice_date: data.invoice_date ? new Date(data.invoice_date) : new Date(),
      due_date: data.due_date ? new Date(data.due_date) : new Date(),
      status: data.status || "Draft",
      place_of_supply: data.place_of_supply || "",
      // Use the stored GST *amounts* if they exist, otherwise default to 0
      sgst: data.sgst || 0, 
      cgst: data.cgst || 0,
      igst: data.igst || 0,
      po_no: data.po_no || "",
      our_ref: data.our_ref || "",
      items: data.items?.length > 0
        ? data.items.map((item: any) => ({
            description: item.description || "",
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.unit_price) || 0,
          }))
        : [
            {
              description: "",
              quantity: 1,
              unit_price: 0,
            },
          ],
    })
  }

  const calculateItemTotal = (item: any) => {
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.unit_price) || 0
    return quantity * unitPrice
  }

  const calculateTotals = () => {
    const itemsSubtotal = watchedItems.reduce((sum, item) => {
      return sum + calculateItemTotal(item)
    }, 0)

    // *** IMPORTANT CHANGE: Use the input values directly as the GST amounts (no division by 100) ***
    const sgstAmount = watchedSgst 
    const cgstAmount = watchedCgst
    const igstAmount = watchedIgst

    const totalGst = sgstAmount + cgstAmount + igstAmount
    const total = itemsSubtotal + totalGst

    return {
      subtotal: itemsSubtotal,
      // The returned values here are the direct user inputs
      sgst: sgstAmount,
      cgst: cgstAmount,
      igst: igstAmount,
      totalGst,
      total: Math.max(0, total),
    }
  }

  const totals = calculateTotals()

  const onSubmit = async (data: InvoiceFormData) => {
    console.log("Form submitted with data:", data)
    
    try {
      // Helper function to round to 2 decimal places
      const roundToTwoDecimals = (num: number): number => {
        return Math.round((num + Number.EPSILON) * 100) / 100;
      };

      const formattedData = {
        ...data,
        invoice_date: data.invoice_date.toISOString().split('T')[0],
        due_date: data.due_date.toISOString().split('T')[0],
        items: data.items.map((item) => ({
          description: item.description,
          quantity: (item.quantity),
          unit_price: (item.unit_price),
          amount: (calculateItemTotal(item)),
        })),
        subtotal: (totals.subtotal),
        // Use the totals which now reflect the direct amount entered by the user
        sgst: (totals.sgst), 
        cgst: (totals.cgst),
        igst: (totals.igst),
        total_amount: (totals.total),
        
        // Remove sgst_percentage, cgst_percentage, igst_percentage fields 
        // to prevent confusion since the user is now entering amounts, not percentages.
        // If the API requires them, they should be set to 0 or derived elsewhere.
      }

      // Deleting the percentage keys from the final data object, as they now hold the amount
      // and sending them with a 'percentage' suffix is misleading/incorrect.
      delete (formattedData as any).sgst_percentage;
      delete (formattedData as any).cgst_percentage;
      delete (formattedData as any).igst_percentage;

      console.log("Sending data to API:", formattedData)

      let result
      if (isEditing && invoiceId) {
        result = await updateInvoice({
          id: invoiceId,
          ...formattedData
        }).unwrap()
        
        toast({
          title: "Success!",
          description: "Invoice updated successfully",
        })
      } else {
        result = await addInvoice(formattedData).unwrap()
        
        toast({
          title: "Success!",
          description: "Invoice created successfully",
        })
      }
      router.push("/sales/invoice")
      router.refresh()
      console.log("API response:", result)
      
      if (onSuccess) {
        onSuccess()
      }

    } catch (error: any) {
      console.error("Failed to submit invoice:", error)
      
      toast({
        title: "Error",
        description: error?.data?.message || error?.data?.detail || `Failed to ${isEditing ? 'update' : 'create'} invoice`,
        variant: "destructive",
      })
    }
  }

  // Debug: Log form state and errors
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      console.log("Form values:", value)
      console.log("Form errors:", form.formState.errors)
    })
    return () => subscription.unsubscribe()
  }, [form.watch, form.formState.errors])

  const isSubmitting = isAdding || isUpdating

  // Check if form is valid
  const isFormValid = form.formState.isValid
  console.log("Form is valid:", isFormValid)
  console.log("Form errors:", form.formState.errors)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Customer, Project, Vessel, Status fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="customer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={customersLoading}
                >
                  <FormControl>
                    <SelectTrigger className={form.formState.errors.customer ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customersLoading ? (
                      <SelectItem value="loading" disabled>Loading customers...</SelectItem>
                    ) : (
                      customersData.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer?.company_name} - {customer?.contacts[0]?.first_name} {customer?.contacts[0]?.last_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="project"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={projectsLoading}
                >
                  <FormControl>
                    <SelectTrigger className={form.formState.errors.project ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projectsLoading ? (
                      <SelectItem value="loading" disabled>Loading projects...</SelectItem>
                    ) : (
                      projectsData.map((project: any) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vessel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vessel *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={vesselsLoading}
                >
                  <FormControl>
                    <SelectTrigger className={form.formState.errors.vessel ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select vessel" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vesselsLoading ? (
                      <SelectItem value="loading" disabled>Loading vessels...</SelectItem>
                    ) : (
                      vesselsData.map((vessel: any) => (
                        <SelectItem key={vessel.id} value={vessel.id.toString()}>
                          {vessel.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Sent">Sent</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Date fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="invoice_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Date *</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value}
                    setDate={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date *</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value}
                    setDate={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Place of Supply */}
        <FormField
          control={form.control}
          name="place_of_supply"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Place of Supply *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className={form.formState.errors.place_of_supply ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select place of supply" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {INDIAN_STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* GST fields (now as absolute amounts) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="sgst"
            render={({ field }) => (
              <FormItem>
                {/* Updated Label to indicate Amount (₹) instead of Percentage (%) */}
                <FormLabel>SGST (Amount ₹)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    step="0.1" // Changed step for monetary amount
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cgst"
            render={({ field }) => (
              <FormItem>
                {/* Updated Label to indicate Amount (₹) instead of Percentage (%) */}
                <FormLabel>CGST (Amount ₹)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    step="0.1" // Changed step for monetary amount
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="igst"
            render={({ field }) => (
              <FormItem>
                {/* Updated Label to indicate Amount (₹) instead of Percentage (%) */}
                <FormLabel>IGST (Amount ₹)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    step="0.1" // Changed step for monetary amount
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Optional fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="po_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PO Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="our_ref"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Our Reference</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Items section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Invoice Items *</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: "", quantity: 1, unit_price: 0 })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-4 items-start">
                  <div className="col-span-5">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className={form.formState.errors.items?.[index]?.description ? "border-red-500" : ""}
                              placeholder="Item description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              step="1"
                              {...field} 
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              className={form.formState.errors.items?.[index]?.quantity ? "border-red-500" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.unit_price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="1"
                              min="0"
                              {...field} 
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              className={form.formState.errors.items?.[index]?.unit_price ? "border-red-500" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-1 pt-8">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="col-span-1 pt-8">
                    <div className="text-sm font-medium">
                      ₹{calculateItemTotal(watchedItems[index]).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {form.formState.errors.items && !Array.isArray(form.formState.errors.items) && (
              <p className="text-sm font-medium text-destructive mt-2">
                {form.formState.errors.items.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Totals section */}
        {/* <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.sgst > 0 && (
                <div className="flex justify-between">
                  <span>SGST (Inputted):</span>
                  <span>₹{totals?.sgst.toFixed(2)}</span>
                </div>
              )}
              {totals.cgst > 0 && (
                <div className="flex justify-between">
                  <span>CGST (Inputted):</span>
                  <span>₹{totals?.cgst.toFixed(2)}</span>
                </div>
              )}
              {totals.igst > 0 && (
                <div className="flex justify-between">
                  <span>IGST (Inputted):</span>
                  <span>₹{totals?.igst.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>₹{totals.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card> */}

        <Button 
          type="submit" 
          className="w-full"
          size="lg"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Update Invoice' : 'Create Invoice'}
        </Button>

      </form>
    </Form>
  )
}
