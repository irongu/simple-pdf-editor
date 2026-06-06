import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// PDFRawStream mock class — hoisted so vi.mock factory can access it
const MockPDFRawStream = vi.hoisted(() => {
  return class {
    contents: Uint8Array;
    constructor(contents: Uint8Array) {
      this.contents = contents;
    }
  };
});

// Mock pdf-lib
const mockSave = vi.fn();
const mockAddPage = vi.fn();
const mockCopyPages = vi.fn();
const mockEmbedPage = vi.fn();
const mockGetPage = vi.fn();
const mockGetRotation = vi.fn(() => ({ angle: 0 }));
const mockSetRotation = vi.fn();
const mockDrawPage = vi.fn();
const mockGetSize = vi.fn(() => ({ width: 600, height: 800 }));

// Mock for PDFRawStream (node.get('Contents') result)
const mockRawContentStream = new MockPDFRawStream(new TextEncoder().encode('existing content'));

const mockNode = {
  get: vi.fn(() => mockRawContentStream),
};

const mockPdfDoc = {
  addPage: mockAddPage,
  copyPages: mockCopyPages,
  embedPage: mockEmbedPage,
  save: mockSave,
};

const mockSrcPdfDoc = {
  getPage: mockGetPage,
};

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    create: vi.fn(() => mockPdfDoc),
    load: vi.fn(() => mockSrcPdfDoc),
  },
  PDFName: {
    of: vi.fn((name: string) => ({ name })),
  },
  PDFRawStream: MockPDFRawStream,
  PDFNumber: { of: vi.fn((n: number) => n) },
}));

import { exportPdf } from './pdfExporter';
import type { PageInfo } from '../types';

