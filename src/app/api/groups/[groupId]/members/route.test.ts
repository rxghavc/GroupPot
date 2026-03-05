import { POST } from '@/app/api/groups/[groupId]/members/route';
import connectDB from '@/lib/db';
import Group from '@/models/Group';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

jest.mock('@/lib/db', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/models/Group', () => ({ __esModule: true, default: { findById: jest.fn() } }));
jest.mock('@/models/User', () => ({ __esModule: true, default: { findById: jest.fn() } }));
jest.mock('@/lib/auth', () => ({ __esModule: true, verifyToken: jest.fn() }));

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedGroupFindById = Group.findById as jest.Mock;
const mockedUserFindById = User.findById as jest.Mock;
const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

const params = Promise.resolve({ groupId: 'group-1' });

describe('POST /api/groups/[groupId]/members', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockImplementation(async () => ({} as any));
  });

  it('returns 401 when auth is missing', async () => {
    const req = new Request('http://localhost/api/groups/group-1/members', {
      method: 'POST',
      body: JSON.stringify({ userId: 'u2' }),
    });

    const response = await POST(req as any, { params });
    expect(response.status).toBe(401);
  });

  it('returns 400 when userId is missing', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });

    const req = new Request('http://localhost/api/groups/group-1/members', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({}),
    });

    const response = await POST(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User ID is required');
  });

  it('returns 403 when requester is not owner/moderator', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedGroupFindById.mockResolvedValue({
      ownerId: { toString: () => 'owner-9' },
      moderators: [{ toString: () => 'mod-9' }],
      members: [],
    });

    const req = new Request('http://localhost/api/groups/group-1/members', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({ userId: 'u2' }),
    });

    const response = await POST(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Only moderators can add members');
  });

  it('adds member and persists group', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const group = {
      ownerId: { toString: () => 'u1' },
      moderators: [{ toString: () => 'u1' }],
      members: [{ toString: () => 'u1' }],
      save: saveMock,
    };

    mockedGroupFindById.mockResolvedValue(group);
    mockedUserFindById.mockResolvedValue({ _id: 'u2', username: 'bob' });

    const req = new Request('http://localhost/api/groups/group-1/members', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({ userId: 'u2' }),
    });

    const response = await POST(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(group.members).toContain('u2');
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(data.success).toBe(true);
    expect(data.message).toBe('User added to group successfully');
  });
});
