"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Loader2 } from "lucide-react"

interface BudgetFormProps {
  budget?: any
  isEditing?: boolean
}

export function BudgetForm({ budget, isEditing = false }: BudgetFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState([])
  const [formData, setFormData] = useState({
    name: budget?.name || "",
    description: budget?.description || "",
    fiscalYear: budget?.fiscalYear || new Date().getFullYear().toString(),
    department: budget?.department || "",
    totalAmount: budget?.totalAmount || 0,
    allocatedAmount: budget?.allocatedAmount || 0,
    spentAmount: budget?.spentAmount || 0,
    status: budget?.status || "PLANNING",
    startDate: budget?.startDate ? new Date(budget.startDate) : new Date(),
    endDate: budget?.endDate ? new Date(budget.endDate) : new Date(new Date().getFullYear(), 11, 31),
  })

  useEffect(() => {
    fetchDepartments()
  }, [])

  useEffect(() => {
    // Calculate remaining amount
    const remaining = formData.totalAmount - formData.spentAmount
    setFormData((prev) => ({
      ...prev,
      remainingAmount: remaining,
    }))
  }, [formData.totalAmount, formData.spentAmount])

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments")
      if (!response.ok) throw new Error("Failed to fetch departments")
      const data = await response.json()
      setDepartments(data)

      // Set default department if creating new budget and departments exist
      if (!isEditing && data.length > 0 && !formData.department) {
        setFormData((prev) => ({ ...prev, department: data[0].name }))
      }
    } catch (error) {
      console.error("Error fetching departments:", error)
      toast({
        title: "Error",
        description: "Failed to load departments",
        variant: "destructive",
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Handle numeric inputs
    if (name === "totalAmount" || name === "allocatedAmount" || name === "spentAmount") {
      setFormData((prev) => ({ ...prev, [name]: Number.parseFloat(value) || 0 }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const generateFiscalYears = () => {
    const currentYear = new Date().getFullYear()
    const years = []

    for (let i = currentYear - 2; i <= currentYear + 3; i++) {
      years.push(i.toString())
    }

    return years
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        remainingAmount: formData.totalAmount - formData.spentAmount,
      }

      const url = isEditing ? `/api/finance/budgets/${budget.id}` : "/api/finance/budgets"

      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Failed to save budget")

      toast({
        title: "Success",
        description: `Budget ${isEditing ? "updated" : "created"} successfully`,
      })

      router.push("/finance/budgets")
      router.refresh()
    } catch (error) {
      console.error("Error saving budget:", error)
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} budget`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Budget" : "Create New Budget"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Budget Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter budget name"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Budget description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fiscalYear">Fiscal Year</Label>
              <Select value={formData.fiscalYear} onValueChange={(value) => handleSelectChange("fiscalYear", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fiscal year" />
                </SelectTrigger>
                <SelectContent>
                  {generateFiscalYears().map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Select value={formData.department} onValueChange={(value) => handleSelectChange("department", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <DatePicker
                date={formData.startDate}
                setDate={(date) => setFormData((prev) => ({ ...prev, startDate: date }))}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <DatePicker
                date={formData.endDate}
                setDate={(date) => setFormData((prev) => ({ ...prev, endDate: date }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="totalAmount">Total Budget Amount</Label>
              <Input
                id="totalAmount"
                name="totalAmount"
                type="number"
                step="0.01"
                value={formData.totalAmount}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="allocatedAmount">Allocated Amount</Label>
              <Input
                id="allocatedAmount"
                name="allocatedAmount"
                type="number"
                step="0.01"
                value={formData.allocatedAmount}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="spentAmount">Spent Amount</Label>
              <Input
                id="spentAmount"
                name="spentAmount"
                type="number"
                step="0.01"
                value={formData.spentAmount}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNING">Planning</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="OVERBUDGET">Over Budget</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Saving..." : "Save Budget"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
