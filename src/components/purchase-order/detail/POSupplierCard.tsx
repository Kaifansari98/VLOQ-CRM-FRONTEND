"use client";

import { PODetail } from "@/api/purchaseOrder/purchaseOrder";
import { Building2, Mail, Phone, User } from "lucide-react";

export function POSupplierCard({ po }: { po: PODetail }) {
  const vendor = po.companyVendor;

  return (
    <div className="rounded-[28px] border bg-background p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
          <Building2 size={20} />
        </div>
        <div>
          <p className="text-base font-black">{vendor.company_name}</p>
          <p className="text-xs text-muted-foreground">{vendor.vendor_code}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Info icon={User} label="Contact Person" value={vendor.point_of_contact ?? "—"} />
        <Info icon={Phone} label="Phone" value={vendor.contact_no ?? "—"} />
        <Info icon={Mail} label="Email" value={vendor.email ?? "—"} />
        <Info icon={Building2} label="State ID" value={vendor.state_id ?? "—"} />
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-muted/40 p-3">
      <p className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase text-muted-foreground">
        <Icon size={11} />
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}