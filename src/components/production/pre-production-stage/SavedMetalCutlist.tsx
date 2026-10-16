"use client";

import { useMemo, useState } from "react";
import { Layers, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { MetalCutlistRow } from "@/api/production/production-api";

const formatMm = (value: number | null) => (value === null ? "—" : value.toFixed(2));

export default function SavedMetalCutlist({ rows, loading }: { rows: MetalCutlistRow[]; loading: boolean }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const numbered = rows.map((row, index) => ({ row, number: index + 1 }));
    return term ? numbered.filter(({ row }) => row.item_name.toLowerCase().includes(term)) : numbered;
  }, [rows, query]);
  const total = rows.reduce((sum, row) => sum + row.qty, 0);
  const uploadedAt = rows[0] ? new Date(rows[0].created_at).toLocaleString() : null;

  if (loading) {
    return <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading Metalwork Cutlist…</div>;
  }

  return (
    <div className="rounded-lg border">
      <div className="flex flex-col gap-3 border-b bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">Uploaded Metalwork Cutlist</h3>
            <p className="text-xs text-muted-foreground">
              {rows.length ? `${rows.length} part rows · ${total} total pieces · uploaded ${uploadedAt}` : "Nothing uploaded yet"}
            </p>
          </div>
        </div>
        {!!rows.length && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search part name…" aria-label="Search uploaded parts" className="h-9 bg-background pl-8" />
          </div>
        )}
      </div>

      {rows.length ? (
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-background shadow-[inset_0_-1px_0] shadow-border">
              <tr className="text-xs text-muted-foreground">
                <th scope="col" className="w-14 px-4 py-3 font-medium">#</th>
                <th scope="col" className="px-4 py-3 font-medium">Part name</th>
                <th scope="col" className="px-4 py-3 font-medium">Shape</th>
                <th scope="col" className="px-4 py-3 font-medium">Size (mm × mm)</th>
                <th scope="col" className="px-4 py-3 text-center font-medium">Qty</th>
                <th scope="col" className="px-4 py-3 font-medium">Unique code</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map(({ row, number }) => (
                <tr key={row.id} className="hover:bg-muted/40">
                  <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">{number}</td>
                  <td className="px-4 py-2.5 font-mono text-[13px] font-medium">{row.item_name}</td>
                  <td className="px-4 py-2.5">
                    {row.image_url ? (
                      // Signed Wasabi URLs expire, so they bypass next/image caching.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.image_url} alt={`Shape of ${row.item_name}`} loading="lazy" className="h-12 w-28 rounded-md border bg-white object-contain p-1" />
                    ) : <span className="text-xs text-muted-foreground">No image</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">
                    {formatMm(row.length)} <span className="text-muted-foreground">×</span> {formatMm(row.width)}
                  </td>
                  <td className="px-4 py-2.5 text-center font-semibold tabular-nums">{row.qty}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">{row.unique_code ?? "—"}</td>
                </tr>
              ))}
              {!visible.length && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">No parts match “{query.trim()}”.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">Upload a nesting PDF above and confirm the upload to see its parts here.</p>
      )}
    </div>
  );
}
