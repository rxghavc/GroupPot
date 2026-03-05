import { POST } from '@/app/api/auth/login/route';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { comparePassword, generateToken } from '@/lib/auth';

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

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  comparePassword: jest.fn(),
  generateToken: jest.fn(),
}));

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedFindOne = User.findOne as jest.Mock;
const mockedComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;
const mockedGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockResolvedValue({} as any);
  });

  it('returns 400 when email or password is missing', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'alice@example.com' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email and password are required');
  });

  it('returns 401 for unknown user', async () => {
    mockedFindOne.mockResolvedValue(null);

    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'alice@example.com', password: 'secret123' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid email or password');
  });

  it('returns token and user for valid credentials', async () => {
    mockedFindOne.mockResolvedValue({
      _id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      password: 'hashed-password',
    });
    mockedComparePassword.mockResolvedValue(true);
    mockedGenerateToken.mockReturnValue('jwt-token');

    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'alice@example.com', password: 'secret123' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      token: 'jwt-token',
      userId: 'user-1',
      username: 'alice',
    });
    expect(mockedComparePassword).toHaveBeenCalledWith('secret123', 'hashed-password');
  });
});
