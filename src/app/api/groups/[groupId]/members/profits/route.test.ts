import { GET } from '@/app/api/groups/[groupId]/members/profits/route';
import connectDB from '@/lib/db';
import Group from '@/models/Group';
import Bet from '@/models/Bet';
import Vote from '@/models/Vote';
import { verifyToken } from '@/lib/auth';
import { calculateBetPayout } from '@/lib/payouts';

jest.mock('@/lib/db', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/models/Group', () => ({ __esModule: true, default: { findById: jest.fn() } }));
jest.mock('@/models/Bet', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/models/Vote', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/lib/auth', () => ({ __esModule: true, verifyToken: jest.fn() }));
jest.mock('@/lib/payouts', () => ({ __esModule: true, calculateBetPayout: jest.fn() }));

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedGroupFindById = Group.findById as jest.Mock;
const mockedBetFind = Bet.find as jest.Mock;
const mockedVoteFind = Vote.find as jest.Mock;
const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
const mockedCalculateBetPayout = calculateBetPayout as jest.MockedFunction<typeof calculateBetPayout>;

const params = Promise.resolve({ groupId: 'group-1' });

describe('GET /api/groups/[groupId]/members/profits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockImplementation(async () => ({} as any));
  });

  it('returns 401 for invalid token', async () => {
    mockedVerifyToken.mockReturnValue(null);

    const req = new Request('http://localhost/api/groups/group-1/members/profits', {
      headers: { authorization: 'Bearer bad' },
    });

    const response = await GET(req as any, { params });
    expect(response.status).toBe(401);
  });

  it('returns 403 when requester is not a group member', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u9', username: 'x', email: 'x@x.com' });
    mockedGroupFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ members: ['u1', 'u2'] }) });

    const req = new Request('http://localhost/api/groups/group-1/members/profits', {
      headers: { authorization: 'Bearer valid' },
    });

    const response = await GET(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Access denied');
  });

  it('returns computed profits for settled and pending bets', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedGroupFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ members: ['u1', 'u2'] }),
    });

    mockedBetFind.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { _id: 'b1', status: 'settled' },
        { _id: 'b2', status: 'open' },
      ]),
    });

    mockedVoteFind.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { betId: 'b1', userId: 'u1', stake: 10 },
        { betId: 'b1', userId: 'u2', stake: 10 },
        { betId: 'b2', userId: 'u1', stake: 5 },
      ]),
    });

    mockedCalculateBetPayout.mockReturnValue({
      totalPool: 20,
      winners: [{ userId: 'u1', payout: 20 }],
      losers: [{ userId: 'u2', loss: 10 }],
      isRefund: false,
      winningOptionId: 'o1',
      winningOptionText: 'A',
    });

    const req = new Request('http://localhost/api/groups/group-1/members/profits', {
      headers: { authorization: 'Bearer valid' },
    });

    const response = await GET(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.profits.u1.totalStakes).toBe(15);
    expect(data.profits.u1.totalPayouts).toBe(20);
    expect(data.profits.u1.netProfit).toBe(5);
    expect(data.profits.u1.settledBets).toBe(1);
    expect(data.profits.u1.pendingBets).toBe(1);
    expect(data.profits.u2.totalStakes).toBe(10);
    expect(data.profits.u2.totalPayouts).toBe(0);
  });
});
