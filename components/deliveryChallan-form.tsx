"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import { useGetInvoicesQuery } from "@/redux/Service/invoice"
import { useGetCustomersQuery } from "@/redux/Service/customer"
import { 
  useAddDeliveryChallanMutation, 
  useUpdateDeliveryChallanMutation,
  useUpdateDeliveryChallanItemsMutation 
} from "@/redux/Service/delivery-challan"
import { useToast } from "@/hooks/use-toast"

interface DeliveryItem {
  id?: string  // Item ID from backend (exists in edit mode)
  description: string
  quantity: number
  unit_wt: string
  remarks: string
  box_wt: string
  box_no: string
}

interface DeliveryChallanFormData {
  order_no: string
  order_date: string
  delivery_note_no: string
  invoice_id: string
  dispatch_date: string
  delivery_method: string
  customer_id: string
  delivery_items: DeliveryItem[]
}

interface DeliveryChallanFormProps {
  initialData?: DeliveryChallanFormData
  challanId?: string
}

export default function DeliveryChallanForm({ initialData, challanId }: DeliveryChallanFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // Fetch invoices and customers
  const { data: invoices, isLoading: invoicesLoading } = useGetInvoicesQuery({})
  const { data: customers, isLoading: customersLoading } = useGetCustomersQuery({})
  
  // Add and update mutations
  const [addDeliveryChallan, { isLoading: isAdding }] = useAddDeliveryChallanMutation()
  const [updateDeliveryChallan, { isLoading: isUpdating }] = useUpdateDeliveryChallanMutation()
  const [updateDeliveryChallanItems, { isLoading: isUpdatingItems }] = useUpdateDeliveryChallanItemsMutation()
  
  const isSubmitting = isAdding || isUpdating || isUpdatingItems
  const isEditMode = !!challanId

  const [formData, setFormData] = useState<DeliveryChallanFormData>(
    initialData || {
      order_no: "",
      order_date: new Date().toISOString().split("T")[0],
      delivery_note_no: "",
      invoice_id: "",
      dispatch_date: "",
      delivery_method: "",
      customer_id: "",
      delivery_items: [
        {
          description: "",
          quantity: 0,
          unit_wt: "",
          remarks: "",
          box_wt: "",
          box_no: "",
        },
      ],
    },
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle invoice selection - auto-select customer (works in both create and edit mode)
  const handleInvoiceChange = (invoiceId: string) => {
    const selectedInvoice = invoices?.find((inv: { id: string; customer: string; invoice_no: string }) => inv.id === invoiceId)
    
    if (selectedInvoice) {
      setFormData((prev) => ({
        ...prev,
        invoice_id: invoiceId,
        customer_id: selectedInvoice.customer,
      }))
    } else {
      setFormData((prev) => ({ ...prev, invoice_id: invoiceId }))
    }
  }

  // Auto-select customer when form loads in edit mode with an invoice_id
  useEffect(() => {
    if (isEditMode && formData.invoice_id && invoices && invoices.length > 0) {
      const selectedInvoice = invoices.find((inv: { id: string; customer: string }) => inv.id === formData.invoice_id)
      if (selectedInvoice && selectedInvoice.customer !== formData.customer_id) {
        setFormData((prev) => ({
          ...prev,
          customer_id: selectedInvoice.customer,
        }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, invoices])

  const handleItemChange = (index: number, field: keyof DeliveryItem, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      delivery_items: prev.delivery_items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      delivery_items: [
        ...prev.delivery_items,
        {
          description: "",
          quantity: 0,
          unit_wt: "",
          remarks: "",
          box_wt: "",
          box_no: "",
        },
      ],
    }))
  }

  const removeItem = (index: number) => {
    if (formData.delivery_items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        delivery_items: prev.delivery_items.filter((_, i) => i !== index),
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (isEditMode && challanId) {
        // Update existing delivery challan
        // First update the details (without items)
        const { delivery_items, ...detailsData } = formData
        await updateDeliveryChallan({ id: challanId, ...detailsData }).unwrap()
        
        // Then update each item individually by its item ID
        const itemUpdatePromises = delivery_items.map((item) => {
          if (item.id) {
            // Update existing item
            const { id, ...itemData } = item
            return updateDeliveryChallanItems({ itemId: id, ...itemData }).unwrap()
          }
          // Skip new items without ID (they should be created through a different endpoint if needed)
          return Promise.resolve()
        })
        
        await Promise.all(itemUpdatePromises)
        
        toast({
          title: "Success",
          description: "Delivery Challan updated successfully",
        })
      } else {
        // Create new delivery challan
        await addDeliveryChallan(formData).unwrap()
        toast({
          title: "Success",
          description: "Delivery Challan created successfully",
        })
      }
      
      router.push("/sales/deliverychallan")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} delivery challan`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="mx-auto sm:px-4 pb-4 md:px-6">
      <CardHeader className="mb-4 sm:mb-6 px-0">
        <CardTitle className="text-xl sm:text-2xl md:text-3xl">
          {isEditMode ? "Edit" : "Create"} Delivery Challan
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Fill in the details to {isEditMode ? "update the" : "create a new"} delivery challan
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Delivery Note Header Information */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Delivery Note Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="order_date" className="text-xs sm:text-sm">Order Date</Label>
                <Input
                  id="order_date"
                  name="order_date"
                  type="date"
                  value={formData.order_date}
                  onChange={handleChange}
                  required
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order_no" className="text-xs sm:text-sm">Order No.</Label>
                <Input
                  id="order_no"
                  name="order_no"
                  placeholder="ORD-2025-1001"
                  value={formData.order_no}
                  onChange={handleChange}
                  required
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_note_no" className="text-xs sm:text-sm">Delivery Note No.</Label>
                <Input
                  id="delivery_note_no"
                  name="delivery_note_no"
                  placeholder="DN-2025-1001"
                  value={formData.delivery_note_no}
                  onChange={handleChange}
                  required
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_id" className="text-xs sm:text-sm">Invoice</Label>
                <Select
                  value={formData.invoice_id}
                  onValueChange={handleInvoiceChange}
                >
                  <SelectTrigger id="invoice_id" className="h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Select Invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoicesLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : (
                      invoices?.map((invoice: { id: string; invoice_no: string; total_amount: string; customer: string }) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.invoice_no} - ₹{invoice.total_amount}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_id" className="text-xs sm:text-sm">
                  Customer {formData.invoice_id && "(Auto-selected)"}
                </Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) => handleSelectChange("customer_id", value)}
                  disabled={!!formData.invoice_id}
                >
                  <SelectTrigger id="customer_id" className="h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customersLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : (
                      customers?.map((customer: { id: string; contacts: { first_name: string; last_name: string }[] }) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer?.contacts[0]?.first_name} {customer?.contacts[0]?.last_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dispatch_date" className="text-xs sm:text-sm">Dispatch Date</Label>
                <Input
                  id="dispatch_date"
                  name="dispatch_date"
                  type="date"
                  value={formData.dispatch_date}
                  onChange={handleChange}
                  required
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2 max-w-md">
              <Label htmlFor="delivery_method" className="text-xs sm:text-sm">Delivery Method</Label>
              <Input
                id="delivery_method"
                name="delivery_method"
                placeholder="Road - Partner Courier"
                value={formData.delivery_method}
                onChange={handleChange}
                required
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Delivery Items</CardTitle>
            <Button type="button" onClick={addItem} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              + Add Item
            </Button>
          </CardHeader>
          <CardContent className="p-0 sm:p-4">
            {/* Mobile View - Cards */}
            <div className="block sm:hidden space-y-3 p-3">
              {formData.delivery_items.map((item, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Item {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={formData.delivery_items.length === 1}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        placeholder="Widget A - Blue"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                        placeholder="10"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Unit Wt (Kg)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_wt}
                        onChange={(e) => handleItemChange(index, "unit_wt", e.target.value)}
                        placeholder="0.50"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Box Wt (Kg)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.box_wt}
                        onChange={(e) => handleItemChange(index, "box_wt", e.target.value)}
                        placeholder="5.00"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Box No.</Label>
                      <Input
                        value={item.box_no}
                        onChange={(e) => handleItemChange(index, "box_no", e.target.value)}
                        placeholder="BOX-101"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">Remarks</Label>
                      <Input
                        value={item.remarks}
                        onChange={(e) => handleItemChange(index, "remarks", e.target.value)}
                        placeholder="Handle with care"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b bg-muted">
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">S. No.</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Description</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Quantity</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Unit Wt. (Kg)</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Box Wt. (Kg)</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Box No.</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium whitespace-nowrap">Remarks</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 text-center font-medium whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.delivery_items.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="px-2 sm:px-3 md:px-4 py-2">
                        <div className="h-8 flex items-center text-xs bg-muted px-2 rounded">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2">
                        <Input
                          value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          placeholder="Widget A - Blue"
                          className="h-8 text-xs min-w-[150px]"
                        />
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                          placeholder="10"
                          className="h-8 text-xs min-w-[60px]"
                        />
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_wt}
                          onChange={(e) => handleItemChange(index, "unit_wt", e.target.value)}
                          placeholder="0.50"
                          className="h-8 text-xs min-w-20"
                        />
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.box_wt}
                          onChange={(e) => handleItemChange(index, "box_wt", e.target.value)}
                          placeholder="5.00"
                          className="h-8 text-xs min-w-20"
                        />
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2">
                        <Input
                          value={item.box_no}
                          onChange={(e) => handleItemChange(index, "box_no", e.target.value)}
                          placeholder="BOX-101"
                          className="h-8 text-xs min-w-[100px]"
                        />
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2">
                        <Input
                          value={item.remarks}
                          onChange={(e) => handleItemChange(index, "remarks", e.target.value)}
                          placeholder="Handle with care"
                          className="h-8 text-xs min-w-[120px]"
                        />
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={formData.delivery_items.length === 1}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button type="submit" disabled={isSubmitting} className="flex-1 text-sm sm:text-base h-10 sm:h-11">
            {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Create"} Delivery Challan
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 bg-transparent text-sm sm:text-base h-10 sm:h-11"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}