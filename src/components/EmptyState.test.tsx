import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('should render the heading text', () => {
    render(<EmptyState onOpenPdf={vi.fn()} />);
    expect(screen.getByText('PDF Editor')).toBeInTheDocument();
  });

  it('should render the description text', () => {
    render(<EmptyState onOpenPdf={vi.fn()} />);
    expect(
      screen.getByText(/加载 PDF 文件以开始编辑/)
    ).toBeInTheDocument();
  });

  it('should render the open button', () => {
    render(<EmptyState onOpenPdf={vi.fn()} />);
    expect(screen.getByRole('button', { name: '打开 PDF 文件' })).toBeInTheDocument();
  });

  it('should call onOpenPdf when button is clicked', async () => {
    const onOpenPdf = vi.fn();
    render(<EmptyState onOpenPdf={onOpenPdf} />);
    const btn = screen.getByRole('button', { name: '打开 PDF 文件' });
    btn.click();
    expect(onOpenPdf).toHaveBeenCalledTimes(1);
  });

  it('should render the PDF icon SVG', () => {
    const { container } = render(<EmptyState onOpenPdf={vi.fn()} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
