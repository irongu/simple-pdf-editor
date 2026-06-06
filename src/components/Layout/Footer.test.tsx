import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('should render the footer text', () => {
    render(<Footer />);
    expect(screen.getByText(/PDF Editor/)).toBeInTheDocument();
  });

  it('should render a footer element', () => {
    const { container } = render(<Footer />);
    expect(container.querySelector('footer')).toBeInTheDocument();
  });
});
