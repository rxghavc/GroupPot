import { GET } from '@/app/api/users/[userId]/bets/route';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Bet from '@/models/Bet';
import Group from '@/models/Group';
import Vote from '@/models/Vote';
import { verifyToken } from '@/lib/auth';
import { calculateBetPayout } from '@/lib/payouts';

jest.mock('@/lib/db', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/models/User', () => ({ __esModule: true, default: { findById: jest.fn() } }));
jest.mock('@/models/Bet', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/models/Group', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/models/Vote', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/lib/auth', () => ({ __esModule: true, verifyToken: jest.fn() }));
jest.mock('@/lib/payouts', () => ({ __esModule: true, calculateBetPayout: jest.fn() }));

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedUserFindById = User.findById as jest.Mock;
const mockedBetFind = Bet.find as jest.Mock;
const mockedGroupFind = Group.find as jest.Mock;
const mockedVoteFind = Vote.find as jest.Mock;
const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
const mockedCalculateBetPayout = calculateBetPayout as jest.MockedFunction<typeof calculateBetPayout>;

const params = Promise.resolve({ userId: 'u1' });

describe('GET /api/users/[userId]/bets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockImplementation(async () => ({} as any));
  });

  it('returns 401 when missing auth', async () => {
    const req = new Request('http://localhost/api/users/u1/bets');
    const response = await GET(req as any, { params });
    expect(response.status).toBe(401);
  });

  it('returns 404 when user does not exist', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedUserFindById.mockResolvedValue(null);

    const req = new Request('http://localhost/api/users/u1/bets', {
      headers: { authorization: 'Bearer valid' },
    });

    const response = await GET(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('returns user bet participation with settled outcome', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedUserFindById.mockResolvedValue({ _id: 'u1', username: 'alice' });

    mockedVoteFind
      .mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue([
          { betId: 'b1', optionId: 'o1', stake: 10, userId: 'u1' },
        ]),
      })
      .mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue([
          { betId: 'b1', optionId: 'o1', stake: 10, userId: 'u1' },
          { betId: 'b1', optionId: 'o2', stake: 10, userId: 'u2' },
        ]),
      });

    mockedBetFind.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        {
          _id: 'b1',
          title: 'Match Winner',
          groupId: 'g1',
          status: 'settled',
          votingType: 'single',
          winningOption: 0,
          options: [
            { _id: { toString: () => 'o1' }, text: 'Team A' },
            { _id: { toString: () => 'o2' }, text: 'Team B' },
          ],
          createdAt: '2026-02-01T00:00:00.000Z',
          deadline: '2026-02-02T00:00:00.000Z',
        },
      ]),
    });

    mockedGroupFind.mockReturnValue({
      lean: jest.fn().mockResolvedValue([{ _id: 'g1', name: 'Friends' }]),
    });

    mockedCalculateBetPayout.mockReturnValue({
      totalPool: 20,
      winners: [{ userId: 'u1', payout: 20 }],
      losers: [{ userId: 'u2', loss: 10 }],
      isRefund: false,
      winningOptionId: 'o1',
      winningOptionText: 'Team A',
    });

    const req = new Request('http://localhost/api/users/u1/bets', {
      headers: { authorization: 'Bearer valid' },
    });

    const response = await GET(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].groupName).toBe('Friends');
    expect(data[0].result).toBe('won');
    expect(data[0].payout).toBe('20.00');
    expect(data[0].userVotes[0].optionText).toBe('Team A');
  });
});
