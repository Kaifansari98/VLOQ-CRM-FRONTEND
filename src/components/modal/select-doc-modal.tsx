"use client";

import React, { useMemo, useState } from "react";
import BaseModal from "../utils/baseModal";
import { useAppSelector } from "@/redux/store";
import {
  useQuotationDoc,
  useDesignsDoc,
} from "@/hooks/designing-stage/designing-leads-hooks";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Link2, FileText } from "lucide-react";
import { urlToFile } from "@/utils/file.utils";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
  onSelectDocs?: (files: File[]) => void; // 👈 callback to booking modal
}

export interface DocItem {
  id: number;
  doc_og_name: string;
  signedUrl: string;
  type: "quotation" | "design";
  created_at?: string;
}

interface LinkedDocGroup {
  key: string;
  quotation?: DocItem;
  design?: DocItem;
  latestTimestamp: number;
}

const getDocKey = (doc: DocItem) => `${doc.type}-${doc.id}`;

const stripDocPrefix = (fileName: string) =>
  fileName.replace(/\.[^/.]+$/, "").replace(/^\[.*?\]\s*/, "");

const getLinkedRevisionKey = (fileName: string, prefix: "Q" | "D" | "R") => {
  const parsedName = stripDocPrefix(fileName);

  const underscoreMatch = parsedName.match(
    new RegExp(
      `^${prefix}(\\d+)_(?:(2D|3D)_)?(.+)_\\d{4}-\\d{2}-\\d{2}$`,
      "i",
    ),
  );

  if (underscoreMatch) {
    const [, revision, , baseSegment] = underscoreMatch;
    return `${revision}-${baseSegment.toLowerCase()}`;
  }

  const hyphenMatch = parsedName.match(
    new RegExp(`^${prefix}(\\d+)-(.+)-\\d{4}-\\d{2}-\\d{2}$`, "i"),
  );

  if (!hyphenMatch) return null;

  return `${hyphenMatch[1]}-${hyphenMatch[2].toLowerCase()}`;
};

const getDesignRevisionKey = (fileName: string) =>
  getLinkedRevisionKey(fileName, "D") ?? getLinkedRevisionKey(fileName, "R");

const getTimestamp = (value?: string) => (value ? new Date(value).getTime() : 0);

const sortLatestFirst = (docs: DocItem[]) =>
  [...docs].sort((a, b) => {
    const timeDiff = getTimestamp(b.created_at) - getTimestamp(a.created_at);
    if (timeDiff !== 0) return timeDiff;
    return b.id - a.id;
  });

