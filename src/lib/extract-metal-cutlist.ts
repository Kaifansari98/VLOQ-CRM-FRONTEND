import { parseMetalPartInfo, type PdfTextPage, type MetalCutlistResult } from "./metal-cutlist-parser";

/** Local-only extraction: no PDF or extracted data is sent to a server. */
export async function extractMetalCutlist(file: File, onProgress: (message: string) => void): Promise<MetalCutlistResult> {
  if (!file.name.toLowerCase().endsWith(".pdf")) throw new Error("Please choose a PDF file.");
  if (file.size > 50 * 1024 * 1024) throw new Error("Please choose a PDF smaller than 50 MB.");
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true });
  try {
    const document = await task.promise;
    if (document.numPages > 250) throw new Error("Please choose a PDF with 250 pages or fewer.");
    const pages: PdfTextPage[] = [];
    for (let number = 1; number <= document.numPages; number++) {
      onProgress(`Reading page ${number} of ${document.numPages}…`);
      const page = await document.getPage(number);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      pages.push({ page: number, width: viewport.width, height: viewport.height, items: content.items.flatMap(item => {
        if (!("str" in item)) return [];
        const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
        return [{ str: item.str, x, y, width: item.width, height: item.height }];
      }) });
    }
    const result = parseMetalPartInfo(pages);
    for (const number of new Set(result.parts.map(part => part.page))) {
      onProgress(`Extracting thumbnails from page ${number}…`);
      const page = await document.getPage(number);
      const scale = 2;
      const viewport = page.getViewport({ scale });
      const canvas = window.document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      try {
        await page.render({ canvas, viewport }).promise;
        for (const part of result.parts.filter(part => part.page === number)) {
          const bounds = part.thumbnailBounds;
          const crop = window.document.createElement("canvas");
          crop.width = Math.ceil(bounds.width * scale);
          crop.height = Math.ceil(bounds.height * scale);
          const context = crop.getContext("2d");
          if (!context) throw new Error("Unable to extract thumbnails.");
          context.drawImage(canvas, bounds.x * scale, bounds.y * scale, bounds.width * scale, bounds.height * scale, 0, 0, crop.width, crop.height);
          part.thumbnail = crop.toDataURL("image/png");
          crop.width = crop.height = 0;
        }
      } catch {
        result.warnings.push(`Page ${number}: thumbnail preview unavailable; table values were extracted.`);
      } finally {
        canvas.width = canvas.height = 0;
        page.cleanup();
      }
    }
    return result;
  } catch (error) {
    if (error instanceof Error && error.name === "PasswordException") throw new Error("This PDF is password protected. Choose an unlocked copy.");
    if (error instanceof Error && error.name === "InvalidPDFException") throw new Error("This file could not be read as a PDF. Choose a valid PDF file.");
    throw error;
  } finally {
    await task.destroy();
  }
}
