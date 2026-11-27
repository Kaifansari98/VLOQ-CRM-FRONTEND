"use client";

import React, { useEffect, useState } from "react";
import {
  getLeadSpecificationPdfData,
  type LeadSpecificationEntry,
} from "@/api/designingStageQueries";
import DocumentCard from "@/components/utils/documentCard";

/** Latest specification of each item code, the ones that go through Tech Check. */
export const getLatestItemCodeSpecifications = (
  specifications: LeadSpecificationEntry[],
) =>
  specifications.filter(
    (spec) => spec.item_code_id && spec.is_latest_for_item_code,
  );

/** Latest specifications belonging to the given item group. */
export const getItemGroupSpecifications = (
  specifications: LeadSpecificationEntry[],
  structureInstances: any[],
  productTypeId?: number | null,
) => {
  if (!productTypeId) return getLatestItemCodeSpecifications(specifications);

  const itemCodeIds = new Set<number>();
  structureInstances.forEach((instance: any) => {
    const instanceProductTypeId =
      instance.product_type_id ||
      instance.product_type?.id ||
      instance.productType?.id ||
      instance.productItemCode?.productStructure?.productType?.id;
    if (
      instance.productItemCode?.id &&
      Number(instanceProductTypeId) === Number(productTypeId)
    ) {
      itemCodeIds.add(Number(instance.productItemCode.id));
    }
  });

  return getLatestItemCodeSpecifications(specifications).filter((spec) =>
    itemCodeIds.has(Number(spec.item_code_id)),
  );
};

// Specifications have no stored file, so the PDF is generated when its card is shown
export function SpecificationDocumentCard({
  vendorId,
  specification,
  status,
}: {
  vendorId: number;
  specification: LeadSpecificationEntry;
  status?: string;
}) {
  const [file, setFile] = useState<{ fileName: string; url: string } | null>(
    null,
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | null = null;

    Promise.all([
      getLeadSpecificationPdfData(
        vendorId,
        specification.lead_id,
        specification.id,
      ),
      import("@/utils/pdf/specifications-pdf"),
    ])
      .then(([pdfData, pdfModule]) => {
        if (isCancelled) return;
        const pdfFile = pdfModule.createLeadSpecificationPdfFile(
          pdfData.file_name || specification.name,
          pdfData,
        );
        objectUrl = pdfFile.url;
        setFile(pdfFile);
      })
      .catch(() => {
        if (!isCancelled) setHasError(true);
      });

    return () => {
      isCancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [vendorId, specification.id, specification.lead_id, specification.name]);

  if (!file) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        {hasError
          ? `Failed to load ${specification.name}.`
          : `Preparing ${specification.name}...`}
      </div>
    );
  }

  return (
    <DocumentCard
      doc={{
        id: specification.id,
        originalName: file.fileName,
        signedUrl: file.url,
        created_at: specification.created_at,
      }}
      status={status}
    />
  );
}
