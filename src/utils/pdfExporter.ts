import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import type { PageInfo, PdfSource } from '../types';

/**
 * Export pages (with rotation and mirror transforms) to a single PDF and trigger download.
 */
export async function exportPdf(
  pages: PageInfo[],
  sources: PdfSource[],
  filename: string
): Promise<void> {
  if (pages.length === 0) return;

  const outputDoc = await PDFDocument.create();

  try {
    for (const page of pages) {
      const source = sources[page.sourcePdfIndex];
      if (!source) continue;

      // Load source PDF (cached per source)
      const sourceDoc = pageToSourceDocCache.get(source);
      let pdfDoc: PDFDocument;

      if (sourceDoc) {
        pdfDoc = sourceDoc;
      } else {
        pdfDoc = await PDFDocument.load(source.bytes);
        pageToSourceDocCache.set(source, pdfDoc);
      }

      if (page.flipH || page.flipV) {
        // Use copyPages + content-stream cm transform
        // This avoids the clipping issues of embedPage+drawPage with negative dimensions.
        const copiedPages = await outputDoc.copyPages(pdfDoc, [page.sourcePageIndex]);
        const newPage = outputDoc.addPage(copiedPages[0]);

        const { width, height } = newPage.getSize();

        // Build the cm transform matrix
        const a = page.flipH ? -1 : 1;
        const d = page.flipV ? -1 : 1;
        const e = page.flipH ? width : 0;
        const f = page.flipV ? height : 0;
        const cmPrefix = new TextEncoder().encode(`${a} 0 0 ${d} ${e} ${f} cm\n`);

        // Prepend the cm operator to the page content so it applies before existing drawing
        const contentsRef = newPage.node.get(PDFName.of('Contents'));
        if (contentsRef instanceof PDFRawStream) {
          const existing = contentsRef.contents;
          const combined = new Uint8Array(cmPrefix.length + existing.length);
          combined.set(cmPrefix, 0);
          combined.set(existing, cmPrefix.length);
          (contentsRef as { contents: Uint8Array }).contents = combined;
        }

        // Apply rotation after mirror
        if (page.rotation !== 0) {
          newPage.setRotation({ ...newPage.getRotation(), angle: page.rotation });
        }
      } else {
        // No mirror: copy page directly, apply rotation
        const copiedPage = await outputDoc.copyPages(pdfDoc, [page.sourcePageIndex]);
        const newPage = outputDoc.addPage(copiedPage[0]);

        if (page.rotation !== 0) {
          // Combine with any existing rotation on the source page
          const existingRotation = newPage.getRotation().angle;
          const totalRotation = (existingRotation + page.rotation) % 360;
          newPage.setRotation({ ...newPage.getRotation(), angle: totalRotation });
        }
      }
    }

    const pdfBytes = await outputDoc.save();
    triggerDownload(pdfBytes, filename);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error(`PDF 导出失败: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  } finally {
    // Clean up cached source docs - this will always run
    pageToSourceDocCache.clear();
  }
}

// Cache for loaded source PDF documents
const pageToSourceDocCache = new Map<PdfSource, PDFDocument>();

function triggerDownload(bytes: Uint8Array, filename: string) {
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
