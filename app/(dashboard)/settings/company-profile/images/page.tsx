"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload } from "lucide-react"
import Image from "next/image"

export default function CompanyImagesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [headerImage, setHeaderImage] = useState<File | null>(null)
  const [footerImage, setFooterImage] = useState<File | null>(null)
  const [headerImagePreview, setHeaderImagePreview] = useState<string | null>(null)
  const [footerImagePreview, setFooterImagePreview] = useState<string | null>(null)

  const handleHeaderImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setHeaderImage(file)
      setHeaderImagePreview(URL.createObjectURL(file))
    }
  }

  const handleFooterImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFooterImage(file)
      setFooterImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()

      if (headerImage) {
        formData.append("headerImage", headerImage)
      }

      if (footerImage) {
        formData.append("footerImage", footerImage)
      }

      const response = await fetch("/api/settings/upload-company-images", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload company images")
      }

      toast({
        title: "Success",
        description: "Company images uploaded successfully",
      })

      router.push("/settings/company-profile")
      router.refresh()
    } catch (error) {
      console.error("Error uploading company images:", error)
      toast({
        title: "Error",
        description: "Failed to upload company images",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Company Images</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Header Image</CardTitle>
              <CardDescription>
                This image will appear at the top of quotations, invoices, and other documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center rounded-md border border-dashed p-4">
                  {headerImagePreview ? (
                    <div className="relative h-40 w-full">
                      <Image
                        src={headerImagePreview || "/placeholder.svg"}
                        alt="Header Image Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-40 w-full flex-col items-center justify-center text-center text-muted-foreground">
                      <Upload className="mb-2 h-10 w-10" />
                      <p>Upload header image</p>
                      <p className="text-xs">Recommended size: 800 x 150 pixels</p>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="headerImage">Upload Header Image</Label>
                  <Input id="headerImage" type="file" accept="image/*" onChange={handleHeaderImageChange} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Footer Image</CardTitle>
              <CardDescription>
                This image will appear at the bottom of quotations, invoices, and other documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center rounded-md border border-dashed p-4">
                  {footerImagePreview ? (
                    <div className="relative h-40 w-full">
                      <Image
                        src={footerImagePreview || "/placeholder.svg"}
                        alt="Footer Image Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-40 w-full flex-col items-center justify-center text-center text-muted-foreground">
                      <Upload className="mb-2 h-10 w-10" />
                      <p>Upload footer image</p>
                      <p className="text-xs">Recommended size: 800 x 100 pixels</p>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="footerImage">Upload Footer Image</Label>
                  <Input id="footerImage" type="file" accept="image/*" onChange={handleFooterImageChange} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || (!headerImage && !footerImage)}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Uploading..." : "Save Images"}
          </Button>
        </div>
      </form>
    </div>
  )
}

