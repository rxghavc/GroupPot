import { DELETE } from '@/app/api/groups/[groupId]/members/[userId]/route';
import connectDB from '@/lib/db';
import Group from '@/models/Group';
import Bet from '@/models/Bet';
import { verifyToken } from '@/lib/auth';

jest.mock('@/lib/db', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/models/Group', () => ({
  __esModule: true,
  default: { findById: jest.fn(), findByIdAndDelete: jest.fn() },
}));
jest.mock('@/models/Bet', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/lib/auth', () => ({ __esModule: true, verifyToken: jest.fn() }));

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedGroup = Group as any;
const mockedBetFind = Bet.find as jest.Mock;
const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

const params = Promise.resolve({ groupId: 'group-1', userId: 'u2' });

describe('DELETE /api/groups/[groupId]/members/[userId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockImplementation(async () => ({} as any));
  });

  it('returns 401 when auth header is missing', async () => {
    const req = new Request('http://localhost/api/groups/group-1/members/u2', { method: 'DELETE' });
    const response = await DELETE(req as any, { params });
    expect(response.status).toBe(401);
  });

  it('returns 403 when non-moderator tries removing another member', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedGroup.findById.mockResolvedValue({
      ownerId: { toString: () => 'owner-9' },
      moderators: [{ toString: () => 'mod-9' }],
      members: ['u1', 'u2'],
    });

    const req = new Request('http://localhost/api/groups/group-1/members/u2', {
      method: 'DELETE',
      headers: { authorization: 'Bearer valid' },
    });

    const response = await DELETE(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Only moderators can remove other members');
  });

  it('removes member, strips votes from active bets, and saves group', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });

    const saveGroup = jest.fn().mockResolvedValue(undefined);
    const group = {
      ownerId: { toString: () => 'u1' },
      moderators: [{ toString: () => 'u1' }],
      members: ['u1', 'u2'],
      save: saveGroup,
    };
    mockedGroup.findById.mockResolvedValue(group);

    const saveBet = jest.fn().mockResolvedValue(undefined);
    mockedBetFind.mockResolvedValue([
      {
        options: [
          { votes: [{ userId: { toString: () => 'u2' } }, { userId: { toString: () => 'u1' } }] },
          { votes: [{ userId: { toString: () => 'u3' } }] },
        ],
        save: saveBet,
      },
    ]);

    const req = new Request('http://localhost/api/groups/group-1/members/u2', {
      method: 'DELETE',
      headers: { authorization: 'Bearer valid' },
    });

    const response = await DELETE(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockedBetFind).toHaveBeenCalledWith({ groupId: 'group-1', status: { $in: ['open', 'closed'] } });
    expect(saveBet).toHaveBeenCalledTimes(1);
    expect(group.members).toEqual(['u1']);
    expect(saveGroup).toHaveBeenCalledTimes(1);
    expect(data.message).toBe('Member removed successfully');
    expect(data.votesRemoved).toBe(true);
  });
});
