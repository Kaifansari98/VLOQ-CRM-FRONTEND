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
import { useVendorLeads, useVendorUserLeads } from "@/hooks/useLeadsQueries"

export function GenerateLeadFormModal({ children }: { children: React.ReactNode }) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const shouldFetch = !!vendorId && !!userId

  // TanStack Query hooks
  const vendorLeadsQuery = useVendorLeads(vendorId || 0, shouldFetch)
  const vendorUserLeadsQuery = useVendorUserLeads(vendorId || 0, userId || 0, shouldFetch)

    // Console log vendor leads data
    useEffect(() => {
      if (vendorLeadsQuery.data) {
        console.log('=== VENDOR LEADS API RESPONSE ===')
        console.log('Raw API Response:', vendorLeadsQuery.data)
        console.log('Total Vendor Leads:', vendorLeadsQuery.data.length)
        console.log('Vendor ID:', vendorId)
        
        // Log each lead with key details
        vendorLeadsQuery.data.forEach((lead, index) => {
          console.log(`Vendor Lead ${index + 1}:`, {
            id: lead.id,
            name: `${lead.firstname} ${lead.lastname}`,
            email: lead.email,
            contact: lead.contact_no,
            priority: lead.priority,
            site_address: lead.site_address,
            billing_name: lead.billing_name,
            archetech_name: lead.archetech_name,
            designer_remark: lead.designer_remark,
            account_details: lead.account,
            product_types: lead.productMappings.map(pm => ({
              id: pm.productType.id,
              type: pm.productType.type
            })),
            product_structures: lead.leadProductStructureMapping.map(psm => ({
              id: psm.productStructure.id,
              type: psm.productStructure.type
            })),
            documents: lead.documents.map(doc => ({
              id: doc.id,
              original_name: doc.doc_og_name,
              system_name: doc.doc_sys_name,
              type: doc.doc_type
            })),
            source: lead.source,
            site_type: lead.siteType,
            created_by_user: lead.createdBy,
            created_at: lead.created_at,
            updated_at: lead.updated_at
          })
        })
        console.log('=== END VENDOR LEADS ===\n')
      }
    }, [vendorLeadsQuery.data, vendorId])
  
    // Console log vendor user leads data
    useEffect(() => {
      if (vendorUserLeadsQuery.data) {
        console.log('=== VENDOR USER LEADS API RESPONSE ===')
        console.log('Raw API Response:', vendorUserLeadsQuery.data)
        console.log('Total Vendor User Leads:', vendorUserLeadsQuery.data.length)
        console.log('Vendor ID:', vendorId)
        console.log('User ID:', userId)
        
        // Log each lead with key details
        vendorUserLeadsQuery.data.forEach((lead, index) => {
          console.log(`Vendor User Lead ${index + 1}:`, {
            id: lead.id,
            name: `${lead.firstname} ${lead.lastname}`,
            email: lead.email,
            contact: lead.contact_no,
            priority: lead.priority,
            site_address: lead.site_address,
            billing_name: lead.billing_name,
            archetech_name: lead.archetech_name,
            designer_remark: lead.designer_remark,
            account_details: lead.account,
            product_types: lead.productMappings.map(pm => ({
              id: pm.productType.id,
              type: pm.productType.type
            })),
            product_structures: lead.leadProductStructureMapping.map(psm => ({
              id: psm.productStructure.id,
              type: psm.productStructure.type
            })),
            documents: lead.documents.map(doc => ({
              id: doc.id,
              original_name: doc.doc_og_name,
              system_name: doc.doc_sys_name,
              type: doc.doc_type
            })),
            source: lead.source,
            site_type: lead.siteType,
            created_by_user: lead.createdBy,
            assigned_to: lead.assign_to,
            assigned_by: lead.assigned_by,
            created_at: lead.created_at,
            updated_at: lead.updated_at
          })
        })
        console.log('=== END VENDOR USER LEADS ===\n')
      }
    }, [vendorUserLeadsQuery.data, vendorId, userId])
  
    // Console log loading and error states
    useEffect(() => {
      if (vendorLeadsQuery.isLoading) {
        console.log('Loading vendor leads...')
      }
      if (vendorUserLeadsQuery.isLoading) {
        console.log('Loading vendor user leads...')
      }
    }, [vendorLeadsQuery.isLoading, vendorUserLeadsQuery.isLoading])
  
    useEffect(() => {
      if (vendorLeadsQuery.error) {
        console.error('Vendor Leads API Error:', vendorLeadsQuery.error)
      }
      if (vendorUserLeadsQuery.error) {
        console.error('Vendor User Leads API Error:', vendorUserLeadsQuery.error)
      }
    }, [vendorLeadsQuery.error, vendorUserLeadsQuery.error])
  
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