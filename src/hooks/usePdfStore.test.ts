import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePdfStore } from './usePdfStore';
import type { PageInfo, PdfSource } from '../types';

function makeSource(overrides: Partial<PdfSource> = {}): PdfSource {
  return {
    name: 'test.pdf',
    bytes: new ArrayBuffer(8),
    pageCount: 3,
    ...overrides,
  };
}

describe('usePdfStore', () => {
  let result: { current: ReturnType<typeof usePdfStore> };

  beforeEach(() => {
    const rendered = renderHook(() => usePdfStore());
    result = rendered.result;
  });

  // ==================== addSource ====================
  describe('addSource', () => {
    it('should add a source and create pages with correct metadata', () => {
      const source = makeSource({ pageCount: 3 });
      act(() => { result.current.addSource(source, ['a', 'b', 'c']); });

      expect(result.current.sources).toHaveLength(1);
      expect(result.current.sources[0]).toEqual(source);
      expect(result.current.pages).toHaveLength(3);
      expect(result.current.pages[0]).toMatchObject({
        id: 'a', sourcePdfIndex: 0, sourcePageIndex: 0,
        rotation: 0, flipH: false, flipV: false,
      });
      expect(result.current.pages[1]).toMatchObject({
        id: 'b', sourcePdfIndex: 0, sourcePageIndex: 1,
      });
      expect(result.current.pages[2]).toMatchObject({
        id: 'c', sourcePdfIndex: 0, sourcePageIndex: 2,
      });
    });

    it('should handle empty pageIds array', () => {
      const source = makeSource({ pageCount: 0 });
      act(() => { result.current.addSource(source, []); });
      expect(result.current.pages).toHaveLength(0);
      expect(result.current.sources).toHaveLength(1);
    });

    it('should assign correct sourceIndex for multiple sources', () => {
      act(() => { result.current.addSource(makeSource(), ['a', 'b']); });
      act(() => { result.current.addSource(makeSource({ name: 'second.pdf' }), ['c']); });

      expect(result.current.sources).toHaveLength(2);
      expect(result.current.pages[0].sourcePdfIndex).toBe(0);
      expect(result.current.pages[2].sourcePdfIndex).toBe(1);
      expect(result.current.pages[2].sourcePageIndex).toBe(0);
    });
  });

  // ==================== setThumbnails ====================
  describe('setThumbnails', () => {
    it('should store thumbnail URLs keyed by page ID', () => {
      act(() => { result.current.setThumbnails([['a', 'data:img1'], ['b', 'data:img2']]); });

      expect(result.current.thumbnailMap.get('a')).toBe('data:img1');
      expect(result.current.thumbnailMap.get('b')).toBe('data:img2');
    });

    it('should merge with existing thumbnails', () => {
      act(() => { result.current.setThumbnails([['a', 'data:img1']]); });
      act(() => { result.current.setThumbnails([['b', 'data:img2']]); });

      expect(result.current.thumbnailMap.get('a')).toBe('data:img1');
      expect(result.current.thumbnailMap.get('b')).toBe('data:img2');
    });

    it('should overwrite existing entries when key conflicts', () => {
      act(() => { result.current.setThumbnails([['a', 'data:img1']]); });
      act(() => { result.current.setThumbnails([['a', 'data:img2']]); });

      expect(result.current.thumbnailMap.get('a')).toBe('data:img2');
    });

    it('should handle empty entries array', () => {
      act(() => { result.current.setThumbnails([]); });
      expect(result.current.thumbnailMap.size).toBe(0);
    });
  });

  // ==================== removePages ====================
  describe('removePages', () => {
    beforeEach(() => {
      act(() => {
        result.current.addSource(makeSource({ pageCount: 3 }), ['a', 'b', 'c']);
        result.current.setThumbnails([['a', 'u1'], ['b', 'u2'], ['c', 'u3']]);
      });
    });

    it('should remove specified pages', () => {
      act(() => { result.current.removePages(['b']); });
      expect(result.current.pages).toHaveLength(2);
      expect(result.current.pages.map((p: PageInfo) => p.id)).toEqual(['a', 'c']);
    });

    it('should remove thumbnails of removed pages', () => {
      act(() => { result.current.removePages(['a', 'b']); });
      expect(result.current.thumbnailMap.has('a')).toBe(false);
      expect(result.current.thumbnailMap.has('b')).toBe(false);
      expect(result.current.thumbnailMap.has('c')).toBe(true);
    });

    it('should clear selection for removed pages', () => {
      act(() => { result.current.selectPage('a'); });
      act(() => { result.current.selectPage('b', true); });
      act(() => { result.current.removePages(['a']); });
      expect(result.current.selectedIds.has('a')).toBe(false);
      expect(result.current.selectedIds.has('b')).toBe(true);
    });

    it('should handle empty ids array', () => {
      act(() => { result.current.removePages([]); });
      expect(result.current.pages).toHaveLength(3);
    });

    it('should handle non-existent ids gracefully', () => {
      act(() => { result.current.removePages(['nonexistent']); });
      expect(result.current.pages).toHaveLength(3);
    });

    it('should remove all pages when all ids are given', () => {
      act(() => { result.current.removePages(['a', 'b', 'c']); });
      expect(result.current.pages).toHaveLength(0);
      expect(result.current.thumbnailMap.size).toBe(0);
    });
  });

  // ==================== updatePageRotation ====================
  describe('updatePageRotation', () => {
    beforeEach(() => {
      act(() => { result.current.addSource(makeSource(), ['a']); });
    });

    it.each([0, 90, 180, 270] as const)('should set rotation to %ddeg', (angle) => {
      act(() => { result.current.updatePageRotation('a', angle); });
      expect(result.current.pages[0].rotation).toBe(angle);
    });

    it('should not affect other pages', () => {
      act(() => { result.current.addSource(makeSource(), ['b']); });
      act(() => { result.current.updatePageRotation('a', 90); });
      expect(result.current.pages[0].rotation).toBe(90);
      expect(result.current.pages[1].rotation).toBe(0);
    });

    it('should handle non-existent page id gracefully (no-op)', () => {
      act(() => { result.current.updatePageRotation('nonexistent', 90); });
      expect(result.current.pages[0].rotation).toBe(0);
    });
  });

  // ==================== togglePageFlipH ====================
  describe('togglePageFlipH', () => {
    beforeEach(() => {
      act(() => { result.current.addSource(makeSource(), ['a']); });
    });

    it('should toggle flipH from false to true', () => {
      act(() => { result.current.togglePageFlipH('a'); });
      expect(result.current.pages[0].flipH).toBe(true);
    });

    it('should toggle flipH from true to false', () => {
      act(() => { result.current.togglePageFlipH('a'); });
      act(() => { result.current.togglePageFlipH('a'); });
      expect(result.current.pages[0].flipH).toBe(false);
    });

    it('should not affect other properties', () => {
      act(() => { result.current.togglePageFlipH('a'); });
      expect(result.current.pages[0].flipV).toBe(false);
      expect(result.current.pages[0].rotation).toBe(0);
    });

    it('should handle non-existent id', () => {
      act(() => { result.current.togglePageFlipH('nonexistent'); });
      expect(result.current.pages[0].flipH).toBe(false);
    });
  });

  // ==================== togglePageFlipV ====================
  describe('togglePageFlipV', () => {
    beforeEach(() => {
      act(() => { result.current.addSource(makeSource(), ['a']); });
    });

    it('should toggle flipV from false to true', () => {
      act(() => { result.current.togglePageFlipV('a'); });
      expect(result.current.pages[0].flipV).toBe(true);
    });

    it('should toggle flipV from true to false', () => {
      act(() => { result.current.togglePageFlipV('a'); });
      act(() => { result.current.togglePageFlipV('a'); });
      expect(result.current.pages[0].flipV).toBe(false);
    });

    it('should not affect flipH when toggling flipV', () => {
      act(() => { result.current.togglePageFlipH('a'); });
      act(() => { result.current.togglePageFlipV('a'); });
      expect(result.current.pages[0].flipH).toBe(true);
      expect(result.current.pages[0].flipV).toBe(true);
    });

    it('should handle non-existent id', () => {
      act(() => { result.current.togglePageFlipV('nonexistent'); });
      expect(result.current.pages[0].flipV).toBe(false);
    });
  });

  // ==================== reorderPages ====================
  describe('reorderPages', () => {
    beforeEach(() => {
      act(() => { result.current.addSource(makeSource({ pageCount: 4 }), ['a', 'b', 'c', 'd']); });
    });

    it('should move page from beginning to end', () => {
      act(() => { result.current.reorderPages(0, 3); });
      const ids = result.current.pages.map((p: PageInfo) => p.id);
      expect(ids).toEqual(['b', 'c', 'd', 'a']);
    });

    it('should move page from end to beginning', () => {
      act(() => { result.current.reorderPages(3, 0); });
      const ids = result.current.pages.map((p: PageInfo) => p.id);
      expect(ids).toEqual(['d', 'a', 'b', 'c']);
    });

    it('should move page forward in middle', () => {
      act(() => { result.current.reorderPages(1, 2); });
      const ids = result.current.pages.map((p: PageInfo) => p.id);
      expect(ids).toEqual(['a', 'c', 'b', 'd']);
    });

    it('should move page backward in middle', () => {
      act(() => { result.current.reorderPages(2, 1); });
      const ids = result.current.pages.map((p: PageInfo) => p.id);
      expect(ids).toEqual(['a', 'c', 'b', 'd']);
    });

    it('should be no-op when from and to are same', () => {
      act(() => { result.current.reorderPages(1, 1); });
      const ids = result.current.pages.map((p: PageInfo) => p.id);
      expect(ids).toEqual(['a', 'b', 'c', 'd']);
    });
  });

  // ==================== selectPage ====================
  describe('selectPage', () => {
    beforeEach(() => {
      act(() => { result.current.addSource(makeSource({ pageCount: 3 }), ['a', 'b', 'c']); });
    });

    describe('single click (no modifier)', () => {
      it('should select a single page', () => {
        act(() => { result.current.selectPage('a'); });
        expect(result.current.selectedIds.has('a')).toBe(true);
        expect(result.current.selectedIds.size).toBe(1);
      });

      it('should deselect when clicking the same page again', () => {
        act(() => { result.current.selectPage('a'); });
        act(() => { result.current.selectPage('a'); });
        expect(result.current.selectedIds.size).toBe(0);
      });

      it('should switch selection to a different page', () => {
        act(() => { result.current.selectPage('a'); });
        act(() => { result.current.selectPage('b'); });
        expect(result.current.selectedIds.has('a')).toBe(false);
        expect(result.current.selectedIds.has('b')).toBe(true);
        expect(result.current.selectedIds.size).toBe(1);
      });

      it('should not deselect if multiple pages are selected', () => {
        act(() => { result.current.selectPage('a'); });
        act(() => { result.current.selectPage('b', true); });
        act(() => { result.current.selectPage('a'); });
        // Clicking one of multi-selected pages should reduce to just that one
        expect(result.current.selectedIds.has('a')).toBe(true);
        expect(result.current.selectedIds.size).toBe(1);
      });
    });

    describe('ctrl/meta click (multi)', () => {
      it('should add page to selection with ctrl+click', () => {
        act(() => { result.current.selectPage('a'); });
        act(() => { result.current.selectPage('b', true); });
        expect(result.current.selectedIds.has('a')).toBe(true);
        expect(result.current.selectedIds.has('b')).toBe(true);
        expect(result.current.selectedIds.size).toBe(2);
      });

      it('should remove page from selection with ctrl+click', () => {
        act(() => { result.current.selectPage('a'); });
        act(() => { result.current.selectPage('b', true); });
        act(() => { result.current.selectPage('a', true); });
        expect(result.current.selectedIds.has('a')).toBe(false);
        expect(result.current.selectedIds.has('b')).toBe(true);
        expect(result.current.selectedIds.size).toBe(1);
      });

      it('should work with multiple pages', () => {
        act(() => { result.current.selectPage('a', true); });
        act(() => { result.current.selectPage('b', true); });
        act(() => { result.current.selectPage('c', true); });
        expect(result.current.selectedIds.size).toBe(3);
      });
    });

    describe('shift click (range)', () => {
      it('should select the page with range flag', () => {
        act(() => { result.current.selectPage('a'); });
        act(() => { result.current.selectPage('c', false, true); });
        expect(result.current.selectedIds.has('c')).toBe(true);
        expect(result.current.selectedIds.size).toBe(1);
      });

      it('should add to selection when multi + range', () => {
        act(() => { result.current.selectPage('a'); });
        act(() => { result.current.selectPage('c', true, true); });
        expect(result.current.selectedIds.has('a')).toBe(true);
        expect(result.current.selectedIds.has('c')).toBe(true);
        expect(result.current.selectedIds.size).toBe(2);
      });
    });

    it('should handle selecting a non-existent page', () => {
      act(() => { result.current.selectPage('nonexistent'); });
      expect(result.current.selectedIds.has('nonexistent')).toBe(true);
    });
  });

  // ==================== clearSelection ====================
  describe('clearSelection', () => {
    it('should clear all selected pages', () => {
      act(() => {
        result.current.addSource(makeSource(), ['a', 'b']);
      });
      act(() => { result.current.selectPage('a'); });
      act(() => { result.current.selectPage('b', true); });
      expect(result.current.selectedIds.size).toBe(2);

      act(() => { result.current.clearSelection(); });
      expect(result.current.selectedIds.size).toBe(0);
    });

    it('should be no-op when nothing is selected', () => {
      act(() => { result.current.addSource(makeSource(), ['a']); });
      act(() => { result.current.clearSelection(); });
      expect(result.current.selectedIds.size).toBe(0);
    });
  });

  // ==================== resetPageTransform ====================
  describe('resetPageTransform', () => {
    it('should reset rotation, flipH, and flipV to defaults', () => {
      act(() => { result.current.addSource(makeSource(), ['a']); });
      act(() => { result.current.updatePageRotation('a', 180); });
      act(() => { result.current.togglePageFlipH('a'); });
      act(() => { result.current.togglePageFlipV('a'); });

      act(() => { result.current.resetPageTransform('a'); });
      const page = result.current.pages[0];
      expect(page.rotation).toBe(0);
      expect(page.flipH).toBe(false);
      expect(page.flipV).toBe(false);
    });

    it('should handle non-existent id gracefully', () => {
      act(() => { result.current.addSource(makeSource(), ['a']); });
      act(() => { result.current.resetPageTransform('nonexistent'); });
      expect(result.current.pages[0].rotation).toBe(0);
    });

    it('should not affect other pages transforms', () => {
      act(() => { result.current.addSource(makeSource({ pageCount: 2 }), ['a', 'b']); });
      act(() => { result.current.updatePageRotation('a', 90); });
      act(() => { result.current.updatePageRotation('b', 180); });

      act(() => { result.current.resetPageTransform('a'); });
      expect(result.current.pages[0].rotation).toBe(0);
      expect(result.current.pages[1].rotation).toBe(180);
    });
  });

  // ==================== clearAll ====================
  describe('clearAll', () => {
    it('should reset all state to initial values', () => {
      act(() => {
        result.current.addSource(makeSource(), ['a', 'b']);
        result.current.setThumbnails([['a', 'u1'], ['b', 'u2']]);
        result.current.selectPage('a');
      });

      act(() => { result.current.clearAll(); });

      expect(result.current.pages).toHaveLength(0);
      expect(result.current.sources).toHaveLength(0);
      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.thumbnailMap.size).toBe(0);
    });

    it('should be idempotent (no error on empty state)', () => {
      act(() => { result.current.clearAll(); });
      expect(result.current.pages).toHaveLength(0);
    });
  });

  // ==================== State immutability ====================
  describe('state immutability', () => {
    it('should not mutate the original pages array externally', () => {
      act(() => { result.current.addSource(makeSource(), ['a']); });
      const pagesBefore = result.current.pages;
      act(() => { result.current.updatePageRotation('a', 90); });
      expect(result.current.pages).not.toBe(pagesBefore);
      expect(pagesBefore[0].rotation).toBe(0);
    });
  });

  // ==================== undo/redo ====================
  describe('undo/redo', () => {
    it('should undo the last operation', () => {
      act(() => { result.current.addSource(makeSource(), ['a']); });
      expect(result.current.pages).toHaveLength(1);

      act(() => { result.current.undo(); });
      expect(result.current.pages).toHaveLength(0);
    });

    it('should redo an undone operation', () => {
      act(() => { result.current.addSource(makeSource(), ['a']); });
      expect(result.current.pages).toHaveLength(1);

      act(() => { result.current.undo(); });
      expect(result.current.pages).toHaveLength(0);

      act(() => { result.current.redo(); });
      expect(result.current.pages).toHaveLength(1);
      expect(result.current.pages[0].id).toBe('a');
    });

    it('should clear redo stack when new operation is performed', () => {
      act(() => { result.current.addSource(makeSource({ name: 'A.pdf' }), ['a']); });
      act(() => { result.current.addSource(makeSource({ name: 'B.pdf' }), ['b']); });
      expect(result.current.pages).toHaveLength(2);

      act(() => { result.current.undo(); });
      expect(result.current.pages).toHaveLength(1);
      expect(result.current.pages[0].id).toBe('a');

      act(() => { result.current.addSource(makeSource({ name: 'C.pdf' }), ['c']); });
      expect(result.current.pages).toHaveLength(2);
      expect(result.current.pages[1].id).toBe('c');

      act(() => { result.current.redo(); });
      expect(result.current.pages).toHaveLength(2);
      expect(result.current.pages[1].id).toBe('c');
    });

    it('should not change selectedIds on undo', () => {
      act(() => { result.current.addSource(makeSource(), ['a']); });
      act(() => { result.current.selectPage('a'); });
      expect(result.current.selectedIds.has('a')).toBe(true);

      act(() => { result.current.undo(); });
      expect(result.current.selectedIds.has('a')).toBe(true);
    });

    it('should handle multiple undos', () => {
      act(() => { result.current.addSource(makeSource(), ['a']); });
      act(() => { result.current.addSource(makeSource(), ['b']); });
      act(() => { result.current.addSource(makeSource(), ['c']); });
      expect(result.current.pages).toHaveLength(3);

      act(() => { result.current.undo(); });
      expect(result.current.pages).toHaveLength(2);

      act(() => { result.current.undo(); });
      expect(result.current.pages).toHaveLength(1);
      expect(result.current.pages[0].id).toBe('a');
    });

    it('should handle undo after clearAll', () => {
      act(() => { result.current.addSource(makeSource(), ['a']); });
      expect(result.current.pages).toHaveLength(1);

      act(() => { result.current.clearAll(); });
      expect(result.current.pages).toHaveLength(0);

      act(() => { result.current.undo(); });
      expect(result.current.pages).toHaveLength(1);
      expect(result.current.pages[0].id).toBe('a');
    });
  });

  // ==================== batch operations ====================
  describe('batch operations', () => {
    beforeEach(() => {
      act(() => { result.current.addSource(makeSource({ pageCount: 3 }), ['a', 'b', 'c']); });
    });

    it('should create only one history entry for batch rotation', () => {
      act(() => { result.current.beginTransaction(); });
      act(() => { result.current.updatePageRotation('a', 90); });
      act(() => { result.current.updatePageRotation('b', 180); });
      act(() => { result.current.updatePageRotation('c', 270); });
      act(() => { result.current.commitTransaction(); });

      expect(result.current.pages[0].rotation).toBe(90);
      expect(result.current.pages[1].rotation).toBe(180);
      expect(result.current.pages[2].rotation).toBe(270);

      act(() => { result.current.undo(); });
      expect(result.current.pages[0].rotation).toBe(0);
      expect(result.current.pages[1].rotation).toBe(0);
      expect(result.current.pages[2].rotation).toBe(0);
    });

    it('should create only one history entry for batch flip', () => {
      act(() => { result.current.beginTransaction(); });
      act(() => { result.current.togglePageFlipH('a'); });
      act(() => { result.current.togglePageFlipH('b'); });
      act(() => { result.current.togglePageFlipH('c'); });
      act(() => { result.current.commitTransaction(); });

      expect(result.current.pages[0].flipH).toBe(true);
      expect(result.current.pages[1].flipH).toBe(true);
      expect(result.current.pages[2].flipH).toBe(true);

      act(() => { result.current.undo(); });
      expect(result.current.pages[0].flipH).toBe(false);
      expect(result.current.pages[1].flipH).toBe(false);
      expect(result.current.pages[2].flipH).toBe(false);
    });
  });
});
