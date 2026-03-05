import { POST } from '@/app/api/auth/reset-password/route';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  hashPassword: jest.fn(),
}));

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedFindOne = User.findOne as jest.Mock;
const mockedFindByIdAndUpdate = User.findByIdAndUpdate as jest.Mock;
const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockResolvedValue({} as any);
  });

  it('returns 400 when token or password is missing', async () => {
    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'token-only' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Token and new password are required');
  });

  it('returns 400 when new password is too short', async () => {
    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'token', password: '123' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Password must be at least 6 characters long');
  });

  it('returns 400 for invalid/expired token', async () => {
    mockedFindOne.mockResolvedValue(null);

    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'bad-token', password: 'newpassword123' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid or expired reset token');
    expect(mockedFindOne).toHaveBeenCalledWith({
      resetToken: 'bad-token',
      resetTokenExpiry: { $gt: expect.any(Date) },
    });
  });

  it('updates user password and clears reset token fields', async () => {
    mockedFindOne.mockResolvedValue({ _id: 'user-99' });
    mockedHashPassword.mockResolvedValue('new-hashed-password');

    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token', password: 'newpassword123' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Password has been reset successfully');
    expect(mockedHashPassword).toHaveBeenCalledWith('newpassword123');
    expect(mockedFindByIdAndUpdate).toHaveBeenCalledWith('user-99', {
      password: 'new-hashed-password',
      resetToken: null,
      resetTokenExpiry: null,
    });
  });
});
