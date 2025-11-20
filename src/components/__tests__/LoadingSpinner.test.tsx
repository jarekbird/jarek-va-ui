import { describe, it, expect } from 'vitest';
import { render } from '../../test/test-utils';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders the loading spinner', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('has the correct CSS class', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('loading-spinner');
  });

  it('renders within loading container', () => {
    const { container } = render(<LoadingSpinner />);
    const containerDiv = container.querySelector('.loading-container');
    expect(containerDiv).toBeInTheDocument();
  });
});