const SelectDocumentModal: React.FC<Props> = ({
  open,
  onOpenChange,
  leadId,
  onSelectDocs,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const vendorCustomUserTypeMode = useAppSelector(
    (state) => state.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only
  );

  const { data: quotationData } = useQuotationDoc(vendorId!, leadId);
  const { data: designData } = useDesignsDoc(vendorId!, leadId);

  const [selectedDocs, setSelectedDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(false);

  const quotations: DocItem[] =
    quotationData?.data?.documents.map((doc: any) => ({
      id: doc.id,
      doc_og_name: doc.doc_og_name,
      signedUrl: doc.signedUrl,
      type: "quotation" as const,
      created_at: doc.created_at,
    })) || [];

  const designs: DocItem[] =
    designData?.data?.documents.map((doc: any) => ({
      id: doc.id,
      doc_og_name: doc.doc_og_name,
      signedUrl: doc.signedUrl,
      type: "design" as const,
      created_at: doc.created_at,
    })) || [];

  const sortedQuotations = useMemo(() => sortLatestFirst(quotations), [quotations]);
  const sortedDesigns = useMemo(() => sortLatestFirst(designs), [designs]);

  const linkedDocGroups = useMemo<LinkedDocGroup[]>(() => {
    const grouped = new Map<string, LinkedDocGroup>();

    sortedQuotations.forEach((doc) => {
      const key =
        getLinkedRevisionKey(doc.doc_og_name, "Q") ??
        `quotation-${doc.id}`;
      const existing = grouped.get(key);
      grouped.set(key, {
        key,
        quotation: doc,
        design: existing?.design,
        latestTimestamp: Math.max(
          getTimestamp(doc.created_at),
          existing?.latestTimestamp ?? 0,
        ),
      });
    });

    sortedDesigns.forEach((doc) => {
      const key = getDesignRevisionKey(doc.doc_og_name) ?? `design-${doc.id}`;
      const existing = grouped.get(key);
      grouped.set(key, {
        key,
        quotation: existing?.quotation,
        design: doc,
        latestTimestamp: Math.max(
          getTimestamp(doc.created_at),
          existing?.latestTimestamp ?? 0,
        ),
      });
    });

    return [...grouped.values()].sort((a, b) => {
      if (b.latestTimestamp !== a.latestTimestamp) {
        return b.latestTimestamp - a.latestTimestamp;
      }
      return b.key.localeCompare(a.key);
    });
  }, [sortedDesigns, sortedQuotations]);

  const toggleSelect = (doc: DocItem) => {
    const revisionKey =
      doc.type === "quotation"
        ? getLinkedRevisionKey(doc.doc_og_name, "Q")
        : getDesignRevisionKey(doc.doc_og_name);

    setSelectedDocs((prev) => {
      const selectedMap = new Map(prev.map((item) => [getDocKey(item), item]));
      const currentKey = getDocKey(doc);
      const isCurrentlySelected = selectedMap.has(currentKey);

      const linkedPair = revisionKey
        ? [
            ...(doc.type === "quotation"
              ? sortedDesigns.filter(
                  (item) => getDesignRevisionKey(item.doc_og_name) === revisionKey,
                )
              : sortedQuotations.filter(
                  (item) => getLinkedRevisionKey(item.doc_og_name, "Q") === revisionKey,
                )),
          ]
        : [];

      if (isCurrentlySelected) {
        selectedMap.delete(currentKey);
        linkedPair.forEach((item) => selectedMap.delete(getDocKey(item)));
      } else {
        if (vendorCustomUserTypeMode === true) {
          selectedMap.clear();
        }

        selectedMap.set(currentKey, doc);
        linkedPair.forEach((item) => selectedMap.set(getDocKey(item), item));
      }

      return [...selectedMap.values()];
    });
  };

  const isSelected = (doc: DocItem) =>
    selectedDocs.some((item) => getDocKey(item) === getDocKey(doc));

  // const handleSelect = () => {
  //   onSelectDocs(selectedDocs);
  //   onOpenChange(false);
  // };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Select Documents"
      description="Choose documents for the lead"
      size={vendorCustomUserTypeMode === true ? "lg" : "md"}
    >
      <div className="p-5 space-y-6">
        {vendorCustomUserTypeMode === true ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Link2 className="h-4 w-4" />
                Quotation - Design linkage
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Matching files are linked by revision name like `D1` and `Q1`.
                Selecting one will select its linked pair automatically. Only one quotation-design pair can be selected at a time.
              </p>
            </div>

            <div className="space-y-3">
              {linkedDocGroups.length > 0 ? (
                linkedDocGroups.map((group, index) => {
                  const quotationSelected = group.quotation
                    ? isSelected(group.quotation)
                    : false;
                  const designSelected = group.design ? isSelected(group.design) : false;
                  const isGroupLatest = index === 0;

                  return (
                    <div
                      key={group.key}
                      className={`rounded-2xl border p-4 ${
                        isGroupLatest
                          ? "border-emerald-400 ring-1 ring-emerald-200"
                          : "border-border"
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {group.key.startsWith("quotation-") ||
                            group.key.startsWith("design-")
                              ? "Unlinked"
                              : group.key}
                          </span>
                          {group.quotation && group.design && (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                              Linked Pair
                            </span>
                          )}
                          {isGroupLatest && (
                            <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-foreground">
                              Latest
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {(quotationSelected ? 1 : 0) + (designSelected ? 1 : 0)} selected
                        </span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {[group.quotation, group.design].map((doc, docIndex) => {
                          if (!doc) {
                            return (
                              <div
                                key={`${group.key}-${docIndex}-empty`}
                                className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground"
                              >
                                No {docIndex === 0 ? "quotation" : "design"} file
                              </div>
                            );
                          }

                          return (
                            <div
                              key={getDocKey(doc)}
                              onClick={() => toggleSelect(doc)}
                              className={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                                isSelected(doc)
                                  ? "border-emerald-400 bg-emerald-50/60"
                                  : "border-border hover:bg-muted/40"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={isSelected(doc)}
                                  onCheckedChange={() => toggleSelect(doc)}
                                  onClick={(event) => event.stopPropagation()}
                                  className="mt-0.5"
                                />
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                      {doc.type}
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium leading-5">
                                    {doc.doc_og_name}
                                  </p>
                                  {doc.created_at && (
                                    <p className="text-xs text-muted-foreground">
                                      Uploaded at{" "}
                                      {format(
                                        new Date(doc.created_at),
                                        "HH:mm, dd MMM yyyy"
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <a
                                href={doc.signedUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(event) => event.stopPropagation()}
                                className="rounded-md border border-border p-2 text-muted-foreground hover:text-foreground"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  No quotation or design documents available
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Select Quotations</h3>
                <span className="text-xs text-muted-foreground">
                  {selectedDocs.filter((d) => d.type === "quotation").length}{" "}
                  selected
                </span>
              </div>
              <div className="space-y-2">
                {sortedQuotations.length > 0 ? (
                  sortedQuotations.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between border rounded-md px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isSelected(doc)}
                          onCheckedChange={() => toggleSelect(doc)}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm">{doc.doc_og_name}</span>
                          {doc.created_at && (
                            <span className="text-xs text-gray-500">
                              Uploaded at{" "}
                              {format(
                                new Date(doc.created_at),
                                "HH:mm, dd MMM yyyy"
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <a
                        href={doc.signedUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4 text-gray-600 hover:text-black" />
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No quotation documents available
                  </p>
                )}
              </div>
            </div>

            <hr />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Select Designs</h3>
                <span className="text-xs text-muted-foreground">
                  {selectedDocs.filter((d) => d.type === "design").length} selected
                </span>
              </div>
              <div className="space-y-2">
                {sortedDesigns.length > 0 ? (
                  sortedDesigns.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between border rounded-md px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isSelected(doc)}
                          onCheckedChange={() => toggleSelect(doc)}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm">{doc.doc_og_name}</span>
                          {doc.created_at && (
                            <span className="text-xs text-gray-500">
                              Uploaded at{" "}
                              {format(
                                new Date(doc.created_at),
                                "HH:mm, dd MMM yyyy"
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <a
                        href={doc.signedUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4 text-gray-600 hover:text-black" />
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No design documents available
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background px-6 py-4">
        <Button
          variant="outline"
          onClick={() => {
            setSelectedDocs([]);
          }}
          disabled={loading} // 👈 disable while loading
        >
          Clear
        </Button>

        <Button
          disabled={loading || selectedDocs.length === 0}
          onClick={async () => {
            setLoading(true); // 👈 start loader
            try {
              const convertedFiles: File[] = [];

              for (const doc of selectedDocs) {
                let mime = "application/octet-stream";
                if (doc.doc_og_name.endsWith(".pdf")) mime = "application/pdf";
                if (doc.doc_og_name.match(/\.(jpg|jpeg)$/)) mime = "image/jpeg";
                if (doc.doc_og_name.endsWith(".png")) mime = "image/png";

                const file = await urlToFile(
                  doc.signedUrl,
                  doc.doc_og_name,
                  mime
                );
                convertedFiles.push(file);
              }

              onSelectDocs?.(convertedFiles);
              onOpenChange(false);
            } catch (err) {
              console.error("Error converting docs:", err);
            } finally {
              setLoading(false); // 👈 stop loader
            }
          }}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Select"
          )}
        </Button>
      </div>
    </BaseModal>
  );
};

export default SelectDocumentModal;
