"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";

type FranchiseMapping = {
  id: number;
  franchise_name: string;
  sales_executive_id: number | null;
  executives: { id: number; user_name: string }[];
};

export function OnlineLeadExecutiveMappingCard({ vendorId }: { vendorId: number }) {
  const client = useQueryClient();
  const queryKey = ["onlineLeadExecutiveMappings", vendorId];
  const endpoint = `/vendors/${vendorId}/online-lead-executive-mappings`;
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
      toastManager.add({ title: "Sales executive mapping saved", type: "success" });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toastManager.add({ title: error.response?.data?.message || error.message, type: "error" });
    },
  });

  return (
    <section className="overflow-hidden rounded-xl border bg-card" aria-labelledby="online-lead-mapping-title">
      <div className="border-b px-4 py-3">
        <h2 id="online-lead-mapping-title" className="text-sm font-semibold">Sales executive Online Leads mapping</h2>
        <p className="mt-1 text-xs text-muted-foreground">Choose who receives online leads for each franchise. Changes save automatically.</p>
      </div>
      {query.isPending ? (
        <p className="flex items-center gap-2 p-4 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading franchises…</p>
      ) : query.isError ? (
        <div className="flex items-center justify-between gap-3 p-4 text-xs"><span role="alert">Unable to load sales executive mappings.</span><Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>
      ) : !query.data?.length ? (
        <p className="p-4 text-xs text-muted-foreground">No franchises available for this vendor.</p>
      ) : (
        <div className="max-h-64 divide-y overflow-y-auto">
          {query.data.map((row) => (
            <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 px-4 py-2">
              <label htmlFor={`online-lead-executive-${row.id}`} className="truncate text-sm" title={row.franchise_name}>{row.franchise_name}</label>
              <div className="flex items-center gap-2">
                <select
                  id={`online-lead-executive-${row.id}`}
                  value={row.sales_executive_id ?? ""}
                  disabled={row.executives.length <= 1 || save.isPending}
                  onChange={(event) => save.mutate({ franchise_id: row.id, sales_executive_id: Number(event.target.value) })}
                  className="h-8 w-full min-w-0 rounded-md border bg-background px-2 text-xs disabled:opacity-70"
                >
                  <option value="" disabled>{row.executives.length ? "Select sales executive" : "No active sales executive"}</option>
                  {row.executives.map((executive) => <option key={executive.id} value={executive.id}>{executive.user_name}{row.executives.length === 1 ? " (Automatic)" : ""}</option>)}
                </select>
                {save.isPending && save.variables.franchise_id === row.id && <Loader2 aria-label="Saving mapping" className="h-3.5 w-3.5 shrink-0 animate-spin" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
