// components/vessel-form.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import {
  useAddVesselMutation,
  useUpdateVesselMutation,
} from "@/redux/Service/vessel"
import { useGetCustomersQuery } from "@/redux/Service/customer"

interface VesselFormProps {
  vessel?: any
  isEditing?: boolean
}

export function VesselForm({ vessel, isEditing = false }: VesselFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  // RTK Query hooks
  const [addVessel, { isLoading: isAdding }] = useAddVesselMutation()
  const [updateVessel, { isLoading: isUpdating }] = useUpdateVesselMutation()
  
  // Use RTK Query to get customers
  const { data: customers = [], isLoading: isLoadingCustomers, error: customersError } = useGetCustomersQuery()

  const [formData, setFormData] = useState({
    name: vessel?.name || "",
    imo_number: vessel?.imo_number || "",
    type: vessel?.type || "",
    owner: vessel?.owner || "",
    flag_state: vessel?.flag_state || "",
    classification_society: vessel?.classification_society || "",
    class_notation: vessel?.class_notation || "",
    build_year: vessel?.build_year || "",
    shipyard: vessel?.shipyard || "",
    length_overall: vessel?.length_overall || "",
    breadth: vessel?.breadth || "",
    depth: vessel?.depth || "",
    gross_tonnage: vessel?.gross_tonnage || "",
    net_tonnage: vessel?.net_tonnage || "",
    deadweight: vessel?.deadweight || "",
  })

  const isLoading = isAdding || isUpdating

  // Handle customer fetch errors
  useEffect(() => {
    if (customersError) {
      console.error("Error fetching customers:", customersError)
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      })
    }
  }, [customersError, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value === "" ? "" : Number.parseFloat(value) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Prepare the data in exact format required by API
      const payload = {
        name: formData.name,
        imo_number: formData.imo_number,
        type: formData.type,
        owner: formData.owner, // This will be the customer ID
        flag_state: formData.flag_state,
        classification_society: formData.classification_society,
        class_notation: formData.class_notation,
        build_year: formData.build_year ? parseInt(formData.build_year) : null,
        shipyard: formData.shipyard,
        length_overall: formData.length_overall ? parseFloat(formData.length_overall) : null,
        breadth: formData.breadth ? parseFloat(formData.breadth) : null,
        depth: formData.depth ? parseFloat(formData.depth) : null,
        gross_tonnage: formData.gross_tonnage ? parseInt(formData.gross_tonnage) : null,
        net_tonnage: formData.net_tonnage ? parseInt(formData.net_tonnage) : null,
        deadweight: formData.deadweight ? parseInt(formData.deadweight) : null,
      }

      console.log("Submitting vessel data:", payload)

      if (isEditing && vessel?.id) {
        await updateVessel({ id: vessel.id, ...payload }).unwrap()
        toast({
          title: "Success",
          description: "Vessel updated successfully",
        })
      } else {
        await addVessel(payload).unwrap()
        toast({
          title: "Success",
          description: "Vessel created successfully",
        })
      }

      router.push("/vessels")
      router.refresh()
    } catch (error: any) {
      console.error("Error saving vessel:", error)
      
      let errorMessage = `Failed to ${isEditing ? "update" : "create"} vessel`
      
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

  // Get display name for customer - FIXED VERSION
  const getCustomerDisplayName = (customer: any) => {
    // Use company_name if available
    if (customer.company_name) {
      return customer.company_name
    }
    
    // If no company_name, try to get primary contact name
    if (customer.contacts && customer.contacts.length > 0) {
      // Find primary contact first
      const primaryContact = customer.contacts.find((contact: any) => contact.is_primary)
      if (primaryContact) {
        return `${primaryContact.first_name} ${primaryContact.last_name}`.trim()
      }
      
      // If no primary contact, use first contact
      const firstContact = customer.contacts[0]
      return `${firstContact.first_name} ${firstContact.last_name}`.trim()
    }
    
    // Fallback to customer ID if no other info available
    return `Customer ${customer.id.slice(0, 8)}...`
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Vessel" : "Add New Vessel"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div>
                <Label htmlFor="name">Vessel Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Evergreen Marine"
                />
              </div>

              <div>
                <Label htmlFor="imo_number">IMO Number</Label>
                <Input
                  id="imo_number"
                  name="imo_number"
                  value={formData.imo_number}
                  onChange={handleChange}
                  placeholder="e.g., 9876543"
                />
              </div>

              <div>
                <Label htmlFor="type">Vessel Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vessel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Container Ship">Container Ship</SelectItem>
                    <SelectItem value="Bulk Carrier">Bulk Carrier</SelectItem>
                    <SelectItem value="Tanker">Tanker</SelectItem>
                    <SelectItem value="General Cargo">General Cargo</SelectItem>
                    <SelectItem value="Ro-Ro">Ro-Ro</SelectItem>
                    <SelectItem value="Passenger Ship">Passenger Ship</SelectItem>
                    <SelectItem value="Offshore Vessel">Offshore Vessel</SelectItem>
                    <SelectItem value="Tug">Tug</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="owner">Owner *</Label>
                <Select
                  value={formData.owner}
                  onValueChange={(value) => handleSelectChange("owner", value)}
                  disabled={isLoadingCustomers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingCustomers ? "Loading customers..." : "Select owner"} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.length > 0 ? (
                      customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {getCustomerDisplayName(customer)}
                          {customer.contacts && customer.contacts.length > 0 && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({customer.contacts.length} contact{customer.contacts.length !== 1 ? 's' : ''})
                            </span>
                          )}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        {isLoadingCustomers ? "Loading customers..." : "No customers found"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {isLoadingCustomers && (
                  <p className="text-sm text-muted-foreground mt-1">Loading customers...</p>
                )}
              </div>

              <div>
                <Label htmlFor="flag_state">Flag State</Label>
                <Input
                  id="flag_state"
                  name="flag_state"
                  value={formData.flag_state}
                  onChange={handleChange}
                  placeholder="e.g., Panama"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Classification & Build</h3>
              
              <div>
                <Label htmlFor="classification_society">Classification Society</Label>
                <Select
                  value={formData.classification_society}
                  onValueChange={(value) => handleSelectChange("classification_society", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select society" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNV">DNV</SelectItem>
                    <SelectItem value="ABS">ABS</SelectItem>
                    <SelectItem value="LR">Lloyd's Register</SelectItem>
                    <SelectItem value="BV">Bureau Veritas</SelectItem>
                    <SelectItem value="CCS">China Classification Society</SelectItem>
                    <SelectItem value="NK">Nippon Kaiji Kyokai</SelectItem>
                    <SelectItem value="RINA">RINA</SelectItem>
                    <SelectItem value="IRS">Indian Register of Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="class_notation">Class Notation</Label>
                <Input
                  id="class_notation"
                  name="class_notation"
                  value={formData.class_notation}
                  onChange={handleChange}
                  placeholder="e.g., 1A1 Container Carrier"
                />
              </div>

              <div>
                <Label htmlFor="build_year">Build Year</Label>
                <Input
                  id="build_year"
                  name="build_year"
                  type="number"
                  value={formData.build_year}
                  onChange={handleNumberChange}
                  placeholder="e.g., 2015"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>

              <div>
                <Label htmlFor="shipyard">Shipyard</Label>
                <Input
                  id="shipyard"
                  name="shipyard"
                  value={formData.shipyard}
                  onChange={handleChange}
                  placeholder="e.g., Samsung Heavy Industries"
                />
              </div>
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dimensions</h3>
              
              <div>
                <Label htmlFor="length_overall">Length Overall (m)</Label>
                <Input
                  id="length_overall"
                  name="length_overall"
                  type="number"
                  step="0.01"
                  value={formData.length_overall}
                  onChange={handleNumberChange}
                  placeholder="e.g., 399.94"
                />
              </div>

              <div>
                <Label htmlFor="breadth">Breadth (m)</Label>
                <Input
                  id="breadth"
                  name="breadth"
                  type="number"
                  step="0.01"
                  value={formData.breadth}
                  onChange={handleNumberChange}
                  placeholder="e.g., 59.00"
                />
              </div>

              <div>
                <Label htmlFor="depth">Depth (m)</Label>
                <Input
                  id="depth"
                  name="depth"
                  type="number"
                  step="0.01"
                  value={formData.depth}
                  onChange={handleNumberChange}
                  placeholder="e.g., 30.50"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tonnage</h3>
              
              <div>
                <Label htmlFor="gross_tonnage">Gross Tonnage</Label>
                <Input
                  id="gross_tonnage"
                  name="gross_tonnage"
                  type="number"
                  value={formData.gross_tonnage}
                  onChange={handleNumberChange}
                  placeholder="e.g., 220000"
                />
              </div>

              <div>
                <Label htmlFor="net_tonnage">Net Tonnage</Label>
                <Input
                  id="net_tonnage"
                  name="net_tonnage"
                  type="number"
                  value={formData.net_tonnage}
                  onChange={handleNumberChange}
                  placeholder="e.g., 110000"
                />
              </div>

              <div>
                <Label htmlFor="deadweight">Deadweight (DWT)</Label>
                <Input
                  id="deadweight"
                  name="deadweight"
                  type="number"
                  value={formData.deadweight}
                  onChange={handleNumberChange}
                  placeholder="e.g., 190000"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading || isLoadingCustomers}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || isLoadingCustomers}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditing ? "Update Vessel" : "Create Vessel"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}