import * as pdfjsLib from 'pdfjs-dist';

// Set worker - use the same version bundled with pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const THUMBNAIL_WIDTH = 200;

export interface ThumbnailResult {
  pageId: string;
  imageUrl: string;
  width: number;
  height: number;
}

export async function getPageCount(bytes: ArrayBuffer): Promise<number> {
  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const count = pdf.numPages;
  pdf.destroy();
  return count;
}

export async function renderThumbnail(
  bytes: ArrayBuffer,
  pageIndex: number // 0-based
): Promise<ThumbnailResult> {
  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageIndex + 1); // PDF.js pages are 1-based

  const viewport = page.getViewport({ scale: 1 });
  const scale = THUMBNAIL_WIDTH / viewport.width;
  const scaledViewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;

  await page.render({
    canvas,
    viewport: scaledViewport,
  }).promise;

  const imageUrl = canvas.toDataURL('image/png');

  pdf.destroy();

  return {
    pageId: '', // will be set by caller
    imageUrl,
    width: scaledViewport.width,
    height: scaledViewport.height,
  };
}

// Render all pages of a PDF in one pass — also returns total page count.
// Accepts bytes directly to avoid double-parsing / detached ArrayBuffer issues.
export async function renderAllThumbnails(
  bytes: ArrayBuffer,
): Promise<{ results: ThumbnailResult[]; totalPages: number }> {
  const results: ThumbnailResult[] = [];
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(0) });
  const pdf = await loadingTask.promise;
  const total = pdf.numPages;

  for (let i = 0; i < total; i++) {
    const page = await pdf.getPage(i + 1);
    const viewport = page.getViewport({ scale: 1 });
    const scale = THUMBNAIL_WIDTH / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    await page.render({
      canvas,
      viewport: scaledViewport,
    }).promise;

    const imageUrl = canvas.toDataURL('image/png');
    results.push({
      pageId: '', // will be assigned by caller
      imageUrl,
      width: scaledViewport.width,
      height: scaledViewport.height,
    });
  }

  pdf.destroy();
  return { results, totalPages: total };
}
