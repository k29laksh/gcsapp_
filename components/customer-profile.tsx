// components/profile-component.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUpdateCustomerMutation } from "@/redux/Service/customer"

interface ProfileComponentProps {
  customerId: string
  customerData: {
    customer_type: string
    company_name: string
    gst_number: string
    pan_number: string
    gst_state: string
    gst_type: string
    credit_terms_days: number
    credit_limit: number
  }
}

export function ProfileComponent({ customerId, customerData }: ProfileComponentProps) {
  const { toast } = useToast()
  const [updateCustomer, { isLoading }] = useUpdateCustomerMutation()

  const [formData, setFormData] = useState({
    customer_type: customerData.customer_type || "Company",
    company_name: customerData.company_name || "",
    gst_number: customerData.gst_number || "",
    pan_number: customerData.pan_number || "",
    gst_state: customerData.gst_state || "",
    gst_type: customerData.gst_type || "Regular",
    credit_terms_days: customerData.credit_terms_days || 30,
    credit_limit: customerData.credit_limit || 0,
  })

  useEffect(() => {
    setFormData({
      customer_type: customerData.customer_type,
      company_name: customerData.company_name || "",
      gst_number: customerData.gst_number || "",
      pan_number: customerData.pan_number || "",
      gst_state: customerData.gst_state || "",
      gst_type: customerData.gst_type || "Regular",
      credit_terms_days: customerData.credit_terms_days,
      credit_limit: customerData.credit_limit,
    })
  }, [customerData])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload = {
        customer_type: formData.customer_type,
        company_name: formData.customer_type === "Company" ? formData.company_name : null,
        gst_number: formData.gst_number || null,
        pan_number: formData.pan_number || null,
        gst_state: formData.gst_state,
        gst_type: formData.gst_type,
        credit_terms_days: formData.credit_terms_days,
        credit_limit: formData.credit_limit,
      }

      await updateCustomer({ id: customerId, ...payload }).unwrap()
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating profile:", error)
      
      let errorMessage = "Failed to update profile"
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
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
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Profile"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}