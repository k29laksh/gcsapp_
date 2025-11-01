"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface POItem {
  description: string
  quantity: number
  unitPrice: number
  tax: number
  total: number
  hsn: string
  sacCode: string
}

export default function NewPOPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState([])
  const [projects, setProjects] = useState([])
  const [poNumber, setPONumber] = useState("")

  const [formData, setFormData] = useState({
    poNumber: "",
    date: new Date().toISOString().split("T")[0],
    vendorId: "",
    projectId: "",
    notes: "",
    status: "DRAFT",
  })

  const [items, setItems] = useState<POItem[]>([
    {
      description: "",
      quantity: 1,
      unitPrice: 0,
      tax: 0,
      total: 0,
      hsn: "",
      sacCode: "",
    },
  ])

  useEffect(() => {
    fetchVendors()
    fetchProjects()
    generatePONumber()
  }, [])

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/purchase/vendor")
      if (response.ok) {
        const data = await response.json()
        setVendors(data)
      }
    } catch (error) {
      console.error("Error fetching vendors:", error)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  const generatePONumber = async () => {
    try {
      const response = await fetch("/api/generate-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "po" }),
      })
      if (response.ok) {
        const data = await response.json()
        setPONumber(data.number)
        setFormData((prev) => ({ ...prev, poNumber: data.number }))
      }
    } catch (error) {
      console.error("Error generating PO number:", error)
    }
  }

  const calculateItemTotal = (item: POItem) => {
    const subtotal = item.quantity * item.unitPrice
    const taxAmount = (subtotal * item.tax) / 100
    return subtotal + taxAmount
  }

  const updateItem = (index: number, field: keyof POItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Recalculate total
    updatedItems[index].total = calculateItemTotal(updatedItems[index])

    setItems(updatedItems)
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        tax: 0,
        total: 0,
        hsn: "",
        sacCode: "",
      },
    ])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const tax = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.tax) / 100, 0)
    const total = subtotal + tax

    return { subtotal, tax, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { subtotal, tax, total } = calculateTotals()

      const response = await fetch("/api/purchase/po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items,
          subtotal,
          tax,
          total,
        }),
      })

      if (response.ok) {
        toast.success("Purchase order created successfully")
        router.push("/purchase/po")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to create purchase order")
      }
    } catch (error) {
      toast.error("An error occurred while creating the purchase order")
    } finally {
      setLoading(false)
    }
  }

  const { subtotal, tax, total } = calculateTotals()

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Purchase Order</h1>
        <p className="text-muted-foreground">Create a new purchase order</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="poNumber">PO Number</Label>
                <Input
                  id="poNumber"
                  value={formData.poNumber}
                  onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="RECEIVED">Received</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vendorId">Vendor</Label>
                <Select
                  value={formData.vendorId}
                  onValueChange={(value) => setFormData({ ...formData, vendorId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor: any) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="projectId">Project (Optional)</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Project</SelectItem>
                    {projects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Items</CardTitle>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-8 gap-4 p-4 border rounded-lg">
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      placeholder="Item description"
                      required
                    />
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", Number.parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, "unitPrice", Number.parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <Label>Tax (%)</Label>
                    <Input
                      type="number"
                      value={item.tax}
                      onChange={(e) => updateItem(index, "tax", Number.parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label>HSN</Label>
                    <Input
                      value={item.hsn}
                      onChange={(e) => updateItem(index, "hsn", e.target.value)}
                      placeholder="HSN Code"
                    />
                  </div>
                  <div>
                    <Label>Total</Label>
                    <Input value={item.total.toFixed(2)} readOnly />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 text-right">
              <div className="flex justify-end space-x-4">
                <span>Subtotal: ₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-end space-x-4">
                <span>Tax: ₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-end space-x-4 text-lg font-semibold">
                <span>Total: ₹{total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Purchase Order"}
          </Button>
        </div>
      </form>
    </div>
  )
}
