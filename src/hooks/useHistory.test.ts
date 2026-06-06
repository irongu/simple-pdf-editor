import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useHistory } from './useHistory';

describe('useHistory', () => {
  let result: { current: ReturnType<typeof useHistory<number>> };

  beforeEach(() => {
    const rendered = renderHook(() => useHistory(0));
    result = rendered.result;
  });

  // ==================== Initial state ====================
  describe('initial state', () => {
    it('should set initial state correctly', () => {
      expect(result.current.state).toBe(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  // ==================== push ====================
  describe('push', () => {
    it('should add state to history', () => {
      act(() => { result.current.push(1); });

      expect(result.current.state).toBe(1);
      expect(result.current.canUndo).toBe(true);
    });

    it('should clear future stack when pushing after undo', () => {
      act(() => { result.current.push(1); });
      act(() => { result.current.push(2); });
      act(() => { result.current.undo(); });
      expect(result.current.canRedo).toBe(true);

      act(() => { result.current.push(3); });
      expect(result.current.state).toBe(3);
      expect(result.current.canRedo).toBe(false);
    });
  });

  // ==================== undo ====================
  describe('undo', () => {
    it('should restore previous state', () => {
      act(() => { result.current.push(1); });
      act(() => { result.current.push(2); });
      expect(result.current.state).toBe(2);

      act(() => { result.current.undo(); });
      expect(result.current.state).toBe(1);

      act(() => { result.current.undo(); });
      expect(result.current.state).toBe(0);
    });

    it('should be no-op when nothing to undo', () => {
      act(() => { result.current.undo(); });
      expect(result.current.state).toBe(0);
      expect(result.current.canUndo).toBe(false);
    });
  });

  // ==================== redo ====================
  describe('redo', () => {
    it('should restore undone state', () => {
      act(() => { result.current.push(1); });
      act(() => { result.current.push(2); });
      act(() => { result.current.undo(); });
      expect(result.current.state).toBe(1);

      act(() => { result.current.redo(); });
      expect(result.current.state).toBe(2);
    });

    it('should be no-op when nothing to redo', () => {
      act(() => { result.current.redo(); });
      expect(result.current.state).toBe(0);
      expect(result.current.canRedo).toBe(false);
    });
  });

  // ==================== canUndo / canRedo flags ====================
  describe('canUndo and canRedo', () => {
    it('canUndo is false initially and true after push', () => {
      expect(result.current.canUndo).toBe(false);

      act(() => { result.current.push(1); });
      expect(result.current.canUndo).toBe(true);
    });

    it('canRedo is false initially, true after undo, false after push', () => {
      expect(result.current.canRedo).toBe(false);

      act(() => { result.current.push(1); });
      expect(result.current.canRedo).toBe(false);

      act(() => { result.current.undo(); });
      expect(result.current.canRedo).toBe(true);

      act(() => { result.current.push(2); });
      expect(result.current.canRedo).toBe(false);
    });
  });

  // ==================== History limit ====================
  describe('history limit', () => {
    it('should drop oldest entries when exceeding 50', () => {
      act(() => {
        for (let i = 1; i <= 52; i++) {
          result.current.push(i);
        }
      });

      expect(result.current.state).toBe(52);

      // Undo all the way back; the oldest two entries (1 and 2) should have been dropped
      act(() => {
        for (let i = 0; i < 51; i++) {
          result.current.undo();
        }
      });

      expect(result.current.state).toBe(2);
      expect(result.current.canUndo).toBe(false);
    });
  });

  // ==================== reset ====================
  describe('reset', () => {
    it('should clear all history and set new initial state', () => {
      act(() => { result.current.push(1); });
      act(() => { result.current.push(2); });
      act(() => { result.current.undo(); });

      act(() => { result.current.reset(100); });

      expect(result.current.state).toBe(100);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });
});
