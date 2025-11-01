"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, FileText } from "lucide-react"

export default function EditDeliverablePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [formData, setFormData] = useState({
    irsProjectId: "",
    irsPassword: "",
    documentTitle: "",
    documentNumber: "",
    latestRevisionNumber: "0",
    planCategory: "",
    status: "DRAFT",
    transmittalDate: null as Date | null,
    submittedDate: null as Date | null,
    approvedDate: null as Date | null,
    reminderDays: 30,
    remarks: "",
    invoiceRaised: false,
    planMadeBy: "",
    planWithIRS: "",
    contactDetails: "",
  })

  const projectId = params.id as string
  const deliverableId = params.deliverableId as string

  const planCategories = [
    "General Arrangement",
    "Lines Plan",
    "Capacity Plan",
    "Structural Plan",
    "Machinery Arrangement",
    "Electrical Plan",
    "Safety Plan",
    "Stability Calculation",
    "Load Line Calculation",
    "Tonnage Calculation",
    "Fire Safety Plan",
    "Life Saving Appliances",
    "Navigation Equipment",
    "Radio Equipment",
    "Other",
  ]

  const statusOptions = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "REVISION_REQUIRED"]

  useEffect(() => {
    fetchDeliverable()
  }, [deliverableId])

  const fetchDeliverable = async () => {
    try {
      setFetchLoading(true)
      const response = await fetch(`/api/projects/${projectId}/deliverables/${deliverableId}`)
      if (!response.ok) throw new Error("Failed to fetch deliverable")

      const data = await response.json()
      setFormData({
        irsProjectId: data.irsProjectId || "",
        irsPassword: data.irsPassword || "",
        documentTitle: data.documentTitle || "",
        documentNumber: data.documentNumber || "",
        latestRevisionNumber: data.latestRevisionNumber || "0",
        planCategory: data.planCategory || "",
        status: data.status || "DRAFT",
        transmittalDate: data.transmittalDate ? new Date(data.transmittalDate) : null,
        submittedDate: data.submittedDate ? new Date(data.submittedDate) : null,
        approvedDate: data.approvedDate ? new Date(data.approvedDate) : null,
        reminderDays: data.reminderDays || 30,
        remarks: data.remarks || "",
        invoiceRaised: data.invoiceRaised || false,
        planMadeBy: data.planMadeBy || "",
        planWithIRS: data.planWithIRS || "",
        contactDetails: data.contactDetails || "",
      })
    } catch (error) {
      console.error("Error fetching deliverable:", error)
      toast({
        title: "Error",
        description: "Failed to load deliverable details",
        variant: "destructive",
      })
    } finally {
      setFetchLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (name: string, date: Date | null) => {
    setFormData((prev) => ({ ...prev, [name]: date }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/deliverables/${deliverableId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error occurred" }))
        throw new Error(errorData.message || "Failed to update deliverable")
      }

      toast({
        title: "Success",
        description: "Deliverable updated successfully",
      })

      router.push(`/projects/${projectId}/deliverables`)
      router.refresh()
    } catch (error) {
      console.error("Error updating deliverable:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update deliverable",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading deliverable...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}/deliverables`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Deliverable</h1>
          <p className="text-gray-600">Update plan deliverable information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Deliverable Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="irsProjectId">IRS Project ID *</Label>
                <Input
                  id="irsProjectId"
                  name="irsProjectId"
                  value={formData.irsProjectId}
                  onChange={handleChange}
                  placeholder="e.g., IRS/2024/001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="irsPassword">IRS Password</Label>
                <Input
                  id="irsPassword"
                  name="irsPassword"
                  value={formData.irsPassword}
                  onChange={handleChange}
                  placeholder="IRS system password"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="documentTitle">Document/Plan Title *</Label>
              <Input
                id="documentTitle"
                name="documentTitle"
                value={formData.documentTitle}
                onChange={handleChange}
                placeholder="e.g., General Arrangement Plan"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="documentNumber">Document Number</Label>
                <Input
                  id="documentNumber"
                  name="documentNumber"
                  value={formData.documentNumber}
                  onChange={handleChange}
                  placeholder="e.g., GCS-GA-001"
                />
              </div>
              <div>
                <Label htmlFor="latestRevisionNumber">Latest Revision Number</Label>
                <Input
                  id="latestRevisionNumber"
                  name="latestRevisionNumber"
                  value={formData.latestRevisionNumber}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="reminderDays">Reminder Days</Label>
                <Input
                  id="reminderDays"
                  name="reminderDays"
                  type="number"
                  value={formData.reminderDays}
                  onChange={handleChange}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="planCategory">Plan Category</Label>
                <Select
                  value={formData.planCategory}
                  onValueChange={(value) => handleSelectChange("planCategory", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan category" />
                  </SelectTrigger>
                  <SelectContent>
                    {planCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
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
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Transmittal Date</Label>
                <DatePicker
                  date={formData.transmittalDate}
                  setDate={(date) => handleDateChange("transmittalDate", date)}
                />
              </div>
              <div>
                <Label>Submitted Date</Label>
                <DatePicker date={formData.submittedDate} setDate={(date) => handleDateChange("submittedDate", date)} />
              </div>
              <div>
                <Label>Approved Date</Label>
                <DatePicker date={formData.approvedDate} setDate={(date) => handleDateChange("approvedDate", date)} />
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="planMadeBy">Plan Made By</Label>
                <Input
                  id="planMadeBy"
                  name="planMadeBy"
                  value={formData.planMadeBy}
                  onChange={handleChange}
                  placeholder="Designer/Engineer name"
                />
              </div>
              <div>
                <Label htmlFor="planWithIRS">Plan With (in IRS)</Label>
                <Input
                  id="planWithIRS"
                  name="planWithIRS"
                  value={formData.planWithIRS}
                  onChange={handleChange}
                  placeholder="IRS reference"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contactDetails">Contact Details</Label>
              <Input
                id="contactDetails"
                name="contactDetails"
                value={formData.contactDetails}
                onChange={handleChange}
                placeholder="Contact person details"
              />
            </div>

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Additional notes or comments"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="invoiceRaised"
                checked={formData.invoiceRaised}
                onCheckedChange={(checked) => handleCheckboxChange("invoiceRaised", checked as boolean)}
              />
              <Label htmlFor="invoiceRaised">Invoice Raised</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" asChild>
              <Link href={`/projects/${projectId}/deliverables`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Updating..." : "Update Deliverable"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
