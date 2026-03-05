import { GET } from '@/app/api/groups/[groupId]/route';
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
    findById: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  verifyToken: jest.fn(),
}));

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedFindById = Group.findById as jest.Mock;
const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

const params = Promise.resolve({ groupId: 'group-1' });

describe('GET /api/groups/[groupId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockImplementation(async () => ({} as any));
  });

  it('returns 401 without auth header', async () => {
    const req = new Request('http://localhost/api/groups/group-1');

    const response = await GET(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('returns 401 on invalid token', async () => {
    mockedVerifyToken.mockReturnValue(null);

    const req = new Request('http://localhost/api/groups/group-1', {
      headers: { authorization: 'Bearer bad' },
    });

    const response = await GET(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid token');
  });

  it('returns 404 when group is not found', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedFindById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    const req = new Request('http://localhost/api/groups/group-1', {
      headers: { authorization: 'Bearer valid' },
    });

    const response = await GET(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Group not found');
  });

  it('returns 403 when user is not a group member', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedFindById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: { toString: () => 'group-1' },
          name: 'Friends',
          members: [{ _id: { toString: () => 'u2' } }],
        }),
      }),
    });

    const req = new Request('http://localhost/api/groups/group-1', {
      headers: { authorization: 'Bearer valid' },
    });

    const response = await GET(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Access denied');
  });

  it('returns transformed group when user is a member', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedFindById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: { toString: () => 'group-1' },
          name: 'Friends',
          code: 'ABC123',
          members: [{ _id: { toString: () => 'u1' }, username: 'alice' }],
        }),
      }),
    });

    const req = new Request('http://localhost/api/groups/group-1', {
      headers: { authorization: 'Bearer valid' },
    });

    const response = await GET(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.group.id).toBe('group-1');
    expect(data.group.name).toBe('Friends');
    expect(data.group.members[0].username).toBe('alice');
  });
});
