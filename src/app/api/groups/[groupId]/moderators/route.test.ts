import { DELETE, POST } from '@/app/api/groups/[groupId]/moderators/route';
import connectDB from '@/lib/db';
import Group from '@/models/Group';
import { verifyToken } from '@/lib/auth';

jest.mock('@/lib/db', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/models/Group', () => ({ __esModule: true, default: { findById: jest.fn() } }));
jest.mock('@/lib/auth', () => ({ __esModule: true, verifyToken: jest.fn() }));

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedGroupFindById = Group.findById as jest.Mock;
const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

const params = Promise.resolve({ groupId: 'group-1' });

describe('POST /api/groups/[groupId]/moderators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockImplementation(async () => ({} as any));
  });

  it('returns 400 when userId is missing', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    const req = new Request('http://localhost/api/groups/group-1/moderators', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({}),
    });

    const response = await POST(req as any, { params });
    expect(response.status).toBe(400);
  });

  it('returns 400 when target user is not a member', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedGroupFindById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        ownerId: { toString: () => 'u1' },
        moderators: [{ toString: () => 'u1' }],
        members: [{ _id: { toString: () => 'u1' } }],
      }),
    });

    const req = new Request('http://localhost/api/groups/group-1/moderators', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({ userId: 'u9' }),
    });

    const response = await POST(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User is not a member of this group');
  });

  it('promotes member to moderator', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const group = {
      ownerId: { toString: () => 'u1' },
      moderators: [{ toString: () => 'u1' }],
      members: [{ _id: { toString: () => 'u1' } }, { _id: { toString: () => 'u2' } }],
      save: saveMock,
    };
    mockedGroupFindById.mockReturnValue({ populate: jest.fn().mockResolvedValue(group) });

    const req = new Request('http://localhost/api/groups/group-1/moderators', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({ userId: 'u2' }),
    });

    const response = await POST(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(group.moderators).toContain('u2');
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(data.message).toBe('User promoted to moderator successfully');
  });
});

describe('DELETE /api/groups/[groupId]/moderators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockImplementation(async () => ({} as any));
  });

  it('returns 400 when target is not currently moderator', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedGroupFindById.mockResolvedValue({
      ownerId: { toString: () => 'u1' },
      moderators: [{ toString: () => 'u1' }],
    });

    const req = new Request('http://localhost/api/groups/group-1/moderators', {
      method: 'DELETE',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({ userId: 'u2' }),
    });

    const response = await DELETE(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User is not a moderator');
  });

  it('demotes moderator successfully', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const group = {
      ownerId: { toString: () => 'u1' },
      moderators: [{ toString: () => 'u1' }, { toString: () => 'u2' }],
      save: saveMock,
    };
    mockedGroupFindById.mockResolvedValue(group);

    const req = new Request('http://localhost/api/groups/group-1/moderators', {
      method: 'DELETE',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({ userId: 'u2' }),
    });

    const response = await DELETE(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(group.moderators).toHaveLength(1);
    expect(group.moderators[0].toString()).toBe('u1');
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(data.message).toBe('Moderator demoted successfully');
  });
});
