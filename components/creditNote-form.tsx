"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useGetCustomersQuery } from "@/redux/Service/customer";
import { useGetInvoicesQuery } from "@/redux/Service/invoice";
import { useGetVesselsQuery } from "@/redux/Service/vessel";
import {
  useAddCreditNoteMutation,
  useUpdateCreditNoteMutation,
  useUpdateCreditNoteItemMutation,
} from "@/redux/Service/credit-notes";
import { useToast } from "@/hooks/use-toast";

interface CreditNoteItem {
  id?: string;
  description: string;
  quantity: number;
  rate: string;
}

interface CreditNoteFormData {
  note_no: string;
  date: string;
  status: string;
  customer_id: string;
  contact_person: string;
  contact_email: string;
  contact_number: string;
  invoice_id: string;
  place_of_supply: string;
  P_O_no: string;
  reference: string;
  vessel_id: string;
  items: CreditNoteItem[];
}

interface CreditNoteFormProps {
  initialData?: CreditNoteFormData;
  creditNoteId?: string;
}

export default function CreditNoteForm({
  initialData,
  creditNoteId,
}: CreditNoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Fetch customers, invoices, and vessels
  const { data: customers, isLoading: customersLoading } = useGetCustomersQuery(
    {}
  );
  const { data: invoices, isLoading: invoicesLoading } = useGetInvoicesQuery(
    {}
  );
  const { data: vessels, isLoading: vesselsLoading } = useGetVesselsQuery({});

  // Add and update mutations
  const [addCreditNote, { isLoading: isAdding }] = useAddCreditNoteMutation();
  const [updateCreditNote, { isLoading: isUpdating }] =
    useUpdateCreditNoteMutation();
  const [updateCreditNoteItem] = useUpdateCreditNoteItemMutation();

  const isSubmitting = isAdding || isUpdating;
  const isEditMode = !!creditNoteId;

  const [formData, setFormData] = useState<CreditNoteFormData>(
    initialData || {
      note_no: "",
      date: new Date().toISOString().split("T")[0],
      status: "draft",
      customer_id: "",
      contact_person: "",
      contact_email: "",
      contact_number: "",
      invoice_id: "",
      place_of_supply: "",
      P_O_no: "",
      reference: "",
      vessel_id: "",
      items: [
        {
          description: "",
          quantity: 1,
          rate: "0.00",
        },
      ],
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (
    index: number,
    field: keyof CreditNoteItem,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: "",
          quantity: 1,
          rate: "0.00",
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditMode && creditNoteId) {
        // Update existing credit note - first update details without items
        const { items, ...creditNoteDetails } = formData;
        await updateCreditNote({ id: creditNoteId, ...creditNoteDetails }).unwrap();

        // Then update each item individually by item ID
        const itemUpdatePromises = items
          .filter((item) => item.id) // Only update items that have IDs
          .map((item) =>
            updateCreditNoteItem({
              itemId: item.id,
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
            }).unwrap()
          );

        await Promise.all(itemUpdatePromises);

        toast({
          title: "Success",
          description: "Credit Note updated successfully",
        });
      } else {
        // Create new credit note
        await addCreditNote(formData).unwrap();
        toast({
          title: "Success",
          description: "Credit Note created successfully",
        });
      }

      router.push("/sales/creditnote");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : `Failed to ${isEditMode ? "update" : "create"} credit note`,
        variant: "destructive",
      });

      console.error("Error submitting credit note form:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 ">
      {/* Credit Note Header */}
      <Card className="p-4 sm:p-6">
        {/* <h2 className="text-lg sm:text-xl font-semibold mb-4">
          {isEditMode ? "Edit" : "Create"} Credit Note
        </h2> */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label htmlFor="note_no" className="text-sm sm:text-base">
              Credit Note No.
            </Label>
            <Input
              id="note_no"
              name="note_no"
              value={formData.note_no}
              onChange={handleChange}
              placeholder="CN-2025-001"
              required
              className="text-sm sm:text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm sm:text-base">
              Date
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="text-sm sm:text-base"
            />
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="status" className="text-sm sm:text-base">
              Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Customer, Invoice, and Vessel Selection */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          Customer & Invoice Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label htmlFor="customer" className="text-sm sm:text-base">
              Customer
            </Label>
            <Select
              value={formData.customer_id}
              onValueChange={(value) =>
                handleSelectChange("customer_id", value)
              }
            >
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customersLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  customers?.map(
                    (customer: {
                      id: string;
                      contacts: {
                        first_name: string;
                        last_name: string;
                        designation: string;
                      }[];
                    }) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer?.contacts[0].first_name}{" "}
                        {customer?.contacts[0].last_name} -{" "}
                        {customer?.contacts[0].designation}
                      </SelectItem>
                    )
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice" className="text-sm sm:text-base">
              Invoice
            </Label>
            <Select
              value={formData.invoice_id}
              onValueChange={(value) => handleSelectChange("invoice_id", value)}
            >
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="Select invoice" />
              </SelectTrigger>
              <SelectContent>
                {invoicesLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  invoices?.map(
                    (invoice: {
                      id: string;
                      invoice_no: string;
                      total_amount: string;
                      customer: string;
                    }) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoice_no} - ₹{invoice.total_amount}
                      </SelectItem>
                    )
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="vessel" className="text-sm sm:text-base">
              Vessel
            </Label>
            <Select
              value={formData.vessel_id}
              onValueChange={(value) => handleSelectChange("vessel_id", value)}
            >
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="Select vessel" />
              </SelectTrigger>
              <SelectContent>
                {vesselsLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  vessels?.map(
                    (vessel: { id: string; name: string; type: string }) => (
                      <SelectItem key={vessel.id} value={vessel.id}>
                        {vessel.name} - {vessel.type}
                      </SelectItem>
                    )
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Contact Details */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          Contact Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact_person" className="text-sm sm:text-base">
              Contact Person
            </Label>
            <Input
              id="contact_person"
              name="contact_person"
              value={formData.contact_person}
              onChange={handleChange}
              placeholder="Contact person name"
              className="text-sm sm:text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_email" className="text-sm sm:text-base">
              Email
            </Label>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={handleChange}
              placeholder="email@example.com"
              className="text-sm sm:text-base"
            />
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="contact_number" className="text-sm sm:text-base">
              Contact Number
            </Label>
            <Input
              id="contact_number"
              name="contact_number"
              value={formData.contact_number}
              onChange={handleChange}
              placeholder="9876543210"
              className="text-sm sm:text-base"
            />
          </div>
        </div>
      </Card>

      {/* Additional Information */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          Additional Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label htmlFor="place_of_supply" className="text-sm sm:text-base">
              Place of Supply
            </Label>
            <Input
              id="place_of_supply"
              name="place_of_supply"
              value={formData.place_of_supply}
              onChange={handleChange}
              placeholder="Mumbai"
              className="text-sm sm:text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="P_O_no" className="text-sm sm:text-base">
              P.O. No.
            </Label>
            <Input
              id="P_O_no"
              name="P_O_no"
              value={formData.P_O_no}
              onChange={handleChange}
              placeholder="PO-5567"
              className="text-sm sm:text-base"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="reference" className="text-sm sm:text-base">
              Reference
            </Label>
            <Textarea
              id="reference"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="Credit for overcharge"
              rows={2}
              className="text-sm sm:text-base"
            />
          </div>
        </div>
      </Card>

     <Card className="p-4 sm:p-6">
  <h2 className="text-lg sm:text-xl font-semibold mb-4">Items</h2>
  
  {/* Mobile Cards View - Hidden on medium screens and up */}
  <div className="md:hidden space-y-4 mb-4">
    {formData.items.map((item, index) => (
      <div key={index} className="border border-border rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="text-sm font-medium text-muted-foreground">
            Item {index + 1}
          </div>
          {formData.items.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
              className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              value={item.description}
              onChange={(e) =>
                handleItemChange(index, "description", e.target.value)
              }
              placeholder="Item description"
              className="min-h-16 text-sm"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Quantity</Label>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(
                    index,
                    "quantity",
                    Number.parseInt(e.target.value) || 1
                  )
                }
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Rate (₹)</Label>
              <Input
                type="text"
                value={item.rate}
                onChange={(e) =>
                  handleItemChange(index, "rate", e.target.value)
                }
                placeholder="0.00"
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>

  {/* Desktop Table View - Hidden on mobile */}
  <div className="hidden md:block overflow-x-auto mb-4">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border">
          <th className="px-4 py-2 text-left font-semibold text-sm">
            Sr. No.
          </th>
          <th className="px-4 py-2 text-left font-semibold text-sm">
            Description
          </th>
          <th className="px-4 py-2 text-right font-semibold text-sm">
            Quantity
          </th>
          <th className="px-4 py-2 text-right font-semibold text-sm">
            Rate (₹)
          </th>
          <th className="px-4 py-2 text-center font-semibold text-sm">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {formData.items.map((item, index) => (
          <tr
            key={index}
            className="border-b border-border hover:bg-muted/50"
          >
            <td className="px-4 py-2 text-muted-foreground text-sm">
              {index + 1}
            </td>
            <td className="px-4 py-2">
              <Textarea
                value={item.description}
                onChange={(e) =>
                  handleItemChange(index, "description", e.target.value)
                }
                placeholder="Item description"
                className="min-h-10 text-sm"
                rows={2}
              />
            </td>
            <td className="px-4 py-2">
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(
                    index,
                    "quantity",
                    Number.parseInt(e.target.value) || 1
                  )
                }
                className="text-right text-sm w-20"
              />
            </td>
            <td className="px-4 py-2">
              <Input
                type="text"
                value={item.rate}
                onChange={(e) =>
                  handleItemChange(index, "rate", e.target.value)
                }
                placeholder="0.00"
                className="text-right text-sm w-24"
              />
            </td>
            <td className="px-4 py-2 text-center">
              {formData.items.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-700 h-9 w-9 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  <Button
    type="button"
    variant="outline"
    onClick={addItem}
    className="w-full text-sm sm:text-base"
  >
    <Plus className="w-4 h-4 mr-2" />
    Add Item
  </Button>
</Card>

      {/* Submit Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/sales/creditnotes")}
          className="order-2 sm:order-1 text-sm sm:text-base"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="order-1 sm:order-2 text-sm sm:text-base"
        >
          {isSubmitting
            ? "Saving..."
            : isEditMode
            ? "Update Credit Note"
            : "Create Credit Note"}
        </Button>
      </div>
    </form>
  );
}