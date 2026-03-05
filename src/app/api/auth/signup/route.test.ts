import { POST } from '@/app/api/auth/signup/route';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateToken, hashPassword } from '@/lib/auth';

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  hashPassword: jest.fn(),
  generateToken: jest.fn(),
}));

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedFindOne = User.findOne as jest.Mock;
const mockedCreate = User.create as jest.Mock;
const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockedGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockResolvedValue({} as any);
  });

  it('returns 400 when required fields are missing', async () => {
    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'alice@example.com', password: 'secret123' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Username, email, and password are required');
  });

  it('returns 409 when email already exists', async () => {
    mockedFindOne.mockResolvedValue({ email: 'alice@example.com' });

    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username: 'alice', email: 'alice@example.com', password: 'secret123' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('User with this email already exists');
  });

  it('creates user and returns token for valid signup', async () => {
    mockedFindOne.mockResolvedValue(null);
    mockedHashPassword.mockResolvedValue('hashed-password');
    mockedCreate.mockResolvedValue({
      _id: 'user-2',
      username: 'alice',
      email: 'alice@example.com',
    });
    mockedGenerateToken.mockReturnValue('jwt-token');

    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username: 'alice', email: 'alice@example.com', password: 'secret123' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockedCreate).toHaveBeenCalledWith({
      username: 'alice',
      email: 'alice@example.com',
      password: 'hashed-password',
    });
    expect(data).toEqual({
      userId: 'user-2',
      token: 'jwt-token',
      username: 'alice',
    });
  });
});
