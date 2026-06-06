import { useState, useCallback, useRef } from 'react';
import type { PageInfo, PdfSource } from '../types';

export function usePdfStore() {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [sources, setSources] = useState<PdfSource[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [thumbnailMap, setThumbnailMap] = useState<Map<string, string>>(new Map());
  const sourceIndexRef = useRef(0);

  const addSource = useCallback((source: PdfSource, pageIds: string[]) => {
    const sourceIndex = sourceIndexRef.current;
    sourceIndexRef.current += 1;

    const newPages: PageInfo[] = pageIds.map((id, i) => ({
      id,
      sourcePdfIndex: sourceIndex,
      sourcePageIndex: i,
      rotation: 0 as const,
      flipH: false,
      flipV: false,
    }));
    setPages(p => [...p, ...newPages]);
    setSources(prev => [...prev, source]);
  }, []);

  const setThumbnails = useCallback((entries: [string, string][]) => {
    setThumbnailMap(prev => {
      const next = new Map(prev);
      entries.forEach(([id, url]) => next.set(id, url));
      return next;
    });
  }, []);

  const removePages = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setPages(prev => prev.filter(p => !idSet.has(p.id)));
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
    setThumbnailMap(prev => {
      const next = new Map(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
  }, []);

  const updatePageRotation = useCallback((id: string, rotation: 0 | 90 | 180 | 270) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, rotation } : p));
  }, []);

  const togglePageFlipH = useCallback((id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, flipH: !p.flipH } : p));
  }, []);

  const togglePageFlipV = useCallback((id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, flipV: !p.flipV } : p));
  }, []);

  const reorderPages = useCallback((fromIndex: number, toIndex: number) => {
    setPages(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const selectPage = useCallback((id: string, multi = false, range = false) => {
    setSelectedIds(prev => {
      if (range) {
        const next = multi ? new Set(prev) : new Set<string>();
        next.add(id);
        return next;
      }

      if (multi) {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      }

      const next = new Set<string>();
      if (!prev.has(id) || prev.size > 1) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const resetPageTransform = useCallback((id: string) => {
    setPages(prev => prev.map(p =>
      p.id === id ? { ...p, rotation: 0 as const, flipH: false, flipV: false } : p
    ));
  }, []);

  const resetPageOrder = useCallback(() => {
    setPages(prev => [...prev].sort((a, b) => {
      if (a.sourcePdfIndex !== b.sourcePdfIndex) {
        return a.sourcePdfIndex - b.sourcePdfIndex;
      }
      return a.sourcePageIndex - b.sourcePageIndex;
    }));
  }, []);

  const clearAll = useCallback(() => {
    setPages([]);
    setSources([]);
    setSelectedIds(new Set());
    setThumbnailMap(new Map());
    sourceIndexRef.current = 0;
  }, []);

  return {
    pages,
    sources,
    selectedIds,
    thumbnailMap,
    addSource,
    setThumbnails,
    removePages,
    updatePageRotation,
    togglePageFlipH,
    togglePageFlipV,
    reorderPages,
    resetPageTransform,
    resetPageOrder,
    selectPage,
    clearSelection,
    clearAll,
  };
}
