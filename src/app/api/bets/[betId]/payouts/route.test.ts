import { GET } from '@/app/api/bets/[betId]/payouts/route';
import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import Vote from '@/models/Vote';
import { verifyToken } from '@/lib/auth';
import { calculateBetPayout } from '@/lib/payouts';

jest.mock('@/lib/db', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/models/Bet', () => ({ __esModule: true, default: { findById: jest.fn() } }));
jest.mock('@/models/Vote', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/lib/auth', () => ({ __esModule: true, verifyToken: jest.fn() }));
jest.mock('@/lib/payouts', () => ({ __esModule: true, calculateBetPayout: jest.fn() }));

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedBetFindById = Bet.findById as jest.Mock;
const mockedVoteFind = Vote.find as jest.Mock;
const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
const mockedCalculateBetPayout = calculateBetPayout as jest.MockedFunction<typeof calculateBetPayout>;

const params = Promise.resolve({ betId: 'bet-1' });

describe('GET /api/bets/[betId]/payouts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockImplementation(async () => ({} as any));
  });

  it('returns 401 on invalid token', async () => {
    mockedVerifyToken.mockReturnValue(null);

    const req = new Request('http://localhost/api/bets/bet-1/payouts', {
      headers: { authorization: 'Bearer bad' },
    });

    const response = await GET(req as any, { params });
    expect(response.status).toBe(401);
  });

  it('returns 404 when bet does not exist', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedBetFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    const req = new Request('http://localhost/api/bets/bet-1/payouts', {
      headers: { authorization: 'Bearer valid' },
    });

    const response = await GET(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Bet not found');
  });

  it('returns 400 when bet is not settled', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedBetFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'bet-1', status: 'open' }),
      }),
    });

    const req = new Request('http://localhost/api/bets/bet-1/payouts', {
      headers: { authorization: 'Bearer valid' },
    });

    const response = await GET(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Bet has not been settled yet');
  });

  it('returns payout result for settled bet', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    const settledBet = { _id: 'bet-1', status: 'settled', options: [], votingType: 'single' };

    mockedBetFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(settledBet),
      }),
    });

    mockedVoteFind.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ userId: 'u2', optionId: 'o1', stake: 15, username: 'bob' }]),
      }),
    });

    mockedCalculateBetPayout.mockReturnValue({
      totalPool: 15,
      winners: [],
      losers: [],
      isRefund: false,
      winningOptionId: 'o1',
      winningOptionText: 'A',
    });

    const req = new Request('http://localhost/api/bets/bet-1/payouts', {
      headers: { authorization: 'Bearer valid' },
    });

    const response = await GET(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockedCalculateBetPayout).toHaveBeenCalledWith(settledBet, [
      { userId: 'u2', optionId: 'o1', stake: 15, username: 'bob' },
    ]);
    expect(data.result.totalPool).toBe(15);
  });
});
