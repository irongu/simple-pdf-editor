import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Panel } from './Panel';
import type { PageInfo } from '../../types';

function makePage(overrides: Partial<PageInfo> = {}): PageInfo {
  return {
    id: 'page-1',
    sourcePdfIndex: 0,
    sourcePageIndex: 0,
    rotation: 0,
    flipH: false,
    flipV: false,
    ...overrides,
  };
}

describe('Panel', () => {
  const defaultProps = {
    selectedPages: [] as PageInfo[],
    onRotateCW: vi.fn(),
    onRotateCCW: vi.fn(),
    onFlipH: vi.fn(),
    onFlipV: vi.fn(),
    onReset: vi.fn(),
  };

  describe('empty state (no selection)', () => {
    it('should show hint text when no pages are selected', () => {
      render(<Panel {...defaultProps} />);
      expect(screen.getByText('选择页面以查看属性')).toBeInTheDocument();
    });

    it('should show the "属性" heading', () => {
      render(<Panel {...defaultProps} />);
      expect(screen.getByText('属性')).toBeInTheDocument();
    });

    it('should not show action buttons', () => {
      render(<Panel {...defaultProps} />);
      expect(screen.queryByText('顺时针旋转 90°')).not.toBeInTheDocument();
    });
  });

  describe('single page selected', () => {
    const page = makePage({ id: 'a', sourcePdfIndex: 0, sourcePageIndex: 2, rotation: 90, flipH: true });

    it('should show page info for single selection', () => {
      const { container } = render(<Panel {...defaultProps} selectedPages={[page]} />);
      const paragraphs = container.querySelectorAll('p');
      const texts = Array.from(paragraphs).map(p => p.textContent);
      expect(texts).toContain('来源: PDF 1');
      expect(texts).toContain('原页码: 第 3 页');
      expect(texts[2]).toBe('旋转: 90°');
    });

    it('should show flipH status as "是"', () => {
      const { container } = render(<Panel {...defaultProps} selectedPages={[page]} />);
      const paragraphs = container.querySelectorAll('p');
      const texts = Array.from(paragraphs).map(p => p.textContent);
      expect(texts).toContain('水平镜像: 是');
    });

    it('should show flipV status as "否"', () => {
      const { container } = render(<Panel {...defaultProps} selectedPages={[page]} />);
      const paragraphs = container.querySelectorAll('p');
      const texts = Array.from(paragraphs).map(p => p.textContent);
      expect(texts).toContain('垂直镜像: 否');
    });

    it('should show flipV status as "是" when flipV is true', () => {
      const pageWithFlipV = makePage({ flipV: true });
      const { container } = render(<Panel {...defaultProps} selectedPages={[pageWithFlipV]} />);
      const paragraphs = container.querySelectorAll('p');
      const texts = Array.from(paragraphs).map(p => p.textContent);
      expect(texts).toContain('垂直镜像: 是');
    });

    it('should show all action buttons', () => {
      render(<Panel {...defaultProps} selectedPages={[page]} />);
      expect(screen.getByText('顺时针旋转 90°')).toBeInTheDocument();
      expect(screen.getByText('逆时针旋转 90°')).toBeInTheDocument();
      expect(screen.getByText('水平镜像')).toBeInTheDocument();
      expect(screen.getByText('垂直镜像')).toBeInTheDocument();
      expect(screen.getByText('重置变换')).toBeInTheDocument();
    });

    it('should show "属性" heading for single selection', () => {
      render(<Panel {...defaultProps} selectedPages={[page]} />);
      expect(screen.getByText('属性')).toBeInTheDocument();
    });

    it('should show default values (0 rotation, no flips)', () => {
      const defaultPage = makePage();
      const { container } = render(<Panel {...defaultProps} selectedPages={[defaultPage]} />);
      const paragraphs = container.querySelectorAll('p');
      const texts = Array.from(paragraphs).map(p => p.textContent);
      expect(texts[2]).toBe('旋转: 0°');
    });

    it('should trigger onRotateCW when button clicked', () => {
      const onRotateCW = vi.fn();
      render(<Panel {...defaultProps} selectedPages={[makePage()]} onRotateCW={onRotateCW} />);
      screen.getByText('顺时针旋转 90°').click();
      expect(onRotateCW).toHaveBeenCalledTimes(1);
    });

    it('should trigger onFlipH when button clicked', () => {
      const onFlipH = vi.fn();
      render(<Panel {...defaultProps} selectedPages={[makePage()]} onFlipH={onFlipH} />);
      screen.getByText('水平镜像').click();
      expect(onFlipH).toHaveBeenCalledTimes(1);
    });

    it('should trigger onReset when button clicked', () => {
      const onReset = vi.fn();
      render(<Panel {...defaultProps} selectedPages={[makePage()]} onReset={onReset} />);
      screen.getByText('重置变换').click();
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('should display 270° rotation', () => {
      const { container } = render(<Panel {...defaultProps} selectedPages={[makePage({ rotation: 270 })]} />);
      const paragraphs = container.querySelectorAll('p');
      const texts = Array.from(paragraphs).map(p => p.textContent);
      expect(texts[2]).toBe('旋转: 270°');
    });
  });

  describe('multiple pages selected', () => {
    const pages = [makePage({ id: 'a' }), makePage({ id: 'b' })];

    it('should show selection count heading', () => {
      render(<Panel {...defaultProps} selectedPages={pages} />);
      expect(screen.getByText('已选择 2 页')).toBeInTheDocument();
    });

    it('should not show individual page info for multi-selection', () => {
      render(<Panel {...defaultProps} selectedPages={pages} />);
      expect(screen.queryByText('页面信息')).not.toBeInTheDocument();
    });

    it('should still show action buttons for multi-selection', () => {
      render(<Panel {...defaultProps} selectedPages={pages} />);
      expect(screen.getByText('顺时针旋转 90°')).toBeInTheDocument();
      expect(screen.getByText('重置变换')).toBeInTheDocument();
    });

    it('should show correct count for 3 pages', () => {
      const threePages = [makePage({ id: 'a' }), makePage({ id: 'b' }), makePage({ id: 'c' })];
      render(<Panel {...defaultProps} selectedPages={threePages} />);
      expect(screen.getByText('已选择 3 页')).toBeInTheDocument();
    });
  });
});
