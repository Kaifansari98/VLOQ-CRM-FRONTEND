"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry } from "ag-grid-community";
import { AllCommunityModule } from "ag-grid-community";
import { useAppSelector } from "@/redux/store";
import { useVendorUserLeads } from "@/hooks/useLeadsQueries";
import type { Lead } from "@/api/leads"; // Import the actual Lead type

import type { ColDef } from "ag-grid-community";

// ✅ Register community modules once
ModuleRegistry.registerModules([AllCommunityModule]);

type ProcessedLead = {
  srNo: number;
  name: string;
  email: string;
  contact: string;
  priority: string;
  siteAddress: string;
  billingName: string;
  architechName: string;
  designerRemark: string;
  productTypes: string;
  productStructures: string;
  source: string;
  siteType: string;
  createdAt: string;
  updatedAt: string;
};

const VendorLeadsTable = () => {
  // Get vendor and user IDs from Redux store
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const shouldFetch = !!vendorId && !!userId;

  // Fetch vendor user leads data
  const vendorUserLeadsQuery = useVendorUserLeads(
    vendorId || 0,
    userId || 0,
    shouldFetch
  );

  // Process the raw API data for AG Grid
  const rowData = useMemo(() => {
    if (!vendorUserLeadsQuery.data) return [];

    return vendorUserLeadsQuery.data.map((lead: Lead, index: number): ProcessedLead => ({
      srNo: index + 1,
      name: `${lead.firstname} ${lead.lastname}`.trim(),
      email: lead.email || '',
      contact: lead.contact_no || '',
      priority: lead.priority || '',
      siteAddress: lead.site_address || '',
      billingName: lead.billing_name || '',
      architechName: lead.archetech_name || '',
      designerRemark: lead.designer_remark || '',
      productTypes: lead.productMappings
        ?.map(pm => pm.productType.type)
        .join(', ') || '',
      productStructures: lead.leadProductStructureMapping
        ?.map(psm => psm.productStructure.type)
        .join(', ') || '',
      source: lead.source?.type || '', // Use 'type' property from Source object
      siteType: lead.siteType?.type || '', // Use 'type' property from SiteType object
      createdAt: lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '',
      updatedAt: lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : '',
    }));
  }, [vendorUserLeadsQuery.data]);

  // Column definitions for AG Grid
  const colDefs = useMemo<ColDef<ProcessedLead>[]>(() => [
    {
      field: "srNo",
      headerName: "Sr. No.",
      width: 80,
      pinned: "left",
      sortable: true,
      filter: false,
    },
    {
      field: "name",
      headerName: "Name",
      width: 150,
      sortable: true,
      filter: true,
      pinned: "left",
    },
    {
      field: "email",
      headerName: "Email",
      width: 200,
      sortable: true,
      filter: true,
    },
    {
      field: "contact",
      headerName: "Contact",
      width: 130,
      sortable: true,
      filter: true,
    },
    {
      field: "priority",
      headerName: "Priority",
      width: 100,
      sortable: true,
      filter: true,
    },
    {
      field: "siteAddress",
      headerName: "Site Address",
      width: 200,
      sortable: true,
      filter: true,
    },
    {
      field: "billingName",
      headerName: "Billing Name",
      width: 150,
      sortable: true,
      filter: true,
    },
    {
      field: "architechName",
      headerName: "Architect Name",
      width: 150,
      sortable: true,
      filter: true,
    },
    {
      field: "designerRemark",
      headerName: "Designer Remark",
      width: 180,
      sortable: true,
      filter: true,
    },
    {
      field: "productTypes",
      headerName: "Product Types",
      width: 150,
      sortable: true,
      filter: true,
    },
    {
      field: "productStructures",
      headerName: "Product Structures",
      width: 170,
      sortable: true,
      filter: true,
    },
    {
      field: "source",
      headerName: "Source",
      width: 120,
      sortable: true,
      filter: true,
    },
    {
      field: "siteType",
      headerName: "Site Type",
      width: 120,
      sortable: true,
      filter: true,
    },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 120,
      sortable: true,
      filter: true,
    },
    {
      field: "updatedAt",
      headerName: "Updated At",
      width: 120,
      sortable: true,
      filter: true,
    },
  ], []);

  // Log API responses for debugging
  useEffect(() => {
    if (vendorUserLeadsQuery.data) {
      console.log("=== VENDOR USER LEADS API RESPONSE ===");
      console.log("Raw API Response:", vendorUserLeadsQuery.data);
      console.log("Total Vendor User Leads:", vendorUserLeadsQuery.data.length);
      console.log("Vendor ID:", vendorId);
      console.log("User ID:", userId);

      // Log each lead with key details
      vendorUserLeadsQuery.data.forEach((lead: Lead, index: number) => {
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
          product_types: lead.productMappings?.map((pm) => ({
            id: pm.productType.id,
            type: pm.productType.type,
          })),
          product_structures: lead.leadProductStructureMapping?.map((psm) => ({
            id: psm.productStructure.id,
            type: psm.productStructure.type,
          })),
          documents: lead.documents?.map((doc) => ({
            id: doc.id,
            original_name: doc.doc_og_name,
            system_name: doc.doc_sys_name,
            type: doc.doc_type,
          })),
          source: lead.source, // This will log the entire Source object
          site_type: lead.siteType,
          created_by_user: lead.createdBy,
          assigned_to: lead.assign_to,
          assigned_by: lead.assigned_by,
          created_at: lead.created_at,
          updated_at: lead.updated_at,
        });
      });
      console.log("=== END VENDOR USER LEADS ===\n");
    }
  }, [vendorUserLeadsQuery.data, vendorId, userId]);

  useEffect(() => {
    if (vendorUserLeadsQuery.isLoading) {
      console.log("Loading vendor user leads...");
    }
  }, [vendorUserLeadsQuery.isLoading]);

  // Loading state
  if (vendorUserLeadsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading vendor user leads...</div>
      </div>
    );
  }

  // Error state
  if (vendorUserLeadsQuery.error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <div>Error loading leads: {vendorUserLeadsQuery.error.message}</div>
      </div>
    );
  }

  // No data state
  if (!vendorUserLeadsQuery.data || vendorUserLeadsQuery.data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">No leads found</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Leads Table ({rowData.length})</h2>
      </div>
      <div className="ag-theme-alpine" style={{ height: 650, width: "100%" }}>
        <AgGridReact<ProcessedLead>
          rowData={rowData}
          columnDefs={colDefs}
          defaultColDef={{
            resizable: true,
            sortable: true,
            filter: true,
            minWidth: 100,
          }}
          suppressRowClickSelection={true}
          rowSelection="multiple"
          enableRangeSelection={true}
          pagination={true}
          paginationPageSize={20}
          animateRows={true}
        />
      </div>
    </div>
  );
};

export default VendorLeadsTable;