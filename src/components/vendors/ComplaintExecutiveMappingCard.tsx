"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastManager } from "@/components/ui/toast";

type FranchiseMapping = {
  id: number;
  franchise_name: string;
  sales_executive_id: number | null;
  executives: { id: number; user_name: string }[];
};

export function ComplaintExecutiveMappingCard({ vendorId }: { vendorId: number }) {
  const client = useQueryClient();
  const queryKey = ["complaintExecutiveMappings", vendorId];
  const endpoint = `/vendors/${vendorId}/complaint-executive-mappings`;
  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<FranchiseMapping[]> => {
      const { data } = await apiClient.get(endpoint);
      if (!data.success) throw new Error(data.message || "Unable to load mappings.");
      return data.data;
    },
  });
  const save = useMutation({
    mutationFn: async (mapping: { franchise_id: number; sales_executive_id: number }): Promise<FranchiseMapping[]> => {
      const { data } = await apiClient.put(endpoint, mapping);
      if (!data.success) throw new Error(data.message || "Unable to save mapping.");
      return data.data;
    },
    onSuccess: (rows) => {
      client.setQueryData(queryKey, rows);
      toastManager.add({ title: "Complaint sales executive mapping saved", type: "success" });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toastManager.add({ title: error.response?.data?.message || error.message, type: "error" });
    },
  });

  return (
    <section className="overflow-hidden rounded-xl border bg-card" aria-labelledby="complaint-mapping-title">
      <div className="border-b px-4 py-3">
        <h2 id="complaint-mapping-title" className="text-sm font-semibold">Sales executive Client Complaints mapping</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose who receives external client complaints (without lead code) for each franchise. Changes save automatically.
        </p>
      </div>
      {query.isPending ? (
        <p className="flex items-center gap-2 p-4 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading franchises…</p>
      ) : query.isError ? (
        <div className="flex items-center justify-between gap-3 p-4 text-xs"><span role="alert">Unable to load complaint sales executive mappings.</span><Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>
      ) : !query.data?.length ? (
        <p className="p-4 text-xs text-muted-foreground">No franchises available for this vendor.</p>
      ) : (
        <div className="max-h-64 divide-y overflow-y-auto">
          {query.data.map((row) => (
            <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 px-4 py-2">
              <label htmlFor={`complaint-executive-${row.id}`} className="truncate text-sm" title={row.franchise_name}>{row.franchise_name}</label>
              <div className="flex items-center gap-2">
                <Select
                  value={row.sales_executive_id ? String(row.sales_executive_id) : undefined}
                  disabled={row.executives.length <= 1 || save.isPending}
                  onValueChange={(value) => {
                    const num = Number(value);
                    if (num && num !== row.sales_executive_id) {
                      save.mutate({ franchise_id: row.id, sales_executive_id: num });
                    }
                  }}
                >
                  <SelectTrigger id={`complaint-executive-${row.id}`} className="h-8 w-full text-xs bg-background">
                    <SelectValue
                      placeholder={row.executives.length ? "Select sales executive" : "No active sales executive"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {row.executives.map((executive) => (
                      <SelectItem key={executive.id} value={String(executive.id)} className="text-xs">
                        {executive.user_name}{row.executives.length === 1 ? " (Automatic)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {save.isPending && save.variables.franchise_id === row.id && <Loader2 aria-label="Saving mapping" className="h-3.5 w-3.5 shrink-0 animate-spin" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
