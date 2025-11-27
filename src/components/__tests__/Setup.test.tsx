import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Setup from '../../pages/Setup';
import { setupService } from '../../services/setupService';

vi.mock('../../services/setupService');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Setup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render setup form', () => {
    render(<Setup />, { wrapper: createWrapper() });

    expect(screen.getByText(/Welcome to Proxmox Manager/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Complete Setup/i })).toBeInTheDocument();
  });

  it('should show password requirements', () => {
    render(<Setup />, { wrapper: createWrapper() });

    const passwordInput = screen.getByLabelText(/^Password$/i);
    fireEvent.change(passwordInput, { target: { value: 'Test' } });

    expect(screen.getByText(/At least 12 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/One uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/One lowercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/One number/i)).toBeInTheDocument();
    expect(screen.getByText(/One special character/i)).toBeInTheDocument();
  });

  it('should validate password strength in real-time', () => {
    render(<Setup />, { wrapper: createWrapper() });

    const passwordInput = screen.getByLabelText(/^Password$/i);

    // Weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    const submitButton = screen.getByRole('button', { name: /Complete Setup/i });
    expect(submitButton).toBeDisabled();

    // Strong password
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    expect(submitButton).not.toBeDisabled();
  });

  it('should require all fields', async () => {
    render(<Setup />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /Complete Setup/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/All fields are required/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    render(<Setup />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Test User' }
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'invalid-email' }
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'StrongPass123!' }
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'StrongPass123!' }
    });

    const submitButton = screen.getByRole('button', { name: /Complete Setup/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    });
  });

  it('should validate password confirmation', async () => {
    render(<Setup />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Test User' }
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'StrongPass123!' }
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'DifferentPass123!' }
    });

    const submitButton = screen.getByRole('button', { name: /Complete Setup/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should call setupService.initialize on valid submission', async () => {
    const mockInitialize = vi.fn().mockResolvedValue({
      success: true,
      message: 'Setup completed successfully',
      data: {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin'
      }
    });

    vi.mocked(setupService.initialize).mockImplementation(mockInitialize);

    render(<Setup />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Admin User' }
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'admin@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'AdminPass123!' }
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'AdminPass123!' }
    });

    const submitButton = screen.getByRole('button', { name: /Complete Setup/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'AdminPass123!',
        name: 'Admin User'
      });
    });
  });

  it('should show security notice', () => {
    render(<Setup />, { wrapper: createWrapper() });

    expect(screen.getByText(/Security Notice/i)).toBeInTheDocument();
    expect(screen.getByText(/remember this password/i)).toBeInTheDocument();
  });
});
