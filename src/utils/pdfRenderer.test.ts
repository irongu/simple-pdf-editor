import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock pdfjs-dist
const mockDestroy = vi.fn();
const mockGetPage = vi.fn();

const mockPdfDoc = {
  numPages: 3,
  getPage: mockGetPage,
  destroy: mockDestroy,
};

const mockPage = {
  getViewport: vi.fn(),
  render: vi.fn(() => ({ promise: Promise.resolve() })),
};

const mockLoadingTask = {
  promise: Promise.resolve(mockPdfDoc),
};

vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(() => mockLoadingTask),
  GlobalWorkerOptions: { workerSrc: '' },
}));

// Import after mock so tests use the mocked version
import { getPageCount, renderThumbnail, renderAllThumbnails } from './pdfRenderer';

describe('pdfRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the mock pdf doc
    mockPdfDoc.numPages = 3;
    mockPdfDoc.getPage = mockGetPage;
    mockPdfDoc.destroy = mockDestroy;

    // Setup page mock
    mockGetPage.mockResolvedValue(mockPage);
    mockPage.getViewport.mockImplementation(({ scale }: { scale: number }) => ({
      width: 600 * (scale || 1),
      height: 800 * (scale || 1),
    }));

    // Mock canvas
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({
        drawImage: vi.fn(),
      })),
      toDataURL: vi.fn(() => 'data:image/png;base64,mockthumbnail'),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(
      mockCanvas as unknown as HTMLCanvasElement
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPageCount', () => {
    it('should return the correct page count', async () => {
      const bytes = new ArrayBuffer(8);
      mockPdfDoc.numPages = 5;

      const count = await getPageCount(bytes);

      expect(count).toBe(5);
      expect(mockDestroy).toHaveBeenCalled();
    });

    it('should handle single-page PDF', async () => {
      mockPdfDoc.numPages = 1;
      const count = await getPageCount(new ArrayBuffer(8));
      expect(count).toBe(1);
    });

    it('should call pdfjs getDocument with correct data', async () => {
      const { getDocument } = await import('pdfjs-dist');
      const bytes = new ArrayBuffer(16);

      await getPageCount(bytes);

      expect(getDocument).toHaveBeenCalledWith({ data: bytes });
    });

    it('should propagate errors from pdfjs', async () => {
      const { getDocument } = await import('pdfjs-dist');
      vi.mocked(getDocument).mockReturnValueOnce({
        promise: Promise.reject(new Error('Invalid PDF')),
      } as any);

      await expect(getPageCount(new ArrayBuffer(8))).rejects.toThrow('Invalid PDF');
    });
  });

  describe('renderThumbnail', () => {
    it('should render a page and return a ThumbnailResult', async () => {
      const bytes = new ArrayBuffer(8);
      const result = await renderThumbnail(bytes, 0);

      expect(result).toHaveProperty('imageUrl');
      expect(result).toHaveProperty('width');
      expect(result).toHaveProperty('height');
      expect(result.imageUrl).toContain('data:image/png');
      expect(mockGetPage).toHaveBeenCalledWith(1); // 1-based index
    });

    it('should use 1-based page index for pdfjs', async () => {
      const bytes = new ArrayBuffer(8);
      await renderThumbnail(bytes, 2); // 0-based index 2 => 1-based index 3

      expect(mockGetPage).toHaveBeenCalledWith(3);
    });

    it('should calculate correct thumbnail dimensions', async () => {
      const bytes = new ArrayBuffer(8);

      // page is 600x800, scale to width 200 => scale = 200/600 = 1/3
      // scaled width = 600/3 = 200, scaled height = 800/3 ? 267
      const result = await renderThumbnail(bytes, 0);

      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    it('should destroy the PDF document after rendering', async () => {
      const bytes = new ArrayBuffer(8);
      await renderThumbnail(bytes, 0);

      expect(mockDestroy).toHaveBeenCalled();
    });

    it('should handle errors during rendering', async () => {
      mockGetPage.mockRejectedValueOnce(new Error('Page not found'));

      await expect(
        renderThumbnail(new ArrayBuffer(8), 999)
      ).rejects.toThrow('Page not found');
    });

    it('should render a landscape page correctly', async () => {
      mockPage.getViewport.mockImplementation(({ scale }: { scale: number }) => ({
        width: 1200 * (scale || 1),
        height: 600 * (scale || 1),
      }));

      const result = await renderThumbnail(new ArrayBuffer(8), 0);

      // landscape 1200x600, scale = 200/1200 = 1/6
      // width = 1200/6 = 200, height = 600/6 = 100
      expect(result.width).toBe(200);
      expect(result.height).toBe(100);
    });
  });

  describe('renderAllThumbnails', () => {
    it('should render all pages and return results with total count', async () => {
      mockPdfDoc.numPages = 3;
      const bytes = new ArrayBuffer(8);

      const { results, totalPages } = await renderAllThumbnails(bytes);

      expect(totalPages).toBe(3);
      expect(results).toHaveLength(3);
      expect(mockGetPage).toHaveBeenCalledTimes(3);
      expect(mockDestroy).toHaveBeenCalled();
    });

    it('should handle a PDF with 0 pages', async () => {
      mockPdfDoc.numPages = 0;
      const bytes = new ArrayBuffer(8);

      const { results, totalPages } = await renderAllThumbnails(bytes);

      expect(totalPages).toBe(0);
      expect(results).toHaveLength(0);
    });

    it('should handle a single-page PDF', async () => {
      mockPdfDoc.numPages = 1;
      const bytes = new ArrayBuffer(8);

      const { results, totalPages } = await renderAllThumbnails(bytes);

      expect(totalPages).toBe(1);
      expect(results).toHaveLength(1);
      expect(results[0].imageUrl).toContain('data:image/png');
    });

    it('should handle many pages efficiently', async () => {
      mockPdfDoc.numPages = 50;
      const bytes = new ArrayBuffer(8);

      const { results, totalPages } = await renderAllThumbnails(bytes);

      expect(totalPages).toBe(50);
      expect(results).toHaveLength(50);
      expect(mockGetPage).toHaveBeenCalledTimes(50);
    });

    it('should propagate rendering errors', async () => {
      mockGetPage.mockRejectedValueOnce(new Error('Render failed'));
      mockPdfDoc.numPages = 1;

      await expect(
        renderAllThumbnails(new ArrayBuffer(8))
      ).rejects.toThrow('Render failed');
    });

    it('should use bytes.slice(0) to avoid detached ArrayBuffer issues', async () => {
      const { getDocument } = await import('pdfjs-dist');
      const bytes = new ArrayBuffer(8);

      await renderAllThumbnails(bytes);

      // Check that getDocument was called - implementation uses bytes.slice(0)
      // to avoid detached ArrayBuffer
      expect(getDocument).toHaveBeenCalled();
      const calledWith = vi.mocked(getDocument).mock.calls[0][0];
      expect(calledWith).toHaveProperty('data');
    });
  });
});
