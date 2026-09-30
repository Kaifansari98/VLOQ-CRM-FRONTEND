import { jsPDF } from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import type { LeadSpecificationPdfData } from "@/api/designingStageQueries";
import { OTHER_APPLIANCE_TYPES } from "@/api/typesMasterApi";

const DASH = "—";
const MARGIN = 12;
const FOOTER_HEIGHT = 12;
const APPROVED_ROW_COLOR: [number, number, number] = [220, 252, 231];
const REJECTED_ROW_COLOR: [number, number, number] = [254, 226, 226];
const AMENDED_ROW_COLOR: [number, number, number] = [254, 249, 195];

type PdfReviewStatus =
  | "approved"
  | "rejected"
  | "amended"
  | null;

type PdfReviewFields = {
  is_approved: boolean;
  is_amended: boolean;
  is_deleted_item: boolean;
};

type PdfDataRow = {
  values: unknown[];
  reviewStatus: PdfReviewStatus;
};

const display = (value: unknown): string => {
  if (value === null || value === undefined) return DASH;
  if (typeof value === "string") return value.trim() || DASH;
  return String(value);
};

const safeFilename = (value: string): string =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "specification";

const formatLongDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return DASH;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const getReviewStatus = (
  row: PdfReviewFields,
  includeReviewColors: boolean,
): PdfReviewStatus => {
  if (!includeReviewColors) return null;
  if (row.is_approved) return "approved";
  if (row.is_amended) return "amended";
  if (row.is_deleted_item) return "rejected";
  return null;
};

