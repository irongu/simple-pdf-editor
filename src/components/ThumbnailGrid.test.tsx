import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThumbnailGrid } from './ThumbnailGrid';
import type { PageInfo } from '../types';

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

describe('ThumbnailGrid', () => {
  const defaultProps = {
    pages: [] as PageInfo[],
    selectedIds: new Set<string>(),
    thumbnailMap: new Map<string, string>(),
    onSelect: vi.fn(),
    onReorder: vi.fn(),
    loading: false,
  };

  it('should render empty grid with no pages', () => {
    const { container } = render(<ThumbnailGrid {...defaultProps} />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid?.children).toHaveLength(0);
  });

  it('should render page numbers for each page', () => {
    const pages = [makePage({ id: 'a' }), makePage({ id: 'b' }), makePage({ id: 'c' })];
    render(<ThumbnailGrid {...defaultProps} pages={pages} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should render placeholder text when no thumbnail available', () => {
    const pages = [makePage({ id: 'a' })];
    render(<ThumbnailGrid {...defaultProps} pages={pages} />);

    expect(screen.getByText('第 1 页')).toBeInTheDocument();
  });

  it('should render thumbnail image when URL is available', () => {
    const pages = [makePage({ id: 'a' })];
    const thumbnailMap = new Map([['a', 'data:image/png;test']]);

    render(<ThumbnailGrid {...defaultProps} pages={pages} thumbnailMap={thumbnailMap} />);

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'data:image/png;test');
  });

  it('should show loading spinner when loading is true', () => {
    const pages = [makePage({ id: 'a' })];
    const { container } = render(<ThumbnailGrid {...defaultProps} pages={pages} loading={true} />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should show selected state with ring styling', () => {
    const pages = [makePage({ id: 'a' })];
    const selectedIds = new Set(['a']);

    render(
      <ThumbnailGrid
        {...defaultProps}
        pages={pages}
        selectedIds={selectedIds}
      />
    );

    const pageEl = screen.getByText('1').closest('.ring-apple-primary');
    expect(pageEl).not.toBeNull();
  });

  it('should render rotated images with correct transform', () => {
    const pages = [makePage({ id: 'a', rotation: 90 })];
    const thumbnailMap = new Map([['a', 'data:image/png;test']]);

    render(
      <ThumbnailGrid
        {...defaultProps}
        pages={pages}
        thumbnailMap={thumbnailMap}
      />
    );

    const img = screen.getByRole('img');
    expect(img.style.transform).toContain('rotate(90deg)');
  });

  it('should render flipped images with correct CSS transform', () => {
    const pages = [makePage({ id: 'a', flipH: true, flipV: true })];
    const thumbnailMap = new Map([['a', 'data:image/png;test']]);

    render(
      <ThumbnailGrid
        {...defaultProps}
        pages={pages}
        thumbnailMap={thumbnailMap}
      />
    );

    const img = screen.getByRole('img');
    expect(img.style.transform).toContain('scaleX(-1)');
    expect(img.style.transform).toContain('scaleY(-1)');
  });

  it('should call onSelect when a page is clicked', async () => {
    const onSelect = vi.fn();
    const pages = [makePage({ id: 'a' })];

    render(<ThumbnailGrid {...defaultProps} pages={pages} onSelect={onSelect} />);

    // Click on the page number area - the outer div
    const pageEl = screen.getByText('1').closest('div');
    pageEl?.click();
    expect(onSelect).toHaveBeenCalledWith('a', false, false);
  });

  it('should render multiple rows of pages', () => {
    const pages = Array.from({ length: 12 }, (_, i) =>
      makePage({ id: `page-${i}`, sourcePageIndex: i })
    );

    const { container } = render(<ThumbnailGrid {...defaultProps} pages={pages} />);

    // All 12 pages should be rendered
    expect(screen.getByText('12')).toBeInTheDocument();
    // Grid should contain all items
    const grid = container.querySelector('.grid');
    expect(grid?.children).toHaveLength(12);
  });

  it('should render alt text for images', () => {
    const pages = [makePage({ id: 'a' })];
    const thumbnailMap = new Map([['a', 'data:image/png;test']]);

    render(
      <ThumbnailGrid
        {...defaultProps}
        pages={pages}
        thumbnailMap={thumbnailMap}
      />
    );

    expect(screen.getByAltText('第 1 页')).toBeInTheDocument();
  });

  it('should render drag handle with SVG icon', () => {
    const pages = [makePage({ id: 'a' })];

    const { container } = render(<ThumbnailGrid {...defaultProps} pages={pages} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render drag handle on each page card', () => {
    const pages = [makePage({ id: 'a' }), makePage({ id: 'b' })];
    const { container } = render(<ThumbnailGrid {...defaultProps} pages={pages} />);

    // Each page card should have a drag handle area with grip icon
    const dragHandles = container.querySelectorAll('.cursor-grab');
    expect(dragHandles).toHaveLength(2);
  });
});
