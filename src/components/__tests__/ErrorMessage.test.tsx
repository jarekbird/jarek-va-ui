import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { ErrorMessage } from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('renders the error message', () => {
    const message = 'Something went wrong';
    render(<ErrorMessage message={message} />);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('has the correct CSS class', () => {
    const { container } = render(<ErrorMessage message="Error" />);
    const errorDiv = container.querySelector('.error-message');
    expect(errorDiv).not.toBeNull();
    if (errorDiv) {
      expect(errorDiv).toBeInTheDocument();
    }
  });

  it('displays different error messages', () => {
    const message1 = 'Network error';
    const { rerender } = render(<ErrorMessage message={message1} />);
    expect(screen.getByText(message1)).toBeInTheDocument();

    const message2 = 'API error';
    rerender(<ErrorMessage message={message2} />);
    expect(screen.getByText(message2)).toBeInTheDocument();
  });
});
