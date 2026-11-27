export type PdfTextPosition = { str: string; x: number; y: number; width: number; height: number };
export type PdfTextPage = { page: number; width: number; height: number; items: PdfTextPosition[] };
export type MetalPart = {
  order: number;
  partName: string;
  size: string;
  dimension1Mm: number;
  dimension2Mm: number;
  partsCount: number;
  nestCount: number;
  remainCount: number;
  processed: number;
  page: number;
  thumbnail?: string;
  thumbnailBounds: { x: number; y: number; width: number; height: number };
};
export type MetalCutlistResult = { parts: MetalPart[]; warnings: string[]; pageCount: number };
const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, "");
const center = (item: PdfTextPosition) => item.x + item.width / 2;

/** Read the summary Part Info table by column positions, including continuation pages.
 * PDF text is often emitted column-by-column, so its raw string order is unsuitable.
 */
export function parseMetalPartInfo(pages: PdfTextPage[]): MetalCutlistResult {
  const parts: MetalPart[] = [];
  const warnings: string[] = [];
  let inPartInfo = false;
  for (const page of pages) {
    const items = page.items.filter(item => item.str.trim());
    const title = items.find(item => normalize(item.str) === "partinfo");
    if (title) inPartInfo = true;
    if (!inPartInfo) continue;
    const labels = ["order", "partname", "thumbnail", "size(mm*mm)", "partscount", "nestcount", "remaincount", "processed"];
    const headers = labels.map(label => items.find(item => normalize(item.str).replace("×", "*") === label));
    if (headers.some(header => !header)) {
      if (title) warnings.push(`Page ${page.page}: Part Info column headings could not be read.`);
      inPartInfo = false;
      continue;
    }
    const columns = headers as PdfTextPosition[];
    const centers = columns.map(center);
    const boundaries = centers.slice(1).map((value, index) => (centers[index] + value) / 2);
    const columnOf = (item: PdfTextPosition) => {
      const index = boundaries.findIndex(boundary => center(item) < boundary);
      return index < 0 ? 7 : index;
    };
    const headerY = Math.max(...columns.map(item => item.y));
    const anchors = items.filter(item => item.y > headerY + 5 && columnOf(item) === 0 && /^\d+$/.test(item.str.trim())).sort((a, b) => a.y - b.y);
    if (!anchors.length) warnings.push(`Page ${page.page}: no Part Info rows could be read.`);
    for (const [index, anchor] of anchors.entries()) {
      const rowHeight = anchors[index + 1] ? anchors[index + 1].y - anchor.y : index ? anchor.y - anchors[index - 1].y : 60;
      const rowCenter = anchor.y - anchor.height / 2;
      const top = rowCenter - rowHeight / 2;
      const bottom = rowCenter + rowHeight / 2;
      const row = items.filter(item => item.y > headerY + 5 && item.y - item.height / 2 > top && item.y - item.height / 2 < bottom);
      const cells = columns.map((_, column) => row.filter(item => columnOf(item) === column).sort((a, b) => Math.abs(a.y - b.y) < 3 ? a.x - b.x : a.y - b.y).map(item => item.str.trim()).join(" "));
      const size = cells[3].match(/^([\d,]+(?:\.\d+)?)\s*[x×*]\s*([\d,]+(?:\.\d+)?)(?:\s*mm)?$/i);
      const counts = cells.slice(4).map(value => /^\d+$/.test(value) ? Number(value) : NaN);
      const dimensions = size ? [Number(size[1].replaceAll(",", "")), Number(size[2].replaceAll(",", ""))] : [];
      if (!cells[1] || !size || dimensions.some(value => !Number.isFinite(value) || value <= 0) || counts.some(value => !Number.isSafeInteger(value))) {
        warnings.push(`Page ${page.page}, row ${anchor.str}: incomplete or invalid data; review the PDF before using this cutlist.`);
        continue;
      }
      parts.push({
        order: Number(anchor.str), partName: cells[1], size: cells[3], dimension1Mm: dimensions[0], dimension2Mm: dimensions[1],
        partsCount: counts[0], nestCount: counts[1], remainCount: counts[2], processed: counts[3], page: page.page,
        thumbnailBounds: { x: boundaries[1] + 2, y: Math.max(headerY + 6, top + 5), width: boundaries[2] - boundaries[1] - 4, height: rowHeight - 10 },
      });
    }
  }
  if (!parts.length) throw new Error("No readable Part Info table found. Choose a text-based nesting PDF containing the Part Info table; scanned PDFs are not supported yet.");
  return { parts, warnings, pageCount: pages.length };
}
