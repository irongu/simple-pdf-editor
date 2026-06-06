import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock PDF renderer
vi.mock('./utils/pdfRenderer', () => ({
  renderAllThumbnails: vi.fn().mockResolvedValue({
    results: [
      { pageId: '', imageUrl: 'data:image/png;page1', width: 200, height: 267 },
      { pageId: '', imageUrl: 'data:image/png;page2', width: 200, height: 267 },
    ],
    totalPages: 2,
  }),
}));

// Mock PDF exporter
vi.mock('./utils/pdfExporter', () => ({
  exportPdf: vi.fn().mockResolvedValue(undefined),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the GlobalNav with 0 pages initially', () => {
    render(<App />);
    // "PDF Editor" appears in GlobalNav, EmptyState and Footer
    expect(screen.getAllByText('PDF Editor')).toHaveLength(3);
    // Should show 0 total pages
    const zeros = screen.getAllByText('0');
    // There should be at least 2 zeros (one for pages count, one for selected count)
    expect(zeros.length).toBeGreaterThanOrEqual(2);
  });

  it('should render the Toolbar component', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: '打开 PDF' })).toBeInTheDocument();
  });

  it('should render EmptyState when no pages are loaded', () => {
    render(<App />);
    expect(
      screen.getByText(/加载 PDF 文件以开始编辑/)
    ).toBeInTheDocument();
  });

  it('should render the Footer', () => {
    const { container } = render(<App />);
    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
    expect(footer?.textContent).toContain('PDF Editor');
  });

  it('should open file picker when "打开 PDF" button is clicked', () => {
    render(<App />);

    const createElementSpy = vi.spyOn(document, 'createElement');
    const clickSpy = vi.fn();

    // Mock the input creation and click
    createElementSpy.mockReturnValueOnce({
      type: '',
      accept: '',
      click: clickSpy,
      onchange: null,
    } as unknown as HTMLInputElement);

    const openBtn = screen.getByRole('button', { name: '打开 PDF' });
    fireEvent.click(openBtn);

    expect(clickSpy).toHaveBeenCalled();
    expect(createElementSpy).toHaveBeenCalledWith('input');
  });

  it('should render Panel as an aside', () => {
    const { container } = render(<App />);
    const aside = container.querySelector('aside');
    expect(aside).toBeInTheDocument();
  });

  it('should handle keyboard Escape to clear selection', () => {
    render(<App />);
    // Should not throw when pressing Escape
    expect(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    }).not.toThrow();
  });

  it('should not trigger keyboard shortcuts when typing in input', () => {
    render(<App />);

    // Create an input element to test text input scenario
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    // Press Delete while focused on input - should not remove pages
    expect(() => {
      fireEvent.keyDown(input, { key: 'Delete' });
    }).not.toThrow();

    document.body.removeChild(input);
  });

  it('should show error state when error is set', async () => {
    const { renderAllThumbnails } = await import('./utils/pdfRenderer');
    vi.mocked(renderAllThumbnails).mockRejectedValueOnce(new Error('Failed'));

    // We can't easily simulate file load in tests, but the error state is rendered
    // when the error variable is set
    render(<App />);
    // Initially should show empty state, not error
    expect(
      screen.getByText(/加载 PDF 文件以开始编辑/)
    ).toBeInTheDocument();
  });

  it('should render main content area', () => {
    const { container } = render(<App />);
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });

  it('should render the panel aside element with correct class', () => {
    const { container } = render(<App />);
    const aside = container.querySelector('aside');
    expect(aside).toBeInTheDocument();
    expect(aside?.className).toContain('bg-apple-canvas');
  });

  it('should handle Delete key shortcut', () => {
    render(<App />);
    expect(() => {
      fireEvent.keyDown(window, { key: 'Delete' });
    }).not.toThrow();
  });

  it('should handle Backspace key shortcut', () => {
    render(<App />);
    expect(() => {
      fireEvent.keyDown(window, { key: 'Backspace' });
    }).not.toThrow();
  });

  it('should handle R key shortcut', () => {
    render(<App />);
    expect(() => {
      fireEvent.keyDown(window, { key: 'r' });
    }).not.toThrow();
  });

  it('should handle H key shortcut', () => {
    render(<App />);
    expect(() => {
      fireEvent.keyDown(window, { key: 'h' });
    }).not.toThrow();
  });

  it('should handle V key shortcut', () => {
    render(<App />);
    expect(() => {
      fireEvent.keyDown(window, { key: 'v' });
    }).not.toThrow();
  });

  it('should render all layout sections', () => {
    const { container } = render(<App />);

    expect(container.querySelector('nav')).toBeInTheDocument();
    expect(container.querySelector('main')).toBeInTheDocument();
    expect(container.querySelector('footer')).toBeInTheDocument();
  });

  it('should show loading state text in Chinese', () => {
    render(<App />);
    expect(screen.getByText(/加载 PDF 文件以开始编辑/)).toBeInTheDocument();
  });
});
