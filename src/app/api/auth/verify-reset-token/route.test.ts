import { POST } from '@/app/api/auth/verify-reset-token/route';
import connectDB from '@/lib/db';
import User from '@/models/User';

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedFindOne = User.findOne as jest.Mock;

describe('POST /api/auth/verify-reset-token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockResolvedValue({} as any);
  });

  it('returns 400 when token is missing', async () => {
    const req = new Request('http://localhost/api/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Reset token is required');
  });

  it('returns 400 for invalid token', async () => {
    mockedFindOne.mockResolvedValue(null);

    const req = new Request('http://localhost/api/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token: 'bad-token' }),
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

  it('returns user info for valid token', async () => {
    const mockUser = {
      email: 'alice@example.com',
      username: 'alice',
      password: 'should-not-leak',
    };
    mockedFindOne.mockResolvedValue(mockUser);

    const req = new Request('http://localhost/api/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      email: 'alice@example.com',
      username: 'alice',
    });
    expect((data as any).password).toBeUndefined();
  });
});
