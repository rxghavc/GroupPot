import { GET } from '@/app/api/auth/me/route';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Group from '@/models/Group';
import Bet from '@/models/Bet';
import { getUserFromToken } from '@/lib/auth';

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('@/models/Group', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

jest.mock('@/models/Bet', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  getUserFromToken: jest.fn(),
}));

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedGetUserFromToken = getUserFromToken as jest.MockedFunction<typeof getUserFromToken>;
const mockedUserFindById = User.findById as jest.Mock;
const mockedGroupFind = Group.find as jest.Mock;
const mockedBetFind = Bet.find as jest.Mock;

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockResolvedValue({} as any);
  });

  it('returns 401 when token is invalid', async () => {
    mockedGetUserFromToken.mockReturnValue(null);

    const req = new Request('http://localhost/api/auth/me', {
      method: 'GET',
      headers: { authorization: 'Bearer bad-token' },
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 when user does not exist', async () => {
    mockedGetUserFromToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedUserFindById.mockResolvedValue(null);

    const req = new Request('http://localhost/api/auth/me', {
      method: 'GET',
      headers: { authorization: 'Bearer good-token' },
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('returns user profile with groups and group bets from mocked data', async () => {
    const mockUser = { _id: 'u1', username: 'alice', email: 'alice@example.com' };
    const mockGroups = [
      { _id: 'g1', name: 'Friends', members: [{ username: 'alice' }, { username: 'bob' }] },
      { _id: 'g2', name: 'Office', members: [{ username: 'alice' }, { username: 'dave' }] },
    ];

    mockedGetUserFromToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedUserFindById.mockResolvedValue(mockUser);

    mockedGroupFind.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockGroups),
    });

    mockedBetFind
      .mockReturnValueOnce({
        populate: jest.fn().mockResolvedValue([{ _id: 'b1', title: 'Bet 1' }]),
      })
      .mockReturnValueOnce({
        populate: jest.fn().mockResolvedValue([{ _id: 'b2', title: 'Bet 2' }, { _id: 'b3', title: 'Bet 3' }]),
      });

    const req = new Request('http://localhost/api/auth/me', {
      method: 'GET',
      headers: { authorization: 'Bearer good-token' },
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.userId).toBe('u1');
    expect(data.groups).toHaveLength(2);
    expect(data.groups[0]).toMatchObject({
      groupId: 'g1',
      name: 'Friends',
      bets: [{ _id: 'b1', title: 'Bet 1' }],
    });
    expect(data.groups[1].bets).toHaveLength(2);

    expect(mockedGroupFind).toHaveBeenCalledWith({ members: 'u1' });
    expect(mockedBetFind).toHaveBeenNthCalledWith(1, { groupId: 'g1' });
    expect(mockedBetFind).toHaveBeenNthCalledWith(2, { groupId: 'g2' });
  });
});
