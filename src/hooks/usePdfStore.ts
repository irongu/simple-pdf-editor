import { useState, useCallback, useRef } from 'react';
import { useHistory } from './useHistory';
import type { PageInfo, PdfSource } from '../types';

type DocumentState = {
  pages: PageInfo[];
  sources: PdfSource[];
  thumbnailMap: Map<string, string>;
  nextSourceIndex: number;
};

export function usePdfStore() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const sourceIndexRef = useRef(0);
  const inTransactionRef = useRef(false);

  const history = useHistory<DocumentState>({
    pages: [],
    sources: [],
    thumbnailMap: new Map(),
    nextSourceIndex: 0,
  });

  const { pages, sources, thumbnailMap } = history.state;

  const pushIfNotInTransaction = useCallback(() => {
    if (!inTransactionRef.current) {
      history.push(history.getState());
    }
  }, [history]);

  const beginTransaction = useCallback(() => {
    if (!inTransactionRef.current) {
      history.push(history.getState());
      inTransactionRef.current = true;
    }
  }, [history]);

  const commitTransaction = useCallback(() => {
    inTransactionRef.current = false;
  }, []);

  const addSource = useCallback((source: PdfSource, pageIds: string[]) => {
    pushIfNotInTransaction();

    const state = history.getState();
    const sourceIndex = state.nextSourceIndex;

    const newPages: PageInfo[] = pageIds.map((id, i) => ({
      id,
      sourcePdfIndex: sourceIndex,
      sourcePageIndex: i,
      rotation: 0 as const,
      flipH: false,
      flipV: false,
    }));

    history.setState({
      ...state,
      pages: [...state.pages, ...newPages],
      sources: [...state.sources, source],
      nextSourceIndex: sourceIndex + 1,
    });

    sourceIndexRef.current = sourceIndex + 1;
  }, [pushIfNotInTransaction, history]);

  const setThumbnails = useCallback((entries: [string, string][]) => {
    const state = history.getState();
    history.setState({
      ...state,
      thumbnailMap: new Map([...state.thumbnailMap, ...entries]),
    });
  }, [history]);

  const removePages = useCallback((ids: string[]) => {
    if (ids.length === 0) return;

    pushIfNotInTransaction();

    const state = history.getState();
    const idSet = new Set(ids);
    history.setState({
      ...state,
      pages: state.pages.filter(p => !idSet.has(p.id)),
      thumbnailMap: new Map(
        [...state.thumbnailMap].filter(([id]) => !idSet.has(id))
      ),
    });

    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
  }, [pushIfNotInTransaction]);

  const updatePageRotation = useCallback((id: string, rotation: 0 | 90 | 180 | 270) => {
    pushIfNotInTransaction();

    const state = history.getState();
    history.setState({
      ...state,
      pages: state.pages.map(p =>
        p.id === id ? { ...p, rotation } : p
      ),
    });
  }, [pushIfNotInTransaction]);

  const togglePageFlipH = useCallback((id: string) => {
    pushIfNotInTransaction();

    const state = history.getState();
    history.setState({
      ...state,
      pages: state.pages.map(p =>
        p.id === id ? { ...p, flipH: !p.flipH } : p
      ),
    });
  }, [pushIfNotInTransaction]);

  const togglePageFlipV = useCallback((id: string) => {
    pushIfNotInTransaction();

    const state = history.getState();
    history.setState({
      ...state,
      pages: state.pages.map(p =>
        p.id === id ? { ...p, flipV: !p.flipV } : p
      ),
    });
  }, [pushIfNotInTransaction]);

  const reorderPages = useCallback((fromIndex: number, toIndex: number) => {
    pushIfNotInTransaction();

    const state = history.getState();
    const next = [...state.pages];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    history.setState({
      ...state,
      pages: next,
    });
  }, [pushIfNotInTransaction]);

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
    pushIfNotInTransaction();

    const state = history.getState();
    history.setState({
      ...state,
      pages: state.pages.map(p =>
        p.id === id ? { ...p, rotation: 0 as const, flipH: false, flipV: false } : p
      ),
    });
  }, [pushIfNotInTransaction]);

  const resetPageOrder = useCallback(() => {
    pushIfNotInTransaction();

    const state = history.getState();
    history.setState({
      ...state,
      pages: [...state.pages].sort((a, b) => {
        if (a.sourcePdfIndex !== b.sourcePdfIndex) {
          return a.sourcePdfIndex - b.sourcePdfIndex;
        }
        return a.sourcePageIndex - b.sourcePageIndex;
      }),
    });
  }, [pushIfNotInTransaction]);

  const clearAll = useCallback(() => {
    pushIfNotInTransaction();

    history.setState({
      pages: [],
      sources: [],
      thumbnailMap: new Map(),
      nextSourceIndex: 0,
    });

    setSelectedIds(new Set());
    sourceIndexRef.current = 0;
  }, [pushIfNotInTransaction]);

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
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    beginTransaction,
    commitTransaction,
  };
}
