import { DesignsDocument } from "@/types/designing-stage-types";

type RevisionDoc = Pick<DesignsDocument, "doc_og_name" | "created_at">;

export const getRevisionKey = (fileName: string, prefix: "Q" | "D" | "R") => {
  let parsedName = fileName.replace(/\.[^/.]+$/, "");
  parsedName = parsedName.replace(/^\[.*?\]\s*/, "");
  const match =
    prefix === "Q"
      ? parsedName.match(/^Q(\d+)_(.+)_\d{4}-\d{2}-\d{2}$/i)
      : parsedName.match(/^D(\d+)_(?:(2D|3D)_)?(.+)_\d{4}-\d{2}-\d{2}$/i);

  if (!match) return null;

  if (prefix === "Q") {
    return `${match[1]}-${match[2].toLowerCase()}`;
  }

  return `${match[1]}-${match[3].toLowerCase()}`;
};

export const getDesignRevisionKey = (fileName: string) =>
  getRevisionKey(fileName, "D") ?? getRevisionKey(fileName, "R");

// Design docs that don't already have a quotation linked to their revision
export const getDesignDocsWithoutQuotation = <T extends RevisionDoc>(
  designDocs: T[],
  quotationDocs: RevisionDoc[],
): T[] => {
  const usedQuotationKeys = new Set(
    quotationDocs
      .map((doc) => getRevisionKey(doc.doc_og_name, "Q"))
      .filter((key): key is string => Boolean(key)),
  );
  return designDocs.filter((doc) => {
    const designKey = getDesignRevisionKey(doc.doc_og_name);
    return !designKey || !usedQuotationKeys.has(designKey);
  });
};

// Base design first, then 2D, then 3D within the same revision
const DESIGN_VARIANT_ORDER: Record<string, number> = { "": 0, "2D": 1, "3D": 2 };

const getDesignRevisionInfo = (fileName: string) => {
  const parsedName = fileName.replace(/\.[^/.]+$/, "").replace(/^\[.*?\]\s*/, "");
  const match = parsedName.match(/^D(\d+)_(?:(2D|3D)_)?/i);
  if (!match) return null;
  return {
    revision: Number(match[1]),
    variantOrder: DESIGN_VARIANT_ORDER[(match[2] ?? "").toUpperCase()] ?? 0,
  };
};

// Groups design docs by revision, latest revision first (D2, D1, D0, ...).
// Files that don't follow the naming pattern go in a trailing group.
export const groupDesignDocsByRevision = <T extends RevisionDoc>(docs: T[]) => {
  const byNewest = (a: T, b: T) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

  const groups = new Map<number, { doc: T; variantOrder: number }[]>();
  const ungrouped: T[] = [];

  docs.forEach((doc) => {
    const info = getDesignRevisionInfo(doc.doc_og_name);
    if (!info) {
      ungrouped.push(doc);
      return;
    }
    const group = groups.get(info.revision) ?? [];
    group.push({ doc, variantOrder: info.variantOrder });
    groups.set(info.revision, group);
  });

  const result = [...groups.entries()]
    .sort(([a], [b]) => b - a)
    .map(([revision, items]) => ({
      key: `D${revision}`,
      docs: items
        .sort((a, b) => a.variantOrder - b.variantOrder || byNewest(a.doc, b.doc))
        .map((item) => item.doc),
    }));

  if (ungrouped.length > 0) {
    result.push({ key: "other", docs: ungrouped.sort(byNewest) });
  }

  return result;
};
