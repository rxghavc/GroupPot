import { POST } from '@/app/api/groups/join/route';
import connectDB from '@/lib/db';
import Group from '@/models/Group';
import { verifyToken } from '@/lib/auth';

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Group', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  verifyToken: jest.fn(),
}));

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedFindOne = Group.findOne as jest.Mock;
const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

describe('POST /api/groups/join', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockImplementation(async () => ({} as any));
  });

  it('returns 401 without auth header', async () => {
    const req = new Request('http://localhost/api/groups/join', { method: 'POST', body: JSON.stringify({ code: 'abc123' }) });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('returns 400 when code is missing', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });

    const req = new Request('http://localhost/api/groups/join', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({}),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Group code is required');
  });

  it('returns 404 for invalid group code', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedFindOne.mockResolvedValue(null);

    const req = new Request('http://localhost/api/groups/join', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({ code: 'abc123' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Invalid group code');
    expect(mockedFindOne).toHaveBeenCalledWith({ code: 'ABC123' });
  });

  it('returns 400 when user already exists in members', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedFindOne.mockResolvedValue({
      members: ['u1', 'u2'],
    });

    const req = new Request('http://localhost/api/groups/join', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({ code: 'abc123' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Already a member of this group');
  });

  it('adds user to group and returns transformed group', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u3', username: 'carol', email: 'carol@example.com' });

    const saveMock = jest.fn().mockResolvedValue(undefined);
    const populateMock = jest.fn().mockResolvedValue(undefined);
    const group = {
      _id: { toString: () => 'g1' },
      members: ['u1', 'u2'],
      save: saveMock,
      populate: populateMock,
      toObject: () => ({ name: 'Friends', code: 'ABC123', members: ['u1', 'u2', 'u3'] }),
    };
    mockedFindOne.mockResolvedValue(group);

    const req = new Request('http://localhost/api/groups/join', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({ code: 'abc123' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(populateMock).toHaveBeenCalledWith('members', 'username email');
    expect(group.members).toContain('u3');
    expect(data.message).toBe('Successfully joined group');
    expect(data.group.id).toBe('g1');
    expect(data.group.name).toBe('Friends');
  });
});
