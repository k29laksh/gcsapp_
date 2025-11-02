// components/contact-component.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2, UserCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useEditContactMutation } from "@/redux/Service/customer"

interface ContactComponentProps {
  customerId: string
  contacts: Array<{
    id?: string
    title: string
    first_name: string
    last_name: string
    designation: string
    email: string
    phone: string
    alternate_phone: string
    is_primary: boolean
    notes: string
  }>
}

interface Contact {
  id?: string
  title: string
  first_name: string
  last_name: string
  designation: string
  email: string
  phone: string
  alternate_phone: string
  is_primary: boolean
  notes: string
}

export function ContactComponent({ customerId, contacts }: ContactComponentProps) {
  const { toast } = useToast()
  const [editContact, { isLoading }] = useEditContactMutation()

  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [currentContact, setCurrentContact] = useState<Contact | null>(null)
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null)
  const [localContacts, setLocalContacts] = useState<Contact[]>(contacts || [])

  const openContactDialog = (contact?: Contact, index?: number) => {
    if (contact) {
      setCurrentContact({ ...contact })
      setEditingContactIndex(index !== undefined ? index : null)
    } else {
      setCurrentContact({
        title: "Mr.",
        first_name: "",
        last_name: "",
        designation: "",
        email: "",
        phone: "",
        alternate_phone: "",
        is_primary: localContacts.length === 0,
        notes: "",
      })
      setEditingContactIndex(null)
    }
    setContactDialogOpen(true)
  }

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCurrentContact((prev) => (prev ? { ...prev, [name]: value } : null))
  }

  const handleContactSelectChange = (name: string, value: string) => {
    setCurrentContact((prev) => (prev ? { ...prev, [name]: value } : null))
  }

  const handleContactCheckboxChange = (name: string, checked: boolean) => {
    setCurrentContact((prev) => (prev ? { ...prev, [name]: checked } : null))
  }

  const saveContact = async () => {
    if (!currentContact) return

    try {
      // If it's an existing contact (has ID), update it individually
      if (currentContact.id) {
        const payload = {
          customer: customerId,
          title: currentContact.title,
          first_name: currentContact.first_name,
          last_name: currentContact.last_name,
          designation: currentContact.designation,
          email: currentContact.email,
          phone: currentContact.phone,
          alternate_phone: currentContact.alternate_phone || null,
          notes: currentContact.notes || null,
          is_primary: currentContact.is_primary,
        }

        // Use contact ID for the mutation, not customer ID
        await editContact({ id: currentContact.id, ...payload }).unwrap()

        // Update local state
        const updatedContacts = localContacts.map(contact =>
          contact.id === currentContact.id ? currentContact : contact
        )

        // If this contact is set as primary, update others
        if (currentContact.is_primary) {
          updatedContacts.forEach(contact => {
            if (contact.id !== currentContact.id) {
              contact.is_primary = false
            }
          })
        }

        setLocalContacts(updatedContacts)
        
        toast({
          title: "Success",
          description: "Contact updated successfully",
        })
      } else {
        // For new contacts, you might need a different API endpoint
        // For now, we'll handle it locally
        const newContact = {
          ...currentContact,
          id: `temp-${Date.now()}`, // Temporary ID for local state
        }

        const updatedContacts = [...localContacts, newContact]

        if (newContact.is_primary) {
          updatedContacts.forEach(contact => {
            if (contact.id !== newContact.id) {
              contact.is_primary = false
            }
          })
        }

        setLocalContacts(updatedContacts)
        
        toast({
          title: "Success",
          description: "Contact added successfully",
        })
      }

      setContactDialogOpen(false)
      setCurrentContact(null)
      setEditingContactIndex(null)
    } catch (error: any) {
      console.error("Error saving contact:", error)
      
      let errorMessage = "Failed to save contact"
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

  const deleteContact = async (index: number) => {
    const contactToDelete = localContacts[index]
    
    // If it's an existing contact (has ID), you might want to call delete API
    // For now, we'll just remove it from local state
    const updatedContacts = [...localContacts]
    updatedContacts.splice(index, 1)

    if (contactToDelete.is_primary && updatedContacts.length > 0) {
      updatedContacts[0].is_primary = true
      // If the deleted contact was primary, update the new primary contact
      if (contactToDelete.id) {
        try {
          const newPrimaryContact = updatedContacts[0]
          const payload = {
            customer: customerId,
            title: newPrimaryContact.title,
            first_name: newPrimaryContact.first_name,
            last_name: newPrimaryContact.last_name,
            designation: newPrimaryContact.designation,
            email: newPrimaryContact.email,
            phone: newPrimaryContact.phone,
            alternate_phone: newPrimaryContact.alternate_phone || null,
            notes: newPrimaryContact.notes || null,
            is_primary: true,
          }
          await editContact({ id: newPrimaryContact.id!, ...payload }).unwrap()
        } catch (error) {
          console.error("Error updating primary contact:", error)
        }
      }
    }

    setLocalContacts(updatedContacts)
    
    toast({
      title: "Success",
      description: "Contact deleted successfully",
    })
  }

  const updatePrimaryContact = async (contactId: string) => {
    try {
      // Set all contacts to non-primary first
      const updatedContacts = localContacts.map(contact => ({
        ...contact,
        is_primary: contact.id === contactId
      }))

      // Update the selected contact as primary via API
      const contactToUpdate = localContacts.find(contact => contact.id === contactId)
      if (contactToUpdate) {
        const payload = {
          customer: customerId,
          title: contactToUpdate.title,
          first_name: contactToUpdate.first_name,
          last_name: contactToUpdate.last_name,
          designation: contactToUpdate.designation,
          email: contactToUpdate.email,
          phone: contactToUpdate.phone,
          alternate_phone: contactToUpdate.alternate_phone || null,
          notes: contactToUpdate.notes || null,
          is_primary: true,
        }
        await editContact({ id: contactId, ...payload }).unwrap()
      }

      setLocalContacts(updatedContacts)
      
      toast({
        title: "Success",
        description: "Primary contact updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating primary contact:", error)
      
      let errorMessage = "Failed to update primary contact"
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
        <CardTitle>Contact Persons</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Contact Persons</h3>
          <Button type="button" variant="outline" onClick={() => openContactDialog()}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {localContacts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localContacts.map((contact, index) => (
                <TableRow key={contact.id || index}>
                  <TableCell>
                    {contact.title} {contact.first_name} {contact.last_name}
                  </TableCell>
                  <TableCell>{contact.designation}</TableCell>
                  <TableCell>
                    <div>{contact.email}</div>
                    <div>{contact.phone}</div>
                  </TableCell>
                  <TableCell>
                    {contact.is_primary ? (
                      <Badge>Primary</Badge>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updatePrimaryContact(contact.id!)}
                        disabled={isLoading}
                      >
                        Set Primary
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openContactDialog(contact, index)}
                        disabled={isLoading}
                      >
                        Edit
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteContact(index)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 border rounded-md bg-muted/20">
            <UserCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">No contacts added yet</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => openContactDialog()}
            >
              Add Contact
            </Button>
          </div>
        )}

        {/* Contact Dialog */}
        <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{currentContact?.id ? "Edit Contact" : "Add Contact"}</DialogTitle>
            </DialogHeader>

            {currentContact && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Select
                      value={currentContact.title}
                      onValueChange={(value) => handleContactSelectChange("title", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select title" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mr.">Mr.</SelectItem>
                        <SelectItem value="Mrs.">Mrs.</SelectItem>
                        <SelectItem value="Ms.">Ms.</SelectItem>
                        <SelectItem value="Dr.">Dr.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={currentContact.first_name}
                      onChange={handleContactChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={currentContact.last_name}
                      onChange={handleContactChange}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    name="designation"
                    value={currentContact.designation}
                    onChange={handleContactChange}
                    placeholder="e.g., Procurement Manager"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={currentContact.email}
                    onChange={handleContactChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={currentContact.phone}
                      onChange={handleContactChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="alternate_phone">Alternate Phone</Label>
                    <Input
                      id="alternate_phone"
                      name="alternate_phone"
                      type="tel"
                      value={currentContact.alternate_phone}
                      onChange={handleContactChange}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={currentContact.notes}
                    onChange={handleContactChange}
                    placeholder="Additional information about this contact"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_primary"
                    checked={currentContact.is_primary}
                    onCheckedChange={(checked) => handleContactCheckboxChange("is_primary", checked as boolean)}
                  />
                  <label
                    htmlFor="is_primary"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Primary Contact
                  </label>
                </div>
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                type="button" 
                onClick={saveContact}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Contact"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
