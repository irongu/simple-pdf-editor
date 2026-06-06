import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlobalNav } from './GlobalNav';

describe('GlobalNav', () => {
  it('should display the app name', () => {
    render(<GlobalNav totalPages={0} selectedCount={0} />);
    expect(screen.getByText('PDF Editor')).toBeInTheDocument();
  });

  it('should display total page count', () => {
    render(<GlobalNav totalPages={5} selectedCount={0} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should display selected count', () => {
    render(<GlobalNav totalPages={10} selectedCount={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should display 0 for empty state', () => {
    render(<GlobalNav totalPages={0} selectedCount={0} />);
    // Should show two zeros: one for pages, one for selected
    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(2);
  });

  it('should render a nav element', () => {
    const { container } = render(<GlobalNav totalPages={0} selectedCount={0} />);
    expect(container.querySelector('nav')).toBeInTheDocument();
  });

  it('should display labels for pages and selected', () => {
    render(<GlobalNav totalPages={10} selectedCount={2} />);
    expect(screen.getByText('页面数')).toBeInTheDocument();
    expect(screen.getByText('选中')).toBeInTheDocument();
  });

  it('should handle large numbers', () => {
    render(<GlobalNav totalPages={9999} selectedCount={500} />);
    expect(screen.getByText('9999')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });
});