describe('pdfExporter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSave.mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
    mockCopyPages.mockReturnValue([{ mock: 'copiedPage' }]);
    mockEmbedPage.mockReturnValue({ mock: 'embeddedPage' });

    // Source page mock (used by copyPages internally, and by getPage)
    mockGetPage.mockReturnValue({
      getSize: mockGetSize,
      getRotation: mockGetRotation,
      setRotation: mockSetRotation,
      drawPage: mockDrawPage,
    });

    // Output page mock — needs node.get for content stream prepend in mirror path
    mockAddPage.mockReturnValue({
      node: mockNode,
      getSize: vi.fn(() => ({ width: 600, height: 800 })),
      getRotation: mockGetRotation,
      setRotation: mockSetRotation,
      drawPage: mockDrawPage,
    });

    // Reset raw content stream bytes
    mockRawContentStream.contents = new TextEncoder().encode('existing content');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const makePage = (overrides: Partial<PageInfo> = {}): PageInfo => ({
    id: 'page-1',
    sourcePdfIndex: 0,
    sourcePageIndex: 0,
    rotation: 0,
    flipH: false,
    flipV: false,
    ...overrides,
  });

  const makeSource = () => ({
    name: 'test.pdf',
    bytes: new ArrayBuffer(8),
    pageCount: 1,
  });

  describe('exportPdf', () => {
    it('should return early when pages array is empty', async () => {
      await exportPdf([], [], 'output.pdf');
      expect(mockAddPage).not.toHaveBeenCalled();
    });

    it('should export a single page without transforms', async () => {
      const pages = [makePage()];
      const sources = [makeSource()];

      await exportPdf(pages, sources, 'output.pdf');

      expect(mockCopyPages).toHaveBeenCalledWith(mockSrcPdfDoc, [0]);
      expect(mockAddPage).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
    });

    it('should export a single page with rotation', async () => {
      const pages = [makePage({ rotation: 90 })];
      const sources = [makeSource()];

      await exportPdf(pages, sources, 'output.pdf');

      expect(mockCopyPages).toHaveBeenCalled();
      expect(mockSetRotation).toHaveBeenCalled();
    });

    it('should use copyPages + cm transform when flipH is true', async () => {
      const pages = [makePage({ flipH: true })];
      const sources = [makeSource()];

      await exportPdf(pages, sources, 'output.pdf');

      // Uses copyPages (not embedPage/drawPage)
      expect(mockCopyPages).toHaveBeenCalled();
      expect(mockEmbedPage).not.toHaveBeenCalled();
      expect(mockDrawPage).not.toHaveBeenCalled();
      expect(mockNode.get).toHaveBeenCalled();
    });

    it('should use copyPages + cm transform when flipV is true', async () => {
      const pages = [makePage({ flipV: true })];
      const sources = [makeSource()];

      await exportPdf(pages, sources, 'output.pdf');

      expect(mockCopyPages).toHaveBeenCalled();
      expect(mockEmbedPage).not.toHaveBeenCalled();
      expect(mockDrawPage).not.toHaveBeenCalled();
      expect(mockNode.get).toHaveBeenCalled();
    });

    it('should use copyPages + cm transform when both flipH and flipV are true', async () => {
      const pages = [makePage({ flipH: true, flipV: true })];
      const sources = [makeSource()];

      await exportPdf(pages, sources, 'output.pdf');

      expect(mockCopyPages).toHaveBeenCalled();
      expect(mockEmbedPage).not.toHaveBeenCalled();
      expect(mockNode.get).toHaveBeenCalled();
    });

    it('should prepend cm transform to content stream bytes for flipH', async () => {
      const pages = [makePage({ flipH: true })];
      const sources = [makeSource()];

      await exportPdf(pages, sources, 'output.pdf');

      // Verify that the cm prefix was prepended (content starts with "-1 0 0 1 600 0 cm")
      const contents = new TextDecoder().decode(mockRawContentStream.contents);
      expect(contents).toMatch(/^-1 0 0 1 600 0 cm\n/);
    });

    it('should prepend cm transform for flipV', async () => {
      const pages = [makePage({ flipV: true })];
      const sources = [makeSource()];

      await exportPdf(pages, sources, 'output.pdf');

      const contents = new TextDecoder().decode(mockRawContentStream.contents);
      expect(contents).toMatch(/^1 0 0 -1 0 800 cm\n/);
    });

    it('should prepend cm transform for both flipH and flipV', async () => {
      const pages = [makePage({ flipH: true, flipV: true })];
      const sources = [makeSource()];

      await exportPdf(pages, sources, 'output.pdf');

      const contents = new TextDecoder().decode(mockRawContentStream.contents);
      expect(contents).toMatch(/^-1 0 0 -1 600 800 cm\n/);
    });

    it('should apply rotation after mirror transform', async () => {
      const pages = [makePage({ flipH: true, rotation: 90 })];
      const sources = [makeSource()];

      await exportPdf(pages, sources, 'output.pdf');

      expect(mockCopyPages).toHaveBeenCalled();
      expect(mockSetRotation).toHaveBeenCalled();
    });

    it('should handle multiple pages from the same source (cached)', async () => {
      const pages = [makePage({ id: 'a' }), makePage({ id: 'b', sourcePageIndex: 1 })];
      const sources = [makeSource()];

      await exportPdf(pages, sources, 'output.pdf');

      const { PDFDocument } = await import('pdf-lib');
      expect(PDFDocument.load).toHaveBeenCalledTimes(1);
      expect(mockAddPage).toHaveBeenCalledTimes(2);
    });

    it('should skip pages with missing source', async () => {
      const pages = [makePage({ sourcePdfIndex: 99 })];

      await exportPdf(pages, [], 'output.pdf');

      expect(mockAddPage).not.toHaveBeenCalled();
    });

    it('should combine existing rotation with page rotation for non-mirror pages', async () => {
      mockGetRotation.mockReturnValue({ angle: 45 });
      const pages = [makePage({ rotation: 90 })];
      const sources = [makeSource()];

      await exportPdf(pages, sources, 'output.pdf');

      expect(mockSetRotation).toHaveBeenCalledWith(
        expect.objectContaining({ angle: 135 })
      );
    });

    it('should not call setRotation when rotation is 0 and existing is 0', async () => {
      mockGetRotation.mockReturnValue({ angle: 0 });
      const pages = [makePage({ rotation: 0 })];
      const sources = [makeSource()];

      await exportPdf(pages, sources, 'output.pdf');

      expect(mockSetRotation).not.toHaveBeenCalled();
    });

    it('should export pages from multiple sources', async () => {
      const { PDFDocument } = await import('pdf-lib');
      vi.mocked(PDFDocument.load).mockClear();

      const pages = [
        makePage({ id: 'a', sourcePdfIndex: 0 }),
        makePage({ id: 'b', sourcePdfIndex: 1 }),
      ];
      const sources = [makeSource(), { ...makeSource(), name: 'second.pdf' }];

      await exportPdf(pages, sources, 'output.pdf');

      expect(PDFDocument.load).toHaveBeenCalledTimes(2);
    });
  });

  describe('triggerDownload (via exportPdf)', () => {
    it('should trigger a download with correct filename and type', async () => {
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

      vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn());
      vi.spyOn(document.body, 'removeChild').mockImplementation(vi.fn());
      const clickSpy = vi.fn();

      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: clickSpy,
        style: {},
      } as unknown as HTMLAnchorElement);

      const pages = [makePage()];
      const sources = [makeSource()];

      await exportPdf(pages, sources, 'test.pdf');

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });
  });
});