export const exportLeadSpecificationPdf = (
  specificationName: string,
  specification: LeadSpecificationPdfData,
  includeReviewColors = false,
): void => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const rows: RowInput[] = [];
  const rejectedRowIndexes = new Set<number>();

  const addTitleRow = (
    content: string,
    fontSize: number,
    minCellHeight: number,
  ) => {
    rows.push([
      {
        content: display(content),
        colSpan: 12,
        styles: {
          fillColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize,
          minCellHeight,
          halign: "center",
          valign: "middle",
        },
      },
    ]);
  };

  const addYellowRow = (content: string) => {
    rows.push([
      {
        content: display(content),
        colSpan: 12,
        styles: {
          fillColor: [255, 255, 0],
          fontStyle: "bold",
          fontSize: 9.5,
          minCellHeight: 5.5,
          halign: "center",
          valign: "middle",
        },
      },
    ]);
  };

  const addGridRow = (
    values: unknown[],
    bold = false,
    reviewStatus: PdfReviewStatus = null,
  ) => {
    const colSpan = 12 / values.length;
    const fillColor =
      reviewStatus === "approved"
        ? APPROVED_ROW_COLOR
        : reviewStatus === "rejected"
          ? REJECTED_ROW_COLOR
          : reviewStatus === "amended"
            ? AMENDED_ROW_COLOR
            : ([255, 255, 255] as [number, number, number]);

    if (reviewStatus === "rejected") {
      rejectedRowIndexes.add(rows.length);
    }

    rows.push(
      values.map((value) => ({
        content: display(value),
        colSpan,
        styles: {
          fillColor,
          fontStyle: bold ? ("bold" as const) : ("normal" as const),
        },
      })),
    );
  };

  const addSection = (
    title: string,
    headers: string[],
    dataRows: PdfDataRow[],
  ) => {
    addYellowRow(title);
    addGridRow(headers, true);

    if (dataRows.length === 0) {
      addGridRow(headers.map(() => DASH));
      return;
    }

    dataRows.forEach((row) =>
      addGridRow(row.values, false, row.reviewStatus),
    );
  };

  addTitleRow(specification.header.lead_name, 15, 11);
  addTitleRow(specification.header.sheet_title, 11, 10);
  addYellowRow(`Date - ${formatLongDate(specification.header.created_at)}`);

  addSection(
    "Carcass",
    ["Carcass Type", "Carcass Material", "Carcass Material Finish"],
    specification.carcassMaterialMappings.map((row) => ({
      values: [
        row.carcassType?.name,
        row.carcasMaterial?.name,
        row.carcassMaterialFinish?.name,
      ],
      reviewStatus: getReviewStatus(row, includeReviewColors),
    })),
  );

  addSection(
    "Shutter",
    ["Shutter Type", "Shutter Material", "Shutter Material Finish"],
    specification.shutterMaterialMappings.map((row) => ({
      values: [
        row.shutterType?.name,
        row.shutterMaterial?.name,
        row.shutterMaterialFinish?.name,
      ],
      reviewStatus: getReviewStatus(row, includeReviewColors),
    })),
  );

  addSection(
    "Hardware",
    ["Carcass Legs", "Skirting", "Colors", "Note"],
    specification.hardwareMappings.map((row) => ({
      values: [
        row.carcassLegs?.name,
        row.skirtingCarcassLegs?.name,
        row.skirtingCarcassLegsColor?.color,
        row.skirtingCarcassLegs && !row.skirtingCarcassLegs.inScope
          ? "Not in our scope"
          : row.note,
      ],
      reviewStatus: getReviewStatus(row, includeReviewColors),
    })),
  );

  const isCustomLightsMode = specification.lights_remark === "Not in our scope";
  addSection(
    `Lights - ${display(specification.lights_remark)}`,
    ["Carcass Type", "Remark"],
    specification.lightCarcasUnitMappings.map((row) => ({
      values: [
        isCustomLightsMode
          ? "Custom"
          : row.lightCarcasUnit?.lightCarcasType?.type,
        isCustomLightsMode ? row.custom_remark : row.lightCarcasUnit?.type,
      ],
      reviewStatus: getReviewStatus(row, includeReviewColors),
    })),
  );

  const sectionRemarks = new Map(
    specification.otherAppliancesRemarkMappings.map((item) => [
      item.other_appliance_type,
      item.remark,
    ]),
  );

  OTHER_APPLIANCE_TYPES.forEach((type) => {
    const scopeRemark = sectionRemarks.get(type);
    const customMode = scopeRemark === "Not in our scope";
    const sectionRows = specification.otherAppliancesMappings.filter(
      (row) =>
        (row.otherAppliances?.type ?? row.other_appliance_type) === type,
    );

    addSection(
      `${type} - ${display(scopeRemark)}`,
      [customMode ? "Type" : "Article Code", "Description"],
      sectionRows.map((row) => ({
        values: [
          customMode ? "Custom" : row.otherAppliances?.article_number,
          customMode ? row.custom_remark : row.otherAppliances?.description,
        ],
        reviewStatus: getReviewStatus(row, includeReviewColors),
      })),
    );
  });

  autoTable(doc, {
    body: rows,
    startY: MARGIN,
    margin: {
      left: 18,
      right: 18,
      top: MARGIN,
      bottom: FOOTER_HEIGHT,
    },
    theme: "grid",
    tableWidth: "auto",
    pageBreak: "auto",
    rowPageBreak: "avoid",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      textColor: [0, 0, 0],
      fillColor: [255, 255, 255],
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      cellPadding: { top: 1, right: 1.5, bottom: 1, left: 1.5 },
      minCellHeight: 5,
      overflow: "linebreak",
      halign: "center",
      valign: "middle",
    },
    didDrawCell: (data) => {
      if (!rejectedRowIndexes.has(data.row.index) || data.cell.text.length === 0) {
        return;
      }

      const scaleFactor = doc.internal.scaleFactor;
      const fontSize = data.cell.styles.fontSize / scaleFactor;
      const lineHeight = fontSize * doc.getLineHeightFactor();
      const textPosition = data.cell.getTextPos();
      let baselineY =
        textPosition.y +
        fontSize * (2 - 1.15) -
        (data.cell.text.length / 2) * lineHeight;

      doc.setDrawColor(120, 0, 0);
      doc.setLineWidth(0.25);
      data.cell.text.forEach((line) => {
        const textWidth = doc.getTextWidth(line);
        const startX = textPosition.x - textWidth / 2;
        const strikeY = baselineY - fontSize * 0.3;
        doc.line(startX, strikeY, startX + textWidth, strikeY);
        baselineY += lineHeight;
      });
    },
  });

  const totalPages = doc.getNumberOfPages();
  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    doc.setPage(pageNumber);
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text(`Page ${pageNumber} of ${totalPages}`, width / 2, height - 6, {
      align: "center",
    });
  }

  doc.save(`${safeFilename(specificationName)}.pdf`);
};
