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
import { Loader2 } from "lucide-react"
import { useAddInquiryMutation, useUpdateInquiryMutation, useGetSingleInquiryQuery } from "@/redux/Service/inquiry"
import { useGetEmployeeQuery } from "@/redux/Service/employee"

interface InquiryFormProps {
  inquiryId?: string
  isEditing?: boolean
}

export function InquiryForm({ inquiryId, isEditing = false }: InquiryFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // RTK Query hooks
  const { data: inquiryData, isLoading: isLoadingInquiry } = useGetSingleInquiryQuery(inquiryId!, { skip: !isEditing || !inquiryId })
  const [addInquiry, { isLoading: isAdding }] = useAddInquiryMutation()
  const [updateInquiry, { isLoading: isUpdating }] = useUpdateInquiryMutation()
  const { data: employees = [], isLoading: isLoadingEmployees } = useGetEmployeeQuery({})

  const loading = isAdding || isUpdating

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    subject: "",
    requirements: "",
    source: "Email",
    status: "Pending",
    budget: "",
    timeline: "",
    assigned_to: "unassigned",
    follow_up_date: "",
    notes: "",
  })

  // Set form data when inquiry data is loaded for editing
  useEffect(() => {
    if (isEditing && inquiryData) {
      setFormData({
        date: inquiryData.date || new Date().toISOString().split('T')[0],
        subject: inquiryData.subject || "",
        requirements: inquiryData.requirements || "",
        source: inquiryData.source || "Email",
        status: inquiryData.status || "Pending",
        budget: inquiryData.budget?.toString() || "",
        timeline: inquiryData.timeline || "",
        assigned_to: inquiryData.assigned_to || "unassigned",
        follow_up_date: inquiryData.follow_up_date || "",
        notes: inquiryData.notes || "",
      })
    }
  }, [inquiryData, isEditing])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Prepare data for API - convert "unassigned" to empty string
      const submitData = {
        date: formData.date,
        subject: formData.subject,
        requirements: formData.requirements,
        source: formData.source,
        status: formData.status,
        budget: formData.budget ? parseInt(formData.budget) : 0,
        timeline: formData.timeline,
        assigned_to: formData.assigned_to === "unassigned" ? "" : formData.assigned_to,
        follow_up_date: formData.follow_up_date || undefined,
        notes: formData.notes,
      }

      if (isEditing && inquiryId) {
        await updateInquiry({
          id: inquiryId,
          ...submitData
        }).unwrap()
        
        toast({
          title: "Success",
          description: "Inquiry updated successfully",
        })
      } else {
        await addInquiry(submitData).unwrap()
        
        toast({
          title: "Success",
          description: "Inquiry created successfully",
        })
      }

      router.push("/sales/inquiry")
      router.refresh()
    } catch (error) {
      console.error("Error saving inquiry:", error)
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} inquiry`,
        variant: "destructive",
      })
    }
  }

  if (isEditing && isLoadingInquiry) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading inquiry...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Inquiry" : "New Inquiry"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="date">Inquiry Date *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="follow_up_date">Follow-up Date</Label>
              <Input
                id="follow_up_date"
                name="follow_up_date"
                type="date"
                value={formData.follow_up_date}
                onChange={handleChange}
                className="w-full"
                min={formData.date} // Optional: set min date to inquiry date
              />
            </div>
          </div>

          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Brief description of the inquiry"
              required
            />
          </div>

          <div>
            <Label htmlFor="requirements">Requirements *</Label>
            <Textarea
              id="requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="Detailed requirements from the client"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="source">Source</Label>
              <Select value={formData.source} onValueChange={(value) => handleSelectChange("source", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Social Media">Social Media</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="budget">Budget (₹)</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                placeholder="Client's budget if known"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="timeline">Timeline</Label>
              <Input
                id="timeline"
                name="timeline"
                value={formData.timeline}
                onChange={handleChange}
                placeholder="Expected completion timeframe"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="assigned_to">Assigned To</Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(value) => handleSelectChange("assigned_to", value)}
            >
              <SelectTrigger>
                <SelectValue>
                  {formData.assigned_to === "unassigned" 
                    ? "Unassigned" 
                    : employees.find((emp: any) => emp.id === formData.assigned_to) 
                      ? `${employees.find((emp: any) => emp.id === formData.assigned_to).name}`
                      : "Select employee"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {isLoadingEmployees ? (
                  <SelectItem value="loading" disabled>Loading employees...</SelectItem>
                ) : (
                  employees.map((employee: any) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} {employee.job_title ? `- ${employee.job_title}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about the inquiry"
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Saving..." : "Save Inquiry"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}