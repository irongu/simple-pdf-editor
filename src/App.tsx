import { useCallback, useEffect, useState } from 'react';
import { GlobalNav } from './components/Layout/GlobalNav';
import { Toolbar } from './components/Layout/Toolbar';
import { Footer } from './components/Layout/Footer';
import { Panel } from './components/Layout/Panel';
import { usePdfStore } from './hooks/usePdfStore';
import { EmptyState } from './components/EmptyState';
import { ThumbnailGrid } from './components/ThumbnailGrid';
import { HelpModal } from './components/HelpModal';
import { renderAllThumbnails } from './utils/pdfRenderer';
import { exportPdf } from './utils/pdfExporter';
import type { PageInfo, PdfSource } from './types';

let idCounter = 0;
const genId = () => `page-${++idCounter}`;

function App() {
  const store = usePdfStore();
  const { pages, selectedIds, thumbnailMap, sources, addSource, setThumbnails,
    removePages, updatePageRotation,
    togglePageFlipH, togglePageFlipV, reorderPages, selectPage,
    clearSelection, resetPageTransform, resetPageOrder, clearAll,
    undo, redo, canUndo, canRedo, beginTransaction, commitTransaction } = store;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const loadPdfFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const bytes = await file.arrayBuffer();

      // Render all thumbnails in one pass (also gets page count).
      // Use .slice(0) so the original ArrayBuffer is preserved for pdf-lib export.
      const { results, totalPages } = await renderAllThumbnails(bytes.slice(0));

      if (totalPages === 0) {
        setError('PDF 文件不包含任何页面。');
        setLoading(false);
        return;
      }

      // Store the original bytes for later pdf-lib export
      const source: PdfSource = { name: file.name, bytes, pageCount: totalPages };

      // Generate page IDs and map to thumbnail results
      const pageIds: string[] = [];
      const entries: [string, string][] = [];
      for (let i = 0; i < totalPages; i++) {
        const id = genId();
        pageIds.push(id);
        results[i].pageId = id;
        entries.push([id, results[i].imageUrl]);
      }

      // Add source to store (with page IDs)
      addSource(source, pageIds);
      setThumbnails(entries);

    } catch (err) {
      console.error('Failed to load PDF:', err);
      setError('无法加载 PDF 文件，请确认文件未损坏且未加密。');
    } finally {
      setLoading(false);
    }
  }, [addSource, setThumbnails]);

  const handleOpenPdf = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (pages.length > 0) {
        clearAll();
      }
      await loadPdfFile(file);
    };
    input.click();
  }, [loadPdfFile, pages.length, clearAll]);

  const handleAppendPdf = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      await loadPdfFile(file);
    };
    input.click();
  }, [loadPdfFile]);

  // Drag-and-drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.pdf'));
    if (files.length === 0) return;

    // If no pages loaded, replace; otherwise append
    if (pages.length === 0) {
      clearAll();
      await loadPdfFile(files[0]);
      // Load additional dropped PDFs by appending
      for (let i = 1; i < files.length; i++) {
        await loadPdfFile(files[i]);
      }
    } else {
      for (const file of files) {
        await loadPdfFile(file);
      }
    }
  }, [loadPdfFile, pages.length, clearAll]);

  const getSelectedIds = useCallback(() => Array.from(selectedIds), [selectedIds]);

  const handleRotateCW = useCallback(() => {
    beginTransaction();
    getSelectedIds().forEach(id => {
      const page = pages.find(p => p.id === id);
      if (page) updatePageRotation(id, ((page.rotation + 90) % 360) as 0 | 90 | 180 | 270);
    });
    commitTransaction();
  }, [pages, updatePageRotation, getSelectedIds, beginTransaction, commitTransaction]);

  const handleRotateCCW = useCallback(() => {
    beginTransaction();
    getSelectedIds().forEach(id => {
      const page = pages.find(p => p.id === id);
      if (page) updatePageRotation(id, ((page.rotation + 270) % 360) as 0 | 90 | 180 | 270);
    });
    commitTransaction();
  }, [pages, updatePageRotation, getSelectedIds, beginTransaction, commitTransaction]);

  const handleRotate180 = useCallback(() => {
    beginTransaction();
    getSelectedIds().forEach(id => {
      const page = pages.find(p => p.id === id);
      if (page) updatePageRotation(id, ((page.rotation + 180) % 360) as 0 | 90 | 180 | 270);
    });
    commitTransaction();
  }, [pages, updatePageRotation, getSelectedIds, beginTransaction, commitTransaction]);

  const handleFlipH = useCallback(() => {
    beginTransaction();
    getSelectedIds().forEach(id => togglePageFlipH(id));
    commitTransaction();
  }, [togglePageFlipH, getSelectedIds, beginTransaction, commitTransaction]);

  const handleFlipV = useCallback(() => {
    beginTransaction();
    getSelectedIds().forEach(id => togglePageFlipV(id));
    commitTransaction();
  }, [togglePageFlipV, getSelectedIds, beginTransaction, commitTransaction]);

  const handleDelete = useCallback(() => {
    removePages(getSelectedIds());
  }, [removePages, getSelectedIds]);

  const handleReset = useCallback(() => {
    beginTransaction();
    getSelectedIds().forEach(id => resetPageTransform(id));
    resetPageOrder();
    commitTransaction();
  }, [resetPageTransform, resetPageOrder, getSelectedIds, beginTransaction, commitTransaction]);

  const handleExportPdf = useCallback(async () => {
    if (pages.length === 0) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const baseName = sources[0]?.name?.replace(/\.pdf$/i, '') || 'document';
    await exportPdf(pages, sources, `${baseName}_edited_${timestamp}.pdf`);
  }, [pages, sources]);

  const handleExportSelected = useCallback(async () => {
    const selectedPages = pages.filter(p => selectedIds.has(p.id));
    if (selectedPages.length === 0) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const baseName = sources[0]?.name?.replace(/\.pdf$/i, '') || 'document';
    await exportPdf(selectedPages, sources, `${baseName}_selected_${timestamp}.pdf`);
  }, [pages, sources, selectedIds]);

  const firstSelected = pages.find(p => selectedIds.has(p.id));
  const flipHActive = firstSelected?.flipH ?? false;
  const flipVActive = firstSelected?.flipV ?? false;
  const selectedPages: PageInfo[] = pages.filter(p => selectedIds.has(p.id));

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const selectedArr = Array.from(selectedIds);
      
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (selectedArr.length > 0) {
            e.preventDefault();
            removePages(selectedArr);
          }
          break;
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey && selectedArr.length > 0) {
            e.preventDefault();
            selectedArr.forEach(id => {
              const page = pages.find(p => p.id === id);
              if (page) updatePageRotation(id, ((page.rotation + 90) % 360) as 0 | 90 | 180 | 270);
            });
          }
          break;
        case 'h':
        case 'H':
          if (!e.ctrlKey && !e.metaKey && selectedArr.length > 0) {
            e.preventDefault();
            selectedArr.forEach(id => togglePageFlipH(id));
          }
          break;
        case 'v':
        case 'V':
          if (!e.ctrlKey && !e.metaKey && selectedArr.length > 0) {
            e.preventDefault();
            selectedArr.forEach(id => togglePageFlipV(id));
          }
          break;
        case 'z':
        case 'Z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case 'y':
        case 'Y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            redo();
          }
          break;
        case 'Escape':
          clearSelection();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pages, selectedIds, removePages, updatePageRotation, togglePageFlipH, togglePageFlipV, clearSelection, undo, redo]);

  return (
    <>
      <GlobalNav totalPages={pages.length} selectedCount={selectedIds.size} onHelp={() => setShowHelp(true)} />
      <Toolbar
        onOpenPdf={handleOpenPdf}
        onAppendPdf={handleAppendPdf}
        onRotateCW={handleRotateCW}
        onRotateCCW={handleRotateCCW}
        onRotate180={handleRotate180}
        onFlipH={handleFlipH}
        onFlipV={handleFlipV}
        onExportPdf={handleExportPdf}
        onExportSelected={handleExportSelected}
        onDelete={handleDelete}
        onReset={handleReset}
        onUndo={undo}
        onRedo={redo}
        hasSelection={selectedIds.size > 0}
        hasPages={pages.length > 0}
        flipHActive={flipHActive}
        flipVActive={flipVActive}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <main
        className="flex-1 bg-apple-canvas-parchment flex gap-6 p-6 overflow-auto min-h-0 relative"
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drop overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-40 bg-apple-primary/10 border-2 border-dashed border-apple-primary rounded-xl flex items-center justify-center m-4 pointer-events-none">
            <div className="text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-apple-primary mx-auto mb-3">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p className="text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-apple-primary"
                style={{ fontFamily: 'var(--font-display)' }}>
                释放以添加 PDF
              </p>
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          {loading && pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="w-10 h-10 border-4 border-apple-hairline border-t-apple-primary rounded-full animate-spin mb-4" />
              <p className="text-[17px] text-apple-ink-muted-48">正在加载 PDF...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-apple-ink-muted-48 mb-4">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-apple-ink-muted-48 mb-2">{error}</p>
              <button onClick={handleOpenPdf} className="apple-btn-primary mt-4">重新选择</button>
            </div>
          ) : pages.length === 0 ? (
            <EmptyState onOpenPdf={handleOpenPdf} />
          ) : (
            <ThumbnailGrid
              pages={pages}
              selectedIds={selectedIds}
              thumbnailMap={thumbnailMap}
              onSelect={selectPage}
              onReorder={reorderPages}
              loading={loading}
            />
          )}
        </div>
        <Panel
          selectedPages={selectedPages}
          onRotateCW={handleRotateCW}
          onRotateCCW={handleRotateCCW}
          onFlipH={handleFlipH}
          onFlipV={handleFlipV}
          onReset={handleReset}
        />
      </main>
      <Footer />
      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}

export default App;
