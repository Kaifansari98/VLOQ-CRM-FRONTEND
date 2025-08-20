"use client"

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

export function GenerateLeadFormModal({ children }: { children: React.ReactNode }) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  
  useEffect(() => {
    console.log(vendorId);
  });
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new lead for your sales pipeline.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6 py-4">
            <LeadsGenerationForm />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}