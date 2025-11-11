// app/vessels/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowLeft, 
  Pencil, 
  Loader2, 
  Ship, 
  MapPin, 
  Calendar, 
  Building, 
  Trash,
  Ruler,
  Weight,
  Anchor
} from "lucide-react"
import { useGetSingleVesselQuery, useDeleteVesselMutation } from "@/redux/Service/vessel"

// Add AlertDialog import
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function VesselDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const vesselId = params.id as string

  const { data: vessel, isLoading, error } = useGetSingleVesselQuery(vesselId)
  const [deleteVessel] = useDeleteVesselMutation()
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load vessel details",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleDeleteVessel = async () => {
    try {
      setIsDeleting(true)
      await deleteVessel(vesselId).unwrap()

      toast({
        title: "Success",
        description: "Vessel deleted successfully",
      })

      router.push("/vessels")
      router.refresh()
    } catch (error) {
      console.error("Error deleting vessel:", error)
      toast({
        title: "Error",
        description: "Failed to delete vessel. Please try again.",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" onClick={() => router.push("/vessels")} className="mb-4 sm:mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="md:col-span-2 h-64 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !vessel) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" onClick={() => router.push("/vessels")} className="mb-4 sm:mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="mt-8 text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-red-600">Vessel Not Found</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Button variant="outline" onClick={() => router.push("/vessels")} className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              size="sm" 
              onClick={() => router.push(`/vessels/${vesselId}/edit`)} 
              className="flex-1 sm:flex-none"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            {/* Delete Button with AlertDialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex-1 sm:flex-none text-white">
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the vessel 
                    "{vessel.name}" and remove it from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteVessel}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Main Header */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl truncate flex items-center gap-2">
                  <Ship className="h-6 w-6 text-blue-600" />
                  {vessel.name}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {vessel.flag_state || "Flag state not specified"}
                </p>
              </div>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-sm sm:text-base px-3 py-1 whitespace-nowrap flex items-center gap-1.5">
                <Ship className="h-4 w-4" />
                {vessel.type || "Vessel"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Vessel Details */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Vessel Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">IMO Number</p>
                <p className="font-semibold text-sm sm:text-base">{vessel.imo_number || "N/A"}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Vessel Type</p>
                <p className="font-semibold text-sm sm:text-base">{vessel.type || "N/A"}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Flag State</p>
                <p className="font-semibold text-sm sm:text-base flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {vessel.flag_state || "N/A"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Classification Society</p>
                <p className="font-semibold text-sm sm:text-base">{vessel.classification_society || "N/A"}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Class Notation</p>
                <p className="font-semibold text-sm sm:text-base">{vessel.class_notation || "N/A"}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Build Year</p>
                <p className="font-semibold text-sm sm:text-base flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {vessel.build_year || "N/A"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                <p className="text-xs sm:text-sm text-gray-600">Shipyard</p>
                <p className="font-semibold text-sm sm:text-base flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {vessel.shipyard || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specifications & Additional Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Dimensions */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Ruler className="h-4 w-4 text-gray-600" />
                Dimensions & Tonnage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Length Overall</p>
                  <p className="font-semibold text-sm sm:text-base">
                    {vessel.length_overall ? `${vessel.length_overall}m` : "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Breadth</p>
                  <p className="font-semibold text-sm sm:text-base">
                    {vessel.breadth ? `${vessel.breadth}m` : "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Depth</p>
                  <p className="font-semibold text-sm sm:text-base">
                    {vessel.depth ? `${vessel.depth}m` : "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Gross Tonnage</p>
                  <p className="font-semibold text-sm sm:text-base flex items-center gap-1">
                    <Weight className="w-4 h-4" />
                    {vessel.gross_tonnage ? `${vessel.gross_tonnage.toLocaleString()} GT` : "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Net Tonnage</p>
                  <p className="font-semibold text-sm sm:text-base flex items-center gap-1">
                    <Weight className="w-4 h-4" />
                    {vessel.net_tonnage ? `${vessel.net_tonnage.toLocaleString()} NT` : "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                  <p className="text-xs sm:text-sm text-gray-600">Deadweight</p>
                  <p className="font-semibold text-sm sm:text-base flex items-center gap-1">
                    <Anchor className="w-4 h-4" />
                    {vessel.deadweight ? `${vessel.deadweight.toLocaleString()} DWT` : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

         
        </div>

        {/* Additional Information */}
        {(vessel.additional_notes || vessel.registration_number) && (
          <Card className="mt-4 sm:mt-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {vessel.registration_number && (
                  <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                    <p className="text-xs sm:text-sm text-gray-600">Registration Number</p>
                    <p className="font-semibold text-sm sm:text-base">{vessel.registration_number}</p>
                  </div>
                )}
                {vessel.call_sign && (
                  <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                    <p className="text-xs sm:text-sm text-gray-600">Call Sign</p>
                    <p className="font-semibold text-sm sm:text-base">{vessel.call_sign}</p>
                  </div>
                )}
                {vessel.port_of_registry && (
                  <div className="bg-gray-50 p-3 sm:p-4 rounded border">
                    <p className="text-xs sm:text-sm text-gray-600">Port of Registry</p>
                    <p className="font-semibold text-sm sm:text-base">{vessel.port_of_registry}</p>
                  </div>
                )}
              </div>
              
              {vessel.additional_notes && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-sm mb-2 text-yellow-800">Additional Notes</h4>
                  <p className="text-sm text-yellow-700 whitespace-pre-wrap">{vessel.additional_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}