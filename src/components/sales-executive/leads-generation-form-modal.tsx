"use client"
import { useState } from "react"
import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import LeadsGenerationForm from "./leads-generation-form"
import { useAppSelector } from "@/redux/store"
import { useEffect } from "react"
import { boolean } from "zod"

export function GenerateLeadFormModal({ children }: { children: React.ReactNode }) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  useEffect(() => {
    console.log(vendorId);
  });
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] md:max-w-2xl p-0 gap-0 ">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new lead for your sales pipeline.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6">
            <LeadsGenerationForm onClose={() => setIsOpen(!isOpen)} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}